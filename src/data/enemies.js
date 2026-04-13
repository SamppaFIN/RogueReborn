/**
 * 🌸 Rogue Reborn — Enemy Type Database
 * All monster definitions with stats, elements, and special abilities.
 */

const ENEMY_TYPES = [
    // Base Monsters (Floors 1-3)
    { char: 'r', name: 'Rat', color: '#888', hp: 3, atk: 1, def: 0, speed: 12, element: 'none', baseXP: 5 },
    { char: 'g', name: 'Goblin', color: COLORS.GOBLIN, hp: 10, atk: 3, def: 1, speed: 10, element: 'none', baseXP: 10, personality: 'cowardly' },
    { char: 'k', name: 'Kobold', color: '#c0392b', hp: 12, atk: 4, def: 2, speed: 11, element: 'none', baseXP: 15, personality: 'cowardly' },
    { char: 'h', name: 'Fire Hound', color: COLORS.FIRE_HOUND, hp: 15, atk: 5, def: 2, speed: 14, element: 'fire', baseXP: 25, personality: 'pack' },
    { char: 's', name: 'Giant Spider', color: '#2ecc71', hp: 14, atk: 4, def: 1, speed: 13, element: 'poison', baseXP: 20 },
    { char: 'R', name: 'Giant Rat', color: '#a04000', hp: 18, atk: 4, def: 1, speed: 14, element: 'poison', baseXP: 18, personality: 'pack' },

    // Mid-tier Monsters (Floors 3-6)
    { char: 'o', name: 'Orc', color: '#27ae60', hp: 20, atk: 5, def: 2, speed: 8, element: 'none', baseXP: 30, personality: 'vengeful' },
    { char: 'e', name: 'Dark Elf', color: '#8e44ad', hp: 18, atk: 7, def: 3, speed: 12, element: 'magic', baseXP: 45, personality: 'stealthy' },
    { char: 'T', name: 'Cave Troll', color: COLORS.TROLL, hp: 35, atk: 9, def: 5, speed: 6, element: 'none', baseXP: 60, personality: 'vengeful' },
    { char: 'Z', name: 'Skeleton', color: '#ecf0f1', hp: 14, atk: 4, def: 2, speed: 8, element: 'none', baseXP: 35 },
    { char: 'n', name: 'Blink Dog', color: '#3498db', hp: 12, atk: 5, def: 2, speed: 15, element: 'none', blinker: true, baseXP: 45, personality: 'pack' },
    { char: 'X', name: 'Rust Monster', color: '#d35400', hp: 16, atk: 3, def: 0, speed: 10, element: 'rust', baseXP: 50 },
    { char: 'C', name: 'Gelatinous Cube', color: 'rgba(100,255,100,0.5)', hp: 45, atk: 7, def: 4, speed: 6, element: 'none', baseXP: 55, invisible: true, dissolver: true },

    // Phase VI — Round 1: Frost & Shadow creatures
    { char: 'w', name: 'Frost Wolf', color: '#85c1e9', hp: 22, atk: 6, def: 3, speed: 14, element: 'ice', baseXP: 35, personality: 'pack' },
    { char: 'G', name: 'Gargoyle', color: '#7f8c8d', hp: 40, atk: 8, def: 8, speed: 5, element: 'none', baseXP: 55 },
    { char: 'a', name: 'Shadow Assassin', color: '#2c3e50', hp: 16, atk: 10, def: 1, speed: 15, element: 'none', baseXP: 65, personality: 'stealthy', ambusher: true },

    // Phase VI — Round 2: Phase & Stone creatures
    { char: 'p', name: 'Phase Spider', color: '#af7ac5', hp: 20, atk: 6, def: 2, speed: 13, element: 'magic', blinker: true, baseXP: 50, personality: 'stealthy', ambusher: true },
    { char: 'J', name: 'Iron Golem', color: '#aab7b8', hp: 60, atk: 11, def: 10, speed: 4, element: 'none', baseXP: 90 },

    // Deep Monsters (Floors 6-10)
    { char: 'W', name: 'Wraith', color: '#95a5a6', hp: 25, atk: 8, def: 2, speed: 10, element: 'drain', baseXP: 80, personality: 'stealthy' },
    { char: 'V', name: 'Vampire', color: '#8e44ad', hp: 32, atk: 9, def: 4, speed: 11, element: 'drain', drainMaxHp: true, lifeSteal: true, baseXP: 110 },
    { char: 'N', name: 'Necromancer', color: '#9b59b6', hp: 20, atk: 7, def: 1, speed: 9, element: 'magic', summoner: true, baseXP: 70 },
    { char: 'I', name: 'Beholder', color: '#e74c3c', hp: 22, atk: 9, def: 2, speed: 8, element: 'magic', rangedDebuff: true, baseXP: 85 },
    { char: 'M', name: 'Mind Flayer', color: '#8e44ad', hp: 24, atk: 7, def: 3, speed: 10, element: 'magic', xpDrain: true, baseXP: 100 },
    { char: 'D', name: 'Dragon', color: '#e67e22', hp: 60, atk: 14, def: 8, speed: 9, element: 'fire', breather: true, baseXP: 180 },
    { char: 'd', name: 'Frost Dragon', color: '#3498db', hp: 65, atk: 13, def: 9, speed: 8, element: 'ice', breather: true, baseXP: 185 },

    // Phase VI — Round 3: Wyvern & Elementals
    { char: 'Y', name: 'Wyvern', color: '#16a085', hp: 45, atk: 11, def: 5, speed: 12, element: 'poison', baseXP: 120 },
    { char: 'F', name: 'Fire Elemental', color: '#e74c3c', hp: 35, atk: 10, def: 4, speed: 11, element: 'fire', baseXP: 95 },
    { char: 'E', name: 'Ice Elemental', color: '#3498db', hp: 35, atk: 9, def: 6, speed: 8, element: 'ice', baseXP: 95 },

    // Phase VI — Round 4: Undead elites
    { char: 'P', name: 'Phantom', color: '#d5d8dc', hp: 30, atk: 7, def: 0, speed: 12, element: 'drain', invisible: true, baseXP: 75, personality: 'stealthy' },
    { char: 'S', name: 'Skeletal Knight', color: '#f0f3f4', hp: 38, atk: 9, def: 6, speed: 7, element: 'none', baseXP: 70 },

    // Boss tier
    { char: 'B', name: 'Balrog', color: '#c0392b', hp: 150, atk: 18, def: 12, speed: 10, element: 'fire', baseXP: 500, bossPhases: true },

    // Phase VI — Round 5: Hydra & Demon Lord
    { char: 'H', name: 'Hydra', color: '#1abc9c', hp: 100, atk: 14, def: 6, speed: 7, element: 'poison', baseXP: 250, miniBoss: true, bossPhases: true },
    { char: 'U', name: 'Demon Lord', color: '#e74c3c', hp: 130, atk: 17, def: 11, speed: 9, element: 'fire', summoner: true, baseXP: 400, miniBoss: true, bossPhases: true },
    { char: 'A', name: 'Ancient Wyrm', color: '#f39c12', hp: 250, atk: 22, def: 15, speed: 9, element: 'fire', drainMaxHp: true, breather: true, miniBoss: true, baseXP: 800, bossPhases: true },
    { char: 'K', name: 'Dragon King', color: '#e74c3c', hp: 300, atk: 25, def: 18, speed: 10, element: 'fire', drainMaxHp: true, breather: true, miniBoss: true, baseXP: 1000, bossPhases: true },

    // #24 Floor Guardians (Static Mini-Bosses)
    { char: 'B', name: 'The Butcher', color: '#c0392b', hp: 80, atk: 12, def: 5, speed: 9, element: 'none', baseXP: 150, miniBoss: true, floorGuardian: 3, bossPhases: true },
    { char: 'S', name: 'Shadow Queen', color: '#8e44ad', hp: 120, atk: 15, def: 8, speed: 14, element: 'magic', baseXP: 250, miniBoss: true, floorGuardian: 7, invisible: true, bossPhases: true },

    // #25 Vault Sentries
    { char: 'V', name: 'Vault Guardian', color: '#f1c40f', hp: 100, atk: 15, def: 15, speed: 7, element: 'none', baseXP: 200, vaultSentry: true },
    { char: 'O', name: 'Vault Overseer', color: '#3498db', hp: 150, atk: 18, def: 12, speed: 8, element: 'magic', baseXP: 300, vaultSentry: true, summoner: true },
    { char: 'O', name: 'Champion Orc', color: '#27ae60', hp: 45, atk: 10, def: 6, speed: 9, element: 'none', baseXP: 80, elite: true, personality: 'vengeful' },
    { char: 'Q', name: 'Cave Champion', color: COLORS.TROLL, hp: 70, atk: 13, def: 8, speed: 7, element: 'none', baseXP: 110, elite: true, personality: 'vengeful' },

    // #43 Ambusher — lurks in shadows
    { char: 'l', name: 'Lurker', color: '#2c3e50', hp: 18, atk: 9, def: 2, speed: 12, element: 'none', baseXP: 55, ambusher: true, invisible: true },

    // #44 Support Units — healers and buffers
    { char: 'g', name: 'Goblin Shaman', color: '#9b59b6', hp: 12, atk: 2, def: 1, speed: 8, element: 'magic', baseXP: 25, support: 'healer' },
    { char: 'o', name: 'Orc Warpriest', color: '#f39c12', hp: 25, atk: 4, def: 3, speed: 7, element: 'magic', baseXP: 50, support: 'healer' },
    { char: 'c', name: 'Dark Channeler', color: '#8e44ad', hp: 20, atk: 3, def: 2, speed: 9, element: 'magic', baseXP: 55, support: 'buffer' }
];
