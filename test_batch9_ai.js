/**
 * Batch 9 AI Test Suite — Pack, Retreat, Ambush, Support, Boss Phases
 * Run: node test_batch9_ai.js
 */

// === Minimal Test Harness ===
const fs = require('fs');
let passed = 0, failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.log(`  ❌ FAIL: ${msg}`); }
}

// === Mock globals ===
const MAP_WIDTH = 70, MAP_HEIGHT = 50;
const ENERGY_THRESHOLD = 100;
const BASE_SENSING_RADIUS = 8;
const WAKE_THRESHOLD = 50;
const NOISE_LEVELS = { MOVE: 15, ATTACK: 45, CAST: 30, SHOUT: 80 };
const COLORS = { GOBLIN: '#2ecc71', FIRE_HOUND: '#ff3b3b', TROLL: '#e74c3c' };
const ACTION_COSTS = { MOVE: 100, ATTACK: 150, CAST: 130, USE: 100, WAIT: 100 };

let logMessages = [];
let particles = [];
let actionsTaken = [];
let noiseMap = [];

function logMessage(msg, cls) { logMessages.push({ msg, cls }); }
function spawnParticle(x, y, text, color) { particles.push({ x, y, text, color }); }
function addNoise(x, y, level) {}
function getEntityAt(x, y) { return entities.find(e => e.x === x && e.y === y && e.blocksMovement && e.hp > 0); }
function attemptAction(e, action) { actionsTaken.push({ entity: e, action }); }
function executeBreathAttack(e) { /* mock */ }

// Map
let map = [];
function initMap() {
    map = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
        map[x] = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            map[x][y] = { type: 'floor', visible: false, explored: true };
        }
    }
}

function initNoise() {
    noiseMap = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
        noiseMap[x] = new Float32Array(MAP_HEIGHT).fill(0);
    }
}

// Entity
class Entity {
    constructor(x, y, char, color, name, hp, atk, def, speed) {
        this.x = x; this.y = y;
        this.char = char; this.color = color;
        this.name = name;
        this.maxHp = hp; this.hp = hp;
        this.atk = atk; this.def = def;
        this.speed = speed;
        this.energy = 0;
        this.isPlayer = false;
        this.blocksMovement = true;
        this.sleeping = false; // Start awake for tests
        this.vigilance = 0;
        this.lastSeenPlayerPos = null;
        this.sensingRadius = BASE_SENSING_RADIUS;
        this.stats = { str: 10, int: 10, dex: 10 };
        this.skillPoints = 0;
    }
}

let entities = [];
let player = null;

// Load game data
eval(fs.readFileSync('src/data/enemies.js', 'utf8'));

// Load AI
eval(fs.readFileSync('src/systems/ai.js', 'utf8'));

function resetState() {
    logMessages = [];
    particles = [];
    actionsTaken = [];
    entities = [];
    initMap();
    initNoise();
    player = new Entity(35, 25, '@', '#66fcf1', 'Player', 100, 10, 5, 10);
    player.isPlayer = true;
    player.inventory = [];
    player.equipment = {};
    player.killsByType = {};
    entities.push(player);
}

// ============================================================
console.log('\n🐺 TEST 1: Pack Mentality — Alert Cascade');
// ============================================================
resetState();

// Make player visible at 35,25
for (let x = 30; x <= 40; x++) for (let y = 20; y <= 30; y++) map[x][y].visible = true;

// Spawn 3 Fire Hounds near each other
let fh1 = new Entity(33, 25, 'h', '#ff3b3b', 'Fire Hound', 15, 5, 2, 14);
fh1.personality = 'pack';
let fh2 = new Entity(33, 27, 'h', '#ff3b3b', 'Fire Hound', 15, 5, 2, 14);
fh2.personality = 'pack';
let fh3 = new Entity(33, 29, 'h', '#ff3b3b', 'Fire Hound', 15, 5, 2, 14);
fh3.personality = 'pack';
entities.push(fh1, fh2, fh3);

// Process fh1 — it should alert fh2 and fh3
processMonsterAI(fh1);

assert(fh1.packAlerted === true, 'First hound is pack-alerted');
assert(fh2.packAlerted === true, 'Second hound receives alert');
assert(fh3.packAlerted === true, 'Third hound receives alert');
assert(fh2.sleeping === false, 'Alerted hounds are awake');
assert(fh2.alertTarget !== null && fh2.alertTarget !== undefined, 'Alerted hounds have alert target');
assert(fh2.alertSpeedBoost > 0, 'Alerted hounds have speed boost');
assert(particles.some(p => p.text === 'RALLY!'), 'Rally particle spawned');

// ============================================================
console.log('\n🏃 TEST 2: Retreat Logic — Wounded Monster Flees');
// ============================================================
resetState();

let orc = new Entity(36, 25, 'o', '#27ae60', 'Orc', 20, 5, 2, 8);
orc.hp = 4; // 20% HP — below 30% threshold
orc.maxHp = 20;
orc.personality = 'vengeful';
entities.push(orc);

// Run retreat logic multiple times to account for random chance
let retreated = false;
for (let i = 0; i < 20; i++) {
    actionsTaken = [];
    orc.retreating = false;
    if (handleRetreat(orc, Math.abs(orc.x - player.x) + Math.abs(orc.y - player.y))) {
        retreated = true;
        break;
    }
}
assert(retreated, 'Wounded orc retreats');

// Test that bosses don't retreat
resetState();
let boss = new Entity(36, 25, 'B', '#c0392b', 'Balrog', 150, 18, 12, 10);
boss.hp = 20; // 13% HP
boss.maxHp = 150;
boss.miniBoss = true;
boss.bossPhases = true;
entities.push(boss);
let bossRetreated = handleRetreat(boss, 1);
assert(!bossRetreated, 'Bosses do NOT retreat');

// ============================================================
console.log('\n🗡️ TEST 3: Ambusher AI — Spring Attack');
// ============================================================
resetState();

let lurker = new Entity(34, 25, 'l', '#2c3e50', 'Lurker', 18, 9, 2, 12);
lurker.ambusher = true;
lurker.invisible = true;
entities.push(lurker);

// Far away — should hide
actionsTaken = [];
let handled = handleAmbush(lurker, 10, false);
assert(handled === true, 'Ambusher hides when player is far');
assert(lurker.ambushHidden === true, 'Ambusher is hidden');
assert(lurker.ambushed !== true, 'Ambusher has NOT sprung yet');

// Close range — should spring
lurker.ambushHidden = false;
actionsTaken = [];
let atkBefore = lurker.atk;
handled = handleAmbush(lurker, 2, true);
assert(handled === true, 'Ambusher springs when player is close');
assert(lurker.ambushed === true, 'Ambush flag set');
assert(lurker.invisible === false, 'Ambusher becomes visible');
assert(lurker.atk > atkBefore, 'Ambusher gets ATK bonus');
assert(logMessages.some(m => m.msg.includes('lunges from the shadows')), 'Ambush message logged');

// ============================================================
console.log('\n💚 TEST 4: Support Units — Healer');
// ============================================================
resetState();

let shaman = new Entity(30, 25, 'g', '#9b59b6', 'Goblin Shaman', 12, 2, 1, 8);
shaman.support = 'healer';
shaman.sleeping = false;
entities.push(shaman);

let woundedGob = new Entity(31, 25, 'g', '#2ecc71', 'Goblin', 10, 3, 1, 10);
woundedGob.hp = 4;
woundedGob.maxHp = 10;
woundedGob.sleeping = false;
entities.push(woundedGob);

map[30][25].visible = true;
let hpBefore = woundedGob.hp;
let healHandled = handleSupportAI(shaman, 5, true);
assert(healHandled === true, 'Healer handled support action');
assert(woundedGob.hp > hpBefore, `Wounded goblin healed (${hpBefore} -> ${woundedGob.hp})`);
assert(shaman.supportCooldown === 3, 'Healer has 3-tick cooldown');
assert(particles.some(p => p.text.includes('HP')), 'Heal particle spawned');

// ============================================================
console.log('\n⚡ TEST 5: Support Units — Buffer');
// ============================================================
resetState();

let channeler = new Entity(30, 25, 'c', '#8e44ad', 'Dark Channeler', 20, 3, 2, 9);
channeler.support = 'buffer';
channeler.sleeping = false;
entities.push(channeler);

let targetOrc = new Entity(31, 25, 'o', '#27ae60', 'Orc', 20, 5, 2, 8);
targetOrc.sleeping = false;
entities.push(targetOrc);

let atkBeforeBuff = targetOrc.atk;
let buffHandled = handleSupportAI(channeler, 5, true);
assert(buffHandled === true, 'Buffer handled support action');
assert(targetOrc.atk === atkBeforeBuff + 2, `Orc buffed ATK (${atkBeforeBuff} -> ${targetOrc.atk})`);
assert(targetOrc.supportBuffTimer === 15, 'Buff lasts 15 ticks');
assert(channeler.supportCooldown === 5, 'Buffer has 5-tick cooldown');
assert(particles.some(p => p.text === 'BUFF!'), 'Buff particle spawned');

// ============================================================
console.log('\n👹 TEST 6: Boss Phases — HP Transitions');
// ============================================================
resetState();

let balrog = new Entity(36, 25, 'B', '#c0392b', 'Balrog', 150, 18, 12, 10);
balrog.bossPhases = true;
balrog.maxHp = 150;
entities.push(balrog);

// Phase 1: Full HP — no changes
let baseAtk = balrog.atk;
let baseSpd = balrog.speed;
handleBossPhase(balrog, 3, true);
assert(!balrog.phase2Triggered, 'Phase 2 NOT triggered at full HP');

// Phase 2: 60% HP
balrog.hp = 85; // ~57%
handleBossPhase(balrog, 3, true);
assert(balrog.phase2Triggered === true, 'Phase 2 triggered at 57% HP');
assert(balrog.atk === baseAtk + 3, `Balrog ATK increased by 3 (${baseAtk} -> ${balrog.atk})`);
assert(balrog.speed === baseSpd + 2, `Balrog speed increased by 2`);

// Phase 3: 30% HP
balrog.hp = 40; // ~27%
let atkBeforeP3 = balrog.atk;
handleBossPhase(balrog, 3, true);
assert(balrog.phase3Triggered === true, 'Phase 3 triggered at 27% HP');
assert(balrog.atk === atkBeforeP3 + 5, `Balrog ATK increased by 5 more`);
assert(balrog.phase3Summoned === true, 'Phase 3 summons minions');

// ============================================================
console.log('\n🔪 TEST 7: The Butcher — Boss-specific Phase 2');
// ============================================================
resetState();

let butcher = new Entity(36, 25, 'B', '#c0392b', 'The Butcher', 80, 12, 5, 9);
butcher.bossPhases = true;
butcher.miniBoss = true;
butcher.maxHp = 80;
butcher.hp = 40; // 50% — triggers phase 2
entities.push(butcher);

handleBossPhase(butcher, 3, true);
assert(butcher.phase2Triggered === true, 'Butcher phase 2 triggered');
assert(butcher.lifeSteal === true, 'Butcher gains life steal in phase 2');

// ============================================================
console.log('\n🌑 TEST 8: Shadow Queen — Boss-specific Phase 3');
// ============================================================
resetState();

let shadowQ = new Entity(36, 25, 'S', '#8e44ad', 'Shadow Queen', 120, 15, 8, 14);
shadowQ.bossPhases = true;
shadowQ.miniBoss = true;
shadowQ.maxHp = 120;
shadowQ.hp = 30; // 25% — triggers phases 2 and 3
entities.push(shadowQ);

handleBossPhase(shadowQ, 3, true);
assert(shadowQ.phase2Triggered === true, 'Shadow Queen phase 2 triggered');
shadowQ.hp = 25;
handleBossPhase(shadowQ, 3, true);
assert(shadowQ.phase3Triggered === true, 'Shadow Queen phase 3 triggered');
assert(shadowQ.invisible === true, 'Shadow Queen becomes invisible in phase 3');

// ============================================================
console.log('\n🐾 TEST 9: Retreat toward healer');
// ============================================================
resetState();

let healerMon = new Entity(30, 30, 'g', '#9b59b6', 'Goblin Shaman', 12, 2, 1, 8);
healerMon.support = 'healer';
entities.push(healerMon);

let woundedKob = new Entity(35, 25, 'k', '#c0392b', 'Kobold', 12, 4, 2, 11);
woundedKob.hp = 3; // 25% — should retreat
woundedKob.maxHp = 12;
woundedKob.personality = 'cowardly';
entities.push(woundedKob);

// Cowardly at <50% always retreats
actionsTaken = [];
let retreatResult = handleRetreat(woundedKob, 1);
assert(retreatResult === true, 'Wounded cowardly kobold retreats');
if (actionsTaken.length > 0) {
    let moveAction = actionsTaken[0].action;
    // Should move toward healer (which is at 30,30 — left and down from 35,25)
    assert(moveAction.dx <= 0, 'Kobold retreats toward healer (left)');
}

// ============================================================
console.log('\n🔄 TEST 10: Support buff decay');
// ============================================================
resetState();

let buffedOrc = new Entity(36, 25, 'o', '#27ae60', 'Orc', 20, 7, 2, 8); // ATK 7 (base 5 + 2 buff)
buffedOrc.supportBuffTimer = 1; // About to expire
buffedOrc.supportBuffAtk = 2;
buffedOrc.sleeping = false;
entities.push(buffedOrc);

// Set up visible tiles
map[36][25].visible = true;

// Process AI — should decay buff
processMonsterAI(buffedOrc);
assert(buffedOrc.supportBuffTimer === 0, 'Buff timer decayed');
assert(buffedOrc.atk === 5, `Buff ATK removed (7 -> ${buffedOrc.atk})`);

// ============================================================
// Summary
// ============================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
console.log(`${'='.repeat(50)}`);
if (failed > 0) process.exit(1);
