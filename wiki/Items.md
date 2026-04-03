# 🛡️ Arsenal & Items

Rogue Reborn features **96 items** across weapons, armor, shields, rings, amulets, potions, scrolls, wands, keys, ammo, and legendary artifacts.

## ⚔️ Weaponry
### Melee Weapons (`|`, `\`)
| Name | ATK | Floor | Special | Cost |
|------|-----|-------|---------|------|
| Dagger | +1 | 1 | — | 10g |
| Short Sword | +2 | 2 | — | 40g |
| Longsword | +3 | 3 | — | 80g |
| Battle Axe | +4 | 4 | — | 150g |
| Longsword (+1) | +4 | 5 | — | 250g |
| Frost Blade | +6 | 7 | — | 600g |
| Vorpal Sword | +10 | 9 | — | 1500g |

### Special Melee Weapons
| Name | ATK | Floor | Special | Cost |
|------|-----|-------|---------|------|
| Paired Daggers (`!`) | +2 | 2 | **Dual Wield** — double strike per attack, +2 Speed | 80g |
| Leather Whip (`~`) | +2 | 1 | **20% Disarm** — enemy ATK halved for 5 turns | 35g |
| Spear (`/`) | +3 | 2 | **2-tile Reach** — press `T` to thrust | 60g |
| Halberd (`/`) | +5 | 5 | **2-tile Reach** — press `T` to thrust | 200g |

### Ranged Weapons (`}`)
| Name | ATK | Floor | Special | Cost |
|------|-----|-------|---------|------|
| Short Bow | +1 | 1 | Press `F` to fire arrows | 50g |
| Long Bow | +3 | 3 | Press `F` to fire arrows | 120g |
| Heavy Crossbow | +5 | 4 | Press `F` to fire bolts. **2-turn reload** | 200g |

### Ammo (`-`)
- **Bundle of Arrows**: 20 shots (20g)
- **Crossbow Bolts**: 15 shots (25g)
- Ranged damage has **distance falloff**: `max(0.5, 1.0 - distance × 0.05)`

---

## 🛡️ Armor (`[`)
| Name | DEF | Floor | Special | Cost |
|------|-----|-------|---------|------|
| Leather Armor | +1 | 1 | — | 30g |
| Chain Mail | +3 | 3 | — | 100g |
| Plate Mail | +5 | 5 | — | 250g |
| Mithril Plate | +8 | 8 | — | 800g |
| Mage Robes | +0 | 1 | **SpellBoost +5** (increases wand/scroll damage) | 120g |

## 🛡️ Shields (Off-hand slot) (`)`)
| Name | DEF | Speed Penalty | Floor | Cost |
|------|-----|---------------|-------|------|
| Wooden Shield | +2 | -1 | 1 | 45g |
| Iron Shield | +4 | -2 | 4 | 150g |
| Mithril Shield | +6 | -1 | 7 | 500g |

## ⛑️ Helms (`^`)
| Name | DEF | Floor | Special | Cost |
|------|-----|-------|---------|------|
| Leather Cap | +1 | 1 | — | 20g |
| Iron Helm | +2 | 3 | — | 80g |
| Mithril Crown | +4 | 7 | — | 400g |
| Helm of Telepathy | — | 5 | **ESP** — reveals all monsters on the map | 500g |

---

## 💍 Rings (`=`)
| Name | Floor | Effect | Cost |
|------|-------|--------|------|
| Ring of Fire Resist | 3 | Halves fire damage | 150g |
| Ring of Protection (+1) | 2 | +1 DEF | 200g |
| Ring of Protection (+2) | 6 | +2 DEF | 450g |
| Ring of Burden | 3 | **Cursed** — -3 Speed | 1g |

## 📿 Amulets (`"`)
| Name | Floor | Effect | Cost |
|------|-------|--------|------|
| Amulet of Regeneration | 4 | Passive HP regeneration | 300g |
| Amulet of Strength | 3 | +2 ATK | 350g |

---

## 🧪 Potions (`!`)
| Name | Floor | Effect | Cost |
|------|-------|--------|------|
| Minor Healing | 1 | Heal 10 HP | 10g |
| Curing | 2 | Heal 25 HP | 25g |
| Greater Healing | 5 | Heal 75 HP | 100g |
| Full Healing | 8 | Heal 250 HP | 300g |
| Poison | 2 | 10-turn poison DOT | 5g |
| Slowness | 3 | -3 Speed | 5g |
| Experience | 5 | Gain enough XP to level up | 500g |
| Confusion | 2 | 10-turn confusion | 5g |
| Blindness | 2 | 8-turn blindness (FOV = 2) | 5g |
| Regeneration | 3 | +1 HP/tick for 30 ticks | 80g |
| Paralysis | 2 | 6-turn paralysis | 5g |

## 📜 Scrolls (`?`)
| Name | Floor | Effect | Cost |
|------|-------|--------|------|
| Scroll of Confusion | 3 | Confuses nearest visible monster (12 turns) | 60g |
| Word of Recall | 1 | Returns to Town. From Town, returns to your deepest reached floor. | 250g |
| Scroll of Identify | 1 | Identifies all inventory items | 30g |
| Scroll of Remove Curse | 2 | Purifies all cursed equipped items | 40g |
| Scroll of Summon Monster | 2 | Spawns 3 random monsters at your location! | 5g |
| Scroll of Fireball | 4 | **AoE** — damages all enemies within 3 tiles | 150g |
| Scroll of Frost Nova | 5 | Damages and slows all enemies within 2 tiles | 180g |
| Scroll of Enchant Weapon | 3 | Permanently +1 ATK to equipped weapon | 80g |
| Scroll of Enchant Armor | 4 | Permanently +1 DEF to equipped armor | 100g |

## 🪄 Wands (`/`)
All wands target a tile or enemy. Select with cursor, click or press Enter to fire.

| Name | Charges | Floor | Effect | Cost |
|------|---------|-------|--------|------|
| Wand of Magic Missile | 10 | 1 | 10-15 base damage | 150g |
| Wand of Frost | 8 | 2 | 8-12 damage + Slow (-3 Speed) | 200g |
| Wand of Lightning | 6 | 3 | 15-21 damage + 60% chain to adjacent | 300g |
| Wand of Slow | 12 | 2 | 5 damage + Slow (-4 Speed) | 180g |
| Wand of Haste | 6 | 4 | +4 Speed for 15 ticks (self) | 400g |
| Wand of Teleportation | 5 | 3 | Random blink (self) | 350g |
| Wand of Drain Life | 6 | 5 | 12-17 damage, heal 50% of dealt | 500g |
| Wand of Fire | 8 | 4 | 14-20 fire damage | 380g |
| Staff of Wizardry | 15 | 7 | 20-30 arcane damage | 1200g |

> **Mage Spell Mastery**: All wand/scroll damage gains `Level × 2` bonus for Mages.

---

## 🗝️ Dungeon Keys (`!`)
Dropped by Elite monsters (50% chance on death). Used to unlock `locked_door` tiles.

## 🌟 Legendary Artifacts
| **Sting** | +8 | 4 | +5 bonus damage vs Orcs. Glows blue. | 2000g |
| **Glamdring** | +12 | 7 | Fire element. Random +0-3 bonus damage per hit. | 5000g |
| **Anduril** | +15 | 9 | The legendary blade of kings. | 8000g |
| **Ringil** | +18 | 12 | Ice element. **+3 Speed**. The fastest blade. | 12000g |
| **Aeglos** | +14 | 10 | **2-tile Reach**. The spear of kings. | 9500g |
| **Crown of Kings** (Helm) | +6 DEF | 11 | The master crown. Massive defense. | 7500g |

## ✨ Drop Mechanics
Equipment can spawn with modifiers:
- **Cursed** (15% chance): Stats are inverted (ATK/DEF become negative). Cannot be unequipped without a Scroll of Remove Curse.
- **Blessed** (8% chance): +1-2 extra ATK or DEF bonus.
- **Artifact Drops**: Artifact drop rates now **scale with depth** (`0.5% + floor × 0.2%`). The deeper you go, the more likely you are to find legendaries!
