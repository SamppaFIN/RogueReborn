/**
 * 🌸 Rogue Reborn — Enemy Type Database
 * All monster definitions with stats, elements, and special abilities.
 */

const ENEMY_TYPES = [
    // Base Monsters
    { char: 'r', name: 'Rat', color: '#888', hp: 5, atk: 1, def: 0, speed: 12, element: 'none', baseXP: 5 },
    { char: 'g', name: 'Goblin', color: COLORS.GOBLIN, hp: 10, atk: 3, def: 1, speed: 10, element: 'none', baseXP: 10 },
    { char: 'k', name: 'Kobold', color: '#c0392b', hp: 12, atk: 4, def: 2, speed: 11, element: 'none', baseXP: 15 },
    { char: 'h', name: 'Fire Hound', color: COLORS.FIRE_HOUND, hp: 15, atk: 5, def: 2, speed: 14, element: 'fire', baseXP: 25 },
    { char: 'o', name: 'Orc', color: '#27ae60', hp: 20, atk: 6, def: 3, speed: 8, element: 'none', baseXP: 30 },
    { char: 'e', name: 'Dark Elf', color: '#8e44ad', hp: 18, atk: 7, def: 3, speed: 12, element: 'magic', baseXP: 45 },
    { char: 'T', name: 'Cave Troll', color: COLORS.TROLL, hp: 35, atk: 9, def: 5, speed: 6, element: 'none', baseXP: 60 },
    { char: 'W', name: 'Wraith', color: '#95a5a6', hp: 25, atk: 8, def: 2, speed: 10, element: 'drain', baseXP: 80 },
    { char: 'D', name: 'Dragon', color: '#e67e22', hp: 50, atk: 12, def: 7, speed: 8, element: 'fire', baseXP: 150 },
    { char: 'B', name: 'Balrog', color: '#c0392b', hp: 150, atk: 18, def: 12, speed: 10, element: 'fire', baseXP: 500 },
    { char: 's', name: 'Giant Spider', color: '#2ecc71', hp: 14, atk: 4, def: 1, speed: 13, element: 'poison', baseXP: 20 },
    // Phase III — Bestiary Awakens
    { char: 'C', name: 'Gelatinous Cube', color: 'rgba(100,255,100,0.5)', hp: 30, atk: 6, def: 3, speed: 5, element: 'none', baseXP: 40, invisible: true },
    { char: 'V', name: 'Vampire', color: '#8e44ad', hp: 28, atk: 8, def: 3, speed: 11, element: 'drain', drainMaxHp: true, baseXP: 90 },
    { char: 'N', name: 'Necromancer', color: '#9b59b6', hp: 20, atk: 7, def: 1, speed: 9, element: 'magic', summoner: true, baseXP: 70 },
    { char: 'Z', name: 'Skeleton', color: '#ecf0f1', hp: 18, atk: 5, def: 4, speed: 8, element: 'none', baseXP: 35 },
    { char: 'X', name: 'Rust Monster', color: '#d35400', hp: 16, atk: 3, def: 0, speed: 10, element: 'rust', baseXP: 50 },
    { char: 'n', name: 'Blink Dog', color: '#3498db', hp: 12, atk: 5, def: 2, speed: 15, element: 'none', blinker: true, baseXP: 45 },
    { char: 'I', name: 'Beholder', color: '#e74c3c', hp: 22, atk: 9, def: 2, speed: 8, element: 'magic', rangedDebuff: true, baseXP: 85 },
    { char: 'M', name: 'Mind Flayer', color: '#8e44ad', hp: 24, atk: 7, def: 3, speed: 9, element: 'magic', xpDrain: true, baseXP: 100 },
    { char: 'R', name: 'Giant Rat', color: '#a04000', hp: 18, atk: 4, def: 1, speed: 14, element: 'poison', baseXP: 18 },
    // Phase IX — Elite Encounters & Mini-Bosses
    { char: 'L', name: 'Arch-Lich', color: '#9b59b6', hp: 80, atk: 14, def: 8, speed: 9, element: 'magic', xpDrain: true, summoner: true, baseXP: 350, miniBoss: true },
    { char: 'K', name: 'Dragon King', color: '#e74c3c', hp: 120, atk: 16, def: 10, speed: 10, element: 'fire', drainMaxHp: true, rangedDebuff: true, baseXP: 450, miniBoss: true },
    { char: 'O', name: 'Champion Orc', color: '#27ae60', hp: 45, atk: 10, def: 6, speed: 9, element: 'none', baseXP: 80, elite: true },
    { char: 'Q', name: 'Cave Champion', color: COLORS.TROLL, hp: 70, atk: 13, def: 8, speed: 7, element: 'none', baseXP: 110, elite: true }
];
