# 🐲 Bestiary

Rogue Reborn features **24 unique monsters** with different behaviors, mechanics, and stats across 4 tiers of difficulty.

## 🐀 The Early Depths (Floors 1-2)
| Glyph | Name | HP | ATK | DEF | Speed | Element | XP | Special |
|-------|------|----|-----|-----|-------|---------|----|---------|
| `r` | Rat | 5 | 1 | 0 | 12 | — | 5 | — |
| `g` | Goblin | 10 | 3 | 1 | 10 | — | 10 | — |
| `k` | Kobold | 12 | 4 | 2 | 11 | — | 15 | — |
| `Z` | Skeleton | 18 | 5 | 4 | 8 | — | 35 | High DEF |

## 🕷️ The Core Fiends (Floors 3-6)
| Glyph | Name | HP | ATK | DEF | Speed | Element | XP | Special |
|-------|------|----|-----|-----|-------|---------|----|---------|
| `h` | Fire Hound | 15 | 5 | 2 | 14 | Fire 🔥 | 25 | Fire breath |
| `o` | Orc | 20 | 6 | 3 | 8 | — | 30 | Beefy melee |
| `e` | Dark Elf | 18 | 7 | 3 | 12 | Magic | 45 | Arcane strikes |
| `s` | Giant Spider | 14 | 4 | 1 | 13 | Poison ☠ | 20 | 25% to poison on hit |
| `R` | Giant Rat | 18 | 4 | 1 | 14 | Poison ☠ | 18 | Fast, venomous |
| `C` | Gelatinous Cube | 30 | 6 | 3 | 5 | — | 40 | **Invisible** unless adjacent |
| `X` | Rust Monster | 16 | 3 | 0 | 10 | Rust | 50 | **Degrades armor** (-1 DEF permanently) |
| `n` | Blink Dog | 12 | 5 | 2 | 15 | — | 45 | **Teleports** when below 50% HP |
| `m` | Mimic | 40+ | 8+ | 5 | 9 | — | 40 | **Disguised** as gold/items (Floor 3+). High HP. |

## 🧛 The Mid-Depths (Floors 5-8)
| Glyph | Name | HP | ATK | DEF | Speed | Element | XP | Special |
|-------|------|----|-----|-----|-------|---------|----|---------|
| `V` | Vampire | 28 | 8 | 3 | 11 | Drain | 90 | **20% to drain Max HP** permanently |
| `N` | Necromancer | 20 | 7 | 1 | 9 | Magic | 70 | **Summons Skeletons** (max 4) |
| `T` | Cave Troll | 35 | 9 | 5 | 6 | — | 60 | Massive HP, slow |
| `I` | Beholder | 22 | 9 | 2 | 8 | Magic | 85 | **Eye-Ray**: Slow, Confuse, or Blind at range 2-6 |
| `M` | Mind Flayer | 24 | 7 | 3 | 9 | Magic | 100 | **Drains XP** (15 + floor×3) per hit |

## 🔥 The Abyss & Beyond (Floors 8+)
| Glyph | Name | HP | ATK | DEF | Speed | Element | XP | Special |
|-------|------|----|-----|-----|-------|---------|----|---------|
| `W` | Wraith | 25 | 8 | 2 | 10 | Drain | 80 | Life drain attacks |
| `D` | Dragon | 50 | 12 | 7 | 8 | Fire 🔥 | 150 | Fire breath, massive HP |
| `B` | Balrog | 150 | 18 | 12 | 10 | Fire 🔥 | 500 | **Boss** — regenerates 2 HP/tick when below 150 HP |

| `Q` | Cave Champion | 70 | 13 | 8 | 7 | — | 110 | Abyss-tier brute |

## 🛡️ Special Encounter: Elite Vault Guards
Vicious guards that protect magical vaults in the deep dungeon.
- **Glyphs**: Varies (Random Elite monster)
- **Stats**: **3× HP**, **+5 ATK**, **4× XP**
- These monsters are only found inside the purple-walled **Vaults** starting from Floor 3.
- They are significantly more dangerous than their floor-appropriate peers.

---

## 👑 Mini-Bosses
These are spawned once per specific floor and grant massive XP:

- **Arch-Lich** `L` (Floor 8): 80 HP, 14 ATK, 8 DEF. Drains XP *and* summons lesser undead. Worth 350 XP.
- **Dragon King** `K` (Floor 9): 120 HP, 16 ATK, 10 DEF. Breathes fire, drains Max HP, *and* fires Beholder debuff rays. Worth 450 XP. Do NOT engage blindly!

## ✨ Golden Elites
Any normal monster has a **10% chance** to spawn as a glowing gold **Elite** variant:
- **1.5× HP**, **1.3× ATK**, **2× XP**
- 50% chance to drop a **Dungeon Key** (`!`) on death
- Identified by their golden glow `#f1c40f`

## 🧠 AI Personalities & Reputation
The monsters of Rogue Reborn are not just simple automatons. They adapt based on their specific personality traits and your reputation (kill count) within their species.

| Personality | Effect | Triggers |
|-------------|--------|----------|
| **Cowardly** | Shrieks and runs away from the player. | Kill Count ≥ 5 |
| **Vengeful** | Gains **RAGE! (+2 ATK)** and rushes the player. | Kill Count ≥ 5 |
| **Stealthy** | Waits motionless in the dark. | Dist > 3, HP Full |
| **Pack** | Howls to alert all nearby pack members. | HP < 40% |
| **Fear** | Any monster might panic and flee. | HP < 25% |

- **Species Tracking**: The player's kills are tracked per species (Rat, Goblin, etc.).
- **Dynamic Barks**: Monsters will shout or howl depending on their state.
- **Pack Alert**: Alerted pack members will wake from sleep/confusion and move to engage.
