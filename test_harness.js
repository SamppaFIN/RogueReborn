/**
 * 🌸 Rogue Reborn — Test Harness (Aurora's Macros)
 * 
 * Injectable test framework for browser-based automated testing.
 * Exposes window.TH with macros to programmatically control the game.
 * 
 * Usage (in browser console or via execute_browser_javascript):
 *   // Inject first, then:
 *   await TH.startGame('Warrior');
 *   await TH.autoPlayFloor();
 *   await TH.descendStairs();
 *   TH.getState();
 *   await TH.fullRun('Warrior');
 */
(function() {
    'use strict';

    // Prevent double-injection
    if (window.TH) {
        console.log('[TH] Test Harness already loaded.');
        return;
    }

    const TH = {};

    // ─── Utility: wait for N milliseconds ───
    TH.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // ─── Utility: wait for a condition to be true ───
    TH.waitFor = (condFn, timeoutMs = 30000, pollMs = 100) => {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                if (condFn()) return resolve(true);
                if (Date.now() - start > timeoutMs) return reject(new Error('TH.waitFor timeout'));
                setTimeout(check, pollMs);
            };
            check();
        });
    };

    // ─── Utility: wait for game ticks to process ───
    TH.waitTicks = async (n = 1) => {
        const startTurns = typeof totalTurns !== 'undefined' ? totalTurns : 0;
        // Inject a wait action by pressing '5' (wait key)
        for (let i = 0; i < n; i++) {
            if (typeof keys !== 'undefined') keys['5'] = true;
            await TH.sleep(50);
            if (typeof keys !== 'undefined') keys['5'] = false;
            await TH.sleep(50);
        }
    };

    // ═══════════════════════════════════════════
    //  STATE QUERIES
    // ═══════════════════════════════════════════

    TH.getState = () => {
        if (!player) return { error: 'No player' };
        const monstersNearby = entities
            .filter(e => !e.isPlayer && e.hp > 0 && e.blocksMovement && !e.isTownNPC && !e.isMerchant)
            .map(e => ({
                name: e.name, hp: e.hp, maxHp: e.maxHp,
                x: e.x, y: e.y,
                dist: Math.abs(e.x - player.x) + Math.abs(e.y - player.y)
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 10);

        return {
            gameState,
            floor: currentFloor,
            hp: player.hp, maxHp: player.maxHp,
            atk: player.atk, def: player.def,
            speed: player.speed,
            level: player.level, xp: player.xp, nextXp: player.nextXp,
            gold: player.gold,
            x: player.x, y: player.y,
            class: player.class,
            inventoryCount: player.inventory ? player.inventory.length : 0,
            inventory: player.inventory ? player.inventory.map(i => ({
                name: i.name, type: i.type, equipped: Object.values(player.equipment).includes(i)
            })) : [],
            monstersNearby,
            timeOfDay,
            totalTurns
        };
    };

    TH.isAlive = () => gameState === 'PLAYING' && player && player.hp > 0;
    TH.isDead = () => gameState === 'PLAYER_DEAD';
    TH.isVictory = () => gameState === 'VICTORY';

    TH.getStairsPosition = () => {
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                if (map[x][y].type === 'stairs_down') return { x, y };
            }
        }
        return null;
    };

    TH.getFloorInfo = () => {
        let explored = 0, total = 0, monsters = 0, itemsOnGround = 0;
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                if (map[x][y].type !== 'wall') {
                    total++;
                    if (map[x][y].explored) explored++;
                }
            }
        }
        monsters = entities.filter(e => !e.isPlayer && e.hp > 0 && e.blocksMovement && !e.isTownNPC && !e.isMerchant).length;
        itemsOnGround = items.length;
        const stairs = TH.getStairsPosition();
        return { explored, total, exploredPct: total > 0 ? Math.round(explored / total * 100) : 0, monsters, itemsOnGround, stairs };
    };

    // ═══════════════════════════════════════════
    //  GAME START
    // ═══════════════════════════════════════════

    TH.startGame = async (className = 'Warrior', name = 'TestBot') => {
        // Set the name input
        const nameInput = document.getElementById('charName');
        if (nameInput) nameInput.value = name;

        // Call the game's startGame function
        window.startGame(className);

        // Wait for game to be in PLAYING state
        await TH.waitFor(() => gameState === 'PLAYING', 5000);
        await TH.sleep(200);
        console.log(`[TH] Game started: ${name} the ${className} | Floor ${currentFloor} | HP ${player.hp}/${player.maxHp}`);
        return TH.getState();
    };

    // ═══════════════════════════════════════════
    //  MOVEMENT MACROS
    // ═══════════════════════════════════════════

    TH.move = async (dx, dy) => {
        if (!TH.isAlive()) return false;
        // Use attemptAction directly
        attemptAction(player, { type: 'move', dx, dy });
        computeFOV();
        updateUI();
        await TH.sleep(30);
        return true;
    };

    TH.moveToStairs = async () => {
        if (!TH.isAlive()) return false;
        const stairs = TH.getStairsPosition();
        if (!stairs) {
            console.log('[TH] No stairs found on this floor!');
            return false;
        }

        // Use game's pathfinding
        const path = findPath(player.x, player.y, stairs.x, stairs.y);
        if (!path || path.length === 0) {
            console.log('[TH] No path to stairs!');
            return false;
        }

        console.log(`[TH] Pathfinding to stairs at (${stairs.x},${stairs.y}), ${path.length} steps`);
        for (const node of path) {
            if (!TH.isAlive()) return false;
            const dx = node.x - player.x;
            const dy = node.y - player.y;
            attemptAction(player, { type: 'move', dx, dy });

            // Process monster turns
            TH._processMonsters();
            computeFOV();
            updateUI();
            await TH.sleep(10);

            // If we got into combat, handle it
            if (!TH.isAlive()) return false;
        }
        console.log(`[TH] Reached stairs at (${player.x},${player.y})`);
        return true;
    };

    TH.descendStairs = async () => {
        if (!TH.isAlive()) return false;
        const prevFloor = currentFloor;
        checkStairs(player.x, player.y, true); // force = true
        computeFOV();
        updateUI();
        await TH.sleep(100);
        const newFloor = currentFloor;
        console.log(`[TH] Descended: Floor ${prevFloor} → ${newFloor}`);
        return newFloor !== prevFloor;
    };

    TH.ascendStairs = async () => {
        if (!TH.isAlive()) return false;
        // Check if standing on stairs_up
        if (map[player.x][player.y].type === 'stairs_up') {
            const prevFloor = currentFloor;
            checkStairs(player.x, player.y, true);
            computeFOV();
            updateUI();
            await TH.sleep(100);
            return currentFloor !== prevFloor;
        }
        return false;
    };

    // ═══════════════════════════════════════════
    //  MONSTER PROCESSING (internal)
    // ═══════════════════════════════════════════

    TH._processMonsters = () => {
        // Give monsters energy and let them act
        for (let e of entities) {
            if (e.isPlayer || e.hp <= 0 || e.isTownNPC || e.isMerchant) continue;
            e.energy += e.speed;
            while (e.energy >= 100 && e.hp > 0 && player.hp > 0) {
                processMonsterAI(e);
            }
        }
    };

    // ═══════════════════════════════════════════
    //  COMBAT MACROS
    // ═══════════════════════════════════════════

    TH.attackNearest = async () => {
        if (!TH.isAlive()) return false;
        const monster = getNearestMonster(player.x, player.y);
        if (!monster) return false;

        const dist = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
        if (dist <= 1) {
            // Adjacent — bump attack
            const dx = monster.x - player.x;
            const dy = monster.y - player.y;
            attemptAction(player, { type: 'move', dx, dy });
            TH._processMonsters();
            computeFOV();
            updateUI();
            await TH.sleep(10);
            return true;
        }

        // Not adjacent — pathfind to it
        const path = findPath(player.x, player.y, monster.x, monster.y);
        if (path && path.length > 1) {
            // Move one step towards
            const node = path[0];
            const dx = node.x - player.x;
            const dy = node.y - player.y;
            attemptAction(player, { type: 'move', dx, dy });
            TH._processMonsters();
            computeFOV();
            updateUI();
            await TH.sleep(10);
            return true;
        }
        return false;
    };

    TH.fightUntilClear = async (maxTurns = 500) => {
        let turns = 0;
        while (TH.isAlive() && turns < maxTurns) {
            const monster = getNearestMonster(player.x, player.y);
            if (!monster) break;

            const dist = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
            if (dist > 15) break; // Too far, consider floor clear nearby

            await TH.attackNearest();
            turns++;

            // Use healing potion if low HP
            if (player.hp <= Math.floor(player.maxHp * 0.3)) {
                TH._autoHeal();
            }
        }
        return turns;
    };

    TH._autoHeal = () => {
        if (!player.inventory) return false;
        const healIdx = player.inventory.findIndex(i => i.effect === 'heal');
        if (healIdx >= 0) {
            useItem(healIdx);
            console.log(`[TH] Auto-healed! HP: ${player.hp}/${player.maxHp}`);
            return true;
        }
        return false;
    };

    // ═══════════════════════════════════════════
    //  AUTO-PLAY MACROS
    // ═══════════════════════════════════════════

    TH.autoExploreFloor = async (maxSteps = 2000) => {
        if (!TH.isAlive()) return false;
        console.log(`[TH] Auto-exploring floor ${currentFloor}...`);

        let steps = 0;
        let stuckCounter = 0;
        let lastPos = { x: player.x, y: player.y };

        while (TH.isAlive() && steps < maxSteps) {
            // Heal if needed
            if (player.hp <= Math.floor(player.maxHp * 0.3)) {
                TH._autoHeal();
            }
            if (!TH.isAlive()) break;

            // Check for adjacent monsters — fight them
            const nearMon = getNearestMonster(player.x, player.y);
            if (nearMon) {
                const dist = Math.abs(nearMon.x - player.x) + Math.abs(nearMon.y - player.y);
                if (dist <= 2) {
                    await TH.attackNearest();
                    steps++;
                    stuckCounter = 0;
                    continue;
                }
            }

            // Find unexplored tiles
            const explorePath = findNearestUnexplored(player.x, player.y);
            if (explorePath && explorePath.length > 0) {
                const node = explorePath[0];
                const dx = node.x - player.x;
                const dy = node.y - player.y;
                attemptAction(player, { type: 'move', dx, dy });
                TH._processMonsters();
                computeFOV();
                updateUI();
                steps++;
                await TH.sleep(5);
            } else {
                // Nothing to explore — look for stairs
                const stairs = TH.getStairsPosition();
                if (stairs && (player.x !== stairs.x || player.y !== stairs.y)) {
                    const stairPath = findPath(player.x, player.y, stairs.x, stairs.y);
                    if (stairPath && stairPath.length > 0) {
                        const node = stairPath[0];
                        attemptAction(player, { type: 'move', dx: node.x - player.x, dy: node.y - player.y });
                        TH._processMonsters();
                        computeFOV();
                        updateUI();
                        steps++;
                        await TH.sleep(5);
                    } else {
                        break; // Can't reach stairs
                    }
                } else {
                    break; // On stairs or no stairs found
                }
            }

            // Stuck detection
            if (player.x === lastPos.x && player.y === lastPos.y) {
                stuckCounter++;
                if (stuckCounter > 20) {
                    console.log('[TH] Stuck! Trying random movement...');
                    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
                    const d = dirs[Math.floor(Math.random() * dirs.length)];
                    attemptAction(player, { type: 'move', dx: d[0], dy: d[1] });
                    TH._processMonsters();
                    computeFOV();
                    updateUI();
                    stuckCounter = 0;
                }
            } else {
                lastPos = { x: player.x, y: player.y };
                stuckCounter = 0;
            }

            // Yield every 50 steps to prevent browser freeze
            if (steps % 50 === 0) {
                await TH.sleep(1);
            }
        }

        const info = TH.getFloorInfo();
        console.log(`[TH] Floor ${currentFloor} explored: ${info.exploredPct}% | Steps: ${steps} | Monsters left: ${info.monsters}`);
        return { steps, ...info };
    };

    TH.autoPlayFloor = async () => {
        if (!TH.isAlive()) return null;
        const startFloor = currentFloor;
        console.log(`[TH] ═══ AUTO-PLAYING FLOOR ${startFloor} ═══`);

        // Phase 1: Explore and fight everything
        const exploreResult = await TH.autoExploreFloor();
        if (!TH.isAlive()) return { ...TH.getState(), phase: 'died_exploring' };

        // Phase 2: Clear remaining visible monsters
        await TH.fightUntilClear(300);
        if (!TH.isAlive()) return { ...TH.getState(), phase: 'died_fighting' };

        // Phase 3: Move to stairs
        const reachedStairs = await TH.moveToStairs();
        if (!TH.isAlive()) return { ...TH.getState(), phase: 'died_moving_to_stairs' };

        const state = TH.getState();
        const floorInfo = TH.getFloorInfo();
        console.log(`[TH] Floor ${startFloor} complete: HP ${state.hp}/${state.maxHp} | Lvl ${state.level} | Gold ${state.gold} | Explored ${floorInfo.exploredPct}%`);

        return {
            ...state,
            phase: reachedStairs ? 'ready_to_descend' : 'stairs_unreachable',
            explored: floorInfo.exploredPct
        };
    };

    // ═══════════════════════════════════════════
    //  FULL RUN — Start to death/victory
    // ═══════════════════════════════════════════

    TH.fullRun = async (className = 'Warrior', name = 'TestBot', maxFloors = 15) => {
        console.log(`[TH] ╔═══════════════════════════════════════╗`);
        console.log(`[TH] ║   FULL RUN: ${name} the ${className}       ║`);
        console.log(`[TH] ╚═══════════════════════════════════════╝`);

        const runLog = [];
        const startTime = Date.now();

        // Start the game
        await TH.startGame(className, name);

        // Town: go directly to dungeon
        console.log('[TH] In Town — heading to dungeon...');
        const townStairs = await TH.moveToStairs();
        if (!townStairs) {
            console.log('[TH] ERROR: Could not reach dungeon stairs from town!');
            return { error: 'cant_reach_stairs', log: runLog };
        }
        await TH.descendStairs();

        // Dungeon loop
        let floorsCleared = 0;
        while (TH.isAlive() && currentFloor <= maxFloors) {
            const floorResult = await TH.autoPlayFloor();
            if (!floorResult) break;

            runLog.push({
                floor: currentFloor,
                hp: player.hp,
                maxHp: player.maxHp,
                level: player.level,
                gold: player.gold,
                explored: floorResult.explored,
                phase: floorResult.phase
            });

            if (!TH.isAlive()) {
                console.log(`[TH] ☠ DIED on floor ${currentFloor}!`);
                break;
            }

            if (TH.isVictory()) {
                console.log(`[TH] 🏆 VICTORY! Balrog defeated!`);
                break;
            }

            if (floorResult.phase === 'ready_to_descend') {
                await TH.descendStairs();
                floorsCleared++;
                console.log(`[TH] ═══ Descended to floor ${currentFloor} ═══`);
            } else {
                console.log(`[TH] Cannot descend further. Phase: ${floorResult.phase}`);
                break;
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const finalState = TH.getState();

        const summary = {
            class: className,
            name: name,
            result: TH.isVictory() ? 'VICTORY' : (TH.isDead() ? 'DEAD' : 'STOPPED'),
            finalFloor: currentFloor,
            floorsCleared,
            finalLevel: finalState.level,
            finalGold: finalState.gold,
            finalHP: `${finalState.hp}/${finalState.maxHp}`,
            totalTurns: finalState.totalTurns,
            elapsed: `${elapsed}s`,
            log: runLog
        };

        console.log(`[TH] ╔═══════════════════════════════════════╗`);
        console.log(`[TH] ║   RUN COMPLETE                        ║`);
        console.log(`[TH] ╠═══════════════════════════════════════╣`);
        console.log(`[TH] ║ Result: ${summary.result.padEnd(30)}║`);
        console.log(`[TH] ║ Floor:  ${String(summary.finalFloor).padEnd(30)}║`);
        console.log(`[TH] ║ Level:  ${String(summary.finalLevel).padEnd(30)}║`);
        console.log(`[TH] ║ Gold:   ${String(summary.finalGold).padEnd(30)}║`);
        console.log(`[TH] ║ Time:   ${summary.elapsed.padEnd(30)}║`);
        console.log(`[TH] ╚═══════════════════════════════════════╝`);

        return summary;
    };

    // ═══════════════════════════════════════════
    //  ITEM MACROS
    // ═══════════════════════════════════════════

    TH.useItem = (slot) => {
        if (!player || !player.inventory) return false;
        if (slot >= 0 && slot < player.inventory.length) {
            useItem(slot);
            updateUI();
            return true;
        }
        return false;
    };

    TH.equipBest = () => {
        if (!player || !player.inventory) return;
        // Auto-equip best weapon and armor from inventory
        let bestWeapon = null, bestWeaponIdx = -1;
        let bestArmor = null, bestArmorIdx = -1;

        player.inventory.forEach((item, idx) => {
            if (item.equip && item.type === 'weapon' && !item.cursed) {
                if (!bestWeapon || (item.atkBonus || 0) > (bestWeapon.atkBonus || 0)) {
                    bestWeapon = item;
                    bestWeaponIdx = idx;
                }
            }
            if (item.equip && item.type === 'armor' && !item.cursed) {
                if (!bestArmor || (item.defBonus || 0) > (bestArmor.defBonus || 0)) {
                    bestArmor = item;
                    bestArmorIdx = idx;
                }
            }
        });

        if (bestWeapon && !player.equipment.weapon) {
            useItem(bestWeaponIdx);
            console.log(`[TH] Equipped weapon: ${bestWeapon.name}`);
        }
        if (bestArmor && !player.equipment.armor) {
            // Recalculate index since equipping weapon might shift indices
            const armorIdx = player.inventory.indexOf(bestArmor);
            if (armorIdx >= 0) {
                useItem(armorIdx);
                console.log(`[TH] Equipped armor: ${bestArmor.name}`);
            }
        }
        updateUI();
    };

    // ═══════════════════════════════════════════
    //  REGISTER GLOBALLY
    // ═══════════════════════════════════════════

    window.TH = TH;
    console.log('[TH] 🌸 Test Harness loaded! Use window.TH for macros.');
    console.log('[TH] Quick start: await TH.fullRun("Warrior")');

})();
