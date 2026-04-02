# 🗡️ Classes & Progression

Rogue Reborn offers three distinct classes with unique perk trees that scale automatically as you gain levels.

## ⚔️ The Warrior
An indomitable force in melee combat.
- **Starting Gear**: Sword, Shield, Potions of Minor Healing.
- **Core Perk (Lvl 1)**: **Combat Surge**
  - Trigger: *Every 5 monster kills*
  - Effect: Triggers a massive adrenaline rush granting **+2 ATK** for 20 ticks (`⚡ SURGE` status in HUD).
- **Level 3 Perk**: **Toughened Armor**
  - Effect: Permanent **+1 DEF** increase.
- **Level 5 Perk**: **Weapon Mastery**
  - Effect: Permanent **+2 ATK** increase.

## 🔮 The Mage
A fragile but devastating force, wielding powerful offensive and utility magic.
- **Starting Gear**: Dagger, Mage Robes (grants base SpellBoost), Staff of Wizardry (15 charges), Scrolls.
- **Core Perk (Lvl 1)**: **Spell Mastery**
  - Trigger: *Passive*
  - Effect: All spell damage dealt via Wands and Scrolls scales up drastically. Spells gain `Floor × 2` extra damage.
- **Level 3 Perk**: **Arcane Vitality**
  - Effect: Permanent **+5 Max HP**, drastically aiding survivability.
- **Level 5 Perk**: **Archmage Focus**
  - Effect: Permanent **+3 SpellBoost** (Stacks with Mage Robes for massive magic damage).

## 🗡️ The Rogue
A swift, cunning combatant who strikes from the shadows.
- **Starting Gear**: Paired Daggers (double strike), Bow, Lockpicks (Dungeon Keys).
- **Core Perk (Lvl 1)**: **Backstab**
  - Trigger: *When attacking a monster from a direction it hasn't spotted you yet (from outside FOV / invisible)*
  - Effect: The first hit deals **2× Damage**. Stacks devastatingly well with Gelatinous Cubes or tight corners.
- **Level 3 Perk**: **Fleet Footed**
  - Effect: Permanent **+2 Speed** increase (allows outrunning most mid-game monsters).
- **Level 5 Perk**: **Shadow Assassin**
  - Effect: Permanent **+1 ATK** and **+1 DEF**.

---

## 📈 Leveling & XP
- Experience is gained by killing monsters. XP scales with floor depth: `baseXP × (1 + floor × 0.2)`.
- Every level grants **+5 Max HP**, **+1 ATK**, fully heals the player, and increases XP threshold by 1.8×.
- Non-levelup kills heal **+2 HP** as a combat reward.
- Higher-tier monsters (Mind Flayers, Dragons, Beholders) yield exponentially more XP.
- *Beware*: **Mind Flayers** can permanently drain your accumulated XP with each strike!

## ⚡ Passive HP Regeneration
- While not poisoned, the player regenerates **1 HP every 15 acted turns**.
- The **Potion of Regeneration** grants a temporary boost: **+1 HP per tick for 30 ticks**.
- The **Amulet of Regeneration** provides permanent passive healing.
