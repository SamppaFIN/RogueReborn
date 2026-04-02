/**
 * TomeNET MVP Engine - Real-Time Tick Based
 * Core orchestration: globals, input, game loop, rendering, init
 * 
 * Data files loaded before this:
 *   src/data/constants.js  - TILE_SIZE, MAP_WIDTH, CHARS, COLORS, etc.
 *   src/data/enemies.js    - ENEMY_TYPES
 *   src/data/items.js      - ITEM_DB
 *   src/ui/shops.js        - All shop/NPC modal logic
 *   src/world/generation.js - generateTown(), generateDungeon()
 *   src/systems/combat.js  - Entity, combat(), useItem(), etc.
 *   src/systems/ai.js      - processMonsterAI(), findPath()
 */
let currentShopItems = [];
let identifiedTypes = {};

let timeOfDay = 'Day';
let totalTurns = 0;
let bountyTarget = null;
let bountyClaimed = false;

const POTION_COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Clear', 'Swirling'];
const SCROLL_TITLES = ['ZELGO MER', 'FOO BAR', 'BREAD MAKES YOU FAT', 'KLAATU BARADA NIKTO', 'XYZZY', 'ABAB', 'YENDOR'];
const WAND_WOODS = ['Oak', 'Pine', 'Iron', 'Bone', 'Glass', 'Ebony', 'Ivory'];


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
const ENERGY_THRESHOLD = 100;
const TICK_RATE = 1000 / 60; // 60 ticks per second baseline

// Auto-run state
let isAutoRunning = false;
let isAutoExploring = false; // persistent auto-explore mode
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

// --- Particle System ---
class Particle {
    constructor(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.vx = (Math.random() - 0.5) * 0.05;
        this.vy = -0.05 - Math.random() * 0.05;
        this.life = 1.0; this.maxLife = 1.0;
    }
}
let particles = [];

function spawnParticle(x, y, text, color) {
    particles.push(new Particle(x, y, text, color));
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.life -= dt / 1000;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Input State

// Input State
const keys = {};

// --- Input Handling ---
canvas.addEventListener('mousemove', e => {
    if (gameState !== 'TARGETING') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const offsetX = cx - cameraX;
    const offsetY = cy - cameraY;

    let tx = Math.floor((x - offsetX) / TILE_SIZE);
    let ty = Math.floor((y - offsetY) / TILE_SIZE);

    tx = Math.max(0, Math.min(MAP_WIDTH - 1, tx));
    ty = Math.max(0, Math.min(MAP_HEIGHT - 1, ty));

    targetX = tx; targetY = ty;
    render();
});

canvas.addEventListener('mousedown', e => {
    if (gameState === 'TARGETING') {
        executeTargetSpell();
        return;
    }
    if (gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Reverse engineer UI coordinates using current smooth camera
    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const offsetX = cx - cameraX;
    const offsetY = cy - cameraY;

    const tx = Math.floor((x - offsetX) / TILE_SIZE);
    const ty = Math.floor((y - offsetY) / TILE_SIZE);

    if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
        if (e.button === 2) { // Right click inspect
            const ent = getEntityAt(tx, ty);
            if (ent) logMessage(`Inspect: ${ent.name} (${ent.hp}/${ent.maxHp} HP)`, 'magic');
            const item = getItemAt(tx, ty);
            if (item) logMessage(`Inspect: ${item.name}`, 'magic');
            if (!ent && !item) logMessage(`Inspect: ${map[tx][ty].type.replace('_', ' ')}`);
        } else if (e.button === 0) { // Left click move
            if (!map[tx][ty].explored) {
                logMessage("You cannot path into the unknown.", 'damage');
                return;
            }
            if (map[tx][ty].type === 'wall') {
                logMessage("Cannot path into walls.", 'hint');
                return;
            }
            activePath = findPath(player.x, player.y, tx, ty);
            isAutoRunning = false;
            if (activePath && activePath.length > 0) {
                logMessage("Pathfinding...", "magic");
            }
        }
    }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', e => {
    keys[e.key] = true;

    // Close Modals
    if (e.key === 'Escape') {
        closeAllModals();
        if (gameState === 'TARGETING' || gameState === 'RANGED_TARGETING') {
            logMessage("Cancelled action.", "hint");
            gameState = 'PLAYING';
            render();
        }
    }

    if (e.key === 'i' || e.key === 'I') {
        if (gameState === 'PLAYING') openInventory();
        else if (gameState === 'INVENTORY') closeInventory();
        return;
    }

    if (gameState === 'TARGETING') {
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === '8') dy = -1;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === '2') dy = 1;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === '4') dx = -1;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === '6') dx = 1;

        if (dx !== 0 || dy !== 0) {
            targetX = Math.max(0, Math.min(MAP_WIDTH - 1, targetX + dx));
            targetY = Math.max(0, Math.min(MAP_HEIGHT - 1, targetY + dy));
            render();
            return;
        }

        if (e.key === 'Enter') {
            executeTargetSpell();
            return;
        }
        if (e.key === 'Escape') {
            logMessage("Cancelled targeting.", "hint");
            gameState = 'PLAYING';
            render();
            return;
        }
    }

    if (gameState === 'RANGED_TARGETING') {
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === '8') dy = -1;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === '2') dy = 1;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === '4') dx = -1;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === '6') dx = 1;

        if (dx !== 0 || dy !== 0) {
            targetX = Math.max(0, Math.min(MAP_WIDTH - 1, targetX + dx));
            targetY = Math.max(0, Math.min(MAP_HEIGHT - 1, targetY + dy));
            render();
            return;
        }

        if (e.key === 'f' || e.key === 'F' || e.key === 'Enter') {
            executeRangedAttack();
            return;
        }
        if (e.key === 'Escape') {
            logMessage("Cancelled fire.", "hint");
            gameState = 'PLAYING';
            render();
            return;
        }
    }

    if (e.key === 't' || e.key === 'T') {
        // #12 Polearm reach attack
        if (gameState === 'PLAYING') {
            const wep = player.equipment.weapon;
            if (!wep || !wep.reach) {
                // Remove noisy log during normal movement; only log if explicitly trying to reach-attack
                // logMessage("You need a polearm (Spear/Halberd) to reach-attack!", "damage");
                return;
            }
            // Find targets within reach
            const reachTargets = entities.filter(en => !en.isPlayer && en.hp > 0 &&
                Math.abs(en.x - player.x) <= wep.reach && Math.abs(en.y - player.y) <= wep.reach &&
                (Math.abs(en.x - player.x) + Math.abs(en.y - player.y)) > 1);
            if (reachTargets.length > 0) {
                const tgt = reachTargets[0];
                let atkPower = getEffectiveAtk();
                let defPower = tgt.def;
                let dmg = Math.max(1, atkPower - defPower + Math.floor(Math.random() * 3));
                tgt.hp -= dmg;
                spawnParticle(tgt.x, tgt.y, `-${dmg}`, '#95a5a6');
                logMessage(`You thrust your ${wep.name} at ${tgt.name} for ${dmg}!`, 'magic');
                if (tgt.hp <= 0) handleMonsterDeath(tgt);
                player.energy -= ENERGY_THRESHOLD;
                updateUI();
            } else {
                // Fall back: attack adjacent as normal
                logMessage("No target in reach range (2 tiles). Move into range!", 'hint');
            }
        }
        return;
    }

    if (e.key === 'f' || e.key === 'F') {
        if (gameState === 'PLAYING') {
            const wepEffect = player.equipment.weapon?.effect;
            if (!player.equipment.weapon || (wepEffect !== 'bow' && wepEffect !== 'crossbow')) {
                logMessage("You need a bow or crossbow to fire!", "damage");
                return;
            }
            if (player.ammo <= 0) {
                logMessage(wepEffect === 'crossbow' ? "Out of bolts!" : "Out of arrows!", "damage");
                return;
            }
            gameState = 'RANGED_TARGETING';
            targetX = player.x;
            targetY = player.y;
            // Target nearest monster if possible
            const nearest = getNearestMonster(player.x, player.y);
            if (nearest) {
                targetX = nearest.x;
                targetY = nearest.y;
            }
            logMessage("Targeting... (f to fire)", "hint");
            render();
        }
        return;
    }

    // Removed DEBUG skip for Spacebar so it correctly executes auto-explore/attack in town too.

    // Inventory selection (1-9)
    if (gameState === 'PLAYING' && e.key >= '1' && e.key <= '9' && !e.altKey) {
        const index = parseInt(e.key) - 1;
        if (player.inventory[index]) {
            useItem(index);
        }
    }

    // Explicit Stairs
    if (gameState === 'PLAYING' && e.key === '>') {
        checkStairs(player.x, player.y, true); // force descend
    }
    if (gameState === 'PLAYING' && e.key === '<') {
        checkStairs(player.x, player.y, true); // force ascend
    }

    // Explicit Pickup
    if (gameState === 'PLAYING' && (e.key === 'g' || e.key === ',')) {
        collectItems(player.x, player.y);
    }

    // --- DEBUG AUTOMATION SUITE (Alt + 1-8) ---
    if (e.altKey && gameState === 'PLAYING') {
        if (e.key === '1') { // Skip Floor
            currentFloor++;
            logMessage(`DEBUG: Skipping to Dungeon Level ${currentFloor}`, 'magic');
            generateDungeon();
            computeFOV();
            updateUI();
        }
        if (e.key === '2') { // Add Gold
            player.gold += 1000;
            logMessage("DEBUG: Added 1000 Gold.", "pickup");
            updateUI();
        }
        if (e.ctrlKey && e.key === '3') { // Full Heal
            player.hp = player.maxHp;
            logMessage("DEBUG: Full Heal Applied.", "magic");
            updateUI();
        }
        if (e.ctrlKey && e.key === '4') { // Level Up
            player.xp += 1000;
            logMessage("DEBUG: Added 1000 XP.", "magic");
            updateUI();
        }
        if (e.ctrlKey && e.key === '5') { // Reveal Map
            for (let x = 0; x < MAP_WIDTH; x++) {
                for (let y = 0; y < MAP_HEIGHT; y++) map[x][y].explored = true;
            }
            logMessage("DEBUG: Map Revealed.", "hint");
            render();
        }
        if (e.ctrlKey && e.key === '6') { // Nuke Floor
            entities.forEach(ent => {
                if (!ent.isPlayer && ent.hp > 0) {
                    ent.hp = 0;
                    ent.char = '%'; ent.color = '#888'; ent.blocksMovement = false;
                    ent.name = `${ent.name} remains`;
                }
            });
            logMessage("DEBUG: Floor Nuked!", "damage");
            render();
        }
        if (e.ctrlKey && e.key === '7') { // God Gear
            const gear = [
                ITEM_DB.find(i => i.name === 'Vorpal Sword'),
                ITEM_DB.find(i => i.name === 'Mithril Plate'),
                ITEM_DB.find(i => i.name === 'Helm of Telepathy')
            ];
            gear.forEach(i => {
                if (i) {
                    const instance = { ...i, identified: true };
                    player.inventory.push(instance);
                    // Force equip
                    let slot = instance.effect === 'esp' ? 'helm' : instance.type;
                    player.equipment[slot] = instance;
                    if (instance.effect === 'esp') player.hasESP = true;
                }
            });
            logMessage("DEBUG: God Gear Equipped.", "magic");
            updateUI();
        }
        if (e.ctrlKey && e.key === '8') { // Recall to Town
            currentFloor = 0;
            generateTown();
            logMessage("DEBUG: Recalled to Town.", "magic");
            computeFOV();
            updateUI();
        }
    }

    // 's' â€” #33 Search for secret rooms
    if (e.key === 's' && gameState === 'PLAYING') {
        const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
        let found = false;
        for (const [dx, dy] of dirs) {
            const sx = player.x + dx, sy = player.y + dy;
            if (sx >= 0 && sx < MAP_WIDTH && sy >= 0 && sy < MAP_HEIGHT && map[sx][sy].type === 'secret_wall') {
                map[sx][sy].type = 'floor'; map[sx][sy].char = CHARS.FLOOR;
                logMessage('You find a secret cache!', 'magic');
                spawnParticle(player.x, player.y, 'SECRET!', '#f1c40f');
                if (map[sx][sy].secretCache) spawnRandomItemAt(sx, sy);
                found = true;
            }
        }
        if (!found) logMessage('You search but find nothing.', 'hint');
        player.energy -= ENERGY_THRESHOLD;
    }

    // F5 â€” Save Game, F9 â€” Load Game
    if (e.key === 'F5' && gameState === 'PLAYING') { e.preventDefault(); saveGame(); }
    if (e.key === 'F9' && gameState === 'PLAYING') { e.preventDefault(); loadGame(); }

    if (gameState === 'PLAYING') {
        if (e.key === '<') {
            if (map[player.x][player.y].type === 'stairs_up') {
                checkStairs(player.x, player.y, true);
            } else {
                logMessage("There are no stairs up here.", "hint");
            }
        }
        if (e.key === '>') {
            if (map[player.x][player.y].type === 'stairs_down') {
                checkStairs(player.x, player.y, true);
            } else {
                logMessage("There are no stairs down here.", "hint");
            }
        }
        if (e.key === 'Enter') {
            if (map[player.x][player.y].type === 'stairs_down' || map[player.x][player.y].type === 'stairs_up') {
                checkStairs(player.x, player.y, true);
            }
        }
    }
});
window.addEventListener('keyup', e => {
    keys[e.key] = false;
});
window.addEventListener('blur', () => {
    for (let k in keys) keys[k] = false;
});

// --- Mouse Hover Tracker ---
canvas.addEventListener('mousemove', e => {
    if (gameState !== 'PLAYING') {
        hoverX = -1; hoverY = -1;
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const offsetX = Math.floor(cx - cameraX);
    const offsetY = Math.floor(cy - cameraY);

    const tx = Math.floor((x - offsetX) / TILE_SIZE);
    const ty = Math.floor((y - offsetY) / TILE_SIZE);

    if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
        hoverX = tx; hoverY = ty;
    } else {
        hoverX = -1; hoverY = -1;
    }
});
canvas.addEventListener('mouseleave', () => { hoverX = -1; hoverY = -1; });


function getPendingAction() {
    let dx = 0; let dy = 0;

    let cancelKeysPressed = false;
    const cancelKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'Escape'];
    for (let k of cancelKeys) {
        if (keys[k]) cancelKeysPressed = true;
    }

    // Cancel pathing/running/exploring on any directional keypress
    if (cancelKeysPressed) {
        activePath = null;
        isAutoRunning = false;
        isAutoExploring = false;
    }

    // Process active path if no cancel keys pressed
    if (activePath && activePath.length > 0) {
        const nextNode = activePath.shift();
        return { type: 'move', dx: nextNode.x - player.x, dy: nextNode.y - player.y };
    }

    // WASD Simultaneous Diagonals
    if (keys['w'] || keys['W'] || keys['ArrowUp'] || keys['8']) dy -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown'] || keys['2']) dy += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft'] || keys['4']) dx -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight'] || keys['6']) dx += 1;

    // Numpad exact diagonals overrides
    if (keys['7']) { dx = -1; dy = -1; }
    if (keys['9']) { dx = 1; dy = -1; }
    if (keys['1']) { dx = -1; dy = 1; }
    if (keys['3']) { dx = 1; dy = 1; }

    dx = Math.sign(dx);
    dy = Math.sign(dy);

    if (dx !== 0 || dy !== 0) {
        // Shift to auto-run
        if (keys['Shift']) {
            isAutoRunning = true;
            runDirX = dx;
            runDirY = dy;
        }
        return { type: 'move', dx, dy };
    }

    if (keys[' '] || keys['5']) {
        // Auto-attack adjacent
        for (let e of entities) {
            if (!e.isPlayer && e.hp > 0 && Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1) {
                return { type: 'move', dx: e.x - player.x, dy: e.y - player.y };
            }
        }
        // 5 = wait, Space = toggle auto-explore
        if (keys['5']) return { type: 'wait' };
        if (keys[' '] && !isAutoExploring) {
            isAutoExploring = true;
            activePath = null; // force path recalc
        }
    }
    if ((keys['o'] || keys['O']) && !isAutoExploring) {
        isAutoExploring = true;
        activePath = null;
    }

    // Persistent auto-explore
    if (isAutoExploring) {
        // Stop if HP is low
        if (player.hp <= Math.floor(player.maxHp * 0.3)) {
            isAutoExploring = false;
            logMessage("Auto-explore halted â€” low HP!", "damage");
            return null;
        }
        if (!activePath || activePath.length === 0) {
            const now = performance.now();
            if (typeof lastAutoExploreCheck === 'undefined' || now - lastAutoExploreCheck > 500) {
                lastAutoExploreCheck = now;
                
                let path = findNearestUnexplored(player.x, player.y);
                
                // Floor 0 (Town) specific: explicitly target stairs if no unexplored tiles found
                if (!path && currentFloor === 0) {
                    for(let x=0; x<MAP_WIDTH; x++) {
                        for(let y=0; y<MAP_HEIGHT; y++) {
                            if (map[x][y].type === 'stairs_down') {
                                path = findPath(player.x, player.y, x, y);
                                break;
                            }
                        }
                        if (path) break;
                    }
                }

                if (path && path.length > 0) {
                    activePath = path;
                } else {
                    isAutoExploring = false;
                    logMessage("Nothing left to explore!", "hint");
                    return null;
                }
            } else {
                return null;
            }
        }
        // Let the activePath branch in the game loop handle movement
        return null;
    }

    // Auto-retaliate
    if (player.lastAttackedBy && player.lastAttackedBy.hp > 0 && Math.abs(player.lastAttackedBy.x - player.x) <= 1 && Math.abs(player.lastAttackedBy.y - player.y) <= 1) {
        return { type: 'move', dx: player.lastAttackedBy.x - player.x, dy: player.lastAttackedBy.y - player.y };
    }

    return null;
}

// --- Pathfinding ---

    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    let line = [];

    while (true) {
        line.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    return line;
}

function executeTargetSpell() {
    gameState = 'PLAYING';
    const item = player.inventory[activeItemIndex];
    if (!item || item.charges <= 0) return;

    item.charges--;
    // #18 Mage Robes spell boost
    const spellBoostBonus = player.equipment.armor?.spellBoost || 0;
    logMessage(`You fire a ${activeSpell}!`, 'magic');

    // Trace Line
    const line = getLine(player.x, player.y, targetX, targetY);
    let hitEntity = null;
    let hx = player.x, hy = player.y;

    for (let i = 1; i < line.length; i++) { // skip player 0
        const pt = line[i];
        if (map[pt.x][pt.y].type === 'wall') {
            hx = pt.x; hy = pt.y;
            break;
        }
        const e = getEntityAt(pt.x, pt.y);
        if (e) {
            hitEntity = e;
            hx = pt.x; hy = pt.y;
            break;
        }
        hx = pt.x; hy = pt.y;
        spawnParticle(pt.x, pt.y, "*", "#9b59b6"); // trail
    }

    if (hitEntity) {
        // Spell damage table â€” Phase V
        const lvlBonus = player.spellMastery ? player.level * 2 : 0;
        let spellDmg = 0;
        let spellColor = '#bd93f9';
        const sp = activeSpell;
        if (sp === 'magic_missile') { spellDmg = 10 + Math.floor(Math.random() * 5) + spellBoostBonus + lvlBonus; }
        else if (sp === 'frost') {
            spellDmg = 8 + Math.floor(Math.random() * 4) + spellBoostBonus + lvlBonus;
            hitEntity.speed = Math.max(2, hitEntity.speed - 3);
            logMessage(`${hitEntity.name} is chilled! (-3 Speed)`, 'magic');
            spellColor = '#3498db';
        }
        else if (sp === 'lightning') {
            spellDmg = 15 + Math.floor(Math.random() * 6) + spellBoostBonus + lvlBonus;
            spellColor = '#f1c40f';
            // chain to adjacent monster
            const adjChain = entities.find(e => !e.isPlayer && e.hp > 0 && e !== hitEntity &&
                Math.abs(e.x - hitEntity.x) <= 2 && Math.abs(e.y - hitEntity.y) <= 2);
            if (adjChain) {
                const chainDmg = Math.floor(spellDmg * 0.6);
                adjChain.hp -= chainDmg;
                spawnParticle(adjChain.x, adjChain.y, `-${chainDmg} CHAIN`, '#f1c40f');
                logMessage(`Lightning chains to ${adjChain.name}!`, 'magic');
                if (adjChain.hp <= 0) handleMonsterDeath(adjChain);
            }
        }
        else if (sp === 'slow_bolt')  { spellDmg = 5; hitEntity.speed = Math.max(2, hitEntity.speed - 4); logMessage(`${hitEntity.name} is slowed!`, 'magic'); spellColor = '#2ecc71'; }
        else if (sp === 'drain_life') {
            spellDmg = 12 + Math.floor(Math.random() * 5) + spellBoostBonus + lvlBonus;
            player.hp = Math.min(player.maxHp, player.hp + Math.floor(spellDmg / 2));
            spawnParticle(player.x, player.y, `+${Math.floor(spellDmg/2)} HP`, '#2ecc71');
            spellColor = '#e74c3c';
        }
        else if (sp === 'fire_bolt')  { spellDmg = 14 + Math.floor(Math.random() * 6) + spellBoostBonus + lvlBonus; spellColor = '#e67e22'; }
        else if (sp === 'arcane_blast') { spellDmg = 20 + Math.floor(Math.random() * 10) + spellBoostBonus + lvlBonus; spellColor = '#9b59b6'; }
        else { spellDmg = 10 + Math.floor(Math.random() * 5) + spellBoostBonus + lvlBonus; }

        hitEntity.hp -= spellDmg;
        spawnParticle(hitEntity.x, hitEntity.y, `-${spellDmg}`, spellColor);
        logMessage(`The ${sp.replace('_',' ')} hits ${hitEntity.name}!`, 'magic');
        if (hitEntity.hp <= 0) {
            handleMonsterDeath(hitEntity);
        }
    } else {
        logMessage(`The missile hits the wall.`, 'hint');
    }

    if (item.charges <= 0) {
        logMessage(`${item.name} crumbles to dust.`, 'damage');
        player.inventory.splice(activeItemIndex, 1);
    }

    player.energy -= ENERGY_THRESHOLD;
    updateUI();
    render();
}

function executeRangedAttack() {
    gameState = 'PLAYING';
    if (player.ammo <= 0) return;

    // #17 Heavy Crossbow reload mechanic
    const wep = player.equipment.weapon;
    if (wep && wep.effect === 'crossbow') {
        if (player.reloading > 0) {
            logMessage(`Reloading... (${player.reloading} turns left)`, 'hint');
            player.reloading--;
            player.energy -= ENERGY_THRESHOLD;
            return;
        }
        player.reloading = 2; // needs 2 turns to reload after firing
    }

    player.ammo--;
    logMessage(wep && wep.effect === 'crossbow' ? "You fire a bolt!" : "You loose an arrow!", 'pickup');

    const line = getLine(player.x, player.y, targetX, targetY);
    let hitEntity = null;
    let hx = player.x, hy = player.y;

    for (let i = 1; i < line.length; i++) {
        const pt = line[i];
        if (map[pt.x][pt.y].type === 'wall') {
            hx = pt.x; hy = pt.y;
            break;
        }
        const e = getEntityAt(pt.x, pt.y);
        if (e) {
            hitEntity = e;
            hx = pt.x; hy = pt.y;
            break;
        }
        hx = pt.x; hy = pt.y;
    }

    if (hitEntity) {
        let baseAtk = player.atk + (player.equipment.weapon.atkBonus || 0);
        let dist = Math.sqrt(Math.pow(hitEntity.x - player.x, 2) + Math.pow(hitEntity.y - player.y, 2));
        // Arrows lose power over distance
        let falloff = Math.max(0.5, 1.0 - (dist * 0.05));
        let dmg = Math.max(1, Math.floor(baseAtk * falloff) - hitEntity.def + (Math.floor(Math.random() * 3) - 1));

        hitEntity.hp -= dmg;
        spawnParticle(hitEntity.x, hitEntity.y, `-${dmg}`, '#ecf0f1');
        logMessage(`Arrow hits ${hitEntity.name} for ${dmg}!`, 'magic');
        if (hitEntity.hp <= 0) {
            handleMonsterDeath(hitEntity);
        }
    }

    if (item.charges <= 0) {
        logMessage(`${item.name} crumbles to dust.`, 'damage');
        player.inventory.splice(activeItemIndex, 1);
    }

    player.energy -= ENERGY_THRESHOLD;
    updateUI();
    render();
}

// --- Map Generation ---
class Rect {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
    center() { return { x: Math.floor(this.x + this.w / 2), y: Math.floor(this.y + this.h / 2) }; }
}

function initMap() {


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
        // #IX Phase IX â€” mini-bosses spawned once per floor
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

        // Difficulty scaling â€” proper indices mapping
        let allowedTypes = [];
        if (currentFloor <= 2)      allowedTypes = [0, 1, 2, 14]; // Rat, Goblin, Kobold, Skeleton (No Poison 10/19 on 1-2)
        else if (currentFloor <= 4) allowedTypes = [1, 2, 3, 10, 11, 12, 13, 14, 15, 19]; // +Cube, Vampire, Necro, Rust, Giant Spider, Giant Rat
        else if (currentFloor <= 6) allowedTypes = [2, 3, 4, 5, 12, 15, 16]; // +Blink Dog, Orc, Elf
        else if (currentFloor <= 8) allowedTypes = [4, 5, 6, 7, 13, 17, 18]; // +Troll, Wraith, Beholder, Flayer
        else allowedTypes = [6, 7, 8, 12, 17, 18]; // Deep: Trolls, Wraiths, Dragons, Flayers, Beholders

        // Spawn Balrog on floor 10
        if (currentFloor === 10 && !entities.some(e => e.name === 'Balrog')) {
            allowedTypes = [9];
        }
        // #X Infinite floors â€” deep abyss mixes all strong types plus elites & bosses as regular enemies!
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

        // #81-82 Elite variant â€” 10% chance
        if (Math.random() < 0.10 && !t.miniBoss) {
            e.name = 'Elite ' + e.name;
            e.hp *= 1.5; e.maxHp = e.hp; e.atk = Math.ceil(e.atk * 1.3);
            e.color = '#f1c40f'; // golden tint for elites
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
        // #15 Artifacts: 1% chance of an artifact drop (exclude from normal pool, but allow separately)
        if (Math.random() < 0.01) {
            const artifacts = ITEM_DB.filter(i => i.artifact && currentFloor >= i.minFloor);
            if (artifacts.length > 0) {
                const art = { ...artifacts[Math.floor(Math.random() * artifacts.length)] };
                spawnItem(x, y, art);
                logMessage("Something glitters... an artifact!", 'magic');
                return;
            }
        }
        const pool = ITEM_DB.filter(i => currentFloor >= i.minFloor && !i.artifact); // exclude artifacts from normal pool
        if (pool.length > 0) {
            const templ = pool[Math.floor(Math.random() * pool.length)];
            const instance = { ...templ };
            if (['weapon', 'armor', 'helm', 'ring', 'amulet', 'shield'].includes(instance.type)) {
                if (instance.cursed) {
                    // Already cursed (Ring of Burden), don't override
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


function attemptAction(entity, action) {
    if (action.type === 'wait') {
        entity.energy -= ENERGY_THRESHOLD; // consume energy
        return;
    }

    if (action.type === 'move') {
        const tx = entity.x + action.dx;
        const ty = entity.y + action.dy;

        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
            isAutoRunning = false;
            return;
        }

        const targetEntity = getEntityAt(tx, ty);
        if (targetEntity) {
            // Interact with NPCs
            if (targetEntity.isTownNPC) {
                isAutoRunning = false;
                activePath = null;
                if (targetEntity.npcType === 'villager') {
                    const gossip = [
                        "Have you checked the well today?",
                        "The Mayor is looking for someone brave.",
                        "I heard the Balrog is weak to... something.",
                        "Don't drink glowing potions.",
                        "The Bank is safe. The dungeon is not."
                    ];
                    logMessage(`Villager says: "${gossip[Math.floor(Math.random() * gossip.length)]}"`, 'magic');
                } else if (targetEntity.npcType === 'beggar') {
                    logMessage("Beggar rattles a cup. 'Spare some gold for a poor soul?'", 'hint');
                    if (player.gold >= 5) {
                        player.gold -= 5;
                        if (Math.random() < 0.1) {
                            let unId = player.inventory.find(i => !i.identified && !['potion', 'scroll', 'wand'].includes(i.type));
                            if (unId) {
                                unId.identified = true;
                                logMessage(`The beggar whispers: 'That's a ${unId.name}.'`, 'magic');
                            } else {
                                logMessage("The beggar smiles toothlessly. 'Bless you.'");
                            }
                        } else {
                            logMessage("The beggar grins. 'They say the dungeon has a bottom. I don't believe it.'");
                        }
                    } else {
                        logMessage("You don't have enough gold.");
                    }
                }
                entity.energy -= ENERGY_THRESHOLD;
                updateUI();
                return;
            }

            // #40 Goblin Merchant bump-to-trade
            if (targetEntity.isMerchant) {
                isAutoRunning = false;
                // Offer random dungeon items to buy
                const merchantItems = ITEM_DB.filter(i => (i.minFloor || 1) <= currentFloor + 2 && !['key'].includes(i.type)).sort(() => Math.random()-0.5).slice(0,4);
                let msg = 'Goblin Merchant: ';
                merchantItems.forEach((itm, ii) => msg += `[${ii+1}] ${itm.name} (${itm.cost}g) `);
                logMessage(msg, 'magic');
                // Quick buy: press 1-4 (handled via global gmState)
                player._merchantItems = merchantItems;
                player._merchantMode = true;
                entity.energy -= ENERGY_THRESHOLD;
                return;
            }

            // Combat
            isAutoRunning = false;
            activePath = null;
            combat(entity, targetEntity);
            entity.energy -= ENERGY_THRESHOLD;
            return;
        }

        // Action: move tile interaction
        const mapTile = map[tx][ty];
        // #32 Locked Door â€” requires Dungeon Key
        if (mapTile.type === 'locked_door') {
            isAutoRunning = false; activePath = null;
            const keyIdx = entity.isPlayer ? player.inventory.findIndex(i => i.name === 'Dungeon Key') : -1;
            if (keyIdx >= 0) {
                player.inventory.splice(keyIdx, 1);
                mapTile.type = 'floor'; mapTile.char = CHARS.FLOOR;
                logMessage('You use a Dungeon Key to unlock the door!', 'magic');
                spawnParticle(tx, ty, 'UNLOCKED!', '#f1c40f');
                entity.energy -= ENERGY_THRESHOLD;
            } else {
                logMessage('This door is locked! You need a Dungeon Key.', 'damage');
            }
            return;
        }
        if (mapTile.type === 'wall' || mapTile.type === 'shop' || mapTile.type === 'healer' || mapTile.type === 'blacksmith' || mapTile.type === 'wizard' || mapTile.type === 'bank' || mapTile.type === 'well' || mapTile.type === 'mayor' || mapTile.type === 'gambler' || mapTile.type === 'shrine' || mapTile.type === 'lava') {
            isAutoRunning = false;
            activePath = null;

            if (entity.isPlayer) {
                if (mapTile.type === 'shop') {
                    openShop();
                } else if (mapTile.type === 'healer') {
                    openInnkeeper();
                } else if (mapTile.type === 'blacksmith') {
                    if (timeOfDay === 'Day') openBlacksmith();
                    else logMessage("The forge is quiet tonight.", "hint");
                } else if (mapTile.type === 'wizard') {
                    openWizard();
                } else if (mapTile.type === 'bank') {
                    if (timeOfDay === 'Day') openBank();
                    else logMessage("The bank is closed until morning.", "hint");
                } else if (mapTile.type === 'mayor') {
                    // Only bark if the player isn't in high-speed auto-explore mode
                    if (!isAutoExploring && !activePath) {
                        if (!bountyTarget) {
                            const targets = ['Rat', 'Goblin', 'Kobold', 'Fire Hound', 'Orc'];
                            bountyTarget = targets[Math.floor(Math.random() * targets.length)];
                            logMessage(`Mayor says: "Bounty active for a ${bountyTarget}! Return when it's dead."`, 'magic');
                        } else if (bountyClaimed) {
                            logMessage(`Mayor says: "Excellent work! Wait for the next bounty."`, 'hint');
                        } else {
                            logMessage(`Mayor says: "Have you slain the ${bountyTarget} yet?"`, 'hint');
                        }
                    }
                } else if (mapTile.type === 'gambler') {
                    logMessage("Gambler: '50g for a mystery box?'", 'hint');
                    if (player.gold >= 50) {
                        player.gold -= 50;
                        const randomItem = { ...ITEM_DB[Math.floor(Math.random() * ITEM_DB.length)] };
                        player.inventory.push(randomItem);
                        logMessage(`Gambler hands you a ${getItemName(randomItem)}!`, 'pickup');
                    } else {
                        logMessage("Gambler sneers: 'Come back when you're rich.'");
                    }
                } else if (mapTile.type === 'alchemist') {
                    openAlchemist();
                } else if (mapTile.type === 'trainer') {
                    openTrainer();
                } else if (mapTile.type === 'cartographer') {
                    openCartographer();
                } else if (mapTile.type === 'guildhall') {
                    openGuildhall();
                } else if (mapTile.type === 'stash') {
                    openStash();
                } else if (mapTile.type === 'well') {
                    if (!mapTile.used) {
                        mapTile.used = true;
                        mapTile.color = '#7f8c8d';
                        let r = Math.random();
                        if (r < 0.4) {
                            player.hp = Math.min(player.maxHp, player.hp + 5);
                            logMessage("You drink from the well. Refreshing!", 'magic');
                            spawnParticle(player.x, player.y, "+5 HP", '#2ecc71');
                        } else if (r < 0.8) {
                            player.energy += 50;
                            logMessage("You drink from the well. Invigorating!", 'magic');
                        } else {
                            player.poisonTimer = (player.poisonTimer || 0) + 10;
                            logMessage("The water tastes foul! Poison!", 'damage');
                        }
                    } else {
                        logMessage("The well is dry.");
                    }
                } else if (mapTile.type === 'shrine') {
                    // #34 Shrine
                    if (!mapTile.used) {
                        mapTile.used = true; mapTile.color = '#888';
                        if (Math.random() < 0.5) {
                            player.hp = Math.min(player.maxHp, player.hp + 10);
                            logMessage('The shrine blesses you! (+10 HP)', 'magic');
                            spawnParticle(player.x, player.y, 'BLESSED!', '#f1c40f');
                        } else {
                            player.def = Math.max(0, player.def - 1);
                            logMessage('The shrine curses you! (-1 DEF)', 'damage');
                            spawnParticle(player.x, player.y, 'CURSED!', '#e74c3c');
                        }
                    } else { logMessage('The shrine is spent.', 'hint'); }
                } else if (mapTile.type === 'well') {
                    logMessage("The Town Well is cool and refreshing.", "magic");
                    if (player.hp < player.maxHp) {
                        player.hp = Math.min(player.maxHp, player.hp + 5);
                        logMessage("You drink from the well and feel better.", "magic");
                        spawnParticle(player.x, player.y, "+5 HP", "#2ecc71");
                    }
                    if (Math.random() < 0.1) {
                         logMessage("You toss a coin into the well for luck.");
                         player.gold = Math.max(0, player.gold - 1);
                    }
                    entity.energy -= ENERGY_THRESHOLD;
                    return;
                } else if (mapTile.type === 'lava') {
                    // #38 Lava does not block, but damages
                    entity.x = tx; entity.y = ty; entity.energy -= ENERGY_THRESHOLD;
                    if (entity.isPlayer) {
                        const lavaDmg = 3 + currentFloor;
                        player.hp -= lavaDmg;
                        spawnParticle(player.x, player.y, `-${lavaDmg} FIRE`, '#e67e22');
                        logMessage('You step on lava! OUCH!', 'damage');
                        if (player.hp <= 0) { showGameOverModal('Lava'); }
                        totalTurns++; checkStairs(tx, ty); checkAutoRunStop(tx, ty); collectItems(tx, ty);
                    }
                    return;
                } else if (mapTile.hp <= 0) {
                    mapTile.type = 'floor';
                    mapTile.char = CHARS.FLOOR;
                    logMessage("You break through the rock.", 'pickup');
                    computeFOV();
                } else {
                    logMessage("You dig into the wall...");
                }
                entity.energy -= ENERGY_THRESHOLD;
            }
            return;
        }

        // Move
        entity.x = tx; entity.y = ty;
        entity.energy -= ENERGY_THRESHOLD;

        // #31 Trap trigger
        if (entity.isPlayer && map[tx][ty].type === 'trap' && map[tx][ty].hidden) {
            map[tx][ty].hidden = false;
            map[tx][ty].color = '#c0392b';
            const kind = map[tx][ty].trapKind;
            logMessage(`You triggered a ${kind} trap!`, 'damage');
            if (kind === 'dart')     { player.hp -= 5; spawnParticle(player.x, player.y, '-5 DART', '#e74c3c'); }
            if (kind === 'poison')   { player.poisonTimer = (player.poisonTimer||0)+15; spawnParticle(player.x, player.y, 'POISON!', '#27ae60'); }
            if (kind === 'teleport') {
                let rx, ry, tries=0;
                do { rx=Math.floor(Math.random()*MAP_WIDTH); ry=Math.floor(Math.random()*MAP_HEIGHT); tries++; }
                while(tries<50 && (map[rx][ry].type !== 'floor' || getEntityAt(rx,ry)));
                if(tries<50){ player.x=rx; player.y=ry; logMessage('You are teleported!','magic'); computeFOV(); }
            }
            if (player.hp <= 0) { showGameOverModal('Trap'); }
        }

        if (entity.isPlayer) {
            totalTurns++;
            if (totalTurns % 500 === 0) {
                timeOfDay = timeOfDay === 'Day' ? 'Night' : 'Day';
                logMessage(`The sun ${timeOfDay === 'Day' ? 'rises' : 'sets'}. It is now ${timeOfDay}.`, 'magic');
                if (currentFloor === 0) {
                    generateTown();
                    computeFOV();
                    updateUI();
                }
            }

            checkStairs(tx, ty);
            checkAutoRunStop(tx, ty);
            collectItems(tx, ty);
        }
    }
}


function checkAutoRunStop(x, y) {
    if (!isAutoRunning) return;

    // Stop on intersections (openness)
    let openPaths = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let d of dirs) {
        const nx = x + d[0]; const ny = y + d[1];
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
            if (map[nx][ny].type !== 'wall') openPaths++;
        }
    }

    // Narrow corridors have ~3 open spaces. Open rooms have ~8. T-junctions ~5.
    if (openPaths > 4) isAutoRunning = false;
}

function collectItems(x, y) {
    const itemIdx = items.findIndex(i => i.x === x && i.y === y);
    if (itemIdx !== -1) {
        const item = items[itemIdx];
        if (item.type === 'gold') {
            player.gold += item.amount;
            logMessage(`You pick up ${item.amount} gold.`, 'pickup');
        } else {
            if (player.inventory.length < 18) {
                player.inventory.push(item);
                logMessage(`You pick up ${getItemName(item)}.`, 'pickup');
            } else {
                logMessage(`Inventory full! Cannot pick up ${getItemName(item)}.`, 'damage');
                return; // don't splice
            }
        }
        items.splice(itemIdx, 1);
        isAutoRunning = false;
        // Stop auto-explore when picking up items (gold is silent, real items warrant a pause)
        if (item.type !== 'gold') isAutoExploring = false;
    }
}

function getEffectiveAtk() {
    let base = player.atk;
    if (player.equipment.weapon) base += (player.equipment.weapon.atkBonus || 0);
    if (player.equipment.amulet?.effect === 'strength') base += 2;
    // #VIII Combat Surge â€” Warrior active buff
    if (player.combatSurgeTimer > 0) base += 2;
    return base;
}

function getEffectiveDef() {
    let base = player.def;
    if (player.equipment.armor) base += (player.equipment.armor.defBonus || 0);
    if (player.equipment.helm) base += (player.equipment.helm.defBonus || 0);
    if (player.equipment.ring) base += (player.equipment.ring.defBonus || 0);
    // #13 Shield off-hand
    if (player.equipment.offhand) base += (player.equipment.offhand.defBonus || 0);
    return base;
}

// #13 Speed accounting for shield and burden penalties
function getEffectiveSpeed() {
    let spd = player.speed;
    if (player.equipment.offhand) spd -= (player.equipment.offhand.speedPenalty || 0);
    if (player.equipment.ring?.effect === 'burden') spd -= (player.equipment.ring.speedPenalty || 0);
    // #14 Dual Wield speed bonus
    if (player.equipment.weapon?.dualWield) spd += (player.equipment.weapon.speedBonus || 0);
    return Math.max(1, spd);
}


function gameLoop(timestamp) {
    if (gameState !== 'PLAYING') {
        requestAnimationFrame(gameLoop);
        return;
    }

    const dt = timestamp - lastTime;

    if (dt >= TICK_RATE) {
        lastTime = timestamp;

        let stepsThisFrame = (isAutoRunning || activePath || isAutoExploring) ? 20 : 1;
        
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
                // #53 Paralysis timer â€” player cannot act
                if (player.paralyzedTimer > 0) {
                    player.paralyzedTimer--;
                    if (player.paralyzedTimer === 0) logMessage('You can move again!', 'magic');
                    player.energy -= ENERGY_THRESHOLD; // burn energy while paralyzed
                    stepsThisFrame = 0; continue;
                }
                // Status Effects per tick
                if (player.poisonTimer > 0) {
                    player.hp -= 1; player.poisonTimer--;
                    spawnParticle(player.x, player.y, "-1", "#27ae60");
                    if (player.hp <= 0) { showGameOverModal("Poison"); break; }
                    if (player.poisonTimer === 0) logMessage("You recovered from poison.", "magic");
                }
                // Confusion timer
                if (player.confusedTimer > 0) { player.confusedTimer--; if (player.confusedTimer === 0) logMessage("Your head clears.", "magic"); }
                // Blindness timer
                if (player.blindTimer > 0) { player.blindTimer--; if (player.blindTimer === 0) logMessage("Your vision returns.", "magic"); }
                // #VIII Combat Surge timer decrement
                if (player.combatSurgeTimer > 0) { player.combatSurgeTimer--; if (player.combatSurgeTimer === 0) logMessage('Combat Surge fades.', 'hint'); }
                // Regen boost tick
                if (player.regenBoost > 0) { player.regenBoost--; player.hp = Math.min(player.maxHp, player.hp + 1); }

                // Passive HP Regen
                if (player.hp < player.maxHp && (!player.poisonTimer || player.poisonTimer <= 0)) {
                    player.regenTimer = (player.regenTimer || 0) + 1;
                    if (player.regenTimer >= 15) { // Regenerate 1 HP every 15 acted turns
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
                        // Path exhausted â€” let getPendingAction recalc next path
                        activePath = null;
                    } else if (!activePath || activePath.length === 0) {
                        stepsThisFrame = 0;
                    }
                } else if (isAutoExploring) {
                    // Trigger getPendingAction to find the next unexplored path
                    act = getPendingAction();
                    if (!isAutoExploring && !activePath) stepsThisFrame = 0;
                } else {
                    act = getPendingAction();
                    stepsThisFrame = 0; // Need fresh input, wait for next frame
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
                // Player accumulates energy
                player.energy += (player.isPlayer ? getEffectiveSpeed() : player.speed);
            }

            // 2. Process Monsters
            for (let e of entities) {
                if (!e.isPlayer && e.hp > 0 && e.blocksMovement) {
                    // NPC Barks (Aurora suggestion)
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

            // Re-check conditions incase player attacked or ran into wall
            if (!(isAutoRunning || activePath || isAutoExploring)) stepsThisFrame = 0;
        }

        updateParticles(dt);
        updateUI();
        render();
    }

    requestAnimationFrame(gameLoop);
}

function processMonsterAI(e) {

}

function logMessage(text, className = '') {
    const msgs = msgLog.querySelectorAll('.log-msg');
    msgs.forEach(m => m.classList.remove('newest'));
    const div = document.createElement('div');
    div.className = `log-msg newest ${className}`; div.innerText = text;
    msgLog.appendChild(div);
    msgLog.scrollTop = msgLog.scrollHeight;
    if (msgLog.children.length > 15) msgLog.removeChild(msgLog.children[0]);
}

function updateUI() {
    if (!player) return;
    document.getElementById('ui-location').innerText = currentFloor === 0 ? 'Town' : currentFloor > 10 ? `Abyss Lvl ${currentFloor}` : `Dungeon Lvl ${currentFloor}`;
    document.getElementById('ui-speed').innerText = getEffectiveSpeed();

    // Status HUD indicators
    const statusEl = document.getElementById('ui-status');
    if (statusEl) {
        const statuses = [];
        if (player.poisonTimer > 0) statuses.push(`<span style="color:#27ae60">â˜  POISONED(${player.poisonTimer})</span>`);
        if (player.confusedTimer > 0) statuses.push(`<span style="color:#9b59b6">? CONFUSED(${player.confusedTimer})</span>`);
        if (player.blindTimer > 0) statuses.push(`<span style="color:#888">ðŸ‘ BLIND(${player.blindTimer})</span>`);
        if (player.paralyzedTimer > 0) statuses.push(`<span style="color:#e0c080">ðŸ”’ PARALYZED(${player.paralyzedTimer})</span>`);
        if (player.combatSurgeTimer > 0) statuses.push(`<span style="color:#f1c40f">âš¡ SURGE(${player.combatSurgeTimer})</span>`);
        if (player.regenBoost > 0) statuses.push(`<span style="color:#2ecc71">â™¥ REGEN(${player.regenBoost})</span>`);
        statusEl.innerHTML = statuses.join(' ') || '';
    }

    // Add null checks for ATK/DEF elements in case index.html isn't loaded right
    if (document.getElementById('ui-atk')) document.getElementById('ui-atk').innerText = getEffectiveAtk();
    if (document.getElementById('ui-def')) document.getElementById('ui-def').innerText = getEffectiveDef();

    if (document.getElementById('ui-xp')) document.getElementById('ui-xp').innerText = `${player.xp} / ${player.nextXp} (Lvl ${player.level})`;

    document.getElementById('ui-gold').innerText = player.gold;
    document.getElementById('ui-hp').innerText = player.hp;
    document.getElementById('ui-maxhp').innerText = player.maxHp;
    document.getElementById('ui-hp-bar').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;

    const displayEnergy = Math.max(0, Math.min(110, Math.floor(player.energy)));
    document.getElementById('ui-energy').innerText = displayEnergy;
    document.getElementById('ui-energy-bar').style.width = `${Math.min(100, (player.energy / 100) * 100)}%`;

    // Inventory
    const invDom = document.getElementById('ui-inventory');
    invDom.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const item = player.inventory[i];
        let h = `<li style="display:flex; justify-content:space-between; align-items:center; cursor:${item ? 'pointer' : 'default'}">`;
        h += `<span onclick="if(gameState==='PLAYING' && ${item ? 'true' : 'false'}) useItem(${i})" style="flex-grow:1; display:flex; align-items:center;">`;
        h += `<span class="inv-key" style="margin-right:5px">[${i + 1}]</span> <span class="inv-item" style="color:${item ? item.color : 'inherit'}">`;

        if (item) {
            h += `${getItemName(item)}`;
            const isEquipped = Object.values(player.equipment).includes(item);
            if (isEquipped) h += ` <span class="inv-equip" style="color:#f1c40f; font-size:0.8em">(Eq)</span>`;
            h += `</span></span>`;
            // Explicit Drop Button
            h += `<button onclick="if(gameState==='PLAYING') dropItem(${i}, event)" style="background:#552222; color:#ff9999; border:1px solid #ff3333; border-radius:3px; cursor:pointer; padding:2px 6px; font-size:0.7em;" title="Click to Drop. Shift+Click to Destroy.">DROP</button>`;
        } else {
            h += `<span style="opacity:0.3">Empty</span></span></span>`;
        }
        h += `</li>`;
        invDom.innerHTML += h;
    }
}

function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

function render() {
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${TILE_SIZE}px "Fira Code", monospace`;
    ctx.textBaseline = 'top';

    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);

    // Smooth Camera Lerp
    const targetCamX = player.x * TILE_SIZE;
    const targetCamY = player.y * TILE_SIZE;
    const lerpSpeed = (isAutoRunning || activePath) ? 0.30 : 0.15;
    if (cameraX === 0 && cameraY === 0) {
        cameraX = targetCamX; cameraY = targetCamY;
    } else {
        cameraX += (targetCamX - cameraX) * lerpSpeed;
        cameraY += (targetCamY - cameraY) * lerpSpeed;
    }

    const offsetX = cx - cameraX;
    const offsetY = cy - cameraY;

    // Draw Map
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            const tile = map[x][y];
            if (tile.explored || player.hasESP) { // ESP reveals walls too? Usually just monsters, but let's keep it simple
                let color = tile.visible ? (tile.type === 'wall' ? COLORS.LIT_WALL : COLORS.LIT_FLOOR)
                    : (tile.type === 'wall' ? COLORS.DARK_WALL : COLORS.DARK_FLOOR);
                if (tile.isTown && tile.visible) {
                    color = tile.type === 'wall' ? COLORS.TOWN_WALL : COLORS.TOWN_FLOOR;
                }
                if (tile.type === 'stairs_up' || tile.type === 'stairs_down') color = tile.visible ? COLORS.STAIRS : '#666';
                if (tile.type === 'shop' || tile.type === 'healer' || tile.type === 'blacksmith' || tile.type === 'wizard' || tile.type === 'alchemist' || tile.type === 'trainer' || tile.type === 'bank' || tile.type === 'cartographer') {
                    if (timeOfDay === 'Night' && tile.visible) color = '#f1c40f'; // Glow yellow at night
                    else if (tile.type === 'healer') color = tile.visible ? '#e74c3c' : '#666';
                    else if (tile.type === 'shop') color = tile.visible ? COLORS.GOLD : '#666';
                }

                ctx.fillStyle = color;
                ctx.fillText(tile.char, offsetX + x * TILE_SIZE, offsetY + y * TILE_SIZE);
            }
        }
    }

    // Draw Items
    items.forEach(i => {
        if (map[i.x][i.y].visible) {
            ctx.fillStyle = i.color;
            ctx.fillText(i.char, offsetX + i.x * TILE_SIZE, offsetY + i.y * TILE_SIZE);
        }
    });

    // Draw Corpses
    entities.filter(e => e.hp <= 0).forEach(e => {
        if (map[e.x][e.y].visible) {
            ctx.fillStyle = e.color;
            ctx.fillText(e.char, offsetX + e.x * TILE_SIZE, offsetY + e.y * TILE_SIZE);
        }
    });

    // Draw living entities
    entities.filter(e => e.hp > 0).forEach(e => {
        const isVisible = e.isPlayer || map[e.x][e.y].visible || (player.hasESP && !e.isPlayer);
        // #21 Gelatinous Cube: invisible unless adjacent
        if (e.invisible && !e.isPlayer) {
            const adjDist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
            if (adjDist > 1 && !player.hasESP) return; // skip rendering
        }
        if (isVisible) {
            if (e.isPlayer) {
                ctx.shadowBlur = player.hasESP ? 20 : 10;
                ctx.shadowColor = e.color;
            } else if (!map[e.x][e.y].visible && player.hasESP) {
                ctx.globalAlpha = 0.5;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.fillStyle = e.color;
            ctx.fillText(e.char, offsetX + e.x * TILE_SIZE, offsetY + e.y * TILE_SIZE);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;

            // #62 Monster HP bars drawn below glyph
            if (!e.isPlayer && e.maxHp) {
                const barW = TILE_SIZE;
                const barH = 3;
                const barX = offsetX + e.x * TILE_SIZE;
                const barY = offsetY + e.y * TILE_SIZE + 2;
                const pct = Math.max(0, e.hp / e.maxHp);
                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
                ctx.fillRect(barX, barY, Math.floor(barW * pct), barH);
            }
        }
    });

    // Draw Targeting Reticle
    if (gameState === 'TARGETING') {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
        ctx.fillRect(offsetX + targetX * TILE_SIZE, offsetY + targetY * TILE_SIZE - TILE_SIZE * 0.8, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#e74c3c';
        ctx.strokeRect(offsetX + targetX * TILE_SIZE, offsetY + targetY * TILE_SIZE - TILE_SIZE * 0.8, TILE_SIZE, TILE_SIZE);

        ctx.beginPath();
        ctx.moveTo(offsetX + player.x * TILE_SIZE + TILE_SIZE / 2, offsetY + player.y * TILE_SIZE - TILE_SIZE / 2);
        ctx.lineTo(offsetX + targetX * TILE_SIZE + TILE_SIZE / 2, offsetY + targetY * TILE_SIZE - TILE_SIZE / 2);
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.2)';
        ctx.stroke();
    }

    // Draw Particles
    ctx.textAlign = 'center';
    ctx.font = `bold ${TILE_SIZE * 0.7}px "Fira Code", monospace`;
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, offsetX + p.x * TILE_SIZE + TILE_SIZE / 2, offsetY + p.y * TILE_SIZE);
    });
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;

    // Draw darkness vignette filter
    if (gameState !== 'SHOP' && gameState !== 'CHAR_CREATE' && gameState !== 'HEALER') {
        const sightRadius = currentFloor === 0 ? 15 * TILE_SIZE : 7 * TILE_SIZE;
        const gradient = ctx.createRadialGradient(
            cx, cy, sightRadius * 0.4,
            cx, cy, Math.max(sightRadius, canvas.width / 2)
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(1, "rgba(11, 12, 16, 0.95)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Native Canvas Tooltip Rendering
    if (gameState === 'PLAYING' && hoverX >= 0 && hoverY >= 0) {
        if (map[hoverX] && map[hoverX][hoverY] && map[hoverX][hoverY].explored) {
            const tx = hoverX; const ty = hoverY;
            let text = "";
            const ent = getEntityAt(tx, ty);
            if (ent) {
                if (ent.isPlayer) text = "You (@)";
                else text = `${ent.name} (${ent.hp > 0 ? ent.hp + '/' + ent.maxHp + ' HP' : 'Corpse'})`;
            } else {
                const itm = getItemAt(tx, ty);
                if (itm) text = getItemName(itm);
                else {
                    const mType = map[tx][ty].type;
                    if (mType === 'shop') text = "Shop (S)";
                    else if (mType === 'healer') text = "Innkeeper (H)";
                    else if (mType === 'blacksmith') text = "Blacksmith (B)";
                    else if (mType === 'wizard') text = "Wizard's Tower (W)";
                    else if (mType === 'bank') text = "Bank (Â£)";
                    else if (mType === 'well') text = "Town Well (O)";
                    else if (mType === 'mayor') text = "Mayor's Office (M)";
                    else if (mType === 'gambler') text = "Gambler's Den (G)";
                    else if (mType === 'stairs_down') text = "Stairs Down (>)";
                    else if (mType === 'stairs_up') text = "Stairs Up (<)";
                    else if (mType === 'trap') text = map[tx][ty].hidden ? '' : `${map[tx][ty].trapKind} Trap (^)`;
                    else if (mType === 'lava') text = "Lava (~) DANGER";
                    else if (mType === 'shrine') text = map[tx][ty].used ? 'Spent Shrine' : 'Shrine (A) - Step to activate';
                }
            }

            if (text) {
                ctx.font = '14px "Fira Code", monospace';
                const metrics = ctx.measureText(text);
                const w = metrics.width + 16;
                const h = 26;
                let boxX = offsetX + tx * TILE_SIZE + 20;
                let boxY = offsetY + ty * TILE_SIZE + 20;

                if (boxX + w > canvas.width) boxX = canvas.width - w - 5;
                if (boxY + h > canvas.height) boxY = canvas.height - h - 5;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.fillRect(boxX, boxY, w, h);
                ctx.strokeStyle = '#4FC3F7';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX, boxY, w, h);

                ctx.fillStyle = 'white';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                ctx.fillText(text, boxX + 8, boxY + h / 2);
            }
        }
    }
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
        // Rebuild player from save
        player.name = pd.name; player.class = pd.class;
        player.hp = pd.hp; player.maxHp = pd.maxHp; player.atk = pd.atk; player.def = pd.def;
        player.speed = pd.speed; player.level = pd.level; player.xp = pd.xp; player.nextXp = pd.nextXp;
        player.gold = pd.gold; player.hasESP = pd.hasESP;
        player.spellMastery = pd.spellMastery; player.backstab = pd.backstab;
        player.killCount = pd.killCount || 0; player.combatSurgeTimer = 0;
        player.inventory = (pd.inventory || []).map(i => ({ ...i }));
        player.equipment = pd.equipment || { weapon: null, armor: null, helm: null, ring: null, amulet: null, offhand: null };
        if (pd.hasESP) player.hasESP = true;
        // Restore position
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
