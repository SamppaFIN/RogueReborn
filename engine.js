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

let map = [];
let entities = [];
let items = [];
let player = null;

let currentFloor = 0; // 0 = Town, 1+ = Dungeon
let gameState = 'START';

let lastTime = 0;

// Auto-run state
let isAutoRunning = false;
let isAutoExploring = false;
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
                dkE.maxHp = dkt.hp;
                entities.push(dkE);
                logMessage('** The Dragon King awakens! FLEE or FIGHT! **', 'damage');
                return;
            }
        }

        // Difficulty scaling
        let allowedTypes = [];
        if (currentFloor <= 2)      allowedTypes = [0, 1, 2, 14];
        else if (currentFloor <= 4) allowedTypes = [1, 2, 3, 10, 11, 12, 13, 14, 15, 19];
        else if (currentFloor <= 6) allowedTypes = [2, 3, 4, 5, 12, 15, 16];
        else if (currentFloor <= 8) allowedTypes = [4, 5, 6, 7, 13, 17, 18];
        else allowedTypes = [6, 7, 8, 12, 17, 18];

        if (currentFloor === 10 && !entities.some(e => e.name === 'Balrog')) {
            allowedTypes = [9];
        }
        if (currentFloor > 10) allowedTypes = [7, 8, 9, 17, 18, 20, 21, 22, 23];

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

        // #81-82 Elite variant – 10% chance
        if (Math.random() < 0.10 && !t.miniBoss) {
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
        items.push({ x, y, type: 'gold', char: CHARS.GOLD, color: COLORS.GOLD, name: 'Gold Pile', amount: Math.floor(Math.random() * 20) + 10 });
    } else {
        if (Math.random() < 0.01) {
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
            spawnItem(x, y, instance);
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

    if (dt >= TICK_RATE) {
        lastTime = timestamp;

        let stepsThisFrame = (isAutoRunning || activePath || isAutoExploring) ? 100 : 1;
        
        // Safety check for auto-explore: Stop earlier if monster is very close
        if (isAutoExploring) {
            const nearest = getNearestMonster(player.x, player.y);
            if (nearest) {
                const dist = Math.abs(nearest.x - player.x) + Math.abs(nearest.y - player.y);
                if (dist <= 2) { 
                    isAutoExploring = false; 
                    activePath = null;
                    logMessage("Danger ahead! Auto-explore halted.", "damage");
                    stepsThisFrame = 0;
                }
            }
        }

        while (stepsThisFrame > 0 && gameState === 'PLAYING') {
            stepsThisFrame--;

            // 1. Process Player Input if energy is ready
            let playerActed = false;
            if (player.energy >= ENERGY_THRESHOLD) {
                // #53 Paralysis timer
                if (player.paralyzedTimer > 0) {
                    player.paralyzedTimer--;
                    if (player.paralyzedTimer === 0) logMessage('You can move again!', 'magic');
                    player.energy -= ENERGY_THRESHOLD;
                    stepsThisFrame = 0; continue;
                }
                // Status Effects per tick
                if (player.poisonTimer > 0) {
                    player.hp -= 1; player.poisonTimer--;
                    spawnParticle(player.x, player.y, "-1", "#27ae60");
                    if (player.hp <= 0) { showGameOverModal("Poison"); break; }
                    if (player.poisonTimer === 0) logMessage("You recovered from poison.", "magic");
                }
                if (player.confusedTimer > 0) { player.confusedTimer--; if (player.confusedTimer === 0) logMessage("Your head clears.", "magic"); }
                if (player.blindTimer > 0) { player.blindTimer--; if (player.blindTimer === 0) logMessage("Your vision returns.", "magic"); }
                if (player.combatSurgeTimer > 0) { player.combatSurgeTimer--; if (player.combatSurgeTimer === 0) logMessage('Combat Surge fades.', 'hint'); }
                if (player.regenBoost > 0) { player.regenBoost--; player.hp = Math.min(player.maxHp, player.hp + 1); }

                // Passive HP Regen
                if (player.hp < player.maxHp && (!player.poisonTimer || player.poisonTimer <= 0)) {
                    player.regenTimer = (player.regenTimer || 0) + 1;
                    if (player.regenTimer >= 15) {
                        player.hp++;
                        player.regenTimer = 0;
                    }
                }

                let act = null;
                if (isAutoRunning) {
                    checkAutoRunStop(player.x, player.y);
                    if (isAutoRunning) act = { type: 'move', dx: runDirX, dy: runDirY };
                    else stepsThisFrame = 0;
                } else if (activePath && activePath.length > 0) {
                    const nextNode = activePath.shift();
                    act = { type: 'move', dx: nextNode.x - player.x, dy: nextNode.y - player.y };
                    if (activePath.length === 0 && isAutoExploring) {
                        activePath = null;
                    } else if (!activePath || activePath.length === 0) {
                        stepsThisFrame = 0;
                    }
                } else if (isAutoExploring) {
                    act = getPendingAction();
                    if (!isAutoExploring && !activePath) stepsThisFrame = 0;
                } else {
                    act = getPendingAction();
                    stepsThisFrame = 0;
                }

                // #51 Confusion: randomize movement
                if (player.confusedTimer > 0 && act && act.type === 'move') {
                    const randomDirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
                    const rd = randomDirs[Math.floor(Math.random() * randomDirs.length)];
                    act = { type: 'move', dx: rd[0], dy: rd[1] };
                }

                if (act) {
                    attemptAction(player, act);
                    playerActed = true;
                    computeFOV();
                }
            } else {
                player.energy += (player.isPlayer ? getEffectiveSpeed() : player.speed);
            }

            // 2. Process Monsters
            for (let e of entities) {
                if (!e.isPlayer && e.hp > 0 && e.blocksMovement) {
                    // NPC Barks
                    if (e.isTownNPC && Math.random() < 0.005) {
                        const barks = ["Lovely day for a walk!", "Heard there's a Balrog downstairs...", "Prices at the shop are rising.", "Stay safe, traveler.", "Nice weather today!"];
                        const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                        if (dist < 8) logMessage(`${e.name} says: "${barks[Math.floor(Math.random()*barks.length)]}"`, 'hint');
                    }
                    if (e.name === 'Balrog' && e.hp < 150) e.hp = Math.min(150, e.hp + 2); // Regen
                    if (e.energy >= ENERGY_THRESHOLD) {
                        processMonsterAI(e);
                    } else {
                        e.energy += e.speed;
                    }
                }
            }

            if (!(isAutoRunning || activePath || isAutoExploring)) stepsThisFrame = 0;
        }

        updateParticles(dt);
        updateUI();
        render();
    }

    requestAnimationFrame(gameLoop);
}

// --- Initialization ---
function init() {
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
