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
    // Round 6 — New Potions
    { type: 'potion', char: CHARS.POTION, color: '#e74c3c', name: 'Potion of Berserk Fury', effect: 'berserk', minFloor: 4, cost: 150 },
    { type: 'potion', char: CHARS.POTION, color: '#7f8c8d', name: 'Potion of Invisibility', effect: 'invisibility', minFloor: 6, cost: 250 },
    { type: 'potion', char: CHARS.POTION, color: '#27ae60', name: 'Potion of Antidote', effect: 'cure_poison', minFloor: 1, cost: 15 },
    { type: 'potion', char: CHARS.POTION, color: '#3498db', name: 'Potion of Mana', effect: 'restore_skill', minFloor: 3, cost: 120 },
    { type: 'potion', char: CHARS.POTION, color: '#f39c12', name: 'Potion of Fortitude', effect: 'temp_maxhp', value: 30, minFloor: 5, cost: 200 },
    { type: 'potion', char: CHARS.POTION, color: '#85c1e9', name: 'Potion of Frost Resistance', effect: 'resist_ice', minFloor: 4, cost: 90 },
    // Batch 4 — Stat Potions
    { type: 'potion', char: CHARS.POTION, color: '#ff3b3b', name: 'Potion of Strength', effect: 'perm_str', minFloor: 5, cost: 1000 },
    { type: 'potion', char: CHARS.POTION, color: '#3498db', name: 'Potion of Dexterity', effect: 'perm_dex', minFloor: 5, cost: 1000 },
    { type: 'potion', char: CHARS.POTION, color: '#bd93f9', name: 'Potion of Intellect', effect: 'perm_int', minFloor: 5, cost: 1000 },

    // #32 Repair Kits & Crafting Materials
    { type: 'consumable', char: '!', color: '#95a5a6', name: 'Standard Repair Kit', effect: 'repair', value: 50, minFloor: 2, cost: 60 },
    { type: 'consumable', char: '!', color: '#f1c40f', name: 'Artisan Repair Kit', effect: 'repair', value: 150, minFloor: 5, cost: 200 },
    { type: 'material', char: 'v', color: '#aab7b8', name: 'Scrap Metal', minFloor: 1, cost: 5 },
    { type: 'material', char: 'v', color: '#bd93f9', name: 'Magic Component', minFloor: 4, cost: 25 },
    { type: 'orb', char: '*', color: '#e67e22', name: 'Fire Orb', effect: 'enchant', element: 'fire', minFloor: 6, cost: 500 },
    { type: 'orb', char: '*', color: '#3498db', name: 'Ice Orb', effect: 'enchant', element: 'ice', minFloor: 6, cost: 500 },

    // ─── Scrolls ───
    { type: 'scroll', char: CHARS.SCROLL, color: '#e74c3c', name: 'Scroll of Confusion', effect: 'confuse_monster', minFloor: 3, cost: 60 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Word of Recall', effect: 'recall', minFloor: 1, cost: 250 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Scroll of Identify', effect: 'identify', minFloor: 1, cost: 30 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Scroll of Remove Curse', effect: 'uncurse', minFloor: 2, cost: 40 },
    { type: 'scroll', char: CHARS.SCROLL, color: COLORS.SCROLL, name: 'Scroll of Summon Monster', effect: 'summon', minFloor: 2, cost: 5 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#e67e22', name: 'Scroll of Fireball', effect: 'fireball_aoe', minFloor: 4, cost: 150 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#3498db', name: 'Scroll of Frost Nova', effect: 'frost_nova', minFloor: 5, cost: 180 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#f39c12', name: 'Scroll of Enchant Weapon', effect: 'enchant_weapon', minFloor: 3, cost: 80 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#3498db', name: 'Scroll of Enchant Armor', effect: 'enchant_armor', minFloor: 4, cost: 100 },
    // Round 7 — New Scrolls
    { type: 'scroll', char: CHARS.SCROLL, color: '#9b59b6', name: 'Scroll of Teleportation', effect: 'teleport_self', minFloor: 3, cost: 120 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#e74c3c', name: 'Scroll of Mass Confusion', effect: 'mass_confuse', minFloor: 6, cost: 300 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#f1c40f', name: 'Scroll of Holy Sanctuary', effect: 'sanctuary', minFloor: 5, cost: 220 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#d35400', name: 'Scroll of Earthquake', effect: 'earthquake', minFloor: 7, cost: 350 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#2ecc71', name: 'Scroll of Magic Mapping', effect: 'magic_map', minFloor: 2, cost: 100 },
    { type: 'scroll', char: CHARS.SCROLL, color: '#1abc9c', name: 'Scroll of Acquirement', effect: 'acquirement', minFloor: 8, cost: 1000 },

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
    // Round 8 — New Wands
    { type: 'wand', char: '/', color: '#1abc9c', name: 'Wand of Polymorph', effect: 'target_spell', spell: 'polymorph', charges: 5, minFloor: 5, cost: 450 },
    { type: 'wand', char: '/', color: '#c0392b', name: 'Wand of Disintegrate', effect: 'target_spell', spell: 'disintegrate', charges: 3, minFloor: 8, cost: 800 },
    { type: 'wand', char: '/', color: '#f1c40f', name: 'Wand of Chain Lightning', effect: 'target_spell', spell: 'chain_lightning', charges: 4, minFloor: 7, cost: 700 },
    { type: 'wand', char: '/', color: '#2ecc71', name: 'Wand of Stone to Mud', effect: 'stone_to_mud', charges: 8, minFloor: 3, cost: 250 },

    // ─── Helms ───
    { type: 'helm', char: CHARS.HELM, color: '#bdc3c7', name: 'Leather Cap', effect: 'helm', equip: true, defBonus: 1, minFloor: 1, cost: 20 },
    { type: 'helm', char: CHARS.HELM, color: '#7f8c8d', name: 'Iron Helm', effect: 'helm', equip: true, defBonus: 2, minFloor: 3, cost: 80 },
    { type: 'helm', char: CHARS.HELM, color: '#f39c12', name: 'Mithril Crown', effect: 'helm', equip: true, defBonus: 4, minFloor: 7, cost: 400 },
    { type: 'helm', char: CHARS.HELM, color: COLORS.HELM, name: 'Helm of Telepathy', effect: 'esp', equip: true, minFloor: 5, cost: 500 },
    // Round 6 — New Helm
    { type: 'helm', char: CHARS.HELM, color: '#e74c3c', name: 'Helm of Brilliance', effect: 'helm', equip: true, defBonus: 3, spellBoost: 3, minFloor: 6, cost: 350 },

    // ─── Rings ───
    { type: 'ring', char: CHARS.RING, color: '#e74c3c', name: 'Ring of Fire Resist', effect: 'resist_fire', equip: true, minFloor: 3, cost: 150 },
    { type: 'ring', char: CHARS.RING, color: '#3498db', name: 'Ring of Protection (+1)', effect: 'protection', equip: true, defBonus: 1, minFloor: 2, cost: 200 },
    { type: 'ring', char: CHARS.RING, color: '#9b59b6', name: 'Ring of Protection (+2)', effect: 'protection', equip: true, defBonus: 2, minFloor: 6, cost: 450 },
    { type: 'ring', char: CHARS.RING, color: '#888888', name: 'Ring of Burden', effect: 'burden', equip: true, speedPenalty: 3, cursed: true, minFloor: 3, cost: 1 },
    // Round 9 — New Rings
    { type: 'ring', char: CHARS.RING, color: '#2ecc71', name: 'Ring of Speed', effect: 'speed_boost', equip: true, speedBonus: 3, minFloor: 5, cost: 400 },
    { type: 'ring', char: CHARS.RING, color: '#e67e22', name: 'Ring of Power', effect: 'power', equip: true, atkBonus: 3, minFloor: 6, cost: 500 },
    { type: 'ring', char: CHARS.RING, color: '#85c1e9', name: 'Ring of Evasion', effect: 'evasion', equip: true, minFloor: 4, cost: 300 },
    { type: 'ring', char: CHARS.RING, color: '#27ae60', name: 'Ring of Poison Resist', effect: 'resist_poison', equip: true, minFloor: 3, cost: 180 },

    // ─── Amulets ───
    { type: 'amulet', char: '"', color: '#2ecc71', name: 'Amulet of Regeneration', effect: 'regeneration', equip: true, minFloor: 4, cost: 300 },
    { type: 'amulet', char: '"', color: '#e67e22', name: 'Amulet of Strength', effect: 'strength', equip: true, minFloor: 3, cost: 350 },
    { type: 'amulet', char: '"', color: '#e74c3c', name: 'Amulet of Thorns', effect: 'thorns', equip: true, minFloor: 4, cost: 400 },
    // Round 9 — New Amulets
    { type: 'amulet', char: '"', color: '#3498db', name: 'Amulet of Clarity', effect: 'resist_confuse', equip: true, minFloor: 3, cost: 250 },
    { type: 'amulet', char: '"', color: '#f1c40f', name: 'Amulet of the Ancients', effect: 'xp_boost', equip: true, minFloor: 7, cost: 800 },
    { type: 'amulet', char: '"', color: '#9b59b6', name: 'Amulet of Warding', effect: 'damage_reduction', equip: true, minFloor: 5, cost: 450 },

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
    // Round 7 — New Weapons
    { type: 'weapon', char: '\\', color: '#aab7b8', name: 'War Hammer', effect: 'weapon', equip: true, atkBonus: 5, minFloor: 4, cost: 180 },
    { type: 'weapon', char: '|', color: '#f39c12', name: 'Scimitar', effect: 'weapon', equip: true, atkBonus: 4, speedBonus: 1, minFloor: 3, cost: 130 },
    { type: 'weapon', char: '/', color: '#1abc9c', name: 'Trident', effect: 'weapon', equip: true, atkBonus: 6, reach: 2, minFloor: 6, cost: 350 },
    { type: 'weapon', char: '}', color: '#e67e22', name: 'Composite Bow', effect: 'bow', equip: true, atkBonus: 5, minFloor: 5, cost: 280 },
    { type: 'weapon', char: '-', color: '#95a5a6', name: 'Throwing Knives', effect: 'bow', equip: true, atkBonus: 2, speedBonus: 2, minFloor: 2, cost: 60 },
    { type: 'weapon', char: '|', color: '#c0392b', name: 'Flamberge', effect: 'weapon', equip: true, atkBonus: 7, element: 'fire', minFloor: 7, cost: 700 },
    { type: 'weapon', char: '|', color: '#85c1e9', name: 'Frostmourne', effect: 'weapon', equip: true, atkBonus: 8, element: 'ice', speedBonus: 1, minFloor: 8, cost: 900 },

    // ─── Artifacts (Legendary) ───
    { type: 'weapon', char: '|', color: '#f1c40f', name: 'Sting', effect: 'weapon', equip: true, atkBonus: 8, artifact: true, identified: true, minFloor: 4, cost: 2000, lore: "A short sword of Elven-make, it glows blue in the presence of orcs." },
    { type: 'weapon', char: '|', color: '#e74c3c', name: 'Glamdring', effect: 'weapon', equip: true, atkBonus: 12, artifact: true, identified: true, element: 'fire', minFloor: 7, cost: 5000, lore: "The 'Foe-hammer' that once belonged to the King of Gondolin." },
    { type: 'weapon', char: '|', color: '#66fcf1', name: 'Anduril', effect: 'weapon', equip: true, atkBonus: 15, artifact: true, identified: true, minFloor: 9, cost: 8000, lore: "The Flame of the West, forged from the shards of Narsil." },
    { type: 'weapon', char: '|', color: '#3498db', name: 'Ringil', effect: 'weapon', equip: true, atkBonus: 18, speedBonus: 3, artifact: true, identified: true, element: 'ice', minFloor: 12, cost: 12000, lore: "The sword of Fingolfin, it glittered like ice." },
    { type: 'weapon', char: '/', color: '#bdc3c7', name: 'Aeglos', effect: 'weapon', equip: true, atkBonus: 14, reach: 2, artifact: true, identified: true, minFloor: 10, cost: 9500, lore: "The spear of Gil-galad, none could withstand it." },
    { type: 'helm', char: CHARS.HELM, color: '#f1c40f', name: 'Crown of Kings', effect: 'helm', equip: true, defBonus: 6, artifact: true, identified: true, minFloor: 11, cost: 7500, lore: "A golden crown that radiates authority and protection." },
    // Round 10 — New Artifacts
    { type: 'weapon', char: '\\', color: '#c0392b', name: 'Grond, the Hammer', effect: 'weapon', equip: true, atkBonus: 22, artifact: true, identified: true, minFloor: 13, cost: 15000, lore: "The Hammer of the Underworld, forged in the fires of Angband." },
    { type: 'ring', char: CHARS.RING, color: '#e74c3c', name: 'Narya, Ring of Fire', effect: 'resist_fire', equip: true, atkBonus: 3, defBonus: 2, artifact: true, identified: true, minFloor: 10, cost: 8000, lore: "One of the Three Rings of the Elves, it inspires courage in all." },
    { type: 'ring', char: CHARS.RING, color: '#3498db', name: 'Nenya, Ring of Water', effect: 'regeneration', equip: true, defBonus: 4, artifact: true, identified: true, minFloor: 11, cost: 10000, lore: "Its stone is of adamant, and its power protects against the decay of time." },
    { type: 'weapon', char: '|', color: '#9b59b6', name: 'Calris', effect: 'weapon', equip: true, atkBonus: 16, artifact: true, identified: true, element: 'magic', minFloor: 10, cost: 11000, lore: "A sentient blade with a dark past, and even darker future." },
    { type: 'armor', char: '[', color: '#f1c40f', name: 'Thorin, Shield of Durin', effect: 'armor', equip: true, defBonus: 10, artifact: true, identified: true, minFloor: 12, cost: 12000, lore: "An oak-shield of legendary endurance, it turned aside the blows of kings." },

    // #36 Cursed Relics
    { type: 'armor', char: '[', color: '#888', name: 'Bloodied Shard', effect: 'armor', equip: true, lifeSteal: 1.0, maxHpPenalty: 50, cursed: true, artifact: true, minFloor: 5, cost: 3000, lore: "It heals you with each strike, but at the cost of your very vitality." },
    { type: 'ring', char: CHARS.RING, color: '#9b59b6', name: 'Eye of Chaos', effect: 'power', equip: true, atkBonus: 25, curseEffect: 'chaos', cursed: true, artifact: true, minFloor: 8, cost: 5000, lore: "Absolute power. Absolute instability." },

    // #37 Set Items (Sun Set)
    { type: 'helm', char: CHARS.HELM, color: '#f1c40f', name: 'Sun-Crested Helm', effect: 'helm', equip: true, defBonus: 2, set: 'Sun', minFloor: 3, cost: 500 },
    { type: 'armor', char: '[', color: '#f1c40f', name: 'Sun-Mail', effect: 'armor', equip: true, defBonus: 4, set: 'Sun', minFloor: 4, cost: 800 },
    { type: 'shield', char: ')', color: '#f1c40f', name: 'Sun-Shield', effect: 'shield', equip: true, defBonus: 3, set: 'Sun', minFloor: 5, cost: 1200 },

    // #38 Sentient Weapon
    { type: 'weapon', char: '|', color: '#66fcf1', name: 'Soul Eater', effect: 'weapon', equip: true, atkBonus: 5, sentient: true, itemXp: 0, itemLvl: 1, minFloor: 3, cost: 2000, lore: "It hungers for the spirits of your enemies. It grows stronger with every soul." },

    // ─── Ammo ───
    { type: 'ammo', char: '-', color: '#95a5a6', name: 'Bundle of Arrows', effect: 'ammo', amount: 20, minFloor: 1, cost: 20 },
    { type: 'ammo', char: '-', color: '#7f8c8d', name: 'Crossbow Bolts', effect: 'ammo', amount: 15, minFloor: 1, cost: 25 },
    // Round 8 — New Ammo
    { type: 'ammo', char: '-', color: '#ecf0f1', name: 'Silver Arrows', effect: 'ammo', amount: 10, minFloor: 5, cost: 80 },
    { type: 'ammo', char: '-', color: '#e74c3c', name: 'Explosive Bolts', effect: 'ammo', amount: 5, minFloor: 7, cost: 150 },

    // ─── Shields (off-hand) ───
    { type: 'shield', char: ')', color: '#d35400', name: 'Wooden Shield', effect: 'shield', equip: true, defBonus: 2, speedPenalty: 1, minFloor: 1, cost: 45 },
    { type: 'shield', char: ')', color: '#bdc3c7', name: 'Iron Shield', effect: 'shield', equip: true, defBonus: 4, speedPenalty: 2, minFloor: 4, cost: 150 },
    { type: 'shield', char: ')', color: '#f1c40f', name: 'Mithril Shield', effect: 'shield', equip: true, defBonus: 6, speedPenalty: 1, minFloor: 7, cost: 500 },
    // Round 8 — New Shield
    { type: 'shield', char: ')', color: '#7f8c8d', name: 'Tower Shield', effect: 'shield', equip: true, defBonus: 8, speedPenalty: 3, minFloor: 6, cost: 400 },

    // ─── Armor ───
    { type: 'armor', char: '[', color: '#d35400', name: 'Leather Armor', effect: 'armor', equip: true, defBonus: 1, minFloor: 1, cost: 30 },
    { type: 'armor', char: '[', color: '#bdc3c7', name: 'Chain Mail', effect: 'armor', equip: true, defBonus: 3, minFloor: 3, cost: 100 },
    { type: 'armor', char: '[', color: '#7f8c8d', name: 'Plate Mail', effect: 'armor', equip: true, defBonus: 5, minFloor: 5, cost: 250 },
    { type: 'armor', char: '[', color: '#f1c40f', name: 'Mithril Plate', effect: 'armor', equip: true, defBonus: 8, minFloor: 8, cost: 800 },
    { type: 'armor', char: '[', color: '#9b59b6', name: 'Mage Robes', effect: 'armor', equip: true, defBonus: 0, spellBoost: 5, minFloor: 1, cost: 120 },
    // Round 9 — New Armor
    { type: 'armor', char: '[', color: '#e67e22', name: 'Dragonscale Mail', effect: 'armor', equip: true, defBonus: 7, minFloor: 8, cost: 700 },
    { type: 'armor', char: '[', color: '#aab7b8', name: 'Adamantine Plate', effect: 'armor', equip: true, defBonus: 10, speedPenalty: 2, minFloor: 10, cost: 1200 },
    { type: 'armor', char: '[', color: '#2ecc71', name: 'Elven Cloak', effect: 'armor', equip: true, defBonus: 2, speedBonus: 2, minFloor: 4, cost: 180 }
];

// --- Ego Item Logic (Batch 3) ---
const EGO_PREFIXES = [
    { name: 'Sharp', atkBonus: 2, costMul: 1.5 },
    { name: 'Sturdy', defBonus: 1, costMul: 1.3 },
    { name: 'Swift', speedBonus: 2, costMul: 1.8 },
    { name: 'Deadly', atkBonus: 5, minFloor: 5, costMul: 2.5 },
    { name: 'Blessed', atkBonus: 1, defBonus: 1, costMul: 2.0 }
];

const EGO_SUFFIXES = [
    { name: 'of Might', atkBonus: 3, costMul: 1.6 },
    { name: 'of Life', maxHpBonus: 15, costMul: 2.0 },
    { name: 'of Defense', defBonus: 2, costMul: 1.4 },
    { name: 'of the Bear', hpBonus: 10, defBonus: 1, costMul: 1.7 },
    { name: 'of Speed', speedBonus: 3, minFloor: 4, costMul: 2.2 }
];

function applyEgo(item) {
    if (item.artifact) return item;

    // #31 Initialize Durability for Equipment
    if (['weapon', 'armor', 'helm', 'shield', 'ring', 'amulet'].includes(item.type)) {
        item.maxDurability = 50 + Math.floor(Math.random() * 50);
        if (item.artifact) item.maxDurability += 100;
        item.durability = item.maxDurability;
        
        // #Infinite: Initialize enhancement bonuses
        item.plusAtk = 0;
        item.plusDef = 0;
    }
    
    // 15% chance for prefix
    if (Math.random() < 0.15) {
        const pre = EGO_PREFIXES[Math.floor(Math.random() * EGO_PREFIXES.length)];
        if ((pre.minFloor || 0) <= (currentFloor || 1)) {
            item.name = pre.name + " " + item.name;
            
            // #Infinite: Special handling for Blessed items - randomize bonuses
            if (pre.name === 'Blessed') {
                item.blessed = true;
                item.plusAtk = (item.plusAtk || 0) + Math.floor(Math.random() * 2) + 1; // +1 to +2
                item.plusDef = (item.plusDef || 0) + Math.floor(Math.random() * 2) + 1; // +1 to +2
            } else {
                if (pre.atkBonus) item.plusAtk = (item.plusAtk || 0) + pre.atkBonus;
                if (pre.defBonus) item.plusDef = (item.plusDef || 0) + pre.defBonus;
            }

            if (pre.speedBonus) item.speedBonus = (item.speedBonus || 0) + pre.speedBonus;
            item.cost = Math.floor(item.cost * pre.costMul);
            item.ego = true;
        }
    }
    
    // 10% chance for suffix
    if (Math.random() < 0.10) {
        const suf = EGO_SUFFIXES[Math.floor(Math.random() * EGO_SUFFIXES.length)];
        if ((suf.minFloor || 0) <= (currentFloor || 1)) {
            item.name = item.name + " " + suf.name;
            if (suf.atkBonus) item.plusAtk = (item.plusAtk || 0) + suf.atkBonus;
            if (suf.defBonus) item.plusDef = (item.plusDef || 0) + suf.defBonus;
            if (suf.speedBonus) item.speedBonus = (item.speedBonus || 0) + suf.speedBonus;
            if (suf.maxHpBonus) item.maxHpBonus = (item.maxHpBonus || 0) + suf.maxHpBonus;
            item.cost = Math.floor(item.cost * suf.costMul);
            item.ego = true;
        }
    }
    
    return item;
}
