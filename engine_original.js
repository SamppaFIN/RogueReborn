/**
 * TomeNET MVP Engine - Real-Time Tick Based
 * Features: Energy System, Town/Dungeon Loop, ESP, Auto-running, Tunneling
 */

const TILE_SIZE = 24;
const MAP_WIDTH = 70;
const MAP_HEIGHT = 50;

const CHARS = {
    WALL: '#', FLOOR: '.',
    PLAYER: '@', STAIRS_DOWN: '>', STAIRS_UP: '<',
    GOLD: '$', POTION: '!', SCROLL: '?', HELM: ']', RING: '='
};

const COLORS = {
    DARK_WALL: '#1f2833', DARK_FLOOR: '#0b0c10',
    LIT_WALL: '#45a29e', LIT_FLOOR: '#1a1f24',
    TOWN_WALL: '#825a3d', TOWN_FLOOR: '#5c402a',
    PLAYER: '#66fcf1', STAIRS: '#f1c40f',
    GOLD: '#f1c40f', POTION: '#ff79c6', SCROLL: '#bd93f9', HELM: '#8be9fd', RING: '#ffb86c',
    GOBLIN: '#2ecc71', FIRE_HOUND: '#ff3b3b', TROLL: '#e74c3c'
};

const ENEMY_TYPES = [
    { char: 'r', name: 'Rat', color: '#888', hp: 5, atk: 1, def: 0, speed: 12, element: 'none', baseXP: 5 },
    { char: 'g', name: 'Goblin', color: COLORS.GOBLIN, hp: 10, atk: 3, def: 1, speed: 10, element: 'none', baseXP: 10 },
    { char: 'k', name: 'Kobold', color: '#c0392b', hp: 12, atk: 4, def: 2, speed: 11, element: 'none', baseXP: 15 },
    { char: 'h', name: 'Fire Hound', color: COLORS.FIRE_HOUND, hp: 15, atk: 5, def: 2, speed: 14, element: 'fire', baseXP: 25 },
    { char: 'o', name: 'Orc', color: '#27ae60', hp: 20, atk: 6, def: 3, speed: 8, element: 'none', baseXP: 30 },
    { char: 'e', name: 'Dark Elf', color: '#8e44ad', hp: 18, atk: 7, def: 3, speed: 12, element: 'magic', baseXP: 45 },
    { char: 'T', name: 'Cave Troll', color: COLORS.TROLL, hp: 35, atk: 9, def: 5, speed: 6, element: 'none', baseXP: 60 },
    { char: 'W', name: 'Wraith', color: '#95a5a6', hp: 25, atk: 8, def: 2, speed: 10, element: 'drain', baseXP: 80 },
    { char: 'D', name: 'Dragon', color: '#e67e22', hp: 50, atk: 12, def: 7, speed: 8, element: 'fire', baseXP: 150 },
    { char: 'B', name: 'Balrog', color: '#c0392b', hp: 150, atk: 18, def: 12, speed: 10, element: 'fire', baseXP: 500 },
    { char: 's', name: 'Giant Spider', color: '#2ecc71', hp: 14, atk: 4, def: 1, speed: 13, element: 'poison', baseXP: 20 },
    // Phase III — Bestiary Awakens
    { char: 'C', name: 'Gelatinous Cube', color: 'rgba(100,255,100,0.5)', hp: 30, atk: 6, def: 3, speed: 5, element: 'none', baseXP: 40, invisible: true },  // #21
    { char: 'V', name: 'Vampire', color: '#8e44ad', hp: 28, atk: 8, def: 3, speed: 11, element: 'drain', drainMaxHp: true, baseXP: 90 },  // #23
    { char: 'N', name: 'Necromancer', color: '#9b59b6', hp: 20, atk: 7, def: 1, speed: 9, element: 'magic', summoner: true, baseXP: 70 },  // #24
    { char: 'Z', name: 'Skeleton', color: '#ecf0f1', hp: 18, atk: 5, def: 4, speed: 8, element: 'none', baseXP: 35 },  // #25
    { char: 'X', name: 'Rust Monster', color: '#d35400', hp: 16, atk: 3, def: 0, speed: 10, element: 'rust', baseXP: 50 },  // #26
    { char: 'n', name: 'Blink Dog', color: '#3498db', hp: 12, atk: 5, def: 2, speed: 15, element: 'none', blinker: true, baseXP: 45 },  // #27
    { char: 'I', name: 'Beholder', color: '#e74c3c', hp: 22, atk: 9, def: 2, speed: 8, element: 'magic', rangedDebuff: true, baseXP: 85 },  // #28
    { char: 'M', name: 'Mind Flayer', color: '#8e44ad', hp: 24, atk: 7, def: 3, speed: 9, element: 'magic', xpDrain: true, baseXP: 100 },  // #29
    { char: 'R', name: 'Giant Rat', color: '#a04000', hp: 18, atk: 4, def: 1, speed: 14, element: 'poison', baseXP: 18 },   // #30
    // Phase IX — Elite Encounters & Mini-Bosses
    { char: 'L', name: 'Arch-Lich', color: '#9b59b6', hp: 80, atk: 14, def: 8, speed: 9, element: 'magic', xpDrain: true, summoner: true, baseXP: 350, miniBoss: true },  // #83 - floor 8
    { char: 'K', name: 'Dragon King', color: '#e74c3c', hp: 120, atk: 16, def: 10, speed: 10, element: 'fire', drainMaxHp: true, rangedDebuff: true, baseXP: 450, miniBoss: true }, // #84 - floor 9
    { char: 'O', name: 'Champion Orc', color: '#27ae60', hp: 45, atk: 10, def: 6, speed: 9, element: 'none', baseXP: 80, elite: true },  // #81
    { char: 'Q', name: 'Cave Champion', color: COLORS.TROLL, hp: 70, atk: 13, def: 8, speed: 7, element: 'none', baseXP: 110, elite: true }  // #82
];


const ITEM_DB = [
    // Potions
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Minor Healing', effect: 'heal', value: 10, minFloor: 1, cost: 10 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Curing', effect: 'heal', value: 25, minFloor: 2, cost: 25 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Greater Healing', effect: 'heal', value: 75, minFloor: 5, cost: 100 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Full Healing', effect: 'heal', value: 250, minFloor: 8, cost: 300 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Poison', effect: 'poison', value: 10, minFloor: 2, cost: 5 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Slowness', effect: 'slow', value: 10, minFloor: 3, cost: 5 },
    { type: 'potion', char: CHARS.POTION, color: '#f1c40f', name: 'Potion of Experience', effect: 'xp', minFloor: 5, cost: 500 },
    // Phase VI — New Status Potions
    { type: 'potion', char: CHARS.POTION, color: '#9b59b6', name: 'Potion of Confusion', effect: 'confuse_self', minFloor: 2, cost: 5 },
    { type: 'potion', char: CHARS.POTION, color: '#888888', name: 'Potion of Blindness', effect: 'blind_self', minFloor: 2, cost: 5 },
    { type: 'potion', char: CHARS.POTION, color: '#2ecc71', name: 'Potion of Regeneration', effect: 'regen_boost', minFloor: 3, cost: 80 },
    { type: 'potion', char: CHARS.POTION, color: '#e0c080', name: 'Potion of Paralysis', effect: 'paralyze_self', minFloor: 2, cost: 5 },  // #53
    { type: 'scroll', char: CHARS.SCROLL, color: '#e74c3c', name: 'Scroll of Confusion', effect: 'confuse_monster', minFloor: 3, cost: 60 },
    // Phase IV — Dungeon Key
    { type: 'key', char: '!', color: '#f1c40f', name: 'Dungeon Key', effect: 'key', minFloor: 1, cost: 0 },

    // Scrolls
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Word of Recall', effect: 'recall', minFloor: 1, cost: 50 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Scroll of Identify', effect: 'identify', minFloor: 1, cost: 30 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Scroll of Remove Curse', effect: 'uncurse', minFloor: 2, cost: 40 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Scroll of Summon Monster', effect: 'summon', minFloor: 2, cost: 5 },

    // Wands
    { type: 'wand', char: '/', color: '#9b59b6', name: 'Wand of Magic Missile', effect: 'target_spell', spell: 'magic_missile', charges: 10, minFloor: 1, cost: 150 },
    // Phase V — Advanced Wands
    { type: 'wand', char: '/', color: '#3498db', name: 'Wand of Frost', effect: 'target_spell', spell: 'frost', charges: 8, minFloor: 2, cost: 200 },
    { type: 'wand', char: '/', color: '#f1c40f', name: 'Wand of Lightning', effect: 'target_spell', spell: 'lightning', charges: 6, minFloor: 3, cost: 300 },
    { type: 'wand', char: '/', color: '#2ecc71', name: 'Wand of Slow', effect: 'target_spell', spell: 'slow_bolt', charges: 12, minFloor: 2, cost: 180 },
    { type: 'wand', char: '/', color: '#66fcf1', name: 'Wand of Haste', effect: 'haste_self', charges: 6, minFloor: 4, cost: 400 },
    { type: 'wand', char: '/', color: '#9b59b6', name: 'Wand of Teleportation', effect: 'teleport_self', charges: 5, minFloor: 3, cost: 350 },
    { type: 'wand', char: '/', color: '#e74c3c', name: 'Wand of Drain Life', effect: 'target_spell', spell: 'drain_life', charges: 6, minFloor: 5, cost: 500 },
    { type: 'wand', char: '/', color: '#e67e22', name: 'Wand of Fire', effect: 'target_spell', spell: 'fire_bolt', charges: 8, minFloor: 4, cost: 380 },
    { type: 'wand', char: '/', color: '#f1c40f', name: 'Staff of Wizardry', effect: 'target_spell', spell: 'arcane_blast', charges: 15, minFloor: 7, cost: 1200 },
    // Phase V — AoE Scroll
    { type: 'scroll', char: CHARS.SCROLL, color: '#e67e22', name: 'Scroll of Fireball', effect: 'fireball_aoe', minFloor: 4, cost: 150 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#3498db', name: 'Scroll of Frost Nova', effect: 'frost_nova', minFloor: 5, cost: 180 },

    // Helms
    { type: 'helm', char: CHARS.HELM, color: '#bdc3c7', name: 'Leather Cap', effect: 'helm', equip: true, defBonus: 1, minFloor: 1, cost: 20 },
    { type: 'helm', char: CHARS.HELM, color: '#7f8c8d', name: 'Iron Helm', effect: 'helm', equip: true, defBonus: 2, minFloor: 3, cost: 80 },
    { type: 'helm', char: CHARS.HELM, color: '#f39c12', name: 'Mithril Crown', effect: 'helm', equip: true, defBonus: 4, minFloor: 7, cost: 400 },
    { type: 'helm', char: CHARS.HELM, color: COLORS.HELM, name: 'Helm of Telepathy', effect: 'esp', equip: true, minFloor: 5, cost: 500 },

    // Rings
    { type: 'ring', char: CHARS.RING, color: '#e74c3c', name: 'Ring of Fire Resist', effect: 'resist_fire', equip: true, minFloor: 3, cost: 150 },
    { type: 'ring', char: CHARS.RING, color: '#3498db', name: 'Ring of Protection (+1)', effect: 'protection', equip: true, defBonus: 1, minFloor: 2, cost: 200 },
    { type: 'ring', char: CHARS.RING, color: '#9b59b6', name: 'Ring of Protection (+2)', effect: 'protection', equip: true, defBonus: 2, minFloor: 6, cost: 450 },

    // Amulets
    { type: 'amulet', char: '"', color: '#2ecc71', name: 'Amulet of Regeneration', effect: 'regeneration', equip: true, minFloor: 4, cost: 300 },
    { type: 'amulet', char: '"', color: '#e67e22', name: 'Amulet of Strength', effect: 'strength', equip: true, minFloor: 3, cost: 350 },

    // Weapons
    { type: 'weapon', char: '|', color: '#bdc3c7', name: 'Dagger', effect: 'weapon', equip: true, atkBonus: 1, minFloor: 1, cost: 10 },
    { type: 'weapon', char: '|', color: '#ecf0f1', name: 'Short Sword', effect: 'weapon', equip: true, atkBonus: 2, minFloor: 2, cost: 40 },
    { type: 'weapon', char: '|', color: '#95a5a6', name: 'Longsword', effect: 'weapon', equip: true, atkBonus: 3, minFloor: 3, cost: 80 },
    { type: 'weapon', char: '\\', color: '#7f8c8d', name: 'Battle Axe', effect: 'weapon', equip: true, atkBonus: 4, minFloor: 4, cost: 150 },
    { type: 'weapon', char: '|', color: '#f1c40f', name: 'Longsword (+1)', effect: 'weapon', equip: true, atkBonus: 4, minFloor: 5, cost: 250 },
    { type: 'weapon', char: '|', color: '#3498db', name: 'Frost Blade', effect: 'weapon', equip: true, atkBonus: 6, minFloor: 7, cost: 600 },
    { type: 'weapon', char: '|', color: '#e74c3c', name: 'Vorpal Sword', effect: 'weapon', equip: true, atkBonus: 10, minFloor: 9, cost: 1500 },
    { type: 'weapon', char: '}', color: '#825a3d', name: 'Short Bow', effect: 'bow', equip: true, atkBonus: 1, minFloor: 1, cost: 50 },
    // #11 Extended Bows
    { type: 'weapon', char: '}', color: '#c0a060', name: 'Long Bow', effect: 'bow', equip: true, atkBonus: 3, minFloor: 3, cost: 120 },
    { type: 'weapon', char: '}', color: '#7f8c8d', name: 'Heavy Crossbow', effect: 'crossbow', equip: true, atkBonus: 5, minFloor: 4, cost: 200 },
    // #12 Polearms
    { type: 'weapon', char: '/', color: '#95a5a6', name: 'Spear', effect: 'weapon', equip: true, atkBonus: 3, reach: 2, minFloor: 2, cost: 60 },
    { type: 'weapon', char: '/', color: '#bdc3c7', name: 'Halberd', effect: 'weapon', equip: true, atkBonus: 5, reach: 2, minFloor: 5, cost: 200 },
    // #14 Dual Wield
    { type: 'weapon', char: '!', color: '#e67e22', name: 'Paired Daggers', effect: 'weapon', equip: true, atkBonus: 2, dualWield: true, speedBonus: 2, minFloor: 2, cost: 80 },
    // #15 Artifacts
    { type: 'weapon', char: '|', color: '#f1c40f', name: 'Sting', effect: 'weapon', equip: true, atkBonus: 8, artifact: true, identified: true, minFloor: 4, cost: 2000 },
    { type: 'weapon', char: '|', color: '#e74c3c', name: 'Glamdring', effect: 'weapon', equip: true, atkBonus: 12, artifact: true, identified: true, element: 'fire', minFloor: 7, cost: 5000 },
    { type: 'weapon', char: '|', color: '#66fcf1', name: 'Anduril', effect: 'weapon', equip: true, atkBonus: 15, artifact: true, identified: true, minFloor: 9, cost: 8000 },
    // #16 Whip
    { type: 'weapon', char: '~', color: '#d35400', name: 'Leather Whip', effect: 'weapon', equip: true, atkBonus: 2, disarm: 0.20, minFloor: 1, cost: 35 },

    // Ammo
    { type: 'ammo', char: '-', color: '#95a5a6', name: 'Bundle of Arrows', effect: 'ammo', amount: 20, minFloor: 1, cost: 20 },
    { type: 'ammo', char: '-', color: '#7f8c8d', name: 'Crossbow Bolts', effect: 'ammo', amount: 15, minFloor: 1, cost: 25 },

    // #13 Shields (off-hand)
    { type: 'shield', char: ')', color: '#d35400', name: 'Wooden Shield', effect: 'shield', equip: true, defBonus: 2, speedPenalty: 1, minFloor: 1, cost: 45 },
    { type: 'shield', char: ')', color: '#bdc3c7', name: 'Iron Shield', effect: 'shield', equip: true, defBonus: 4, speedPenalty: 2, minFloor: 4, cost: 150 },
    { type: 'shield', char: ')', color: '#f1c40f', name: 'Mithril Shield', effect: 'shield', equip: true, defBonus: 6, speedPenalty: 1, minFloor: 7, cost: 500 },

    // Armor
    { type: 'armor', char: '[', color: '#d35400', name: 'Leather Armor', effect: 'armor', equip: true, defBonus: 1, minFloor: 1, cost: 30 },
    { type: 'armor', char: '[', color: '#bdc3c7', name: 'Chain Mail', effect: 'armor', equip: true, defBonus: 3, minFloor: 3, cost: 100 },
    { type: 'armor', char: '[', color: '#7f8c8d', name: 'Plate Mail', effect: 'armor', equip: true, defBonus: 5, minFloor: 5, cost: 250 },
    { type: 'armor', char: '[', color: '#f1c40f', name: 'Mithril Plate', effect: 'armor', equip: true, defBonus: 8, minFloor: 8, cost: 800 },
    // #18 Mage Robes
    { type: 'armor', char: '[', color: '#9b59b6', name: 'Mage Robes', effect: 'armor', equip: true, defBonus: 0, spellBoost: 5, minFloor: 1, cost: 120 },

    // #19 Cursed Ring of Burden
    { type: 'ring', char: CHARS.RING, color: '#888888', name: 'Ring of Burden', effect: 'burden', equip: true, speedPenalty: 3, cursed: true, minFloor: 3, cost: 1 },

    // #20 Scroll of Enchant Weapon
    { type: 'scroll', char: CHARS.SCROLL, color: '#f39c12', name: 'Scroll of Enchant Weapon', effect: 'enchant_weapon', minFloor: 3, cost: 80 },
    // Scroll of Enchant Armor
    { type: 'scroll', char: CHARS.SCROLL, color: '#3498db', name: 'Scroll of Enchant Armor', effect: 'enchant_armor', minFloor: 4, cost: 100 }
];

let currentShopItems = [];
let identifiedTypes = {};

let timeOfDay = 'Day';
let totalTurns = 0;
let bountyTarget = null;
let bountyClaimed = false;

const POTION_COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Clear', 'Swirling'];
const SCROLL_TITLES = ['ZELGO MER', 'FOO BAR', 'BREAD MAKES YOU FAT', 'KLAATU BARADA NIKTO', 'XYZZY', 'ABAB', 'YENDOR'];
const WAND_WOODS = ['Oak', 'Pine', 'Iron', 'Bone', 'Glass', 'Ebony', 'Ivory'];

function randomizeFlavors() {
    let pColors = [...POTION_COLORS].sort(() => Math.random() - 0.5);
    let sTitles = [...SCROLL_TITLES].sort(() => Math.random() - 0.5);
    let wWoods = [...WAND_WOODS].sort(() => Math.random() - 0.5);

    ITEM_DB.forEach(item => {
        if (item.type === 'potion') item.flavor = `${pColors.pop() || 'Strange'} Potion`;
        if (item.type === 'scroll') item.flavor = `Scroll labeled '${sTitles.pop() || 'UNKNOWN'}'`;
        if (item.type === 'wand') item.flavor = `${wWoods.pop() || 'Weird'} Wand`;
    });
}
randomizeFlavors();

function getItemName(item) {
    if (!item) return "Empty";
    let name = item.name;
    let isUnid = false;

    if (['potion', 'scroll', 'wand'].includes(item.type)) {
        if (identifiedTypes[item.name]) return item.name;
        name = item.flavor || item.name;
        isUnid = true;
    } else if (['weapon', 'armor', 'helm', 'ring', 'amulet'].includes(item.type)) {
        if (item.identified) {
            name = item.name;
            if (item.blessed) name = `Blessed ${name}`;
            if (item.cursed) name = `Cursed ${name}`;
        } else {
            name = `Unidentified ${item.name.split(' (')[0]}`;
            isUnid = true;
        }
    }
    return name + (isUnid ? " (?)" : "");
}

window.startGame = function (className) {
    const nameInput = document.getElementById('charName').value || 'Nameless';
    player.name = nameInput;
    player.level = 1;
    player.xp = 0;
    player.nextXp = 50;

    player.class = className; // #VIII store class
    player.killCount = 0;     // track kills for perks
    player.combatSurgeTimer = 0; // Warrior perk
    player.inventory = [];    // FIX: Clear inventory on start to avoid duplication
    player.equipment = { weapon: null, armor: null, helm: null, ring: null, amulet: null, offhand: null };
    currentFloor = 0;         // FIX: Ensure we start in town

    if (className === 'Warrior') {
        player.maxHp = 40; player.hp = 40; player.atk = 7; player.def = 4; player.speed = 8;
        logMessage("Warrior Perk: Combat Surge every 5 kills (+2 Atk, 20 ticks)", 'magic');
    } else if (className === 'Mage') {
        player.maxHp = 25; player.hp = 25; player.atk = 4; player.def = 2; player.speed = 10;
        player.spellMastery = true; // Spells scale with level
        player.inventory.push({ ...ITEM_DB.find(i => i.name === 'Wand of Magic Missile'), identified: true });
        identifiedTypes['Wand of Magic Missile'] = true;
        // Mage Robes
        const robes = { ...ITEM_DB.find(i => i.name === 'Mage Robes'), identified: true };
        player.inventory.push(robes);
        player.equipment.armor = robes;
        logMessage("Mage Perk: Spell Mastery — spell damage scales with level", 'magic');
    } else if (className === 'Rogue') {
        player.maxHp = 30; player.hp = 30; player.atk = 5; player.def = 3; player.speed = 14;
        player.backstab = true; // First hit from unseen = double damage
        logMessage("Rogue Perk: Backstab — first hit from unseen = 2x damage", 'magic');
    }
    const modal = document.getElementById('charCreateModal');
    if (modal) modal.classList.remove('active');
    
    // Drop focus so Spacebar doesn't click the start button again!
    if (document.activeElement) document.activeElement.blur();

    gameState = 'PLAYING';
    generateTown();
    computeFOV();
    updateUI();
    logMessage("Welcome to Autonomous Rogue. Press '?' or explore.", "hint");
};

window.showGameOverModal = function (killerName) {
    gameState = 'PLAYER_DEAD';

    // Calculate Score
    const score = Math.floor(player.xp + (player.gold * 2) + (currentFloor * 100));

    document.getElementById('go-killer').innerText = killerName;
    document.getElementById('go-floor').innerText = currentFloor === 0 ? "Town" : currentFloor;
    document.getElementById('go-level').innerText = player.level;
    document.getElementById('go-gold').innerText = player.gold;
    document.getElementById('go-score').innerText = score;

    // Record Score to Guildhall
    let scores = JSON.parse(localStorage.getItem('tomenet_highscores') || '[]');
    scores.push({
        score: score,
        name: player.name,
        class: player.class || 'Unknown',
        level: player.level,
        floor: currentFloor === 0 ? "Town" : currentFloor,
        killer: killerName
    });
    scores.sort((a,b) => b.score - a.score);
    scores = scores.slice(0, 10); // keep top 10
    localStorage.setItem('tomenet_highscores', JSON.stringify(scores));

    // Reveal all items
    const list = document.getElementById('go-items');
    list.innerHTML = '';

    // Combine equipment and backpack
    let allItems = [];
    Object.values(player.equipment).forEach(eq => { if (eq) allItems.push(eq); });
    player.inventory.forEach(item => {
        if (!Object.values(player.equipment).includes(item)) allItems.push(item);
    });

    if (allItems.length === 0) {
        list.innerHTML = '<li><span style="color:#666">No items carried.</span></li>';
    } else {
        allItems.forEach(item => {
            // Force identify
            if (['potion', 'scroll', 'wand'].includes(item.type)) {
                identifiedTypes[item.name] = true;
            } else {
                item.identified = true;
            }
            list.innerHTML += `<li><span style="color:${item.color}">${getItemName(item)}</span></li>`;
        });
    }

    document.getElementById('deathModal').classList.add('active');
    updateUI();
};

window.openShop = function () {
    gameState = 'SHOP';
    document.getElementById('shopModal').classList.add('active');
    document.getElementById('shopGold').innerText = player.gold;

    currentShopItems = ITEM_DB.filter(i => i.cost).map(i => ({ ...i }));
    currentShopItems.sort(() => Math.random() - 0.5);
    currentShopItems = currentShopItems.slice(0, 6); // 6 random items

    renderShop();
};

window.closeAllModals = function () {
    const modals = [
        'shopModal', 'innkeeperModal', 'blacksmithModal', 'wizardModal',
        'bankModal', 'inventoryModal', 'alchemistModal', 'trainerModal',
        'cartographerModal', 'guildhallModal', 'stashModal', 'deathModal'
    ];
    modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    gameState = 'PLAYING';
    updateUI();
};

window.closeShop = function () {
    closeAllModals();
};

window.buyItem = function buyItem(idx, isWizard = false) {
    const item = isWizard ? wizardInventory[idx] : currentShopItems[idx];
    if (player.gold >= item.cost) {
        if (player.inventory.length >= 18) {
            logMessage(`Inventory full!`, 'damage');
            return;
        }
        player.gold -= item.cost;
        let pItem = { ...item };

        // Items bought are identified
        if (['potion', 'scroll', 'wand'].includes(pItem.type)) {
            identifiedTypes[pItem.name] = true;
        } else {
            pItem.identified = true;
        }

        player.inventory.push(pItem);
        logMessage(`Bought ${getItemName(pItem)}.`, 'magic');
        if (isWizard) openWizard(); else openShop();
    } else {
        logMessage(`Not enough gold!`, 'damage');
    }
}

function sellItem(idx) {
    const item = player.inventory[idx];
    if (Object.values(player.equipment).includes(item)) {
        logMessage(`Cannot sell equipped item!`, 'damage');
        return;
    }
    const sellValue = Math.max(1, Math.floor((item.cost || 5) * 0.4));
    player.gold += sellValue;
    player.inventory.splice(idx, 1);
    logMessage(`Sold ${getItemName(item)} for ${sellValue}g.`);
    openShop();
}

// --- Innkeeper Modal ---
window.openInnkeeper = function () {
    gameState = 'INNKEEPER';
    document.getElementById('innkeeperModal').classList.add('active');
};

window.buyHeal = function () {
    if (player.hp === player.maxHp) {
        logMessage("You are already at full health.");
        return;
    }
    if (player.gold >= 20) {
        player.gold -= 20;
        player.hp = player.maxHp;
        player.energy = 0; // Resting passes a little time safely
        logMessage("You rest at the inn. Fully healed!", 'magic');
        closeInnkeeper();
    } else {
        logMessage("Not enough gold!", 'damage');
    }
};

window.closeInnkeeper = function () {
    closeAllModals();
};

// --- Blacksmith Modal ---
function getUpgradeCost(item) {
    if (!item) return 0;
    const currentBonus = (item.atkBonus || 0) + (item.defBonus || 0);
    return 50 * Math.pow(2, Math.max(0, currentBonus));
}

window.openBlacksmith = function () {
    gameState = 'BLACKSMITH';
    const modal = document.getElementById('blacksmithModal');

    // Weapon
    const w = player.equipment.weapon;
    const wName = document.getElementById('bs-weapon-name');
    const wBtn = document.getElementById('bs-btn-weapon');
    if (w) {
        wName.innerText = getItemName(w);
        wName.style.color = w.color;
        const cost = getUpgradeCost(w);
        document.getElementById('bs-cost-weapon').innerText = cost;
        wBtn.style.display = 'block';
        wBtn.disabled = player.gold < cost;
    } else {
        wName.innerText = "Empty";
        wName.style.color = '#888';
        wBtn.style.display = 'none';
    }

    // Armor
    const a = player.equipment.armor;
    const aName = document.getElementById('bs-armor-name');
    const aBtn = document.getElementById('bs-btn-armor');
    if (a) {
        aName.innerText = getItemName(a);
        aName.style.color = a.color;
        const cost = getUpgradeCost(a);
        document.getElementById('bs-cost-armor').innerText = cost;
        aBtn.style.display = 'block';
        aBtn.disabled = player.gold < cost;
    } else {
        aName.innerText = "Empty";
        aName.style.color = '#888';
        aBtn.style.display = 'none';
    }

    modal.classList.add('active');
};

window.upgradeEquipped = function (slot) {
    const item = player.equipment[slot];
    if (!item) return;
    const cost = getUpgradeCost(item);
    if (player.gold >= cost) {
        player.gold -= cost;
        if (slot === 'weapon') {
            item.atkBonus = (item.atkBonus || 0) + 1;
        } else if (slot === 'armor') {
            item.defBonus = (item.defBonus || 0) + 1;
        }
        item.identified = true; // Upgrading forces ID
        logMessage(`Blacksmith upgrades your ${getItemName(item)}!`, 'magic');
        openBlacksmith(); // Refresh
        updateUI();
    }
};

window.closeBlacksmith = function () {
    gameState = 'PLAYING';
    document.getElementById('blacksmithModal').classList.remove('active');
    updateUI();
};

// --- Wizard Modal ---
let wizardInventory = [];
function generateWizardInventory() {
    wizardInventory = [];
    const magicItems = ITEM_DB.filter(i => ['potion', 'scroll', 'wand'].includes(i.type));
    for (let i = 0; i < 6; i++) {
        const t = magicItems[Math.floor(Math.random() * magicItems.length)];
        wizardInventory.push({ ...t });
    }
}

window.openWizard = function () {
    gameState = 'WIZARD';
    if (wizardInventory.length === 0) generateWizardInventory();

    document.getElementById('wizGold').innerText = player.gold;
    const list = document.getElementById('wizItems');
    list.innerHTML = '';

    wizardInventory.forEach((item, idx) => {
        const canAfford = player.gold >= item.cost;
        const btnClass = canAfford ? 'shop-btn' : 'shop-btn-disabled';
        const typePrefix = `[${item.type.toUpperCase()}] `;

        let visualName = item.name;
        if (!identifiedTypes[item.name]) {
            if (item.type === 'potion') visualName = item.flavor;
            if (item.type === 'scroll') visualName = item.flavor;
            if (item.type === 'wand') visualName = item.flavor;
        }

        list.innerHTML += `
            <li>
                <span>${typePrefix}<span style="color:${item.color}">${visualName}</span> - ${item.cost}g</span>
                <button class="${btnClass}" onclick="buyItem(${idx}, true)" ${!canAfford ? 'disabled' : ''}>Buy</button>
            </li>
        `;
    });

    document.getElementById('wizardModal').classList.add('active');
};

window.closeWizard = function () {
    gameState = 'PLAYING';
    document.getElementById('wizardModal').classList.remove('active');
    updateUI();
};

// --- Bank Modal ---
window.openBank = function () {
    gameState = 'BANK';
    let vaultGold = parseInt(localStorage.getItem('vaultGold') || '0');
    document.getElementById('bank-hand-gold').innerText = player.gold + "g";
    document.getElementById('bank-vault-gold').innerText = vaultGold + "g";
    document.getElementById('bankModal').classList.add('active');
};
// --- Alchemist Modal ---
let alchemistInventory = [];
function generateAlchemistInventory() {
    alchemistInventory = [];
    const potionItems = ITEM_DB.filter(i => i.type === 'potion');
    for (let i = 0; i < 4; i++) {
        const t = potionItems[Math.floor(Math.random() * potionItems.length)];
        alchemistInventory.push({ ...t });
    }
}

window.openAlchemist = function () {
    gameState = 'ALCHEMIST';
    if (alchemistInventory.length === 0) generateAlchemistInventory();

    document.getElementById('alchemistGold').innerText = player.gold;
    const list = document.getElementById('alchemistItems');
    list.innerHTML = '';

    alchemistInventory.forEach((item, idx) => {
        const canAfford = player.gold >= item.cost;
        const btnClass = canAfford ? 'shop-btn' : 'shop-btn-disabled';
        
        // Alchemist always sells identified potions
        identifiedTypes[item.name] = true;

        list.innerHTML += `
            <li>
                <span><span style="color:${item.color}">${item.name}</span> - ${item.cost}g</span>
                <button class="${btnClass}" onclick="buyAlchemistItem(${idx})" ${!canAfford ? 'disabled' : ''}>Buy</button>
            </li>
        `;
    });

    // Check for 2 minor healing potions for transmute
    const minorHeals = player.inventory.filter(i => i.name === 'Potion of Minor Healing');
    const transmuteBtn = document.getElementById('btn-transmute-heal');
    if (minorHeals.length >= 2 && player.gold >= 50) {
        transmuteBtn.disabled = false;
        transmuteBtn.className = 'btn shop-btn';
    } else {
        transmuteBtn.disabled = true;
        transmuteBtn.className = 'btn shop-btn-disabled';
    }

    document.getElementById('alchemistModal').classList.add('active');
};

window.buyAlchemistItem = function(idx) {
    const item = alchemistInventory[idx];
    if (player.gold >= item.cost) {
        if (player.inventory.length >= 18) {
            logMessage(`Inventory full!`, 'damage');
            return;
        }
        player.gold -= item.cost;
        let pItem = { ...item, identified: true };
        player.inventory.push(pItem);
        logMessage(`Bought ${pItem.name}.`, 'magic');
        openAlchemist();
    }
}

window.transmutePotions = function() {
    const minorHeals = player.inventory.filter(i => i.name === 'Potion of Minor Healing');
    if (minorHeals.length >= 2 && player.gold >= 50) {
        player.gold -= 50;
        // Remove two minor heals
        let removed = 0;
        for (let i = player.inventory.length - 1; i >= 0; i--) {
            if (player.inventory[i].name === 'Potion of Minor Healing' && removed < 2) {
                player.inventory.splice(i, 1);
                removed++;
            }
        }
        // Add greater healing
        const greaterHeal = { ...ITEM_DB.find(i => i.name === 'Potion of Greater Healing'), identified: true };
        identifiedTypes['Potion of Greater Healing'] = true;
        player.inventory.push(greaterHeal);
        
        logMessage("The Alchemist brews your potions together. Transmutation successful!", "magic");
        openAlchemist();
    }
};

window.closeAlchemist = function () {
    gameState = 'PLAYING';
    document.getElementById('alchemistModal').classList.remove('active');
    updateUI();
};

// --- Trainer Modal ---
window.openTrainer = function () {
    gameState = 'TRAINER';
    document.getElementById('trainerGold').innerText = player.gold;
    document.getElementById('trainerModal').classList.add('active');
};

window.buyStatTraining = function(stat, cost) {
    if (player.gold >= cost) {
        player.gold -= cost;
        if (stat === 'hp') {
            player.maxHp += 10;
            player.hp += 10;
            logMessage("You feel hardier! (+10 Max HP)", "magic");
        } else if (stat === 'atk') {
            player.atk += 1;
            logMessage("Your strikes are more precise! (+1 ATK)", "magic");
        } else if (stat === 'def') {
            player.def += 1;
            logMessage("Your footwork improves! (+1 DEF)", "magic");
        }
        openTrainer();
    } else {
        logMessage("Trainer: 'Come back when you have the coin.'", "damage");
    }
};

window.closeTrainer = function () {
    gameState = 'PLAYING';
    document.getElementById('trainerModal').classList.remove('active');
    updateUI();
};

// --- Cartographer Modal ---
window.openCartographer = function () {
    gameState = 'CARTOGRAPHER';
    document.getElementById('cartGold').innerText = player.gold;
    document.getElementById('cartographerModal').classList.add('active');
};

window.buyIntel = function() {
    if (player.gold >= 100) {
        player.gold -= 100;
        const targetFloor = currentFloor + Math.floor(Math.random() * 3) + 1;
        const elites = ENEMY_TYPES.filter(e => e.elite || e.miniBoss);
        const randomElite = elites[Math.floor(Math.random() * elites.length)];
        
        document.getElementById('cart-intel-text').innerText = `"Beware... My scouts report a ${randomElite.name} roaming around Floor ${targetFloor}..."`;
        document.getElementById('btn-buy-intel').disabled = true;
        document.getElementById('btn-buy-intel').className = 'btn shop-btn-disabled';
        
        logMessage(`Cartographer sold you intel on ${randomElite.name}.`, "magic");
        document.getElementById('cartGold').innerText = player.gold;
    } else {
        logMessage("Cartographer: 'No gold, no secrets.'", "damage");
    }
};

window.closeCartographer = function () {
    gameState = 'PLAYING';
    document.getElementById('cartographerModal').classList.remove('active');
    // Reset intel button for next time
    document.getElementById('cart-intel-text').innerText = `"Pay me, and I'll tell you what hazards lie ahead..."`;
    document.getElementById('btn-buy-intel').disabled = false;
    document.getElementById('btn-buy-intel').className = 'btn shop-btn';
    updateUI();
};

window.depositGold = function (amount) {
    let vaultGold = parseInt(localStorage.getItem('vaultGold') || '0');
    let toDeposit = amount === 'all' ? player.gold : Math.min(player.gold, amount);
    if (toDeposit > 0) {
        player.gold -= toDeposit;
        vaultGold += toDeposit;
        localStorage.setItem('vaultGold', vaultGold);
        logMessage(`Deposited ${toDeposit}g.`, 'magic');
        openBank(); // Refresh
        updateUI();
    }
};

window.withdrawGold = function (amount) {
    let vaultGold = parseInt(localStorage.getItem('vaultGold') || '0');
    let toWithdraw = amount === 'all' ? vaultGold : Math.min(vaultGold, amount);
    if (toWithdraw > 0) {
        vaultGold -= toWithdraw;
        player.gold += toWithdraw;
        localStorage.setItem('vaultGold', vaultGold);
        logMessage(`Withdrew ${toWithdraw}g.`, 'pickup');
        openBank(); // Refresh
        updateUI();
    }
};

window.closeBank = function () {
    gameState = 'PLAYING';
    document.getElementById('bankModal').classList.remove('active');
    updateUI();
};

// --- Stash Modal ---
window.openStash = function () {
    gameState = 'STASH';
    document.getElementById('stashModal').classList.add('active');
    renderStashModal();
};

window.renderStashModal = function() {
    let stashItems = JSON.parse(localStorage.getItem('tomenet_stash') || '[]');
    
    document.getElementById('stash-count').innerText = stashItems.length;
    
    const sList = document.getElementById('stash-list');
    sList.innerHTML = '';
    stashItems.forEach((item, idx) => {
        sList.innerHTML += `
            <li style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                <span style="color:${item.color}">${getItemName(item)}</span>
                <button class="btn" style="padding:2px 5px; font-size:0.7em;" onclick="takeFromStash(${idx})">Take</button>
            </li>
        `;
    });

    const bList = document.getElementById('stash-inv-list');
    bList.innerHTML = '';
    player.inventory.forEach((item, idx) => {
        // Can't stash equipped items directly
        if (Object.values(player.equipment).includes(item)) return;
        bList.innerHTML += `
            <li style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                <span style="color:${item.color}">${getItemName(item)}</span>
                <button class="btn" style="padding:2px 5px; font-size:0.7em;" onclick="putInStash(${idx})">Store</button>
            </li>
        `;
    });
};

window.putInStash = function(invIdx) {
    let stashItems = JSON.parse(localStorage.getItem('tomenet_stash') || '[]');
    if (stashItems.length >= 5) {
        logMessage("Stash is full (Max 5 items).", "damage");
        return;
    }
    const item = player.inventory[invIdx];
    stashItems.push(item);
    localStorage.setItem('tomenet_stash', JSON.stringify(stashItems));
    player.inventory.splice(invIdx, 1);
    logMessage(`Stored ${getItemName(item)} in Stash.`, "magic");
    renderStashModal();
};

window.takeFromStash = function(stashIdx) {
    let stashItems = JSON.parse(localStorage.getItem('tomenet_stash') || '[]');
    if (player.inventory.length >= 18) {
        logMessage("Inventory full!", "damage");
        return;
    }
    const item = stashItems[stashIdx];
    player.inventory.push(item);
    stashItems.splice(stashIdx, 1);
    localStorage.setItem('tomenet_stash', JSON.stringify(stashItems));
    logMessage(`Took ${getItemName(item)} from Stash.`, "pickup");
    renderStashModal();
};

window.closeStash = function () {
    gameState = 'PLAYING';
    document.getElementById('stashModal').classList.remove('active');
    updateUI();
};

// --- Guildhall Modal ---
window.openGuildhall = function () {
    gameState = 'GUILDHALL';
    
    let scores = JSON.parse(localStorage.getItem('tomenet_highscores') || '[]');
    const list = document.getElementById('guildhall-scores');
    list.innerHTML = '';
    
    if (scores.length === 0) {
        list.innerHTML = "<li>No legends recorded yet.</li>";
    } else {
        scores.forEach(s => {
            list.innerHTML += `<li><span style="color:#f1c40f">${s.score} pts</span> - <span style="color:#66fcf1">${s.name}</span> the Lvl ${s.level} ${s.class} (Floor ${s.floor})</li>`;
        });
    }

    document.getElementById('guildhallModal').classList.add('active');
};

window.closeGuildhall = function () {
    gameState = 'PLAYING';
    document.getElementById('guildhallModal').classList.remove('active');
    updateUI();
};

window.saveGame = function () {
    if (gameState !== 'PLAYING') return;
    const data = { map, entities, items, player, currentFloor, fullMessageHistory };
    try {
        localStorage.setItem('tomenet_save', JSON.stringify(data));
        logMessage("Game Saved.", "magic");
    } catch (e) {
        logMessage("Failed to save.", "damage");
    }
};

window.loadGame = function () {
    const raw = localStorage.getItem('tomenet_save');
    if (!raw) {
        logMessage("No save file.", "damage");
        return;
    }
    try {
        const data = JSON.parse(raw);
        map = data.map;
        items = data.items;
        currentFloor = data.currentFloor;
        fullMessageHistory = data.fullMessageHistory || [];
        entities = data.entities;
        player = entities.find(e => e.isPlayer);
        logMessage("Game Loaded.", "magic");

        updateUI();
        computeFOV();
        render();
    } catch (e) {
        logMessage("Failed to load.", "damage");
    }
};

function renderShop() {
    const ul = document.getElementById('shopItems');
    ul.innerHTML = '<li><strong style="color:#45a29e">FOR SALE:</strong></li>';
    currentShopItems.forEach((item, i) => {
        const canAfford = player.gold >= item.cost;
        const btnClass = canAfford ? 'shop-btn' : 'shop-btn-disabled';
        ul.innerHTML += `
            <li style="margin-left: 10px;">
                <span style="color:${item.color}">[${item.type.toUpperCase()}] ${getItemName(item)}</span>
                <span>
                    <span style="color:#f1c40f">${item.cost}g</span>
                    <button class="${btnClass}" onclick="buyItem(${i})" ${!canAfford ? 'disabled' : ''}>Buy</button>
                </span>
            </li>
        `;
    });

    ul.innerHTML += '<li style="margin-top:15px"><strong style="color:#45a29e">SELL ITEMS:</strong></li>';
    let hasSellables = false;
    player.inventory.forEach((item, i) => {
        if (!Object.values(player.equipment).includes(item)) {
            hasSellables = true;
            const sellPrice = Math.floor((item.cost || 10) * 0.5);
            ul.innerHTML += `
                <li style="margin-left: 10px;">
                    <span style="color:${item.color}">${getItemName(item)}</span>
                    <span>
                        <span style="color:#f1c40f">+${sellPrice}g</span>
                        <button class="btn shop-btn" onclick="sellItem(${i})">Sell</button>
                    </span>
                </li>
            `;
        }
    });
    if (!hasSellables) {
        ul.innerHTML += '<li style="margin-left: 10px; opacity:0.5;">No unequipped items to sell.</li>';
    }
}

window.openInventory = function () {
    if (gameState !== 'PLAYING') return;
    gameState = 'INVENTORY';
    document.getElementById('inventoryModal').classList.add('active');
    renderInventoryModal();
};

window.closeInventory = function () {
    document.getElementById('inventoryModal').classList.remove('active');
    gameState = 'PLAYING';
    updateUI();
};

window.renderInventoryModal = function () {
    const elist = document.getElementById('equip-modal-list');
    elist.innerHTML = '';
    const slots = ['weapon', 'offhand', 'armor', 'helm', 'ring', 'amulet'];
    const slotLabels = { weapon: 'WEAPON', offhand: 'OFFHAND (Shield)', armor: 'ARMOR', helm: 'HELM', ring: 'RING', amulet: 'AMULET' };
    slots.forEach(slot => {
        const item = player.equipment[slot];
        let h = `<li style="display:flex; justify-content:space-between; margin-bottom: 5px;"><strong>${slotLabels[slot] || slot.toUpperCase()}:</strong> `;
        if (item) {
            h += `<span><span style="color:${item.color}">${getItemName(item)}</span> <button class="btn" style="padding:2px 5px; font-size:0.7em" onclick="unequipSlot('${slot}')">Unequip</button></span>`;
        } else {
            h += `<span style="color:#666">Empty</span>`;
        }
        h += `</li>`;
        elist.innerHTML += h;
    });

    const blist = document.getElementById('inv-modal-list');
    blist.innerHTML = '';

    const unequippedItems = player.inventory.filter(item => !Object.values(player.equipment).includes(item));
    document.getElementById('inv-count').innerText = unequippedItems.length;

    player.inventory.forEach((item, i) => {
        if (Object.values(player.equipment).includes(item)) return;

        let h = `<li style="display:flex; justify-content:space-between; margin-bottom: 5px;">
            <span style="color:${item.color}">${getItemName(item)}</span>
            <span>`;
        if (item.equip) h += `<button class="btn" style="padding:2px 5px; font-size:0.7em; margin-right:5px;" onclick="useItem(${i}); renderInventoryModal();">Equip</button>`;
        else h += `<button class="btn" style="padding:2px 5px; font-size:0.7em; margin-right:5px;" onclick="useItem(${i}); renderInventoryModal();">Use</button>`;

        h += `<button class="btn" style="padding:2px 5px; font-size:0.7em; background:#552222;" onclick="dropItem(${i}); renderInventoryModal();">Drop</button>
            </span></li>`;
        blist.innerHTML += h;
    });
};

window.unequipSlot = function (slot) {
    const item = player.equipment[slot];
    if (item) {
        if (item.cursed) {
            logMessage(`You cannot unequip the ${getItemName(item)}! It is cursed!`, 'damage');
            return;
        }
        player.equipment[slot] = null;
        if (item.effect === 'esp') player.hasESP = false;
        logMessage(`You unequip ${getItemName(item)}.`, 'magic');
        renderInventoryModal();
    }
};


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

    // 's' — #33 Search for secret rooms
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

    // F5 — Save Game, F9 — Load Game
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
            logMessage("Auto-explore halted — low HP!", "damage");
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
function findPath(sx, sy, tx, ty) {
    const queue = [{ x: sx, y: sy, path: [] }];
    const visited = new Set([`${sx},${sy}`]);
    const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    // Max depth to prevent massive search lag
    let iteration = 0;

    while (queue.length > 0 && iteration < 1500) {
        iteration++;
        const curr = queue.shift();

        if (curr.x === tx && curr.y === ty) {
            return curr.path;
        }

        for (let d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;

            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                    // Path through explored floor, stairs, or target entity (to attack)
                    // Treat unknown as wall.
                    const tile = map[nx][ny];
                    const ent = getEntityAt(nx, ny);
                    const hasKey = player.inventory.some(i => i.name === 'Dungeon Key');
                    const blockingTypes = ['wall', 'locked_door', 'shop', 'healer', 'blacksmith', 'wizard', 'bank', 'well', 'mayor', 'gambler', 'shrine'];
                    const isPassable = !blockingTypes.includes(tile.type) || (tile.type === 'locked_door' && hasKey);
                    if (tile.explored && (isPassable || (nx === tx && ny === ty)) && (!ent || !ent.isTownNPC || !ent.blocksMovement || (nx === tx && ny === ty))) {
                        visited.add(key);
                        queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
                    }
                }
            }
        }
    }
    return null;
}

function findNearestUnexplored(sx, sy) {
    const queue = [{ x: sx, y: sy, path: [] }];
    const visited = new Set([`${sx},${sy}`]);
    const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    let stairsPath = null;
    let iteration = 0;
    while (queue.length > 0 && iteration < 30000) {
        iteration++;
        const curr = queue.shift();

        const cTile = map[curr.x][curr.y];
        // Priority: Unexplored tiles
        if (!cTile.explored && cTile.type !== 'wall') {
            return curr.path;
        }

        // Secondary: Find nearest stairs down (if we haven't found one yet)
        if (!stairsPath && (cTile.type === 'stairs_down' || cTile.type === 'stairs_up')) {
            // Only follow stairs if the current floor is explored enough or specifically stairs_down
            if (cTile.type === 'stairs_down') stairsPath = curr.path;
        }

        for (let d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;
            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    const tile = map[nx][ny];
                    const ent = getEntityAt(nx, ny);
                    const hasKey = player.inventory.some(i => i.name === 'Dungeon Key');
                    const blockingTypes = ['wall', 'locked_door', 'shop', 'healer', 'blacksmith', 'wizard', 'bank', 'well', 'mayor', 'gambler', 'shrine'];
                    const isPassable = !blockingTypes.includes(tile.type) || (tile.type === 'locked_door' && hasKey);
                    // Path through explored floors, avoid blocking Town NPCs specifically
                    if (((tile.explored && isPassable) || (!tile.explored && !blockingTypes.includes(tile.type))) && (!ent || !ent.isTownNPC || !ent.blocksMovement)) {
                        queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
                    }
                }
            }
        }
    }
    if (!stairsPath && iteration >= 30000) console.log(`(DEBUG) findNearestUnexplored: limit reached at ${sx},${sy}, queue: ${queue.length}`);
    if (!stairsPath && queue.length === 0) console.log(`(DEBUG) findNearestUnexplored: queue empty at ${sx},${sy}`);
    return stairsPath; // Fallback to stairs if no unexplored tiles found
}

// --- Spells ---
function getLine(x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0);
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
        // Spell damage table — Phase V
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
    map = []; items = []; entities = [];
    if (player) entities.push(player);

    for (let x = 0; x < MAP_WIDTH; x++) {
        map[x] = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            // Give walls HP for tunneling
            map[x][y] = { type: 'wall', visible: false, explored: false, char: CHARS.WALL, hp: 30 };
        }
    }
}

function generateTown() {
    initMap();
    logMessage("You rise in the safety of the Town.", 'magic');
    const townRect = new Rect(10, 10, MAP_WIDTH - 20, MAP_HEIGHT - 20);

    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            if (x >= townRect.x && x < townRect.x + townRect.w && y >= townRect.y && y < townRect.y + townRect.h) {
                map[x][y].type = 'floor';
                map[x][y].char = CHARS.FLOOR;
                map[x][y].isTown = true;
                map[x][y].color = timeOfDay === 'Day' ? COLORS.TOWN_FLOOR : '#2c1e14';
            } else {
                map[x][y].isTown = true;
                map[x][y].color = timeOfDay === 'Day' ? COLORS.TOWN_WALL : '#4a321d';
            }
        }
    }

    const c = townRect.center();
    if (!player) {
        player = new Entity(c.x, c.y, CHARS.PLAYER, COLORS.PLAYER, 'Player', 30, 5, 2, 10);
        player.isPlayer = true;
        player.gold = 0;
        player.inventory = [];
        player.equipment = { weapon: null, armor: null, helm: null, ring: null, amulet: null, offhand: null }; // #13 added offhand
        player.hasESP = false;
        player.level = 1;
        player.xp = 0;
        player.nextXp = 50;
        player.ammo = 0;
        player.reloading = 0;
        entities.push(player);
    } else {
        player.x = c.x; player.y = c.y; // Spawn center
    }

    // Place stairs down
    map[c.x + 5][c.y].type = 'stairs_down';
    map[c.x + 5][c.y].char = CHARS.STAIRS_DOWN;

    // Place shop
    map[c.x - 5][c.y].type = 'shop';
    map[c.x - 5][c.y].char = 'S';
    map[c.x - 5][c.y].color = COLORS.GOLD;
    map[c.x - 5][c.y].isTown = true;

    // Place Healer (Innkeeper)
    map[c.x][c.y - 5].type = 'healer';
    map[c.x][c.y - 5].char = 'H';
    map[c.x][c.y - 5].color = '#e74c3c';
    map[c.x][c.y - 5].isTown = true;

    // Place Blacksmith
    map[c.x + 3][c.y + 4].type = 'blacksmith';
    map[c.x + 3][c.y + 4].char = 'B';
    map[c.x + 3][c.y + 4].color = '#7f8c8d';
    map[c.x + 3][c.y + 4].isTown = true;

    // Place Wizard's Tower
    map[c.x - 4][c.y - 4].type = 'wizard';
    map[c.x - 4][c.y - 4].char = 'W';
    map[c.x - 4][c.y - 4].color = '#9b59b6';
    map[c.x - 4][c.y - 4].isTown = true;

    // Place Bank
    map[c.x + 5][c.y - 3].type = 'bank';
    map[c.x + 5][c.y - 3].char = '£';
    map[c.x + 5][c.y - 3].color = '#2ecc71';
    map[c.x + 5][c.y - 3].isTown = true;

    // Place Mayor
    map[c.x][c.y + 4].type = 'mayor';
    map[c.x][c.y + 4].char = '6';
    map[c.x][c.y + 4].color = '#f1c40f';
    map[c.x][c.y + 4].isTown = true;

    // Place Gambler (Night only)
    if (timeOfDay === 'Night') {
        map[c.x + 6][c.y - 6].type = 'gambler';
        map[c.x + 6][c.y - 6].char = '7';
        map[c.x + 6][c.y - 6].color = '#95a5a6';
        map[c.x + 6][c.y - 6].isTown = true;
    }

    // Phase II - New NPCs

    // Place Alchemist (Top Right)
    map[c.x + 6][c.y - 4].type = 'alchemist';
    map[c.x + 6][c.y - 4].char = 'A';
    map[c.x + 6][c.y - 4].color = '#2ecc71';
    map[c.x + 6][c.y - 4].isTown = true;

    // Place Class Trainer (Top Left)
    map[c.x - 6][c.y - 3].type = 'trainer';
    map[c.x - 6][c.y - 3].char = 'T';
    map[c.x - 6][c.y - 3].color = '#f39c12';
    map[c.x - 6][c.y - 3].isTown = true;

    // Place Cartographer (Near Stairs)
    map[c.x + 3][c.y + 1].type = 'cartographer';
    map[c.x + 3][c.y + 1].char = 'C';
    map[c.x + 3][c.y + 1].color = '#3498db';
    map[c.x + 3][c.y + 1].isTown = true;

    // Place Guildhall (Bottom Left)
    map[c.x - 5][c.y + 3].type = 'guildhall';
    map[c.x - 5][c.y + 3].char = '{';
    map[c.x - 5][c.y + 3].color = '#bdc3c7';
    map[c.x - 5][c.y + 3].isTown = true;

    // Place Stash (Next to Bank)
    map[c.x + 6][c.y - 3].type = 'stash';
    map[c.x + 6][c.y - 3].char = '[';
    map[c.x + 6][c.y - 3].color = '#e67e22';
    map[c.x + 6][c.y - 3].isTown = true;

    // Place Town Well
    map[c.x - 3][c.y + 5].type = 'well';
    map[c.x - 3][c.y + 5].char = 'O';
    map[c.x - 3][c.y + 5].color = '#3498db';
    map[c.x - 3][c.y + 5].isTown = true;

    // Place Beggars/Villagers (Dynamic entities)
    for (let i = 0; i < 4; i++) {
        let vx, vy;
        do {
            vx = c.x + Math.floor(Math.random() * 14) - 7;
            vy = c.y + Math.floor(Math.random() * 14) - 7;
        } while (map[vx][vy].type !== 'floor' || getEntityAt(vx, vy));
        let type = Math.random() < 0.3 ? 'beggar' : 'villager';
        let npc = new Entity(vx, vy, type === 'beggar' ? 'p' : 'v', type === 'beggar' ? '#888' : '#ecf0f1', type === 'beggar' ? 'Beggar' : 'Villager', 10, 0, 0, 5);
        npc.isTownNPC = true;
        npc.npcType = type;
        entities.push(npc);
    }

    // Local flavor log
    logMessage("Town Services: Shop(S), Healer(H), Blacksmith(B), Wizard(W), Bank(£)", "hint");

    // Pre-explore town
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            if (map[x][y].type !== 'wall') map[x][y].explored = true;
        }
    }
}

function generateDungeon() {
    let connected = false;
    let tries = 0;
    while (!connected && tries < 100) {
        tries++;
        initMap();
        if (currentFloor >= 3 && Math.random() < 0.35) {
            generateCave(); // Cave has its own connectivity check
            return;
        }

        const rooms = [];
        const MAX_ROOMS = 20;

        for (let i = 0; i < MAX_ROOMS; i++) {
            let w = Math.floor(Math.random() * 8) + 4;
            let h = Math.floor(Math.random() * 8) + 4;
            let x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
            let y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;
            let newRoom = new Rect(x, y, w, h);

            let failed = false;
            for (let r of rooms) {
                if (newRoom.x <= r.x + r.w && newRoom.x + newRoom.w >= r.x &&
                    newRoom.y <= r.y + r.h && newRoom.y + newRoom.h >= r.y) {
                    failed = true; break;
                }
            }

            if (!failed) {
                createRoom(newRoom);
                const c = newRoom.center();

                if (rooms.length === 0) {
                    player.x = c.x; player.y = c.y;
                    map[c.x - 1][c.y].type = 'stairs_up';
                    map[c.x - 1][c.y].char = CHARS.STAIRS_UP;
                } else {
                    const prev = rooms[rooms.length - 1].center();
                    if (Math.random() > 0.5) {
                        createHTunnel(prev.x, c.x, prev.y); createVTunnel(prev.y, c.y, c.x);
                    } else {
                        createVTunnel(prev.y, c.y, prev.x); createHTunnel(prev.x, c.x, c.y);
                    }

                    // Spawn monsters & items
                    if (Math.random() < 0.6) spawnMonsters(newRoom);
                    if (Math.random() < 0.4) spawnRandomItem(newRoom);
                }
                rooms.push(newRoom);
            }
        }

        if (rooms.length > 0) {
            const last = rooms[rooms.length - 1].center();
            map[last.x][last.y].type = 'stairs_down';
            map[last.x][last.y].char = CHARS.STAIRS_DOWN;
        }

        // Phase IV — Dungeon Hazards
        generateHazards(rooms);

        // Connectivity Check
        const sx = player.x, sy = player.y;
        let tx = -1, ty = -1;
        for(let x=0; x<MAP_WIDTH; x++) {
            for(let y=0; y<MAP_HEIGHT; y++) {
                if (map[x][y].type === 'stairs_down') { tx=x; ty=y; break; }
            }
            if (tx !== -1) break;
        }
        
        if (tx !== -1) {
            const path = findPath(sx, sy, tx, ty);
            if (path && path.length > 0) {
                connected = true;
            } else {
                console.log("(DEBUG) Disconnected dungeon detected, regenerating...");
            }
        } else {
            connected = true; // No stairs_down (shouldn't happen)
        }
    }
}

function generateHazards(rooms) {
    for (const room of rooms) {
        // 20% chance of a hazard per room
        if (Math.random() > 0.2) continue;
        let hx = Math.floor(Math.random() * (room.w - 2)) + room.x + 1;
        let hy = Math.floor(Math.random() * (room.h - 2)) + room.y + 1;
        const center = room.center();
        if (hx === center.x && hy === center.y) continue;
        if (!map[hx] || map[hx][hy].type !== 'floor' || getEntityAt(hx, hy)) continue;
        const roll = Math.random();
        if (roll < 0.15 && currentFloor >= 2) {
            // #32 Locked Door — place door, drop key nearby
            map[hx][hy].type = 'locked_door';
            map[hx][hy].char = '+';
            map[hx][hy].color = '#d4ac0d';
            // Scatter a key somewhere in the dungeon
            let kx, ky, tries = 0;
            do { kx = Math.floor(Math.random() * MAP_WIDTH); ky = Math.floor(Math.random() * MAP_HEIGHT); tries++; }
            while (tries < 60 && map[kx][ky].type !== 'floor');
            if (tries < 60) items.push({ x: kx, y: ky, ...ITEM_DB.find(i => i.name === 'Dungeon Key') });
        } else if (roll < 0.3) {
            // #33 Secret Wall hint — this wall can be "searched" to reveal a cache
            const adjWalls = [[hx+1,hy],[hx-1,hy],[hx,hy+1],[hx,hy-1]]
                .filter(([wx,wy]) => wx>=0 && wx<MAP_WIDTH && wy>=0 && wy<MAP_HEIGHT && map[wx][wy].type === 'wall');
            if (adjWalls.length > 0) {
                const [wx, wy] = adjWalls[0];
                map[wx][wy].type = 'secret_wall';
                map[wx][wy].char = '#';
                map[wx][wy].secretCache = true; // has loot behind it
            }
        } else if (roll < 0.55) {
            // #31 Trap tile
            const trapTypes = ['dart', 'poison', 'teleport'];
            map[hx][hy].type = 'trap';
            map[hx][hy].trapKind = trapTypes[Math.floor(Math.random() * trapTypes.length)];
            map[hx][hy].char = '^';
            map[hx][hy].color = '#e74c3c';
            map[hx][hy].hidden = true;
        } else if (roll < 0.75 && currentFloor >= 5) {
            // #38 Lava tile
            map[hx][hy].type = 'lava';
            map[hx][hy].char = '~';
            map[hx][hy].color = '#e67e22';
        } else {
            // #34 Shrine
            map[hx][hy].type = 'shrine';
            map[hx][hy].char = 'A';
            map[hx][hy].color = '#f1c40f';
        }
    }

    // #40 Goblin dungeon merchant — floor 5+, 30% chance
    if (currentFloor >= 5 && rooms.length > 3 && Math.random() < 0.3) {
        const mRoom = rooms[Math.floor(Math.random() * rooms.length)];
        const mc = mRoom.center();
        if (map[mc.x][mc.y].type === 'floor' && !getEntityAt(mc.x, mc.y)) {
            const merch = new Entity(mc.x, mc.y, 'g', '#f1c40f', 'Goblin Merchant', 1, 0, 0, 0);
            merch.isMerchant = true; merch.isPlayer = false;
            merch.blocksMovement = false;
            merch.energy = 0;
            entities.push(merch);
            logMessage('A Goblin Merchant lurks in the dungeon! (bump to trade)', 'magic');
        }
    }
}

function generateCave() {
    let connected = false;
    let tries = 0;
    while (!connected && tries < 100) {
        tries++;
        initMap();
        let floorCount = 0;
        const targetFloors = Math.floor(MAP_WIDTH * MAP_HEIGHT * 0.45);
        let cx = Math.floor(MAP_WIDTH / 2);
        let cy = Math.floor(MAP_HEIGHT / 2);

        while (floorCount < targetFloors) {
            if (map[cx][cy].type === 'wall') {
                map[cx][cy].type = 'floor';
                map[cx][cy].char = CHARS.FLOOR;
                floorCount++;
            }
            let dir = Math.floor(Math.random() * 4);
            if (dir === 0) cx++; else if (dir === 1) cx--; else if (dir === 2) cy++; else cy--;

            if (cx <= 1 || cx >= MAP_WIDTH - 2 || cy <= 1 || cy >= MAP_HEIGHT - 2) {
                cx = Math.floor(MAP_WIDTH / 2);
                cy = Math.floor(MAP_HEIGHT / 2);
            }
        }

        // Place Stairs Up & Down
        let sx, sy, ex, ey;
        do { sx = Math.floor(Math.random() * MAP_WIDTH); sy = Math.floor(Math.random() * MAP_HEIGHT); } while (map[sx][sy].type !== 'floor');
        map[sx][sy].type = 'stairs_up'; map[sx][sy].char = CHARS.STAIRS_UP;
        player.x = sx; player.y = sy;

        do { ex = Math.floor(Math.random() * MAP_WIDTH); ey = Math.floor(Math.random() * MAP_HEIGHT); } while (map[ex][ey].type !== 'floor' || (Math.abs(sx - ex) + Math.abs(sy - ey) < 20));
        map[ex][ey].type = 'stairs_down'; map[ex][ey].char = CHARS.STAIRS_DOWN;

        for (let i = 0; i < 15 + currentFloor; i++) {
            let mx, my; do { mx = Math.floor(Math.random() * MAP_WIDTH); my = Math.floor(Math.random() * MAP_HEIGHT); } while (map[mx][my].type !== 'floor' || getEntityAt(mx, my) || (mx === sx && my === sy));
            spawnMonsterAt(mx, my);
        }

        // Connectivity Check
        const path = findPath(sx, sy, ex, ey);
        if (path && path.length > 0) {
            connected = true;
        } else {
            console.log("(DEBUG) Disconnected cave detected, regenerating...");
        }
    }
}

function createRoom(rect) {
    for (let x = rect.x + 1; x < rect.x + rect.w; x++) {
        for (let y = rect.y + 1; y < rect.y + rect.h; y++) {
            map[x][y].type = 'floor'; map[x][y].char = CHARS.FLOOR;
        }
    }
}
function createHTunnel(x1, x2, y) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { map[x][y].type = 'floor'; map[x][y].char = CHARS.FLOOR; }
}
function createVTunnel(y1, y2, x) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { map[x][y].type = 'floor'; map[x][y].char = CHARS.FLOOR; }
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

        // Difficulty scaling — proper indices mapping
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
        // #X Infinite floors — deep abyss mixes all strong types plus elites & bosses as regular enemies!
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

        // #81-82 Elite variant — 10% chance
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

// --- Entity System ---
class Entity {
    constructor(x, y, char, color, name, hp, atk, def, speed) {
        this.x = x; this.y = y;
        this.char = char; this.color = color;
        this.name = name;
        this.maxHp = hp; this.hp = hp;
        this.atk = atk; this.def = def;
        this.speed = speed; // determines how much energy gained per tick
        this.energy = 0;    // needs 100 to act
        this.isPlayer = false;
        this.blocksMovement = true;
    }
}

function getNearestMonster(mx, my) {
    let nearest = null;
    let minDist = Infinity;
    for (let e of entities) {
        if (!e.isPlayer && e.hp > 0 && e.blocksMovement && !e.isTownNPC && !e.isMerchant) {
            const d = Math.abs(e.x - mx) + Math.abs(e.y - my);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        }
    }
    return nearest;
}

function getEntityAt(x, y) {
    return entities.find(e => e.x === x && e.y === y && e.blocksMovement && e.hp > 0);
}

function getItemAt(x, y) {
    return items.find(i => i.x === x && i.y === y);
}

// --- Action Logic ---
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
        // #32 Locked Door — requires Dungeon Key
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

function checkStairs(x, y, force = false) {
    if (!force) {
        isAutoRunning = false;
        activePath = null;
        if (map[x][y].type === 'stairs_down') {
            logMessage(`There are stairs here. Press '>' or 'Enter' to descend.`, 'hint');
        } else if (map[x][y].type === 'stairs_up') {
            logMessage(`There are stairs here. Press '<' or 'Enter' to ascend.`, 'hint');
        }
        return;
    }
    const tile = map[x][y];
    // DEBUG: console.log(`Checking stairs at ${x},${y}: ${tile.type}`);
    if (map[x][y].type === 'stairs_down') {
        currentFloor++;
        console.log(`(DEBUG) Descending to Floor ${currentFloor}`);
        logMessage(`You dive to Dungeon Level ${currentFloor}.`, 'pickup');
        generateDungeon();
        computeFOV();
        updateUI();
    } else if (map[x][y].type === 'stairs_up') {
        if (currentFloor === 1) {
            currentFloor = 0;
            generateTown();
        } else {
            currentFloor--;
            logMessage(`You ascend to Dungeon Level ${currentFloor}.`, 'pickup');
            generateDungeon();
        }
        computeFOV();
        updateUI();
    } else if (force) {
        logMessage("There are no stairs here.", "damage");
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
    // #VIII Combat Surge — Warrior active buff
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

function combat(attacker, defender) {
    let atkPower = attacker.isPlayer ? getEffectiveAtk() : attacker.atk;
    let defPower = defender.isPlayer ? getEffectiveDef() : defender.def;

    // If monster is disarmed, reduce its attack
    if (attacker.disarmed) {
        atkPower = Math.max(1, Math.floor(atkPower * 0.5));
        attacker.disarmTimer = (attacker.disarmTimer || 0) - 1;
        if (attacker.disarmTimer <= 0) { attacker.disarmed = false; logMessage(`${attacker.name} picks up its weapon!`, 'damage'); }
    }

    // Elemental checks
    if (attacker.element === 'fire' && defender.isPlayer) {
        if (defender.equipment.ring && defender.equipment.ring.effect === 'resist_fire') {
            atkPower = Math.floor(atkPower / 2);
            logMessage(`Your ring resists the flames!`, 'magic');
        } else {
            logMessage(`The ${attacker.name} breathes fire!`, 'damage');
        }
    }
    // #15 Sting does bonus damage vs Orcs
    if (attacker.isPlayer && attacker.equipment?.weapon?.name === 'Sting' && defender.name && defender.name.includes('Orc')) {
        atkPower += 5;
        logMessage(`Sting glows blue against the ${defender.name}!`, 'magic');
    }
    // #15 Glamdring has fire element
    if (attacker.isPlayer && attacker.equipment?.weapon?.name === 'Glamdring') {
        atkPower += Math.floor(Math.random() * 4);
    }

    let dmg = Math.max(1, atkPower - defPower + (Math.floor(Math.random() * 3) - 1));
    defender.hp -= dmg;

    // Phase III Special Monster Effects
    if (!attacker.isPlayer && defender.isPlayer) {
        defender.lastAttackedBy = attacker;
        // #23 Vampire drains max HP
        if (attacker.drainMaxHp && Math.random() < 0.2) {
            defender.maxHp = Math.max(10, defender.maxHp - 1);
            logMessage(`${attacker.name} drains your life force! Max HP reduced!`, 'damage');
            spawnParticle(defender.x, defender.y, '-1 MaxHP', '#8e44ad');
        }
        // #26 Rust Monster degrades armor
        if (attacker.element === 'rust' && defender.equipment?.armor) {
            defender.equipment.armor.defBonus = (defender.equipment.armor.defBonus || 0) - 1;
            logMessage(`${attacker.name} corrodes your armor! (-1 Def)`, 'damage');
            spawnParticle(defender.x, defender.y, 'RUST!', '#d35400');
        }
        // #29 Mind Flayer drains XP
        if (attacker.xpDrain && Math.random() < 0.3) {
            const drained = Math.min(player.xp, 15 + currentFloor * 3);
            player.xp = Math.max(0, player.xp - drained);
            logMessage(`${attacker.name} feasts on your mind! Lost ${drained} XP!`, 'damage');
            spawnParticle(defender.x, defender.y, `-${drained} XP`, '#9b59b6');
        }
    }

    if (attacker.isPlayer) {
        // #VIII Rogue Backstab — double dmg if monster was not adjacent last tick
        if (player.backstab && !map[defender.x][defender.y].visible) {
            dmg = dmg * 2;
            spawnParticle(defender.x, defender.y, 'BACKSTAB!', '#e67e22');
            logMessage(`Backstab! Double damage!`, 'magic');
        }
        if (dmg > atkPower + 5) spawnParticle(defender.x, defender.y, `CRIT ${dmg}`, '#f1c40f');
        else spawnParticle(defender.x, defender.y, `-${dmg}`, '#ff3b3b');

        // #16 Whip: disarm on hit
        const wep = attacker.equipment?.weapon;
        if (wep && wep.disarm && Math.random() < wep.disarm && !defender.isPlayer) {
            defender.disarmed = true;
            defender.disarmTimer = 5;
            logMessage(`You crack the whip! ${defender.name} drops its weapon!`, 'magic');
            spawnParticle(defender.x, defender.y, 'DISARMED!', '#f39c12');
        }
        // #14 Dual Wield: second strike at -2 atk
        if (wep && wep.dualWield && defender.hp > 0) {
            const dmg2 = Math.max(1, (atkPower - 2) - defPower + (Math.floor(Math.random() * 3) - 1));
            defender.hp -= dmg2;
            spawnParticle(defender.x, defender.y, `-${dmg2}`, '#e67e22');
            logMessage(`Second strike hits for ${dmg2}!`, 'magic');
        }
    } else if (defender.isPlayer) {
        spawnParticle(defender.x, defender.y, `-${dmg}`, '#e74c3c');
    }

    let msgClass = attacker.isPlayer ? 'magic' : 'damage';
    logMessage(`${attacker.name} hits ${defender.name} for ${dmg}.`, msgClass);

    // Poison Effect
    if (attacker.element === 'poison' && Math.random() < 0.25) {
        defender.poisonTimer = (defender.poisonTimer || 0) + 20;
        if (defender.isPlayer) logMessage(`You are poisoned!`, 'damage');
        else logMessage(`${defender.name} is poisoned!`, 'magic');
    }

    if (defender.hp <= 0) {
        if (defender.isPlayer) {
            defender.name = `${defender.name} remains`;
            showGameOverModal(attacker.name);
        } else {
            handleMonsterDeath(defender);
        }
    }
}

function handleMonsterDeath(defender) {
    if (defender.name.includes("Balrog")) {
        gameState = 'VICTORY';
        document.getElementById('victoryModal').classList.add('active');
        return;
    }

    logMessage(`${defender.name} is destroyed.`, 'kill');
    defender.char = '%'; defender.color = '#888'; defender.blocksMovement = false;

    // Bounty Check
    if (typeof bountyTarget !== 'undefined' && bountyTarget && typeof bountyClaimed !== 'undefined' && !bountyClaimed && defender.name === bountyTarget) {
        bountyClaimed = true;
        player.gold += 150;
        logMessage("You have slain the Mayor's Bounty! Received 150g.", 'magic');
    }

    defender.name = `${defender.name} remains`;

    if (Math.random() > 0.6) player.gold += 5 * (currentFloor || 1);

    // XP logic
    let gainedXp = defender.baseXP || 5;
    if (currentFloor) gainedXp = Math.floor(gainedXp * (1 + currentFloor * 0.2));
    player.xp += gainedXp;
    logMessage(`Gained ${gainedXp} XP.`);
    spawnParticle(defender.x, defender.y, `+${gainedXp} XP`, '#2ecc71');

    if (player.xp >= player.nextXp) {
        player.level++;
        player.maxHp += 5;
        player.hp = player.maxHp;
        player.atk += 1;
        player.nextXp = Math.floor(player.nextXp * 1.8);
        logMessage(`LEVEL UP! You are now level ${player.level}.`, 'magic');
        // #VIII Class perk on level 3 & 5
        if (player.level === 3) {
            if (player.class === 'Warrior') { player.def += 1; logMessage('Warrior Level 3 Perk: +1 Defense!', 'kill'); }
            if (player.class === 'Mage')    { player.maxHp += 5; player.hp += 5; logMessage('Mage Level 3 Perk: +5 Max HP!', 'kill'); }
            if (player.class === 'Rogue')   { player.speed += 2; logMessage('Rogue Level 3 Perk: +2 Speed!', 'kill'); }
        }
        if (player.level === 5) {
            if (player.class === 'Warrior') { player.atk += 2; logMessage('Warrior Level 5 Perk: +2 Attack!', 'kill'); }
            if (player.class === 'Mage')    { player.equipment.armor && (player.equipment.armor.spellBoost = (player.equipment.armor.spellBoost||0)+3); logMessage('Mage Level 5 Perk: +3 SpellBoost!', 'kill'); }
            if (player.class === 'Rogue')   { player.atk += 1; player.def += 1; logMessage('Rogue Level 5 Perk: +1 Atk, +1 Def!', 'kill'); }
        }
    } else {
        player.hp = Math.min(player.maxHp, player.hp + 2);
    }

    // #VIII Combat Surge — Warrior every 5 kills
    if (player.class === 'Warrior') {
        player.killCount = (player.killCount || 0) + 1;
        if (player.killCount % 5 === 0) {
            player.combatSurgeTimer = 20;
            logMessage('COMBAT SURGE! (+2 Atk for 20 ticks)', 'kill');
            spawnParticle(player.x, player.y, 'SURGE!', '#f1c40f');
        }
    }

    // Item Drop Logic (elite drops key)
    if (Math.random() < 0.25) {
        // Elite monsters drop a Dungeon Key 50% of the time
        if (defender.isElite && Math.random() < 0.5) {
            const keyItem = ITEM_DB.find(i => i.name === 'Dungeon Key');
            if (keyItem) items.push({ x: defender.x, y: defender.y, ...keyItem });
            logMessage(`The Elite ${defender.name.replace('Elite ','').split(' ')[0]} drops a key!`, 'pickup');
        } else if (Math.random() < 0.05 && typeof ITEM_DB !== 'undefined') { // 5% chance of the 25% for a great item
            const greatItems = ITEM_DB.filter(i => (i.equip && (i.atkBonus > 3 || i.defBonus > 2)) || i.effect === 'esp' || i.effect === 'summon');
            if (greatItems.length > 0) {
                const drop = Object.assign({}, greatItems[Math.floor(Math.random() * greatItems.length)]);
                items.push({ x: defender.x, y: defender.y, ...drop });
                logMessage("A rare item drops!", "pickup");
                return;
            }
        }
        if (typeof spawnRandomItemAt === 'function') {
            spawnRandomItemAt(defender.x, defender.y);
            logMessage(`Something dropped...`, 'hint');
        }
    }
}

function useItem(index) {
    const item = player.inventory[index];
    if (item.equip) {
        let slot = item.effect;
        if (slot === 'esp') slot = 'helm';
        if (slot === 'resist_fire' || slot === 'protection' || slot === 'burden') slot = 'ring';
        if (slot === 'strength' || slot === 'regeneration') slot = 'amulet';
        if (slot === 'shield') slot = 'offhand'; // #13 shields go to offhand

        if (player.equipment[slot] === item) {
            unequipSlot(slot);
            return;
        }

        if (player.equipment[slot] && player.equipment[slot].cursed) {
            logMessage(`You cannot remove the ${getItemName(player.equipment[slot])}! It is cursed!`, 'damage');
            return;
        }

        if (player.equipment[slot]) unequipSlot(slot);

        player.equipment[slot] = item;
        item.identified = true;
        if (item.effect === 'esp') player.hasESP = true;
        // #14 Dual Wield speed bonus is applied via getEffectiveSpeed()
        // #13 Shield speed penalty applied via getEffectiveSpeed()

        if (item.cursed) logMessage(`The ${getItemName(item)} binds to you! It is cursed!`, 'damage');
        else {
            let equipMsg = `You equip ${getItemName(item)}.`;
            if (item.artifact) equipMsg = `✨ You wield ${getItemName(item)}! A legendary weapon!`;
            logMessage(equipMsg, item.artifact ? 'kill' : 'magic');
        }
        updateUI();
        return;
    }

    // Consumables
    if (item.type === 'ammo') {
        player.ammo = (player.ammo || 0) + (item.amount || 20);
        logMessage(`You add ${item.amount} arrows to your quiver. (Total: ${player.ammo})`, 'pickup');
        player.inventory.splice(index, 1);
        closeInventory();
        updateUI();
        return;
    }

    // Identifies item upon use
    if (['potion', 'scroll', 'wand'].includes(item.type)) {
        identifiedTypes[item.name] = true;
    }

    if (item.effect === 'heal') {
        player.hp = Math.min(player.maxHp, player.hp + item.value);
        spawnParticle(player.x, player.y, `+${item.value}`, '#2ecc71');
        logMessage(`You drink ${getItemName(item)}. You feel better.`, 'magic');
    } else if (item.effect === 'poison') {
        player.poisonTimer = (player.poisonTimer || 0) + 10;
        spawnParticle(player.x, player.y, "Poison!", '#2ecc71');
        logMessage(`You drink ${getItemName(item)}... It's poison!`, 'damage');
    } else if (item.effect === 'uncurse') {
        logMessage(`You read the ${getItemName(item)}! A pure light washes over you.`, 'magic');
        let uncursedAny = false;
        Object.values(player.equipment).forEach(eq => {
            if (eq && eq.cursed) {
                eq.cursed = false;
                uncursedAny = true;
            }
        });
        if (uncursedAny) spawnParticle(player.x, player.y, "Purified!", '#f1c40f');
        else logMessage("Nothing happens.", "hint");
        updateUI();
    } else if (item.effect === 'slow') {
        player.speed = Math.max(2, player.speed - 3);
        spawnParticle(player.x, player.y, "Slow!", '#3498db');
        logMessage(`You drink ${getItemName(item)}... You feel sluggish.`, 'damage');
    } else if (item.effect === 'confuse_self') {
        // #51 Potion of Confusion
        player.confusedTimer = (player.confusedTimer || 0) + 10;
        spawnParticle(player.x, player.y, "CONFUSED!", '#9b59b6');
        logMessage(`You drink ${getItemName(item)}... The world spins!`, 'damage');
    } else if (item.effect === 'blind_self') {
        // #52 Potion of Blindness
        player.blindTimer = (player.blindTimer || 0) + 8;
        spawnParticle(player.x, player.y, "BLIND!", '#888');
        logMessage(`You drink ${getItemName(item)}... You can't see!`, 'damage');
    } else if (item.effect === 'paralyze_self') {
        // #53 Potion of Paralysis
        player.paralyzedTimer = (player.paralyzedTimer || 0) + 6;
        spawnParticle(player.x, player.y, 'PARALYZED!', '#e0c080');
        logMessage(`You drink ${getItemName(item)}... You can't move!`, 'damage');
    } else if (item.effect === 'regen_boost') {
        // #56 Potion of Regeneration — speeds up regen for 30 ticks
        player.regenBoost = (player.regenBoost || 0) + 30;
        spawnParticle(player.x, player.y, "REGEN!", '#2ecc71');
        logMessage(`You drink ${getItemName(item)}. You feel your wounds closing!`, 'magic');
    } else if (item.effect === 'confuse_monster') {
        // Scroll of Confusion — confuses nearest visible monster
        const nearestVis = [...entities].filter(e => !e.isPlayer && e.hp > 0 && map[e.x][e.y].visible)
            .sort((a,b) => (Math.abs(a.x-player.x)+Math.abs(a.y-player.y)) - (Math.abs(b.x-player.x)+Math.abs(b.y-player.y)))[0];
        if (nearestVis) {
            nearestVis.confused = true;
            nearestVis.confusedTimer = 12;
            logMessage(`You read the ${getItemName(item)}! ${nearestVis.name} is confused!`, 'magic');
            spawnParticle(nearestVis.x, nearestVis.y, 'CONFUSED!', '#9b59b6');
        } else {
            logMessage(`You read the ${getItemName(item)}... No target in sight.`, 'hint');
        }
    } else if (item.effect === 'xp') {
        player.xp = player.nextXp;
        spawnParticle(player.x, player.y, "XP!", '#f1c40f');
        logMessage(`You drink ${getItemName(item)}. You feel enlightened!`, 'magic');
    } else if (item.effect === 'recall') {
        logMessage(`The ${getItemName(item)} is read!`, 'magic');
        setTimeout(() => {
            currentFloor = 0;
            generateTown();
            computeFOV();
        }, 1000);
    } else if (item.effect === 'identify') {
        logMessage(`You read the ${getItemName(item)}! All objects are identified.`, 'magic');
        player.inventory.forEach(i => {
            identifiedTypes[i.name] = true;
        });
        spawnParticle(player.x, player.y, "?!", '#f1c40f');
        updateUI();
    } else if (item.effect === 'summon') {
        logMessage(`You read the ${getItemName(item)}! Monsters appear!`, 'damage');
        const pool = ENEMY_TYPES.filter(t => t.hp > 0);
        for (let i = 0; i < 3; i++) {
            const t = pool[Math.floor(Math.random() * pool.length)];
            const hp = t.hp + Math.floor(Math.random() * currentFloor * 2);
            let e = new Entity(player.x, player.y, t.char, t.color, t.name, hp, t.atk + currentFloor, t.def, t.speed);
            e.element = t.element; e.baseXP = t.baseXP;
            entities.push(e);
        }
    } else if (item.effect === 'haste_self') {
        // Phase V — Wand of Haste: self-speed buff
        item.charges = (item.charges || 1) - 1;
        player.speed = Math.min(20, player.speed + 4);
        player.hasteTimer = (player.hasteTimer || 0) + 15;
        spawnParticle(player.x, player.y, 'HASTE!', '#66fcf1');
        logMessage(`You zap the ${getItemName(item)}. You feel lightning fast!`, 'magic');
        if (item.charges <= 0) { logMessage(`${item.name} crumbles.`, 'damage'); player.inventory.splice(index, 1); }
        updateUI(); return;
    } else if (item.effect === 'teleport_self') {
        // Phase V — Wand of Teleportation
        item.charges = (item.charges || 1) - 1;
        let rx, ry, tries = 0;
        do { rx = Math.floor(Math.random() * MAP_WIDTH); ry = Math.floor(Math.random() * MAP_HEIGHT); tries++; }
        while (tries < 80 && (map[rx][ry].type !== 'floor' || getEntityAt(rx, ry)));
        if (tries < 80) { player.x = rx; player.y = ry; computeFOV(); spawnParticle(player.x, player.y, 'POOF!', '#9b59b6'); logMessage('You blink away!', 'magic'); }
        if (item.charges <= 0) { logMessage(`${item.name} crumbles.`, 'damage'); player.inventory.splice(index, 1); }
        updateUI(); return;
    } else if (item.effect === 'target_spell') {
        if (item.charges <= 0) {
            logMessage("The wand is empty.", "damage");
            return;
        }
        targetX = player.x; targetY = player.y;
        activeSpell = item.spell;
        activeItemIndex = index;
        gameState = 'TARGETING';
        logMessage("Select target (mouse or arrows, Enter/Click to fire)", "hint");
        return;
    } else if (item.effect === 'enchant_weapon') {
        // #20 Scroll of Enchant Weapon
        if (player.equipment.weapon) {
            player.equipment.weapon.atkBonus = (player.equipment.weapon.atkBonus || 0) + 1;
            player.equipment.weapon.identified = true;
            const wName = player.equipment.weapon.name;
            logMessage(`The ${getItemName(item)} enchants your ${wName}! (+1 Atk)`, 'magic');
            spawnParticle(player.x, player.y, '+1 ATK!', '#f39c12');
        } else {
            logMessage(`You read the ${getItemName(item)}... but hold no weapon! Wasted.`, 'damage');
        }
    } else if (item.effect === 'fireball_aoe') {
        // Phase V — Scroll of Fireball: AoE around player
        logMessage(`You read the ${getItemName(item)}! FIREBALL!`, 'damage');
        let aoeKills = 0;
        for (const e of [...entities]) {
            if (!e.isPlayer && e.hp > 0) {
                const d = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                if (d <= 3) {
                    const dmg = Math.floor((4 - d) * (8 + Math.floor(Math.random() * 6)));
                    e.hp -= dmg;
                    spawnParticle(e.x, e.y, `-${dmg} FIRE`, '#e67e22');
                    if (e.hp <= 0) { handleMonsterDeath(e); aoeKills++; }
                }
            }
        }
        spawnParticle(player.x, player.y, '\uD83D\uDD25 FIREBALL!', '#e67e22');
        if (aoeKills > 1) logMessage(`${aoeKills} enemies consumed by fire!`, 'kill');
    } else if (item.effect === 'frost_nova') {
        // Phase V — Scroll of Frost Nova: freeze all adjacent enemies
        logMessage(`You read the ${getItemName(item)}! FROST NOVA!`, 'magic');
        for (const e of entities) {
            if (!e.isPlayer && e.hp > 0) {
                const d = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                if (d <= 2) {
                    const dmg = 8 + Math.floor(Math.random() * 5);
                    e.hp -= dmg;
                    e.speed = Math.max(1, e.speed - 4);
                    spawnParticle(e.x, e.y, 'FROZEN!', '#3498db');
                    if (e.hp <= 0) handleMonsterDeath(e);
                }
            }
        }
    } else if (item.effect === 'enchant_armor') {
        if (player.equipment.armor) {
            player.equipment.armor.defBonus = (player.equipment.armor.defBonus || 0) + 1;
            player.equipment.armor.identified = true;
            logMessage(`The ${getItemName(item)} reinforces your armor! (+1 Def)`, 'magic');
            spawnParticle(player.x, player.y, '+1 DEF!', '#3498db');
        } else {
            logMessage(`You read the ${getItemName(item)}... but wear no armor! Wasted.`, 'damage');
        }
    }

    player.inventory.splice(index, 1);
    updateUI();
}

window.dropItem = function (index, ev) {
    const item = player.inventory[index];
    if (ev) ev.stopPropagation(); // prevent useItem if dropping from UI
    if (item.equip) {
        const slotKey = Object.keys(player.equipment).find(key => player.equipment[key] === item);
        if (slotKey) {
            logMessage(`Unequip first.`, 'damage');
            return;
        }
    }
    if (ev && ev.shiftKey) {
        logMessage(`Destroyed ${getItemName(item)}.`, 'damage');
        player.inventory.splice(index, 1);
    } else {
        items.push({ x: player.x, y: player.y, ...item });
        player.inventory.splice(index, 1);
        logMessage(`Dropped ${getItemName(item)}.`);
    }
    updateUI();
};

// --- Real-time Loop ---
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
                // #53 Paralysis timer — player cannot act
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
                        // Path exhausted — let getPendingAction recalc next path
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
    if (e.isTownNPC) {
        if (Math.random() < 0.4) {
            const dirs = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const tx = e.x + d.dx;
            const ty = e.y + d.dy;
            if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                if (!getEntityAt(tx, ty) && map[tx][ty].type === 'floor') {
                    attemptAction(e, { type: 'move', dx: d.dx, dy: d.dy });
                    return;
                }
            }
        }
        attemptAction(e, { type: 'wait' });
        return;
    }

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.abs(dx) + Math.abs(dy);
    const visible = (map[e.x] && map[e.x][e.y]) ? map[e.x][e.y].visible : false;

    // Energy check — processMonsterAI is only called if e.energy >= 100
    // We should NOT subtract energy here if attemptAction(e, ...) is called,
    // as attemptAction handles its own energy subtraction.
    // Only subtract here if we do a special non-move action (like summoning).

    // #27 Blink Dog — teleport randomly when adjacent and hurt
    if (e.blinker && dist <= 2 && e.hp < e.maxHp * 0.5) {
        let bx, by, tries = 0;
        do { bx = e.x + Math.floor(Math.random() * 7) - 3; by = e.y + Math.floor(Math.random() * 7) - 3; tries++; }
        while (tries < 20 && (bx < 0 || bx >= MAP_WIDTH || by < 0 || by >= MAP_HEIGHT || map[bx][by].type !== 'floor' || getEntityAt(bx, by)));
        if (tries < 20) { e.x = bx; e.y = by; e.energy -= ENERGY_THRESHOLD; spawnParticle(e.x, e.y, 'blink!', '#3498db'); return; }
    }

    // #24 Necromancer — summon skeleton if not too many
    if (e.summoner && dist < 10 && visible && Math.random() < 0.08) {
        const skeleCount = entities.filter(en => en.name === 'Skeleton' && en.hp > 0).length;
        if (skeleCount < 4) {
            const skeleDirs = [[1,0],[-1,0],[0,1],[0,-1]];
            for (const sd of skeleDirs) {
                const sx = e.x + sd[0], sy = e.y + sd[1];
                if (sx >= 0 && sx < MAP_WIDTH && sy >= 0 && sy < MAP_HEIGHT && map[sx][sy].type === 'floor' && !getEntityAt(sx, sy)) {
                    const sk = ENEMY_TYPES.find(t => t.name === 'Skeleton');
                    if (sk) {
                        const ne = new Entity(sx, sy, sk.char, sk.color, sk.name, sk.hp, sk.atk, sk.def, sk.speed);
                        ne.element = sk.element; ne.baseXP = sk.baseXP;
                        entities.push(ne);
                        logMessage('Necromancer summons a Skeleton!', 'damage');
                        e.energy -= ENERGY_THRESHOLD; // Manual subtraction for non-attemptAction summons
                        return;
                    }
                    break;
                }
            }
        }
    }

    // #28 Beholder — ranged debuff at range 3-6
    if (e.rangedDebuff && dist >= 2 && dist <= 6 && visible && Math.random() < 0.3) {
        const debuffs = ['slow', 'confuse', 'blind'];
        const debuff = debuffs[Math.floor(Math.random() * debuffs.length)];
        if (debuff === 'slow')    { player.speed = Math.max(2, player.speed - 2); spawnParticle(player.x, player.y, 'SLOW!', '#3498db'); logMessage('Beholder eye-ray slows you!', 'damage'); }
        if (debuff === 'confuse') { player.confusedTimer = (player.confusedTimer || 0) + 8; spawnParticle(player.x, player.y, 'CONFUSED!', '#9b59b6'); logMessage('Beholder eye-ray confuses you!', 'damage'); }
        if (debuff === 'blind')   { player.blindTimer = (player.blindTimer || 0) + 5; spawnParticle(player.x, player.y, 'BLIND!', '#888'); logMessage('Beholder eye-ray blinds you!', 'damage'); }
        e.energy -= ENERGY_THRESHOLD; // Manual subtraction for debuff ray
        return;
    }

    // #54 Fear — flee behaviour for wounded monsters
    if (e.hp < e.maxHp * 0.25 && Math.random() < 0.5) {
        // Move AWAY from player
        let mdx = Math.sign(e.x - player.x), mdy = Math.sign(e.y - player.y);
        if (mdx === 0 && mdy === 0) mdx = 1;
        attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
        return;
    }

    if (dist <= 1) {
        attemptAction(e, { type: 'move', dx, dy });
    } else if (dist < 15 && visible) {
        let mdx = 0; let mdy = 0;
        if (Math.abs(dx) > Math.abs(dy)) mdx = Math.sign(dx);
        else mdy = Math.sign(dy);
        attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
    } else {
        attemptAction(e, { type: 'wait' });
    }
}

// --- Rendering & Utility ---
function computeFOV() {
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) map[x][y].visible = false;
    }

    const radius = currentFloor === 0 ? 15 : (player.blindTimer > 0 ? 2 : 8); // #52 Blindness reduces FOV
    const px = player.x; const py = player.y;

    map[px][py].visible = true; map[px][py].explored = true;

    for (let a = 0; a < 360; a += 2) {
        let ax = Math.cos(a * (Math.PI / 180));
        let ay = Math.sin(a * (Math.PI / 180));
        let ox = px + 0.5; let oy = py + 0.5;

        for (let i = 0; i < radius; i++) {
            ox += ax; oy += ay;
            let tx = Math.floor(ox); let ty = Math.floor(oy);

            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;
            map[tx][ty].visible = true; map[tx][ty].explored = true;
            if (map[tx][ty].type === 'wall') break;
        }
    }

    updateVisibleMonsters();
}

function updateVisibleMonsters() {
    let nowVisible = new Set();
    let newMonsterSpotted = false;
    for (let e of entities) {
        if (!e.isPlayer && e.hp > 0 && map[e.x][e.y].visible) {
            nowVisible.add(e);
            if (!visibleMonsters.has(e)) newMonsterSpotted = true;
        }
    }
    visibleMonsters = nowVisible;
    if (newMonsterSpotted && (isAutoRunning || activePath || isAutoExploring)) {
        isAutoRunning = false;
        activePath = null;
        isAutoExploring = false;
        logMessage("A monster comes into view!", 'damage');
    }
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
        if (player.poisonTimer > 0) statuses.push(`<span style="color:#27ae60">☠ POISONED(${player.poisonTimer})</span>`);
        if (player.confusedTimer > 0) statuses.push(`<span style="color:#9b59b6">? CONFUSED(${player.confusedTimer})</span>`);
        if (player.blindTimer > 0) statuses.push(`<span style="color:#888">👁 BLIND(${player.blindTimer})</span>`);
        if (player.paralyzedTimer > 0) statuses.push(`<span style="color:#e0c080">🔒 PARALYZED(${player.paralyzedTimer})</span>`);
        if (player.combatSurgeTimer > 0) statuses.push(`<span style="color:#f1c40f">⚡ SURGE(${player.combatSurgeTimer})</span>`);
        if (player.regenBoost > 0) statuses.push(`<span style="color:#2ecc71">♥ REGEN(${player.regenBoost})</span>`);
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
                    else if (mType === 'bank') text = "Bank (£)";
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
