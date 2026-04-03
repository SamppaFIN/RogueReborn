# Rogue Reborn

A fully-featured, turn-based HTML5 roguelike game built from the ground up, featuring deep town mechanics, an infinite scaling dungeon abyss, complex combat mechanics, and a massive array of items, monsters, and spells.

## 🏰 Features

**Town & Progression**
- **TomeNET Town System**: The safe haven features distinct, house-like structures for all services. Includes an Inn (healing), Blacksmith (gear upgrades), Wizard Tower (ESP & enchantments), Bank (gold storage), and Alchemist.
- **Day/Night Cycle**: The town changes dynamically, spawning Beggars, Drunks, and special events depending on the time of day.
- **Save/Load System**: Progress is automatically saved locally so you never lose your run (`F5` Save, `F9` Load).

**Endless Dungeon & Exploration**
- **Procedurally Generated Levels**: Rooms, corridors, and twisting caves.
- **Magical Vaults**: Deep in the dungeon (Floor 3+), find purple-walled vaults guarded by **Elite Vault Guards**. These contain specialized merchants or gambler dens but require a **Dungeon Key** to enter.
- **Mimics & Traps**: Beware of "Gold Piles" or items that come alive! Mimics hide in plain sight starting from Floor 3.
- **Hazards & Secrets**: Steer clear of dart/poison traps and lava fields. Find secret walls to uncover hidden caches of items (`S` key to search).
- **The Endless Abyss**: After floor 10, the dungeon transforms into an infinite, continuously scaling abyss where multiple mini-bosses and elite monsters roam together.

**Classes & Mechanics**
- **Three Unique Classes**: Play as the **Warrior** (Combat Surge perks), **Mage** (Spell Mastery scaling), or **Rogue** (Sneak attacks & backstabbing unseen foes).
- **Real-Time Combat Statuses**: Deal with Status Effects like Poison, Blindness, Paralysis, Confusion, and Fear. Look out for the fully responsive status HUD and colored HP bars under enemies.

**Vast Arsenal**
- **Extended Weaponry**: Utilize Halberds and Spears for two-tile reach attacks (`T`), or equip Shields in your dedicated OFFHAND slot.
- **Ranged Combat**: Equip Longbows or Heavy Crossbows (with required reload phases).
- **Advanced Magic**: Wield wands of Frost, Lightning, Teleportation, and Drain Life. Read ancient scrolls to unleash devastating Frost Novas and Fireballs.
- **Word of Recall**: Use the specialized scroll to return to Town instantly, or return to your deepest reached floor from Town.
- **Legendary Artifacts**: Extremely rare drops like Sting, Glamdring, Anduril, Ringil, and Aeglos yield massive bonuses. Artifact drop rates now scale with floor depth.

**Story & Progression**
- **5-Stage Main Arc**: Uncover the mystery of the Balrog through a chain of quests: Whispers in the Dark → The King's Fragment → The Sealed Vault → The Dragon Guardian → The Sleeper Awakens.
- **Side Quests**: Town NPCs offer dynamic side missions including bounty hunts, vault raids, and exploration goals.
- **Lore Altars**: Discover ancient altars (`&`) in the dungeon that reveal fragments of the world's history.
- **Skill Trees**: Each class has a unique skill tree with 3 active and 3 passive skills. Earn Skill Points from quests and leveling.

## 🕹️ Controls

| Interaction | Key |
|---|---|
| **Movement** | `Arrow Keys`, `Numpad`, or `W`,`A`,`S`,`D` |
| **Auto-Run** | `Shift` + `Direction` |
| **Attack** | Bump into enemies |
| **Reach Attack** | `T` (requires Spear/Halberd equipped) |
| **Ranged Attack** | `F` (requires Bow/Crossbow equipped) |
| **Inventory** | `I` |
| **Use Items** | `1`-`9` |
| **Search Walls**| `S` (searches adjacent tiles for secrets) |
| **Stairs** | `<` (Up) / `>` (Down) |
| **Recall** | Use Scroll (Town <-> Deepest Floor) |
| **Quest Journal** | `J` |
| **Skill Menu** | `K` |
| **Save/Load** | `F5` / `F9` |

## 🚀 Running the Game Locally

You don't need any complex build tools. Just serve the directory via any local web server to avoid CORS issues with Canvas UI components.

1. Clone the repository:
   ```bash
   git clone https://github.com/SamppaFIN/RogueReborn.git
   ```
2. Navigate to the game folder and run a local server:
   ```bash
   cd RogueReborn
   npx http-server -p 8234 -c-1
   ```
3. Open `http://localhost:8234` in your browser.

## 📖 Wiki & Documentation

Detailed information on the game's intricate mechanics can be found in the `wiki/` directory:
- [Bestiary](wiki/Bestiary.md) - Learn about the 25+ monster types, Elites, and Mini-bosses.
- [Arsenal & Items](wiki/Items.md) - Comprehensive list of Weapons, Armor, Artifacts, Wands, Potions, and Scrolls.
- [Classes & Perks](wiki/Classes.md) - Details on Warrior, Mage, and Rogue progression.
- [Town Mechanics](wiki/Town.md) - Guides on the Innkeeper, Blacksmith, Wizard, and more.

## 🛠️ Tech Stack
- **HTML5 Canvas:** Pure frame-requested canvas rendering.
- **Vanilla JavaScript (ES6):** No heavy frameworks, purely standard Javascript for high-performance tick-based logic.

## 📝 License
MIT License
