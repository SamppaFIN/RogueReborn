/**
 * Rogue Reborn - AI & Pathfinding
 * Monster AI, A* pathfinding, exploration algorithms.
 * Extracted from engine.js for modularity.
 */
function findPath(sx, sy, tx, ty) {
    const queue = [{ x: sx, y: sy, path: [] }];
    const visited = new Set([`${sx},${sy}`]);
    const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    // Max depth to prevent massive search lag
    let iteration = 0;

    while (queue.length > 0 && iteration < 1500) {
        iteration++;
        const curr = queue.shift();

        if (curr.x === tx && curr.y === ty) {
            return curr.path;
        }

        for (let d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;

            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                    // Path through explored floor, stairs, or target entity (to attack)
                    // Treat unknown as wall.
                    const tile = map[nx][ny];
                    const ent = getEntityAt(nx, ny);
                    const hasKey = player.inventory.some(i => i.name === 'Dungeon Key');
                    const blockingTypes = ['wall', 'locked_door', 'shop', 'healer', 'blacksmith', 'wizard', 'bank', 'well', 'mayor', 'gambler', 'shrine'];
                    const isPassable = !blockingTypes.includes(tile.type) || (tile.type === 'locked_door' && hasKey);
                    if (tile.explored && (isPassable || (nx === tx && ny === ty)) && (!ent || !ent.isTownNPC || !ent.blocksMovement || (nx === tx && ny === ty))) {
                        visited.add(key);
                        queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
                    }
                }
            }
        }
    }
    return null;
}

function findNearestUnexplored(sx, sy) {
    const queue = [{ x: sx, y: sy, path: [] }];
    const visited = new Set([`${sx},${sy}`]);
    const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    let stairsPath = null;
    let iteration = 0;
    while (queue.length > 0 && iteration < 30000) {
        iteration++;
        const curr = queue.shift();

        const cTile = map[curr.x][curr.y];
        // Priority: Unexplored tiles
        if (!cTile.explored && cTile.type !== 'wall') {
            return curr.path;
        }

        // Secondary: Find nearest stairs down (if we haven't found one yet)
        if (!stairsPath && (cTile.type === 'stairs_down' || cTile.type === 'stairs_up')) {
            // Only follow stairs if the current floor is explored enough or specifically stairs_down
            if (cTile.type === 'stairs_down') stairsPath = curr.path;
        }

        for (let d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;
            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    const tile = map[nx][ny];
                    const ent = getEntityAt(nx, ny);
                    const hasKey = player.inventory.some(i => i.name === 'Dungeon Key');
                    const blockingTypes = ['wall', 'locked_door', 'shop', 'healer', 'blacksmith', 'wizard', 'bank', 'well', 'mayor', 'gambler', 'shrine'];
                    const isPassable = !blockingTypes.includes(tile.type) || (tile.type === 'locked_door' && hasKey);
                    // Path through explored floors, avoid blocking Town NPCs specifically
                    if (((tile.explored && isPassable) || (!tile.explored && !blockingTypes.includes(tile.type))) && (!ent || !ent.isTownNPC || !ent.blocksMovement)) {
                        queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
                    }
                }
            }
        }
    }
    if (!stairsPath && iteration >= 30000) console.log(`(DEBUG) findNearestUnexplored: limit reached at ${sx},${sy}, queue: ${queue.length}`);
    if (!stairsPath && queue.length === 0) console.log(`(DEBUG) findNearestUnexplored: queue empty at ${sx},${sy}`);
    return stairsPath; // Fallback to stairs if no unexplored tiles found
}

// --- Monster AI ---
function processMonsterAI(e) {
    if (e.isTownNPC) {
        if (Math.random() < 0.4) {
            const dirs = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const tx = e.x + d.dx;
            const ty = e.y + d.dy;
            if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                if (!getEntityAt(tx, ty) && map[tx][ty].type === 'floor') {
                    attemptAction(e, { type: 'move', dx: d.dx, dy: d.dy });
                    return;
                }
            }
        }
        attemptAction(e, { type: 'wait' });
        return;
    }

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.abs(dx) + Math.abs(dy);
    const visible = (map[e.x] && map[e.x][e.y]) ? map[e.x][e.y].visible : false;

    // Energy check â€” processMonsterAI is only called if e.energy >= 100
    // We should NOT subtract energy here if attemptAction(e, ...) is called,
    // as attemptAction handles its own energy subtraction.
    // Only subtract here if we do a special non-move action (like summoning).

    // #27 Blink Dog â€” teleport randomly when adjacent and hurt
    if (e.blinker && dist <= 2 && e.hp < e.maxHp * 0.5) {
        let bx, by, tries = 0;
        do { bx = e.x + Math.floor(Math.random() * 7) - 3; by = e.y + Math.floor(Math.random() * 7) - 3; tries++; }
        while (tries < 20 && (bx < 0 || bx >= MAP_WIDTH || by < 0 || by >= MAP_HEIGHT || map[bx][by].type !== 'floor' || getEntityAt(bx, by)));
        if (tries < 20) { e.x = bx; e.y = by; e.energy -= ENERGY_THRESHOLD; spawnParticle(e.x, e.y, 'blink!', '#3498db'); return; }
    }

    // #24 Necromancer â€” summon skeleton if not too many
    if (e.summoner && dist < 10 && visible && Math.random() < 0.08) {
        const skeleCount = entities.filter(en => en.name === 'Skeleton' && en.hp > 0).length;
        if (skeleCount < 4) {
            const skeleDirs = [[1,0],[-1,0],[0,1],[0,-1]];
            for (const sd of skeleDirs) {
                const sx = e.x + sd[0], sy = e.y + sd[1];
                if (sx >= 0 && sx < MAP_WIDTH && sy >= 0 && sy < MAP_HEIGHT && map[sx][sy].type === 'floor' && !getEntityAt(sx, sy)) {
                    const sk = ENEMY_TYPES.find(t => t.name === 'Skeleton');
                    if (sk) {
                        const ne = new Entity(sx, sy, sk.char, sk.color, sk.name, sk.hp, sk.atk, sk.def, sk.speed);
                        ne.element = sk.element; ne.baseXP = sk.baseXP;
                        entities.push(ne);
                        logMessage('Necromancer summons a Skeleton!', 'damage');
                        e.energy -= ENERGY_THRESHOLD; // Manual subtraction for non-attemptAction summons
                        return;
                    }
                    break;
                }
            }
        }
    }

    // #28 Beholder â€” ranged debuff at range 3-6
    if (e.rangedDebuff && dist >= 2 && dist <= 6 && visible && Math.random() < 0.3) {
        const debuffs = ['slow', 'confuse', 'blind'];
        const debuff = debuffs[Math.floor(Math.random() * debuffs.length)];
        if (debuff === 'slow')    { player.speed = Math.max(2, player.speed - 2); spawnParticle(player.x, player.y, 'SLOW!', '#3498db'); logMessage('Beholder eye-ray slows you!', 'damage'); }
        if (debuff === 'confuse') { player.confusedTimer = (player.confusedTimer || 0) + 8; spawnParticle(player.x, player.y, 'CONFUSED!', '#9b59b6'); logMessage('Beholder eye-ray confuses you!', 'damage'); }
        if (debuff === 'blind')   { player.blindTimer = (player.blindTimer || 0) + 5; spawnParticle(player.x, player.y, 'BLIND!', '#888'); logMessage('Beholder eye-ray blinds you!', 'damage'); }
        e.energy -= ENERGY_THRESHOLD; // Manual subtraction for debuff ray
        return;
    }

    // Phase IV: AI Personalities & Reputation
    let baseName = e.name.replace('Elite ', '').replace('Mini-Boss ', '');
    let kills = (player.killsByType && player.killsByType[baseName]) ? player.killsByType[baseName] : 0;
    
    // Attempt to get personality
    let template = typeof ENEMY_TYPES !== 'undefined' ? ENEMY_TYPES.find(t => t.name === baseName) : null;
    let pers = e.personality || (template && template.personality) || null;

    if (pers && map[e.x] && map[e.x][e.y] && map[e.x][e.y].visible) {
        if (!e.chattedTimer) e.chattedTimer = 0;
        if (e.chattedTimer > 0) e.chattedTimer--;

        // Cowardly: Run away if kills >= 5
        if (pers === 'cowardly' && kills >= 5) {
            if (e.chattedTimer === 0 && Math.random() < 0.2) {
                logMessage(`${e.name} shrieks: "The madman is here! RUN!"`, 'damage');
                e.chattedTimer = 30; // Rate limit barks
            }
            if (dist <= 6) {
                let mdx = Math.sign(e.x - player.x), mdy = Math.sign(e.y - player.y);
                if (mdx === 0 && mdy === 0) mdx = 1;
                attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
                return;
            }
        }
        
        // Vengeful: Get +2 ATK buff and rush if kills >= 5
        if (pers === 'vengeful' && kills >= 5 && !e.surged) {
            if (e.chattedTimer === 0) {
                logMessage(`${e.name} roars: "For our fallen brothers! DIE!"`, 'damage');
                e.chattedTimer = 100;
            }
            e.atk += 2;
            e.surged = true;
            spawnParticle(e.x, e.y, 'RAGE!', '#e74c3c');
            // Continues to attack naturally
        }

        // Stealthy: Wait in darkness if distance > 3
        if (pers === 'stealthy' && dist > 3 && e.hp === e.maxHp) {
            if (e.chattedTimer === 0 && Math.random() < 0.05) {
                logMessage(`You hear whispers in the dark...`, 'hint');
                e.chattedTimer = 40;
            }
            attemptAction(e, { type: 'wait' });
            return;
        }

        // Pack: Call for help if HP < 40%
        if (pers === 'pack' && e.hp < e.maxHp * 0.4 && !e.hasHowled) {
            logMessage(`${e.name} howls for the pack!`, 'damage');
            e.hasHowled = true;
            spawnParticle(e.x, e.y, 'AWOO!', '#3498db');
            
            // Wake/Alert other pack members within radius 10
            entities.forEach(other => {
                if (!other.isPlayer && other.hp > 0 && Math.abs(other.x - e.x) + Math.abs(other.y - e.y) < 10) {
                    let oBase = other.name.replace('Elite ', '').replace('Mini-Boss ', '');
                    let oTemp = typeof ENEMY_TYPES !== 'undefined' ? ENEMY_TYPES.find(t => t.name === oBase) : null;
                    if (oTemp && oTemp.personality === 'pack' && other !== e) {
                        other.confusedTimer = 0; // Snap out of confusion/sleep
                        spawnParticle(other.x, other.y, '!', '#e74c3c');
                    }
                }
            });
        }
    }

    // #54 Fear â€” flee behaviour for wounded monsters
    if (e.hp < e.maxHp * 0.25 && Math.random() < 0.5) {
        // Move AWAY from player
        let mdx = Math.sign(e.x - player.x), mdy = Math.sign(e.y - player.y);
        if (mdx === 0 && mdy === 0) mdx = 1;
        attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
        return;
    }

    if (dist <= 1) {
        attemptAction(e, { type: 'move', dx, dy });
    } else if (dist < 15 && visible) {
        let mdx = 0; let mdy = 0;
        if (Math.abs(dx) > Math.abs(dy)) mdx = Math.sign(dx);
        else mdy = Math.sign(dy);
        attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
    } else {
        attemptAction(e, { type: 'wait' });
    }
}

// --- Rendering & Utility ---
function computeFOV() {
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) map[x][y].visible = false;
    }

    const radius = currentFloor === 0 ? 15 : (player.blindTimer > 0 ? 2 : 8); // #52 Blindness reduces FOV
    const px = player.x; const py = player.y;

    map[px][py].visible = true; map[px][py].explored = true;

    for (let a = 0; a < 360; a += 2) {
        let ax = Math.cos(a * (Math.PI / 180));
        let ay = Math.sin(a * (Math.PI / 180));
        let ox = px + 0.5; let oy = py + 0.5;

        for (let i = 0; i < radius; i++) {
            ox += ax; oy += ay;
            let tx = Math.floor(ox); let ty = Math.floor(oy);

            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;
            map[tx][ty].visible = true; map[tx][ty].explored = true;
            if (map[tx][ty].type === 'wall') break;
        }
    }

    updateVisibleMonsters();
}

function updateVisibleMonsters() {
    let nowVisible = new Set();
    let newMonsterSpotted = false;
    for (let e of entities) {
        if (!e.isPlayer && e.hp > 0 && map[e.x][e.y].visible) {
            nowVisible.add(e);
            if (!visibleMonsters.has(e)) newMonsterSpotted = true;
        }
    }
    visibleMonsters = nowVisible;
    if (newMonsterSpotted && (isAutoRunning || activePath || isAutoExploring)) {
        isAutoRunning = false;
        activePath = null;
        isAutoExploring = false;
        logMessage("A monster comes into view!", 'damage');
    }
}
