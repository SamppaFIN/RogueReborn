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
    const townRect = new Rect(4, 4, MAP_WIDTH - 8, MAP_HEIGHT - 8);

    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            if (x >= townRect.x && x < townRect.x + townRect.w && y >= townRect.y && y < townRect.y + townRect.h) {
                map[x][y].type = 'floor';
                map[x][y].char = CHARS.FLOOR; // e.g. '.'
                map[x][y].isTown = true;
                map[x][y].color = timeOfDay === 'Day' ? COLORS.TOWN_FLOOR : '#2c1e14';
            } else {
                map[x][y].type = 'wall';
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
    map[c.x][c.y + 2].type = 'stairs_down';
    map[c.x][c.y + 2].char = CHARS.STAIRS_DOWN;

    // Helper function for houses
    const buildHouse = (hx, hy, w, h, type, char, color) => {
        for (let x = hx; x < hx + w; x++) {
            for (let y = hy; y < hy + h; y++) {
                if (map[x] && map[x][y]) {
                    map[x][y].type = 'wall';
                    // Solid block for house. TomeNET uses walls like '#'
                    map[x][y].char = '#'; 
                    map[x][y].color = timeOfDay === 'Day' ? '#8B4513' : '#4a250a'; 
                    map[x][y].isTown = true;
                    map[x][y].hp = 999; // Indestructible town walls
                }
            }
        }
        let dx = hx + Math.floor(w / 2);
        let dy = hy + h - 1; // bottom edge
        if (map[dx] && map[dx][dy]) {
            map[dx][dy].type = type;
            map[dx][dy].char = char;
            map[dx][dy].color = color;
            map[dx][dy].isTown = true;
        }
    };

    // Place houses!
    // Top Row
    buildHouse(c.x - 17, c.y - 12, 6, 5, 'shop', '1', COLORS.GOLD);
    buildHouse(c.x - 8,  c.y - 12, 6, 5, 'healer', '4', '#e74c3c');
    buildHouse(c.x + 2,  c.y - 12, 6, 5, 'wizard', '6', '#9b59b6');
    buildHouse(c.x + 11, c.y - 12, 6, 5, 'blacksmith', '3', '#7f8c8d');

    // Middle Row
    buildHouse(c.x - 22, c.y - 3, 5, 5, 'alchemist', '5', '#2ecc71');
    buildHouse(c.x + 17, c.y - 3, 5, 5, 'bank', '8', '#2ecc71');

    // Bottom Row
    buildHouse(c.x - 17, c.y + 6, 6, 5, 'trainer', 'T', '#f39c12');
    buildHouse(c.x - 8,  c.y + 6, 6, 5, 'guildhall', '{', '#bdc3c7');
    buildHouse(c.x + 2,  c.y + 6, 6, 5, 'mayor', 'M', '#f1c40f');
    buildHouse(c.x + 11, c.y + 6, 6, 5, 'stash', '[', '#e67e22');

    // Extremes
    buildHouse(c.x - 26, c.y + 6, 5, 5, 'cartographer', 'C', '#3498db');
    if (timeOfDay === 'Night') {
        buildHouse(c.x + 21, c.y + 6, 5, 5, 'gambler', '7', '#95a5a6');
    }

    // Place Town Well
    map[c.x][c.y - 2].type = 'well';
    map[c.x][c.y - 2].char = 'O';
    map[c.x][c.y - 2].color = '#3498db';
    map[c.x][c.y - 2].isTown = true;

    // Place Beggars/Villagers (Dynamic entities)
    for (let i = 0; i < 6; i++) {
        let vx, vy, tries = 0;
        do {
            vx = c.x + Math.floor(Math.random() * 30) - 15;
            vy = c.y + Math.floor(Math.random() * 20) - 10;
            tries++;
        } while (tries < 100 && (vx < 0 || vx >= MAP_WIDTH || vy < 0 || vy >= MAP_HEIGHT || map[vx][vy].type !== 'floor' || getEntityAt(vx, vy)));
        if (tries < 100) {
            let type = Math.random() < 0.3 ? 'beggar' : 'villager';
            let charC = type === 'beggar' ? 'p' : 'v';
            let colorC = type === 'beggar' ? '#888' : '#ecf0f1';
            let nameC = type === 'beggar' ? 'Beggar' : 'Villager';
            let npc = new Entity(vx, vy, charC, colorC, nameC, 10, 0, 0, 5);
            npc.isTownNPC = true;
            npc.npcType = type;
            entities.push(npc);
        }
    }

    // Local flavor log
    logMessage("Town Services: 1:Shop, 3:Blacksmith, 4:Healer, 5:Alchemist, 6:Wizard", "hint");

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

        // Vault Generation (Erikoiskaupat)
        if (currentFloor >= 3 && Math.random() < 0.35 && rooms.length > 3) {
            let vIndex = 1 + Math.floor(Math.random() * (rooms.length - 2));
            let vRoom = rooms[vIndex];
            
            // Turn it into a vault
            for (let x = vRoom.x; x < vRoom.x + vRoom.w; x++) {
                for (let y = vRoom.y; y < vRoom.y + vRoom.h; y++) {
                    map[x][y].type = 'wall';
                    map[x][y].char = '%'; // Vault wall
                    map[x][y].color = '#8e44ad'; // Purple wall indicating magic vault
                    map[x][y].hp = 100; // Hard to tunnel
                }
            }
            // Hollow out the center
            for (let x = vRoom.x + 1; x < vRoom.x + vRoom.w - 1; x++) {
                for (let y = vRoom.y + 1; y < vRoom.y + vRoom.h - 1; y++) {
                    map[x][y].type = 'floor';
                    map[x][y].char = CHARS.FLOOR;
                }
            }
            
            // Door at the center bottom edge
            let dx = vRoom.center().x;
            let dy = vRoom.y + vRoom.h - 1;
            map[dx][dy].type = 'locked_door';
            map[dx][dy].char = '+';
            map[dx][dy].color = '#d4ac0d';

            // Ensure cell below door is floor for connectivity
            if (map[dx][dy+1] && map[dx][dy+1].type === 'wall') {
                map[dx][dy+1].type = 'floor';
                map[dx][dy+1].char = CHARS.FLOOR;
            }

            // Spawn Merchant inside
            const vc = vRoom.center();
            entities = entities.filter(e => e.x !== vc.x || e.y !== vc.y);
            
            if (Math.random() < 0.5) {
                const merch = new Entity(vc.x, vc.y, 'g', '#f1c40f', 'Dungeon Merchant', 1, 0, 0, 0);
                merch.isMerchant = true; merch.isPlayer = false;
                merch.blocksMovement = false; merch.energy = 0;
                entities.push(merch);
            } else {
                map[vc.x][vc.y].type = 'gambler';
                map[vc.x][vc.y].char = '7';
                map[vc.x][vc.y].color = '#95a5a6';
            }

            // Spawn Vault Guards (elite enemies guarding the vault)
            if (typeof ENEMY_TYPES !== 'undefined') {
                let guardCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 guards
                for (let i = 0; i < guardCount; i++) {
                    let gx = vRoom.x + 1 + Math.floor(Math.random() * (vRoom.w - 2));
                    let gy = vRoom.y + 1 + Math.floor(Math.random() * (vRoom.h - 2));
                    if ((gx !== vc.x || gy !== vc.y) && map[gx][gy].type === 'floor') {
                        let validEnemies = ENEMY_TYPES.filter(e => currentFloor + 5 >= e.minFloor);
                        if (validEnemies.length > 0) {
                            let eTemplate = validEnemies[Math.floor(Math.random() * validEnemies.length)];
                            let guard = new Entity(gx, gy, eTemplate.char, eTemplate.color, "Elite " + eTemplate.name, Math.floor(eTemplate.hp * 3), eTemplate.atk + 5, eTemplate.def + 3, eTemplate.speed + 1);
                            guard.isElite = true;
                            guard.baseXP = (eTemplate.baseXP || 5) * 4;
                            entities.push(guard);
                        }
                    }
                }
            }
            
            // Scatter a key in the dungeon to open the vault
            let kx, ky, tries = 0;
            do { kx = Math.floor(Math.random() * MAP_WIDTH); ky = Math.floor(Math.random() * MAP_HEIGHT); tries++; }
            while (tries < 60 && map[kx][ky].type !== 'floor');
            if (tries < 60) items.push({ x: kx, y: ky, ...ITEM_DB.find(i => i.name === 'Dungeon Key') });

            logMessage("You feel a strange magical presence...", "magic");
        }

        // Phase IV - Dungeon Hazards
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
