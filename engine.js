/**
 * TomeNET MVP Engine - Core Orchestrator
 * Global state, game loop, spawning, save/load, init.
 * 
 * Loaded after:
 *   src/data/constants.js, src/data/enemies.js, src/data/items.js
 *   src/ui/shops.js, src/ui/renderer.js, src/ui/input.js
 *   src/systems/combat.js  (Entity, combat, useItem, dropItem)
 *   src/systems/ai.js      (findPath, processMonsterAI, computeFOV)
 *   src/world/generation.js (generateTown, generateDungeon)
 */

let currentShopItems = [];
let identifiedTypes = {};

let timeOfDay = 'Day';
let totalTurns = 0;
let bountyTarget = null;
let bountyClaimed = false;

// --- Global State ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const msgLog = document.getElementById('log-container');

var map = [];
var entities = [];
var items = [];
var player = null;

var currentFloor = 0; // 0 = Town, 1+ = Dungeon
var gameState = 'START';

let lastTime = 0;

// Auto-run state
let isAutoRunning = false;
let isAutoExploring = false;
let isAutoExploring_Aggressive = false;
let runDirX = 0;
let runDirY = 0;
let activePath = null;
let visibleMonsters = new Set();
let targetX = 0;
let targetY = 0;
let activeSpell = null;
let activeItemIndex = -1;

let cameraX = 0;
let cameraY = 0;
let hoverX = -1;
let hoverY = -1;

// Input State
const keys = {};
let bufferedAction = null;
let lastLogicalTick = 0;

// Awareness / Sound State
let noiseMap = [];
function initNoiseMap() {
    noiseMap = Array.from({ length: MAP_WIDTH }, () => new Float32Array(MAP_HEIGHT).fill(0));
}
function addNoise(x, y, level) {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        noiseMap[x][y] += level;
    }
}
function updateNoise() {
    let nextNoise = Array.from({ length: MAP_WIDTH }, () => new Float32Array(MAP_HEIGHT).fill(0));
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            if (noiseMap[x][y] > 0.1) {
                let n = noiseMap[x][y] * NOISE_DECAY_RATE;
                nextNoise[x][y] += n * 0.9;
                
                // Propagate a bit to neighbors
                const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                for (let d of neighbors) {
                    let nx = x + d[0], ny = y + d[1];
                    if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                        nextNoise[nx][ny] += n * 0.025; // 2.5% per neighbor
                    }
                }
            }
        }
    }
    noiseMap = nextNoise;
}

// --- Map Generation Helpers ---
class Rect {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
    center() { return { x: Math.floor(this.x + this.w / 2), y: Math.floor(this.y + this.h / 2) }; }
}

function spawnMonsters(room) {
    const num = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < num; i++) {
        let x = Math.floor(Math.random() * (room.w - 2)) + room.x + 1;
        let y = Math.floor(Math.random() * (room.h - 2)) + room.y + 1;
        spawnMonsterAt(x, y);
    }
}

function spawnMonsterAt(x, y) {
    if (!getEntityAt(x, y)) {
        // #IX Phase IX — mini-bosses spawned once per floor
        if (currentFloor === 8 && !entities.some(e => e.name === 'Arch-Lich')) {
            const lt = ENEMY_TYPES.find(t => t.name === 'Arch-Lich');
            if (lt) {
                const lichE = new Entity(x, y, lt.char, lt.color, lt.name, lt.hp, lt.atk, lt.def, lt.speed);
                lichE.element = lt.element; lichE.baseXP = lt.baseXP;
                lichE.xpDrain = true; lichE.summoner = true; lichE.miniBoss = true;
                lichE.maxHp = lt.hp;
                entities.push(lichE);
                logMessage('** The Arch-Lich rises from shadow! **', 'damage');
                return;
            }
        }
        if (currentFloor === 9 && !entities.some(e => e.name === 'Dragon King')) {
            const dkt = ENEMY_TYPES.find(t => t.name === 'Dragon King');
            if (dkt) {
                const dkE = new Entity(x, y, dkt.char, dkt.color, dkt.name, dkt.hp, dkt.atk, dkt.def, dkt.speed);
                dkE.element = dkt.element; dkE.baseXP = dkt.baseXP;
                dkE.drainMaxHp = true; dkE.rangedDebuff = true; dkE.miniBoss = true;
                dkE.bossPhases = true;
                dkE.maxHp = dkt.hp;
                entities.push(dkE);
                logMessage('** The Dragon King awakens! FLEE or FIGHT! **', 'damage');
                return;
            }
        }

        // Difficulty scaling — indices match ENEMY_TYPES array
        // New: 41=Lurker, 42=Goblin Shaman, 43=Orc Warpriest, 44=Dark Channeler
        let allowedTypes = [];
        if (currentFloor <= 2)      allowedTypes = [0, 1, 2, 14, 42];          // +Goblin Shaman
        else if (currentFloor <= 4) allowedTypes = [1, 2, 3, 10, 11, 12, 13, 14, 15, 19, 42, 43]; // +Shaman, Warpriest
        else if (currentFloor <= 6) allowedTypes = [2, 3, 4, 5, 12, 15, 16, 41, 43, 44]; // +Lurker, Warpriest, Channeler
        else if (currentFloor <= 8) allowedTypes = [4, 5, 6, 7, 13, 17, 18, 41, 44]; // +Lurker, Channeler
        else allowedTypes = [6, 7, 8, 12, 17, 18, 41, 44];

        if (currentFloor === 10 && !entities.some(e => e.name === 'Balrog')) {
            allowedTypes = [30]; // Balrog index
        }
        if (currentFloor > 10) allowedTypes = [7, 8, 9, 17, 18, 20, 21, 22, 23, 41, 44];

        let typeIdx = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        const t = ENEMY_TYPES[typeIdx];
        if (!t) return;
        const hp = t.hp + Math.floor(Math.random() * currentFloor * 2);
        let e = new Entity(x, y, t.char, t.color, t.name, hp, t.atk + currentFloor, t.def, t.speed);
        e.element = t.element;
        e.baseXP = t.baseXP;
        e.maxHp = hp;
        // Copy special AI flags
        if (t.invisible)    e.invisible    = true;
        if (t.drainMaxHp)   e.drainMaxHp   = true;
        if (t.summoner)     e.summoner      = true;
        if (t.blinker)      e.blinker       = true;
        if (t.rangedDebuff) e.rangedDebuff  = true;
        if (t.xpDrain)      e.xpDrain       = true;
        if (t.dissolver)    e.dissolver     = true;
        if (t.lifeSteal)    e.lifeSteal     = true;
        if (t.breather)     e.breather      = true;
        if (t.personality)  e.personality   = t.personality;
        // Batch 9 flags
        if (t.ambusher)     e.ambusher      = true;
        if (t.support)      e.support       = t.support;
        if (t.bossPhases)   e.bossPhases    = true;
        if (t.miniBoss)     e.miniBoss      = true;

        // #81-82 Elite variant – 10% chance (not for support units or ambushers)
        if (Math.random() < 0.10 && !t.miniBoss && !t.support && !t.ambusher) {
            e.name = 'Elite ' + e.name;
            e.hp *= 1.5; e.maxHp = e.hp; e.atk = Math.ceil(e.atk * 1.3);
            e.color = '#f1c40f';
            e.baseXP *= 2;
            e.isElite = true;
        }

        entities.push(e);
    }
}

function spawnItem(x, y, template) {
    items.push({ x, y, char: template.char, color: template.color, ...template });
}

function spawnRandomItem(room) {
    let x = Math.floor(Math.random() * (room.w - 2)) + room.x + 1;
    let y = Math.floor(Math.random() * (room.h - 2)) + room.y + 1;
    spawnRandomItemAt(x, y);
}

function spawnRandomItemAt(x, y) {
    const r = Math.random();
    if (r < 0.3) {
        let goldItem = { x, y, type: 'gold', char: CHARS.GOLD, color: COLORS.GOLD, name: 'Gold Pile', amount: Math.floor(Math.random() * 20) + 10 };
        if ((currentFloor || 0) >= 3 && Math.random() < 0.02) goldItem.isMimic = true;
        items.push(goldItem);
    } else {
        // Artifact drop chance scales with depth -> 0.005 + (currentFloor * 0.002) (e.g. at Floor 10 = 2.5%, Floor 20 = 4.5%)
        let artChance = 0.005 + ((currentFloor || 0) * 0.002);
        if (Math.random() < artChance) {
            const artifacts = ITEM_DB.filter(i => i.artifact && currentFloor >= i.minFloor);
            if (artifacts.length > 0) {
                const art = { ...artifacts[Math.floor(Math.random() * artifacts.length)] };
                spawnItem(x, y, art);
                logMessage("Something glitters... an artifact!", 'magic');
                return;
            }
        }
        const pool = ITEM_DB.filter(i => currentFloor >= i.minFloor && !i.artifact);
        if (pool.length > 0) {
            const templ = pool[Math.floor(Math.random() * pool.length)];
            const instance = { ...templ };
            if (['weapon', 'armor', 'helm', 'ring', 'amulet', 'shield'].includes(instance.type)) {
                if (instance.cursed) {
                    // Already cursed, don't override
                } else {
                    let r2 = Math.random();
                    if (r2 < 0.15) {
                        instance.cursed = true;
                        if (instance.atkBonus) instance.atkBonus = -Math.abs(instance.atkBonus);
                        if (instance.defBonus) instance.defBonus = -Math.abs(instance.defBonus);
                    } else if (r2 > 0.92) {
                        instance.blessed = true;
                        if (instance.atkBonus) instance.atkBonus += Math.floor(Math.random() * 2) + 1;
                        if (instance.defBonus) instance.defBonus += Math.floor(Math.random() * 2) + 1;
                    }
                }
            }
            if ((currentFloor || 0) >= 3 && Math.random() < 0.02) instance.isMimic = true;
            spawnItem(x, y, instance);
        }
    }
}

function runLogicalTick() {
    if (gameState !== 'PLAYING') return;

    // Determine how many sub-ticks to process (auto modes get fast processing)
    let subTicks = 1;
    if (isAutoRunning || isAutoExploring || (activePath && activePath.length > 0)) {
        subTicks = 10; // Process up to 10 steps per heartbeat for auto modes
    }

    for (let st = 0; st < subTicks && gameState === 'PLAYING'; st++) {
        // 1. Accumulate Energy (capped to prevent burst freezes)
        player.energy = Math.min(200, player.energy + getEffectiveSpeed());
        for (let e of entities) {
            if (!e.isPlayer && e.hp > 0 && e.blocksMovement) {
                e.energy = Math.min(200, e.energy + (e.speed || 10));
            }
        }

        // Aistimus / Sound Update
        if (st === 0) updateNoise();

        // 2. Process Player Actions
        if (player.energy >= ENERGY_THRESHOLD && gameState === 'PLAYING') {
            // Status & Regen (once per heartbeat)
            if (st === 0) processPlayerTimedEffects();
            
            let act = bufferedAction || getPendingAction();
            bufferedAction = null; 

            if (act) {
                let cost = ACTION_COSTS.MOVE;
                if (act.type === 'move') {
                    const target = getEntityAt(player.x + act.dx, player.y + act.dy);
                    cost = target ? ACTION_COSTS.ATTACK : ACTION_COSTS.MOVE;
                } else if (act.type === 'cast') { cost = ACTION_COSTS.CAST; }
                  else if (act.type === 'use') { cost = ACTION_COSTS.USE; }
                  else if (act.type === 'wait') { 
                    cost = ACTION_COSTS.WAIT; 
                    player.energy += 15; 
                  }

                attemptAction(player, act, cost);
                computeFOV();
                processItemFeelings();
            } else {
                // No input available — stop fast-ticking
                break;
            }
        }

        // 3. Process Monsters
        for (let e of entities) {
            if (!e.isPlayer && e.hp > 0 && e.blocksMovement) {
                if (e.name === 'Balrog' && e.hp < 150) e.hp = Math.min(150, e.hp + 2);
                
                if (st === 0 && e.isTownNPC && Math.random() < 0.005) {
                    const barks = ["Lovely day!", "Prices are rising.", "Stay safe.", "Nice weather!"];
                    const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                    if (dist < 8) logMessage(`${e.name} says: "${barks[Math.floor(Math.random()*barks.length)]}"`, 'hint');
                }
                
                let maxMonsterActions = 3;
                while (e.energy >= ENERGY_THRESHOLD && maxMonsterActions > 0) {
                    maxMonsterActions--;
                    processMonsterAI(e);
                    e.energy -= 100;
                }
            }
        }

        // Stop fast-ticking if we're no longer in an auto mode
        if (!isAutoRunning && !isAutoExploring && (!activePath || activePath.length === 0)) {
            break;
        }
    }
}

function processPlayerTimedEffects() {
    if (!player) return;

    // #19 Berserk & Vanish
    if (player.berserkTimer > 0) {
        player.berserkTimer--;
        if (player.berserkTimer === 0) logMessage("Your berserk rage subsides.", "hint");
    }
    if (player.vanishTimer > 0) {
        player.vanishTimer--;
        if (player.vanishTimer === 0) {
            player.invisible = false;
            logMessage("You emerge from the shadows.", "hint");
        }
    }

    // Skill Cooldowns
    if (player.skillCooldown > 0) player.skillCooldown--;
    if (player.combatSurgeTimer > 0) player.combatSurgeTimer--;

    // Standard Statuses
    if (player.poisonTimer > 0) {
        player.poisonTimer--;
        if (player.poisonTimer % 5 === 0) {
            player.hp = Math.max(1, player.hp - 1);
            spawnParticle(player.x, player.y, "-1 POISON", "#27ae60");
        }
        if (player.poisonTimer === 0) logMessage("You recovered from poison.", "magic");
    }
    if (player.confusedTimer > 0) {
        player.confusedTimer--;
        if (player.confusedTimer === 0) logMessage("Your head clears.", "magic");
    }
    if (player.blindTimer > 0) {
        player.blindTimer--;
        if (player.blindTimer === 0) logMessage("Your vision returns.", "magic");
    }
    if (player.paralyzedTimer > 0) {
        player.paralyzedTimer--;
        if (player.paralyzedTimer === 0) logMessage("You can move again!", "magic");
    }

    // #36 Cursed Relic Drawbacks (Eye of Chaos)
    if (player.equipment.ring && player.equipment.ring.name === 'Eye of Chaos') {
        if (Math.random() < 0.02) {
            player.confusedTimer = (player.confusedTimer || 0) + 5;
            logMessage("The Eye of Chaos pulses! Your mind is clouded!", "damage");
            spawnParticle(player.x, player.y, "CONFUSED!", "#9b59b6");
        }
    }
    
    // Regeneration
    if (player.regenBoost > 0) {
        player.regenBoost--;
        if (player.regenBoost % 3 === 0) player.hp = Math.min(player.maxHp, player.hp + 1);
    }
    if (player.hp < player.maxHp && (!player.poisonTimer || player.poisonTimer <= 0)) {
        player.regenTimer = (player.regenTimer || 0) + 1;
        if (player.regenTimer >= 15) {
            player.hp++;
            player.regenTimer = 0;
        }
    }

    // #26 Poison Gas Damage
    if (map[player.x][player.y].type === 'gas') {
        const gasDmg = 2 + Math.floor(currentFloor / 4);
        player.hp -= gasDmg;
        spawnParticle(player.x, player.y, `-${gasDmg} GAS`, '#2ecc71');
        if (player.hp <= 0) showGameOverModal('Poison Gas');
    }
}

function processItemFeelings() {
    for (let i = 0; i < player.inventory.length; i++) {
        let itm = player.inventory[i];
        if (!itm.identified) {
            itm.carryTurns = (itm.carryTurns || 0) + 1;
            if (itm.carryTurns === 50 && !itm.gutFeeling) {
                if (itm.cursed) itm.gutFeeling = "You feel a sinister, cold aura from this...";
                else if (itm.blessed) itm.gutFeeling = "This item exudes an aura of safety and warmth.";
                else if (itm.artifact) itm.gutFeeling = "This object throbs with ancient power.";
                else if (itm.type === 'potion' || itm.type === 'scroll') itm.gutFeeling = "You sense latent magic within.";
                else itm.gutFeeling = "It feels completely mundane.";
                logMessage(`You get a feeling about the ${itm.name}...`, 'hint');
            }
        }
    }
}

// --- Real-time Loop ---
function gameLoop(timestamp) {
    if (gameState !== 'PLAYING') {
        requestAnimationFrame(gameLoop);
        return;
    }

    const dt = timestamp - lastTime;
    const logicalDt = timestamp - lastLogicalTick;

    // A. Rendering & Particles (60fps goal)
    if (dt >= TICK_RATE) {
        lastTime = timestamp;
        updateParticles(dt);
        updateUI();
        render();
    }

    // B. Logical Heartbeat (TomeNET style - 10 ticks / sec)
    if (logicalDt >= HEARTBEAT_INTERVAL) {
        lastLogicalTick = timestamp;
        runLogicalTick();
    }

    // C. Check for immediate input buffering
    if (!bufferedAction && player.energy < ENERGY_THRESHOLD) {
        const pending = getPendingAction();
        if (pending) bufferedAction = pending;
    }

    requestAnimationFrame(gameLoop);
}

// --- Initialization ---
function init() {
    initNoiseMap();
    generateTown();
    computeFOV();
    resizeCanvas();
    updateUI();
    document.getElementById('charCreateModal').classList.add('active');
    gameState = 'CHAR_CREATE';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// #66 Save / Load Game via localStorage
function saveGame() {
    if (!player || gameState === 'PLAYER_DEAD') return;
    try {
        const saveData = {
            player: {
                name: player.name, class: player.class || 'Warrior',
                hp: player.hp, maxHp: player.maxHp, atk: player.atk, def: player.def,
                speed: player.speed, level: player.level, xp: player.xp, nextXp: player.nextXp,
                gold: player.gold, x: player.x, y: player.y,
                hasESP: player.hasESP, spellMastery: player.spellMastery, backstab: player.backstab,
                killCount: player.killCount || 0, combatSurgeTimer: 0,
                inventory: player.inventory.map(i => ({ ...i })),
                equipment: { ...player.equipment }
            },
            currentFloor,
            identifiedTypes: { ...identifiedTypes }
        };
        localStorage.setItem('autonomous_rogue_save', JSON.stringify(saveData));
        logMessage('Game Saved! [F5]', 'magic');
        spawnParticle(player.x, player.y, 'SAVED!', '#66fcf1');
    } catch(err) {
        logMessage('Save failed: ' + err.message, 'damage');
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem('autonomous_rogue_save');
        if (!raw) { logMessage('No save found.', 'hint'); return; }
        const save = JSON.parse(raw);
        const pd = save.player;
        currentFloor = save.currentFloor || 1;
        identifiedTypes = save.identifiedTypes || {};
        player.name = pd.name; player.class = pd.class;
        player.hp = pd.hp; player.maxHp = pd.maxHp; player.atk = pd.atk; player.def = pd.def;
        player.speed = pd.speed; player.level = pd.level; player.xp = pd.xp; player.nextXp = pd.nextXp;
        player.gold = pd.gold; player.hasESP = pd.hasESP;
        player.spellMastery = pd.spellMastery; player.backstab = pd.backstab;
        player.killCount = pd.killCount || 0; player.combatSurgeTimer = 0;
        player.inventory = (pd.inventory || []).map(i => ({ ...i }));
        player.equipment = pd.equipment || { weapon: null, armor: null, helm: null, ring: null, amulet: null, offhand: null };
        if (pd.hasESP) player.hasESP = true;
        if (currentFloor === 0) generateTown();
        else generateDungeon();
        player.x = pd.x; player.y = pd.y;
        computeFOV(); updateUI();
        logMessage('Game Loaded! [F9]', 'magic');
        spawnParticle(player.x, player.y, 'LOADED!', '#66fcf1');
    } catch(err) {
        logMessage('Load failed: ' + err.message, 'damage');
    }
}

window.onload = () => {
    init();
};
