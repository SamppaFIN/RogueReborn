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

function placeVault(room, dungeonMap, entitiesList, itemsList) {
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
            } else {
                dungeonMap[tx][ty].type = 'floor';
                dungeonMap[tx][ty].char = CHARS.FLOOR;
                
                if (char === 'M') {
                    // Spawn a strong monster
                    spawnMonsterAt(tx, ty, true);
                } else if (char === 'm') {
                    // Spawn a standard monster
                    spawnMonsterAt(tx, ty, false);
                } else if (char === 'S') {
                    // #25 Vault Sentries
                    const sentryType = Math.random() < 0.3 ? 'Vault Overseer' : 'Vault Guardian';
                    const s = ENEMY_TYPES.find(t => t.name === sentryType);
                    if (s) {
                        const ne = new Entity(tx, ty, s.char, s.color, s.name, s.hp, s.atk, s.def, s.speed);
                        ne.element = s.element; ne.baseXP = s.baseXP; ne.vaultSentry = true;
                        entitiesList.push(ne);
                    }
                } else if (char === 'G') {
                    // Spawn gold
                    itemsList.push({ x: tx, y: ty, type: 'gold', char: CHARS.GOLD, color: COLORS.GOLD, amount: Math.floor(Math.random() * 50) + 20 });
                }
            }
        }
    }
    return true;
}
