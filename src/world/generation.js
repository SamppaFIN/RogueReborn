/**
 * Rogue Reborn - World Generation (Town + Dungeon)
 * Extracted from engine.js for modularity.
 * Dependencies: constants.js, items.js, enemies.js, Entity class
 */
function initMap() {
    map = []; items = []; entities = [];
    if (player) entities.push(player);

    for (let x = 0; x < MAP_WIDTH; x++) {
        map[x] = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            // Give walls HP for tunneling
            map[x][y] = { type: 'wall', visible: false, explored: false, char: CHARS.WALL, hp: 30 };
        }
    }
}

function generateTown() {
    initMap();
    logMessage("You rise in the safety of the Town.", 'magic');
    const townRect = new Rect(10, 10, MAP_WIDTH - 20, MAP_HEIGHT - 20);

    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            if (x >= townRect.x && x < townRect.x + townRect.w && y >= townRect.y && y < townRect.y + townRect.h) {
                map[x][y].type = 'floor';
                map[x][y].char = CHARS.FLOOR;
                map[x][y].isTown = true;
                map[x][y].color = timeOfDay === 'Day' ? COLORS.TOWN_FLOOR : '#2c1e14';
            } else {
                map[x][y].isTown = true;
                map[x][y].color = timeOfDay === 'Day' ? COLORS.TOWN_WALL : '#4a321d';
            }
        }
    }

    const c = townRect.center();
    if (!player) {
        player = new Entity(c.x, c.y, CHARS.PLAYER, COLORS.PLAYER, 'Player', 30, 5, 2, 10);
        player.isPlayer = true;
        player.gold = 0;
        player.inventory = [];
        player.equipment = { weapon: null, armor: null, helm: null, ring: null, amulet: null, offhand: null }; // #13 added offhand
        player.hasESP = false;
        player.level = 1;
        player.xp = 0;
        player.nextXp = 50;
        player.ammo = 0;
        player.reloading = 0;
        entities.push(player);
    } else {
        player.x = c.x; player.y = c.y; // Spawn center
    }

    // Place stairs down
    map[c.x + 5][c.y].type = 'stairs_down';
    map[c.x + 5][c.y].char = CHARS.STAIRS_DOWN;

    // Place shop
    map[c.x - 5][c.y].type = 'shop';
    map[c.x - 5][c.y].char = 'S';
    map[c.x - 5][c.y].color = COLORS.GOLD;
    map[c.x - 5][c.y].isTown = true;

    // Place Healer (Innkeeper)
    map[c.x][c.y - 5].type = 'healer';
    map[c.x][c.y - 5].char = 'H';
    map[c.x][c.y - 5].color = '#e74c3c';
    map[c.x][c.y - 5].isTown = true;

    // Place Blacksmith
    map[c.x + 3][c.y + 4].type = 'blacksmith';
    map[c.x + 3][c.y + 4].char = 'B';
    map[c.x + 3][c.y + 4].color = '#7f8c8d';
    map[c.x + 3][c.y + 4].isTown = true;

    // Place Wizard's Tower
    map[c.x - 4][c.y - 4].type = 'wizard';
    map[c.x - 4][c.y - 4].char = 'W';
    map[c.x - 4][c.y - 4].color = '#9b59b6';
    map[c.x - 4][c.y - 4].isTown = true;

    // Place Bank
    map[c.x + 5][c.y - 3].type = 'bank';
    map[c.x + 5][c.y - 3].char = 'Â£';
    map[c.x + 5][c.y - 3].color = '#2ecc71';
    map[c.x + 5][c.y - 3].isTown = true;

    // Place Mayor
    map[c.x][c.y + 4].type = 'mayor';
    map[c.x][c.y + 4].char = '6';
    map[c.x][c.y + 4].color = '#f1c40f';
    map[c.x][c.y + 4].isTown = true;

    // Place Gambler (Night only)
    if (timeOfDay === 'Night') {
        map[c.x + 6][c.y - 6].type = 'gambler';
        map[c.x + 6][c.y - 6].char = '7';
        map[c.x + 6][c.y - 6].color = '#95a5a6';
        map[c.x + 6][c.y - 6].isTown = true;
    }

    // Phase II - New NPCs

    // Place Alchemist (Top Right)
    map[c.x + 6][c.y - 4].type = 'alchemist';
    map[c.x + 6][c.y - 4].char = 'A';
    map[c.x + 6][c.y - 4].color = '#2ecc71';
    map[c.x + 6][c.y - 4].isTown = true;

    // Place Class Trainer (Top Left)
    map[c.x - 6][c.y - 3].type = 'trainer';
    map[c.x - 6][c.y - 3].char = 'T';
    map[c.x - 6][c.y - 3].color = '#f39c12';
    map[c.x - 6][c.y - 3].isTown = true;

    // Place Cartographer (Near Stairs)
    map[c.x + 3][c.y + 1].type = 'cartographer';
    map[c.x + 3][c.y + 1].char = 'C';
    map[c.x + 3][c.y + 1].color = '#3498db';
    map[c.x + 3][c.y + 1].isTown = true;

    // Place Guildhall (Bottom Left)
    map[c.x - 5][c.y + 3].type = 'guildhall';
    map[c.x - 5][c.y + 3].char = '{';
    map[c.x - 5][c.y + 3].color = '#bdc3c7';
    map[c.x - 5][c.y + 3].isTown = true;

    // Place Stash (Next to Bank)
    map[c.x + 6][c.y - 3].type = 'stash';
    map[c.x + 6][c.y - 3].char = '[';
    map[c.x + 6][c.y - 3].color = '#e67e22';
    map[c.x + 6][c.y - 3].isTown = true;

    // Place Town Well
    map[c.x - 3][c.y + 5].type = 'well';
    map[c.x - 3][c.y + 5].char = 'O';
    map[c.x - 3][c.y + 5].color = '#3498db';
    map[c.x - 3][c.y + 5].isTown = true;

    // Place Beggars/Villagers (Dynamic entities)
    for (let i = 0; i < 4; i++) {
        let vx, vy;
        do {
            vx = c.x + Math.floor(Math.random() * 14) - 7;
            vy = c.y + Math.floor(Math.random() * 14) - 7;
        } while (map[vx][vy].type !== 'floor' || getEntityAt(vx, vy));
        let type = Math.random() < 0.3 ? 'beggar' : 'villager';
        let npc = new Entity(vx, vy, type === 'beggar' ? 'p' : 'v', type === 'beggar' ? '#888' : '#ecf0f1', type === 'beggar' ? 'Beggar' : 'Villager', 10, 0, 0, 5);
        npc.isTownNPC = true;
        npc.npcType = type;
        entities.push(npc);
    }

    // Local flavor log
    logMessage("Town Services: Shop(S), Healer(H), Blacksmith(B), Wizard(W), Bank(Â£)", "hint");

    // Pre-explore town
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            if (map[x][y].type !== 'wall') map[x][y].explored = true;
        }
    }
}

function generateDungeon() {
    let connected = false;
    let tries = 0;
    while (!connected && tries < 100) {
        tries++;
        initMap();
        if (currentFloor >= 3 && Math.random() < 0.35) {
            generateCave(); // Cave has its own connectivity check
            return;
        }

        const rooms = [];
        const MAX_ROOMS = 20;

        for (let i = 0; i < MAX_ROOMS; i++) {
            let w = Math.floor(Math.random() * 8) + 4;
            let h = Math.floor(Math.random() * 8) + 4;
            let x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
            let y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;
            let newRoom = new Rect(x, y, w, h);

            let failed = false;
            for (let r of rooms) {
                if (newRoom.x <= r.x + r.w && newRoom.x + newRoom.w >= r.x &&
                    newRoom.y <= r.y + r.h && newRoom.y + newRoom.h >= r.y) {
                    failed = true; break;
                }
            }

            if (!failed) {
                createRoom(newRoom);
                const c = newRoom.center();

                if (rooms.length === 0) {
                    player.x = c.x; player.y = c.y;
                    map[c.x - 1][c.y].type = 'stairs_up';
                    map[c.x - 1][c.y].char = CHARS.STAIRS_UP;
                } else {
                    const prev = rooms[rooms.length - 1].center();
                    if (Math.random() > 0.5) {
                        createHTunnel(prev.x, c.x, prev.y); createVTunnel(prev.y, c.y, c.x);
                    } else {
                        createVTunnel(prev.y, c.y, prev.x); createHTunnel(prev.x, c.x, c.y);
                    }

                    // Spawn monsters & items
                    if (Math.random() < 0.6) spawnMonsters(newRoom);
                    if (Math.random() < 0.4) spawnRandomItem(newRoom);
                }
                rooms.push(newRoom);
            }
        }

        if (rooms.length > 0) {
            const last = rooms[rooms.length - 1].center();
            map[last.x][last.y].type = 'stairs_down';
            map[last.x][last.y].char = CHARS.STAIRS_DOWN;
        }

        // Phase IV â€” Dungeon Hazards
        generateHazards(rooms);

        // Connectivity Check
        const sx = player.x, sy = player.y;
        let tx = -1, ty = -1;
        for(let x=0; x<MAP_WIDTH; x++) {
            for(let y=0; y<MAP_HEIGHT; y++) {
                if (map[x][y].type === 'stairs_down') { tx=x; ty=y; break; }
            }
            if (tx !== -1) break;
        }
        
        if (tx !== -1) {
            const path = findPath(sx, sy, tx, ty);
            if (path && path.length > 0) {
                connected = true;
            } else {
                console.log("(DEBUG) Disconnected dungeon detected, regenerating...");
            }
        } else {
            connected = true; // No stairs_down (shouldn't happen)
        }
    }
}

function generateHazards(rooms) {
    for (const room of rooms) {
        // 20% chance of a hazard per room
        if (Math.random() > 0.2) continue;
        let hx = Math.floor(Math.random() * (room.w - 2)) + room.x + 1;
        let hy = Math.floor(Math.random() * (room.h - 2)) + room.y + 1;
        const center = room.center();
        if (hx === center.x && hy === center.y) continue;
        if (!map[hx] || map[hx][hy].type !== 'floor' || getEntityAt(hx, hy)) continue;
        const roll = Math.random();
        if (roll < 0.15 && currentFloor >= 2) {
            // #32 Locked Door â€” place door, drop key nearby
            map[hx][hy].type = 'locked_door';
            map[hx][hy].char = '+';
            map[hx][hy].color = '#d4ac0d';
            // Scatter a key somewhere in the dungeon
            let kx, ky, tries = 0;
            do { kx = Math.floor(Math.random() * MAP_WIDTH); ky = Math.floor(Math.random() * MAP_HEIGHT); tries++; }
            while (tries < 60 && map[kx][ky].type !== 'floor');
            if (tries < 60) items.push({ x: kx, y: ky, ...ITEM_DB.find(i => i.name === 'Dungeon Key') });
        } else if (roll < 0.3) {
            // #33 Secret Wall hint â€” this wall can be "searched" to reveal a cache
            const adjWalls = [[hx+1,hy],[hx-1,hy],[hx,hy+1],[hx,hy-1]]
                .filter(([wx,wy]) => wx>=0 && wx<MAP_WIDTH && wy>=0 && wy<MAP_HEIGHT && map[wx][wy].type === 'wall');
            if (adjWalls.length > 0) {
                const [wx, wy] = adjWalls[0];
                map[wx][wy].type = 'secret_wall';
                map[wx][wy].char = '#';
                map[wx][wy].secretCache = true; // has loot behind it
            }
        } else if (roll < 0.55) {
            // #31 Trap tile
            const trapTypes = ['dart', 'poison', 'teleport'];
            map[hx][hy].type = 'trap';
            map[hx][hy].trapKind = trapTypes[Math.floor(Math.random() * trapTypes.length)];
            map[hx][hy].char = '^';
            map[hx][hy].color = '#e74c3c';
            map[hx][hy].hidden = true;
        } else if (roll < 0.75 && currentFloor >= 5) {
            // #38 Lava tile
            map[hx][hy].type = 'lava';
            map[hx][hy].char = '~';
            map[hx][hy].color = '#e67e22';
        } else {
            // #34 Shrine
            map[hx][hy].type = 'shrine';
            map[hx][hy].char = 'A';
            map[hx][hy].color = '#f1c40f';
        }
    }

    // #40 Goblin dungeon merchant â€” floor 5+, 30% chance
    if (currentFloor >= 5 && rooms.length > 3 && Math.random() < 0.3) {
        const mRoom = rooms[Math.floor(Math.random() * rooms.length)];
        const mc = mRoom.center();
        if (map[mc.x][mc.y].type === 'floor' && !getEntityAt(mc.x, mc.y)) {
            const merch = new Entity(mc.x, mc.y, 'g', '#f1c40f', 'Goblin Merchant', 1, 0, 0, 0);
            merch.isMerchant = true; merch.isPlayer = false;
            merch.blocksMovement = false;
            merch.energy = 0;
            entities.push(merch);
            logMessage('A Goblin Merchant lurks in the dungeon! (bump to trade)', 'magic');
        }
    }
}

function generateCave() {
    let connected = false;
    let tries = 0;
    while (!connected && tries < 100) {
        tries++;
        initMap();
        let floorCount = 0;
        const targetFloors = Math.floor(MAP_WIDTH * MAP_HEIGHT * 0.45);
        let cx = Math.floor(MAP_WIDTH / 2);
        let cy = Math.floor(MAP_HEIGHT / 2);

        while (floorCount < targetFloors) {
            if (map[cx][cy].type === 'wall') {
                map[cx][cy].type = 'floor';
                map[cx][cy].char = CHARS.FLOOR;
                floorCount++;
            }
            let dir = Math.floor(Math.random() * 4);
            if (dir === 0) cx++; else if (dir === 1) cx--; else if (dir === 2) cy++; else cy--;

            if (cx <= 1 || cx >= MAP_WIDTH - 2 || cy <= 1 || cy >= MAP_HEIGHT - 2) {
                cx = Math.floor(MAP_WIDTH / 2);
                cy = Math.floor(MAP_HEIGHT / 2);
            }
        }

        // Place Stairs Up & Down
        let sx, sy, ex, ey;
        do { sx = Math.floor(Math.random() * MAP_WIDTH); sy = Math.floor(Math.random() * MAP_HEIGHT); } while (map[sx][sy].type !== 'floor');
        map[sx][sy].type = 'stairs_up'; map[sx][sy].char = CHARS.STAIRS_UP;
        player.x = sx; player.y = sy;

        do { ex = Math.floor(Math.random() * MAP_WIDTH); ey = Math.floor(Math.random() * MAP_HEIGHT); } while (map[ex][ey].type !== 'floor' || (Math.abs(sx - ex) + Math.abs(sy - ey) < 20));
        map[ex][ey].type = 'stairs_down'; map[ex][ey].char = CHARS.STAIRS_DOWN;

        for (let i = 0; i < 15 + currentFloor; i++) {
            let mx, my; do { mx = Math.floor(Math.random() * MAP_WIDTH); my = Math.floor(Math.random() * MAP_HEIGHT); } while (map[mx][my].type !== 'floor' || getEntityAt(mx, my) || (mx === sx && my === sy));
            spawnMonsterAt(mx, my);
        }

        // Connectivity Check
        const path = findPath(sx, sy, ex, ey);
        if (path && path.length > 0) {
            connected = true;
        } else {
            console.log("(DEBUG) Disconnected cave detected, regenerating...");
        }
    }
}

function createRoom(rect) {
    for (let x = rect.x + 1; x < rect.x + rect.w; x++) {
        for (let y = rect.y + 1; y < rect.y + rect.h; y++) {
            map[x][y].type = 'floor'; map[x][y].char = CHARS.FLOOR;
        }
    }
}
function createHTunnel(x1, x2, y) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { map[x][y].type = 'floor'; map[x][y].char = CHARS.FLOOR; }
}
function createVTunnel(y1, y2, x) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { map[x][y].type = 'floor'; map[x][y].char = CHARS.FLOOR; }
}
