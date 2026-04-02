/**
 * 🌸 Rogue Reborn — Item Database
 * All item definitions: potions, scrolls, wands, weapons, armor, rings, amulets, artifacts.
 */

const ITEM_DB = [
    // ─── Potions ───
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Minor Healing', effect: 'heal', value: 10, minFloor: 1, cost: 10 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Curing', effect: 'heal', value: 25, minFloor: 2, cost: 25 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Greater Healing', effect: 'heal', value: 75, minFloor: 5, cost: 100 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Full Healing', effect: 'heal', value: 250, minFloor: 8, cost: 300 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Poison', effect: 'poison', value: 10, minFloor: 2, cost: 5 },
    { type: 'potion', char: CHARS.POTION, color: COLORS.POTION, name: 'Potion of Slowness', effect: 'slow', value: 10, minFloor: 3, cost: 5 },
    { type: 'potion', char: CHARS.POTION, color: '#f1c40f', name: 'Potion of Experience', effect: 'xp', minFloor: 5, cost: 500 },
    { type: 'potion', char: CHARS.POTION, color: '#9b59b6', name: 'Potion of Confusion', effect: 'confuse_self', minFloor: 2, cost: 5 },
    { type: 'potion', char: CHARS.POTION, color: '#888888', name: 'Potion of Blindness', effect: 'blind_self', minFloor: 2, cost: 5 },
    { type: 'potion', char: CHARS.POTION, color: '#2ecc71', name: 'Potion of Regeneration', effect: 'regen_boost', minFloor: 3, cost: 80 },
    { type: 'potion', char: CHARS.POTION, color: '#e0c080', name: 'Potion of Paralysis', effect: 'paralyze_self', minFloor: 2, cost: 5 },

    // ─── Scrolls ───
    { type: 'scroll', char: CHARS.SCROLL, color: '#e74c3c', name: 'Scroll of Confusion', effect: 'confuse_monster', minFloor: 3, cost: 60 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Word of Recall', effect: 'recall', minFloor: 1, cost: 50 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Scroll of Identify', effect: 'identify', minFloor: 1, cost: 30 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Scroll of Remove Curse', effect: 'uncurse', minFloor: 2, cost: 40 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Scroll of Summon Monster', effect: 'summon', minFloor: 2, cost: 5 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#e67e22', name: 'Scroll of Fireball', effect: 'fireball_aoe', minFloor: 4, cost: 150 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#3498db', name: 'Scroll of Frost Nova', effect: 'frost_nova', minFloor: 5, cost: 180 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#f39c12', name: 'Scroll of Enchant Weapon', effect: 'enchant_weapon', minFloor: 3, cost: 80 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#3498db', name: 'Scroll of Enchant Armor', effect: 'enchant_armor', minFloor: 4, cost: 100 },

    // ─── Keys ───
    { type: 'key', char: '!', color: '#f1c40f', name: 'Dungeon Key', effect: 'key', minFloor: 1, cost: 0 },

    // ─── Wands ───
    { type: 'wand', char: '/', color: '#9b59b6', name: 'Wand of Magic Missile', effect: 'target_spell', spell: 'magic_missile', charges: 10, minFloor: 1, cost: 150 },
    { type: 'wand', char: '/', color: '#3498db', name: 'Wand of Frost', effect: 'target_spell', spell: 'frost', charges: 8, minFloor: 2, cost: 200 },
    { type: 'wand', char: '/', color: '#f1c40f', name: 'Wand of Lightning', effect: 'target_spell', spell: 'lightning', charges: 6, minFloor: 3, cost: 300 },
    { type: 'wand', char: '/', color: '#2ecc71', name: 'Wand of Slow', effect: 'target_spell', spell: 'slow_bolt', charges: 12, minFloor: 2, cost: 180 },
    { type: 'wand', char: '/', color: '#66fcf1', name: 'Wand of Haste', effect: 'haste_self', charges: 6, minFloor: 4, cost: 400 },
    { type: 'wand', char: '/', color: '#9b59b6', name: 'Wand of Teleportation', effect: 'teleport_self', charges: 5, minFloor: 3, cost: 350 },
    { type: 'wand', char: '/', color: '#e74c3c', name: 'Wand of Drain Life', effect: 'target_spell', spell: 'drain_life', charges: 6, minFloor: 5, cost: 500 },
    { type: 'wand', char: '/', color: '#e67e22', name: 'Wand of Fire', effect: 'target_spell', spell: 'fire_bolt', charges: 8, minFloor: 4, cost: 380 },
    { type: 'wand', char: '/', color: '#f1c40f', name: 'Staff of Wizardry', effect: 'target_spell', spell: 'arcane_blast', charges: 15, minFloor: 7, cost: 1200 },

    // ─── Helms ───
    { type: 'helm', char: CHARS.HELM, color: '#bdc3c7', name: 'Leather Cap', effect: 'helm', equip: true, defBonus: 1, minFloor: 1, cost: 20 },
    { type: 'helm', char: CHARS.HELM, color: '#7f8c8d', name: 'Iron Helm', effect: 'helm', equip: true, defBonus: 2, minFloor: 3, cost: 80 },
    { type: 'helm', char: CHARS.HELM, color: '#f39c12', name: 'Mithril Crown', effect: 'helm', equip: true, defBonus: 4, minFloor: 7, cost: 400 },
    { type: 'helm', char: CHARS.HELM, color: COLORS.HELM, name: 'Helm of Telepathy', effect: 'esp', equip: true, minFloor: 5, cost: 500 },

    // ─── Rings ───
    { type: 'ring', char: CHARS.RING, color: '#e74c3c', name: 'Ring of Fire Resist', effect: 'resist_fire', equip: true, minFloor: 3, cost: 150 },
    { type: 'ring', char: CHARS.RING, color: '#3498db', name: 'Ring of Protection (+1)', effect: 'protection', equip: true, defBonus: 1, minFloor: 2, cost: 200 },
    { type: 'ring', char: CHARS.RING, color: '#9b59b6', name: 'Ring of Protection (+2)', effect: 'protection', equip: true, defBonus: 2, minFloor: 6, cost: 450 },
    { type: 'ring', char: CHARS.RING, color: '#888888', name: 'Ring of Burden', effect: 'burden', equip: true, speedPenalty: 3, cursed: true, minFloor: 3, cost: 1 },

    // ─── Amulets ───
    { type: 'amulet', char: '"', color: '#2ecc71', name: 'Amulet of Regeneration', effect: 'regeneration', equip: true, minFloor: 4, cost: 300 },
    { type: 'amulet', char: '"', color: '#e67e22', name: 'Amulet of Strength', effect: 'strength', equip: true, minFloor: 3, cost: 350 },

    // ─── Weapons ───
    { type: 'weapon', char: '|', color: '#bdc3c7', name: 'Dagger', effect: 'weapon', equip: true, atkBonus: 1, minFloor: 1, cost: 10 },
    { type: 'weapon', char: '|', color: '#ecf0f1', name: 'Short Sword', effect: 'weapon', equip: true, atkBonus: 2, minFloor: 2, cost: 40 },
    { type: 'weapon', char: '|', color: '#95a5a6', name: 'Longsword', effect: 'weapon', equip: true, atkBonus: 3, minFloor: 3, cost: 80 },
    { type: 'weapon', char: '\\', color: '#7f8c8d', name: 'Battle Axe', effect: 'weapon', equip: true, atkBonus: 4, minFloor: 4, cost: 150 },
    { type: 'weapon', char: '|', color: '#f1c40f', name: 'Longsword (+1)', effect: 'weapon', equip: true, atkBonus: 4, minFloor: 5, cost: 250 },
    { type: 'weapon', char: '|', color: '#3498db', name: 'Frost Blade', effect: 'weapon', equip: true, atkBonus: 6, minFloor: 7, cost: 600 },
    { type: 'weapon', char: '|', color: '#e74c3c', name: 'Vorpal Sword', effect: 'weapon', equip: true, atkBonus: 10, minFloor: 9, cost: 1500 },
    { type: 'weapon', char: '}', color: '#825a3d', name: 'Short Bow', effect: 'bow', equip: true, atkBonus: 1, minFloor: 1, cost: 50 },
    { type: 'weapon', char: '}', color: '#c0a060', name: 'Long Bow', effect: 'bow', equip: true, atkBonus: 3, minFloor: 3, cost: 120 },
    { type: 'weapon', char: '}', color: '#7f8c8d', name: 'Heavy Crossbow', effect: 'crossbow', equip: true, atkBonus: 5, minFloor: 4, cost: 200 },
    { type: 'weapon', char: '/', color: '#95a5a6', name: 'Spear', effect: 'weapon', equip: true, atkBonus: 3, reach: 2, minFloor: 2, cost: 60 },
    { type: 'weapon', char: '/', color: '#bdc3c7', name: 'Halberd', effect: 'weapon', equip: true, atkBonus: 5, reach: 2, minFloor: 5, cost: 200 },
    { type: 'weapon', char: '!', color: '#e67e22', name: 'Paired Daggers', effect: 'weapon', equip: true, atkBonus: 2, dualWield: true, speedBonus: 2, minFloor: 2, cost: 80 },
    { type: 'weapon', char: '~', color: '#d35400', name: 'Leather Whip', effect: 'weapon', equip: true, atkBonus: 2, disarm: 0.20, minFloor: 1, cost: 35 },

    // ─── Artifacts (Legendary) ───
    { type: 'weapon', char: '|', color: '#f1c40f', name: 'Sting', effect: 'weapon', equip: true, atkBonus: 8, artifact: true, identified: true, minFloor: 4, cost: 2000 },
    { type: 'weapon', char: '|', color: '#e74c3c', name: 'Glamdring', effect: 'weapon', equip: true, atkBonus: 12, artifact: true, identified: true, element: 'fire', minFloor: 7, cost: 5000 },
    { type: 'weapon', char: '|', color: '#66fcf1', name: 'Anduril', effect: 'weapon', equip: true, atkBonus: 15, artifact: true, identified: true, minFloor: 9, cost: 8000 },

    // ─── Ammo ───
    { type: 'ammo', char: '-', color: '#95a5a6', name: 'Bundle of Arrows', effect: 'ammo', amount: 20, minFloor: 1, cost: 20 },
    { type: 'ammo', char: '-', color: '#7f8c8d', name: 'Crossbow Bolts', effect: 'ammo', amount: 15, minFloor: 1, cost: 25 },

    // ─── Shields (off-hand) ───
    { type: 'shield', char: ')', color: '#d35400', name: 'Wooden Shield', effect: 'shield', equip: true, defBonus: 2, speedPenalty: 1, minFloor: 1, cost: 45 },
    { type: 'shield', char: ')', color: '#bdc3c7', name: 'Iron Shield', effect: 'shield', equip: true, defBonus: 4, speedPenalty: 2, minFloor: 4, cost: 150 },
    { type: 'shield', char: ')', color: '#f1c40f', name: 'Mithril Shield', effect: 'shield', equip: true, defBonus: 6, speedPenalty: 1, minFloor: 7, cost: 500 },

    // ─── Armor ───
    { type: 'armor', char: '[', color: '#d35400', name: 'Leather Armor', effect: 'armor', equip: true, defBonus: 1, minFloor: 1, cost: 30 },
    { type: 'armor', char: '[', color: '#bdc3c7', name: 'Chain Mail', effect: 'armor', equip: true, defBonus: 3, minFloor: 3, cost: 100 },
    { type: 'armor', char: '[', color: '#7f8c8d', name: 'Plate Mail', effect: 'armor', equip: true, defBonus: 5, minFloor: 5, cost: 250 },
    { type: 'armor', char: '[', color: '#f1c40f', name: 'Mithril Plate', effect: 'armor', equip: true, defBonus: 8, minFloor: 8, cost: 800 },
    { type: 'armor', char: '[', color: '#9b59b6', name: 'Mage Robes', effect: 'armor', equip: true, defBonus: 0, spellBoost: 5, minFloor: 1, cost: 120 }
];
