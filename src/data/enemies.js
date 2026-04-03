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
    { char: 'C', name: 'Gelatinous Cube', color: 'rgba(100,255,100,0.5)', hp: 30, atk: 6, def: 3, speed: 5, element: 'none', baseXP: 40, invisible: true },

    // Phase VI — Round 1: Frost & Shadow creatures
    { char: 'w', name: 'Frost Wolf', color: '#85c1e9', hp: 22, atk: 6, def: 3, speed: 14, element: 'ice', baseXP: 35, personality: 'pack' },
    { char: 'G', name: 'Gargoyle', color: '#7f8c8d', hp: 40, atk: 8, def: 8, speed: 5, element: 'none', baseXP: 55 },
    { char: 'a', name: 'Shadow Assassin', color: '#2c3e50', hp: 16, atk: 10, def: 1, speed: 15, element: 'none', baseXP: 65, personality: 'stealthy' },

    // Phase VI — Round 2: Phase & Stone creatures
    { char: 'p', name: 'Phase Spider', color: '#af7ac5', hp: 20, atk: 6, def: 2, speed: 13, element: 'magic', blinker: true, baseXP: 50, personality: 'stealthy' },
    { char: 'J', name: 'Iron Golem', color: '#aab7b8', hp: 60, atk: 11, def: 10, speed: 4, element: 'none', baseXP: 90 },

    // Deep Monsters (Floors 6-10)
    { char: 'W', name: 'Wraith', color: '#95a5a6', hp: 25, atk: 8, def: 2, speed: 10, element: 'drain', baseXP: 80, personality: 'stealthy' },
    { char: 'V', name: 'Vampire', color: '#8e44ad', hp: 28, atk: 8, def: 3, speed: 11, element: 'drain', drainMaxHp: true, baseXP: 90 },
    { char: 'N', name: 'Necromancer', color: '#9b59b6', hp: 20, atk: 7, def: 1, speed: 9, element: 'magic', summoner: true, baseXP: 70 },
    { char: 'I', name: 'Beholder', color: '#e74c3c', hp: 22, atk: 9, def: 2, speed: 8, element: 'magic', rangedDebuff: true, baseXP: 85 },
    { char: 'M', name: 'Mind Flayer', color: '#8e44ad', hp: 24, atk: 7, def: 3, speed: 9, element: 'magic', xpDrain: true, baseXP: 100 },
    { char: 'D', name: 'Dragon', color: '#e67e22', hp: 50, atk: 12, def: 7, speed: 8, element: 'fire', baseXP: 150 },

    // Phase VI — Round 3: Wyvern & Elementals
    { char: 'Y', name: 'Wyvern', color: '#16a085', hp: 45, atk: 11, def: 5, speed: 12, element: 'poison', baseXP: 120 },
    { char: 'F', name: 'Fire Elemental', color: '#e74c3c', hp: 35, atk: 10, def: 4, speed: 11, element: 'fire', baseXP: 95 },
    { char: 'E', name: 'Ice Elemental', color: '#3498db', hp: 35, atk: 9, def: 6, speed: 8, element: 'ice', baseXP: 95 },

    // Phase VI — Round 4: Undead elites
    { char: 'P', name: 'Phantom', color: '#d5d8dc', hp: 30, atk: 7, def: 0, speed: 12, element: 'drain', invisible: true, baseXP: 75, personality: 'stealthy' },
    { char: 'S', name: 'Skeletal Knight', color: '#f0f3f4', hp: 38, atk: 9, def: 6, speed: 7, element: 'none', baseXP: 70 },

    // Boss tier
    { char: 'B', name: 'Balrog', color: '#c0392b', hp: 150, atk: 18, def: 12, speed: 10, element: 'fire', baseXP: 500 },

    // Phase VI — Round 5: Hydra & Demon Lord
    { char: 'H', name: 'Hydra', color: '#1abc9c', hp: 100, atk: 14, def: 6, speed: 7, element: 'poison', baseXP: 250, miniBoss: true },
    { char: 'U', name: 'Demon Lord', color: '#e74c3c', hp: 130, atk: 17, def: 11, speed: 9, element: 'fire', summoner: true, baseXP: 400, miniBoss: true },
    { char: 'A', name: 'Ancient Wyrm', color: '#f39c12', hp: 200, atk: 20, def: 14, speed: 8, element: 'fire', drainMaxHp: true, baseXP: 600, miniBoss: true },

    // Abyss Elite Encounters
    { char: 'L', name: 'Arch-Lich', color: '#9b59b6', hp: 80, atk: 14, def: 8, speed: 9, element: 'magic', xpDrain: true, summoner: true, baseXP: 350, miniBoss: true },
    { char: 'K', name: 'Dragon King', color: '#e74c3c', hp: 120, atk: 16, def: 10, speed: 10, element: 'fire', drainMaxHp: true, rangedDebuff: true, baseXP: 450, miniBoss: true },
    { char: 'O', name: 'Champion Orc', color: '#27ae60', hp: 45, atk: 10, def: 6, speed: 9, element: 'none', baseXP: 80, elite: true, personality: 'vengeful' },
    { char: 'Q', name: 'Cave Champion', color: COLORS.TROLL, hp: 70, atk: 13, def: 8, speed: 7, element: 'none', baseXP: 110, elite: true, personality: 'vengeful' }
];
