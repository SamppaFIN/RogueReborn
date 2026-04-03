# 🏘️ Town Mechanics

Floor 0 is your safe haven, the Town. In Rogue Reborn, the town is built in the **TomeNET style**, featuring distinct, solid buildings for each shop.

## 🏘️ Town Structure
Unlike the open-air stalls of most roguelikes, each shop in this town is a solid structure built of brick (`#`).
- **Doors**: Shops are accessed through specific door tiles marked with numbers (e.g., `1`, `4`, `6`).
- **Identification**: Building characters (the doors) help you navigate quickly: `1` is the Shop, `3` is the Forge, `6` is the Wizard, etc.

## 🏪 Core Services

### The Shop (`$`)
General-purpose item shop. Stock rotates based on floor progression. Sells weapons, armor, potions, scrolls, and wands. Prices are fixed from `ITEM_DB.cost`.

### The Innkeeper (`H`) — *The Prancing Pony*
Full heal and rest for **20g**. Removes all status effects and restores HP to maximum.

### The Blacksmith (`B`) — *The Forge*
Upgrade your equipped weapon or armor for increasing gold costs:
- **Weapon upgrade**: Permanent +1 ATK (cost scales per upgrade level)
- **Armor upgrade**: Permanent +1 DEF (cost scales per upgrade level)
- ⚠️ **Closed at Night** — "The forge is quiet tonight."

### The Wizard's Tower (`W`)
Premium enchanting and scrolls:
- Identify all items
- Specialty scroll shop
- ESP/Telepathy services

### The Bank (`£`) — *The Vault*
Deposit gold safely — it persists across deaths! 
- **Deposit 50g / Deposit All**
- **Withdraw 50g / Withdraw All**
- ⚠️ **Closed at Night** — "The bank is closed until morning."

---

## 🧪 Expansion Services

### The Alchemist (`A`)
Potions and transmutation:
- **Brew Shop**: Sells an assortment of potions (Minor Healing, Curing, Regeneration, etc.)
- **Transmute**: Combine **2 Minor Healing Potions** → **1 Greater Healing Potion** for 50g

### The Class Trainer (`T`)
Permanent stat increases for gold:
| Training | Effect | Cost |
|----------|--------|------|
| Vitality Training | +10 Max HP | 500g |
| Strength Training | +1 ATK | 1000g |
| Defense Training | +1 DEF | 1000g |

### The Cartographer (`C`)
Dungeon intelligence for **100g** — reveals information about upcoming floor hazards, elite monsters, and boss encounters.

---

## 🏛️ Meta-Progression

### The Guildhall (`{`)
Records the **Top 10 run scores** across all lifetimes. Scores are calculated from floor reached, level, and gold collected. Data persists in `localStorage`.

### The Persistent Stash (`[`)
Store up to **5 items** safely across deaths:
- Items in the stash survive reincarnation
- Useful for banking powerful gear for future runs
- Data persists via `localStorage`

---

## 🎭 Dynamic NPCs

### Villagers
Wander the town randomly. Share rumors and gossip when bumped:
- *"Have you checked the well today?"*
- *"The Mayor is looking for someone brave."*
- *"Don't drink glowing potions."*

NPC Barks also trigger passively (0.5% per tick) when within 8 tiles of the player.

### Beggars (`p`)
Interact by bumping. Costs **5g**:
- **10% chance**: The beggar identifies a random unidentified item in your backpack for free!
- **90% chance**: Generic grateful response + dungeon lore tip

---

## 🎲 Dynamic Events

### The Town Well (`O`)
Drink once per visit (resets on town regeneration):
- **40% chance**: Heal +5 HP
- **40% chance**: +50 Energy
- **20% chance**: Poisoned! (+10 poison timer)

### The Gambler's Den (`G`)
Pay **50g** for a mystery box — a completely random item from the entire ITEM_DB.

### The Mayor's Bounty (`M`)
The Mayor posts a bounty for a specific monster type (Rat, Goblin, Kobold, Fire Hound, or Orc). Kill the target and return for **150g** reward.

---

## 🌙 Day/Night Cycle
The town cycles between **Day** and **Night** every **500 turns**:
- **At Night**: Shop signs glow yellow (#f1c40f). Blacksmith and Bank are closed.
- **At Day**: All services available. Normal lighting.
- The cycle announcement: *"The sun rises/sets. It is now Day/Night."*
- Town regenerates (new NPC positions, well refills) on each cycle change.

## 🚪 Access
Return to Town from the dungeon via:
- **Scroll of Word of Recall** (1-second delay teleport)
- **Stairs Up** from Floor 1
- Word of Recall resets your depth to Floor 0
