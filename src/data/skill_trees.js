/**
 * 🌸 Rogue Reborn — Skill Tree Definitions
 * Phase V: Per-class skill trees with 3 active + 3 passive skills each.
 * Each skill costs 1 skill point. Player earns skill points from quests and leveling.
 */

const SKILL_TREES = {
    Warrior: {
        name: 'Path of the Warrior',
        color: '#e74c3c',
        skills: [
            // Active Skills
            { id: 'cleave', name: 'Cleave', type: 'active', description: 'AoE melee: Hit all adjacent enemies for 80% ATK.', key: 'Q', level: 1, cost: 0, unlocked: true,
              effect: { type: 'aoe_melee', range: 1, damageMult: 0.8 } },
            { id: 'war_cry', name: 'War Cry', type: 'active', description: 'Terrify nearby enemies, slowing them and reducing their ATK for 15 ticks.', key: 'Q2', level: 3, cost: 1,
              effect: { type: 'debuff_aoe', range: 3, slow: 3, atkReduce: 2, duration: 15 } },
            { id: 'shield_wall', name: 'Shield Wall', type: 'active', description: 'Raise your defenses: +6 DEF for 20 ticks but cannot move.', key: 'Q3', level: 5, cost: 2,
              effect: { type: 'self_buff', defBonus: 6, duration: 20, rooted: true } },

            // Passive Skills
            { id: 'toughness', name: 'Toughness', type: 'passive', description: '+15 Max HP permanently.', level: 2, cost: 1,
              effect: { type: 'stat_bonus', maxHp: 15 } },
            { id: 'iron_skin', name: 'Iron Skin', type: 'passive', description: '+2 DEF permanently.', level: 4, cost: 1,
              effect: { type: 'stat_bonus', def: 2 } },
            { id: 'berserker', name: 'Berserker Rage', type: 'passive', description: 'When below 25% HP, gain +5 ATK.', level: 6, cost: 2,
              effect: { type: 'conditional', condition: 'low_hp', threshold: 0.25, atkBonus: 5 } }
        ]
    },
    Mage: {
        name: 'Path of the Arcane',
        color: '#9b59b6',
        skills: [
            // Active Skills
            { id: 'fireball_skill', name: 'Fireball', type: 'active', description: 'Hurl a fireball: AoE 3×3 at target, ATK + Level×2 + 15 damage.', key: 'Q', level: 1, cost: 0, unlocked: true,
              effect: { type: 'projectile_aoe', range: 8, radius: 1 } },
            { id: 'frost_armor', name: 'Frost Armor', type: 'active', description: 'Encase yourself in ice: +4 DEF, enemies hitting you are slowed.', key: 'Q2', level: 3, cost: 1,
              effect: { type: 'self_buff', defBonus: 4, duration: 25, retaliation: 'slow' } },
            { id: 'arcane_blast', name: 'Arcane Blast', type: 'active', description: 'Channel pure energy: 3-tile piercing beam dealing massive damage.', key: 'Q3', level: 5, cost: 2,
              effect: { type: 'line_aoe', range: 3, damageMult: 2.0 } },

            // Passive Skills
            { id: 'mana_well', name: 'Mana Well', type: 'passive', description: '+20% spell damage from all sources.', level: 2, cost: 1,
              effect: { type: 'spell_boost', multiplier: 0.2 } },
            { id: 'quick_cast', name: 'Quick Cast', type: 'passive', description: 'Wand and Scroll cooldowns reduced by 30%.', level: 4, cost: 1,
              effect: { type: 'cooldown_reduction', amount: 0.3 } },
            { id: 'arcane_shield', name: 'Arcane Shield', type: 'passive', description: '15% chance to negate incoming damage.', level: 6, cost: 2,
              effect: { type: 'damage_negation', chance: 0.15 } }
        ]
    },
    Rogue: {
        name: 'Path of Shadows',
        color: '#2ecc71',
        skills: [
            // Active Skills
            { id: 'dash_skill', name: 'Shadow Dash', type: 'active', description: 'Dash 3 tiles in a direction, piercing enemies for 150% ATK.', key: 'Q', level: 1, cost: 0, unlocked: true,
              effect: { type: 'dash', range: 3, damageMult: 1.5 } },
            { id: 'poison_blade', name: 'Poison Blade', type: 'active', description: 'Coat your weapon in venom: next 5 attacks apply poison.', key: 'Q2', level: 3, cost: 1,
              effect: { type: 'self_buff', poisonAttacks: 5, poisonDamage: 3, duration: 30 } },
            { id: 'smoke_bomb', name: 'Smoke Bomb', type: 'active', description: 'Create a smoke cloud: enemies lose sight of you for 10 ticks.', key: 'Q3', level: 5, cost: 2,
              effect: { type: 'stealth', duration: 10, radius: 2 } },

            // Passive Skills
            { id: 'nimble', name: 'Nimble', type: 'passive', description: '+3 Speed permanently.', level: 2, cost: 1,
              effect: { type: 'stat_bonus', speed: 3 } },
            { id: 'treasure_sense', name: 'Treasure Sense', type: 'passive', description: 'Gold drops are doubled.', level: 4, cost: 1,
              effect: { type: 'gold_mult', multiplier: 2.0 } },
            { id: 'assassinate', name: 'Assassinate', type: 'passive', description: 'Backstab damage increased to 3× (from 2×).', level: 6, cost: 2,
              effect: { type: 'backstab_mult', multiplier: 3.0 } }
        ]
    }
};
