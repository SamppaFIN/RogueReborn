/**
 * 🌸 Rogue Reborn — Vault Templates
 * Preset rooms with specific layouts, monsters, and rewards.
 */

const VAULT_TEMPLATES = [
    {
        name: "The Guardroom",
        w: 6, h: 6,
        layout: [
            "######",
            "#SGG S#",
            "#M..M#",
            "#....#",
            "#M..M#",
            "######"
        ],
        minFloor: 2
    },
    {
        name: "The Pit",
        w: 8, h: 8,
        layout: [
            "########",
            "#MMMMMM#",
            "#MGGGGm#",
            "#MG..Gm#",
            "#MG S Gm#",
            "#MGGGGm#",
            "#mmmmmm#",
            "########"
        ],
        minFloor: 5
    },
    {
        name: "Orc Barracks",
        w: 10, h: 10,
        layout: [
            "##########",
            "#M..M..M.#",
            "#........#",
            "#..M..M..#",
            "#.GS S SG.#",
            "#.G....G.#",
            "#..M..M..#",
            "#........#",
            "#M..M..M.#",
            "##########"
        ],
        minFloor: 3
    }
];

    {
        name: "The Library",
        w: 8, h: 8,
        minFloor: 2,
        layout: [
            "########",
            "#B....B#",
            "#......#",
            "#..BB..#",
            "#..BB..#",
            "#......#",
            "#B..M.B#",
            "########"
        ]
    },
    {
        name: "Treasure Vault",
        w: 6, h: 6,
        minFloor: 3,
        layout: [
            "######",
            "#M..M#",
            "#.GG.#",
            "#.GG.#",
            "#M..M#",
            "######"
        ]
    },
    {
        name: "Lava Arena",
        w: 8, h: 8,
        minFloor: 5,
        layout: [
            "########",
            "#~....~#",
            "#.M..M.#",
            "#..GG..#",
            "#..GG..#",
            "#.M..M.#",
            "#~....~#",
            "########"
        ]
    },
    {
        name: "Frost Chamber",
        w: 7, h: 7,
        minFloor: 4,
        layout: [
            "#######",
            "#*.*.*#",
            "#.M.M.#",
            "#*.G.*#",
            "#.M.M.#",
            "#*.*.*#",
            "#######"
        ]
    },
    {
        name: "Trap Corridor",
        w: 10, h: 5,
        minFloor: 2,
        layout: [
            "##########",
            "#.^.^.M^.#",
            "#........#",
            "#.M.^.^.#",
            "##########"
        ]
    },
    {
        name: "Alchemist's Lab",
        w: 7, h: 7,
        minFloor: 3,
        layout: [
            "#######",
            "#.....#",
            "#.BBB.#",
            "#.BGB.#",
            "#.BBB.#",
            "#..M..#",
            "#######"
        ]
    },
    {
        name: "Prison Block",
        w: 8, h: 8,
        minFloor: 3,
        layout: [
            "########",
            "#.##.##M#",
            "#.#..#M#",
            "#.##.##M#",
            "#......#",
            "#M##.##M#",
            "#M..#..#M",
            "########"
        ]
    },
    {
        name: "Mushroom Grotto",
        w: 7, h: 7,
        minFloor: 1,
        layout: [
            "#######",
            "#.....#",
            "#.F.F.#",
            "#..G..#",
            "#.F.F.#",
            "#..M..#",
            "#######"
        ]
    },
    {
        name: "Crypt of the Ancients",
        w: 9, h: 9,
        minFloor: 6,
        layout: [
            "#########",
            "#MM...MM#",
            "#..###..#",
            "#..#M#..#",
            "#..###..#",
            "#..#M#..#",
            "#..###..#",
            "#MM...MM#",
            "#########"
        ]
    },
    {
        name: "Bridge Over Chaos",
        w: 10, h: 6,
        minFloor: 5,
        layout: [
            "~########~",
            "~........~",
            "#........#",
            "#....M...#",
            "#........#",
            "#........#"
        ]
    },function placeVault(room, dungeonMap, entitiesList, itemsList) {
    const template = VAULT_TEMPLATES[Math.floor(Math.random() * VAULT_TEMPLATES.length)];
    if (template.minFloor > (currentFloor || 1)) return false;
    if (room.w < template.w || room.h < template.h) return false;

    room.isVault = true;
    room.vaultName = template.name;

    for (let y = 0; y < template.h; y++) {
        for (let x = 0; x < template.w; x++) {
            const char = template.layout[y][x];
            const tx = room.x + x;
            const ty = room.y + y;

            if (char === '#') {
                dungeonMap[tx][ty].type = 'wall';
                dungeonMap[tx][ty].char = CHARS.WALL;
                dungeonMap[tx][ty].color = '#7f8c8d';
            } else if (char === '~') {
                dungeonMap[tx][ty].type = 'lava';
                dungeonMap[tx][ty].char = CHARS.LAVA;
                dungeonMap[tx][ty].color = COLORS.LAVA;
            } else if (char === '*') {
                dungeonMap[tx][ty].type = 'ice';
                dungeonMap[tx][ty].char = CHARS.ICE;
                dungeonMap[tx][ty].color = COLORS.ICE;
            } else if (char === '^') {
                dungeonMap[tx][ty].type = 'trap';
                dungeonMap[tx][ty].char = '^';
                dungeonMap[tx][ty].color = '#e74c3c';
                dungeonMap[tx][ty].visible = false;
            } else {
                dungeonMap[tx][ty].type = 'floor';
                dungeonMap[tx][ty].char = CHARS.FLOOR;
                
                if (char === 'M') {
                    spawnMonsterAt(tx, ty, true);
                } else if (char === 'm') {
                    spawnMonsterAt(tx, ty, false);
                } else if (char === 'S') {
                    const sentryType = Math.random() < 0.3 ? 'Vault Overseer' : 'Vault Guardian';
                    const s = ENEMY_TYPES.find(t => t.name === sentryType);
                    if (s) {
                        const ne = new Entity(tx, ty, s.char, s.color, s.name, s.hp, s.atk, s.def, s.speed);
                        ne.element = s.element; ne.baseXP = s.baseXP; ne.vaultSentry = true;
                        entitiesList.push(ne);
                    }
                } else if (char === 'G') {
                    itemsList.push({ x: tx, y: ty, type: 'gold', char: CHARS.GOLD, color: COLORS.GOLD, amount: Math.floor(Math.random() * 50) + 20 });
                } else if (char === 'B') {
                    // Bookshelf or potion - random potion/scroll
                    const bookItems = ['potion', 'scroll', 'wand'];
                    const type = bookItems[Math.floor(Math.random() * bookItems.length)];
                    const pool = ITEM_DB.filter(i => i.type === type && (i.minFloor || 0) <= (currentFloor || 1) && !i.artifact);
                    if (pool.length > 0) {
                        const template = pool[Math.floor(Math.random() * pool.length)];
                        spawnItem(tx, ty, template);
                    }
                } else if (char === 'F') {
                    // Food / Mushroom
                    const foodPool = ITEM_DB.filter(i => i.type === 'food' && (i.minFloor || 0) <= (currentFloor || 1));
                    if (foodPool.length > 0) {
                        const template = foodPool[Math.floor(Math.random() * foodPool.length)];
                        spawnItem(tx, ty, template);
                    }
                }
            }
        }
    }
    return true;
}
