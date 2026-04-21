/**
 * Rogue Reborn - Autoplay Interface
 * Built-in AI module for testing and user automated gameplay (idle gaming).
 * 
 * v2: Complete rewrite of processAutoPlay to bypass auto-explore system
 *     and use direct pathfinding, eliminating the stuck-loop bug.
 */

window.isAutoPlayActive = false;
window.autoPlayTurns = 0;
window._autoplayStuckCounter = 0;
window._autoplayLastPos = null;

function toggleAutoPlay(state) {
    if (typeof state !== 'undefined') {
        window.isAutoPlayActive = state;
    } else {
        window.isAutoPlayActive = !window.isAutoPlayActive;
    }
    
    // Clear keyboard overrides
    for (let k in keys) keys[k] = false;
    
    if (window.isAutoPlayActive) {
        logMessage("Autoplay Initiated.", "magic");
        window._autoplayStuckCounter = 0;
        window._autoplayLastPos = null;
    } else {
        logMessage("Autoplay Disabled.", "hint");
    }
    
    let btn = document.getElementById('btn-autoplay');
    if (btn) {
        btn.innerText = window.isAutoPlayActive ? 'AUTOPLAY: ON' : 'AUTOPLAY: OFF';
        btn.style.color = window.isAutoPlayActive ? '#2ecc71' : '#f1c40f';
        btn.style.borderColor = window.isAutoPlayActive ? '#2ecc71' : '#f1c40f';
    }
    
    if (typeof updateUI === 'function') updateUI();
}

function checkEquipment() {
    for (let i = 0; i < player.inventory.length; i++) {
        let item = player.inventory[i];
        if (!item || !item.equip) continue;

        let currentEq = player.equipment[item.effect === 'esp' ? 'helm' : item.type];
        
        let currentScore = 0;
        let newScore = 0;

        if (item.type === 'weapon') {
            currentScore = currentEq ? (currentEq.atkBonus || 0) + (currentEq.plusAtk || 0) : 0;
            newScore = (item.atkBonus || 0) + (item.plusAtk || 0);
        } else if (['armor', 'helm', 'shield'].includes(item.type)) {
            currentScore = currentEq ? (currentEq.defBonus || 0) + (currentEq.plusDef || 0) : 0;
            newScore = (item.defBonus || 0) + (item.plusDef || 0);
        }

        if (newScore > currentScore + 1 || (!currentEq && newScore > 0)) {
            console.log(`[Autoplay] Equipping Upgrade: ${item.name} (Score: ${newScore} vs ${currentScore})`);
            window.useItem(i);
            return true;
        }
    }
    return false;
}

function autoDropJunk() {
    if (player.inventory.length < 17) return;

    let lowestScore = 9999;
    let worstIndex = -1;

    for (let i = 0; i < player.inventory.length; i++) {
        let item = player.inventory[i];
        let score = 0;

        // Scoring rules
        if (item.name === 'Dungeon Key') score += 1000;
        if (item.artifact) score += 500;
        if (Object.values(player.equipment).includes(item)) score += 1000;
        if (item.effect === 'heal' || item.effect === 'full_heal') score += 100;
        if (item.type === 'scroll' || item.type === 'potion') score += 50;
        
        // Unidentified items might be good
        if (!item.identified) score += 40;

        // Compare equipment stats
        if (['weapon', 'armor', 'helm', 'shield'].includes(item.type)) {
            score += (item.atkBonus || 0) + (item.defBonus || 0) + (item.plusAtk || 0) + (item.plusDef || 0);
        }

        if (score < lowestScore) {
            lowestScore = score;
            worstIndex = i;
        }
    }

    if (worstIndex >= 0 && lowestScore < 500) {
        console.log(`[Autoplay] Dropping junk to free space: ${player.inventory[worstIndex].name}`);
        window.dropItem(worstIndex, null, true); // true for silent/simulated drop
    }
}

function getNearestVisibleMonster() {
    let bestDest = 999;
    let bestM = null;
    if (typeof entities === 'undefined') return { target: null, dist: null };
    for (let e of entities) {
        if (!e.isPlayer && e.hp > 0 && !e.isTownNPC && !e.isMerchant && map[e.x] && map[e.x][e.y] && map[e.x][e.y].visible) {
            let d = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
            if (d < bestDest) { bestDest = d; bestM = e; }
        }
    }
    return { target: bestM, dist: bestDest };
}

// --- Direct pathfinding exploration (bypasses auto-explore system) ---
function autoplayFindExploreTarget() {
    // Use BFS to find nearest unexplored walkable tile
    const queue = [{ x: player.x, y: player.y, path: [] }];
    const visited = new Set([`${player.x},${player.y}`]);
    const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    let stairsPath = null;
    let iteration = 0;
    
    // Determine if we should allow hazard traversal (when stuck)
    const allowHazards = window._autoplayStuckCounter > 50;

    while (queue.length > 0 && iteration < 30000) {
        iteration++;
        const curr = queue.shift();
        const cTile = map[curr.x][curr.y];

        // Found unexplored tile!
        if (!cTile.explored && cTile.type !== 'wall') {
            return curr.path;
        }

        // Track stairs as fallback
        if (!stairsPath && cTile.type === 'stairs_down') {
            stairsPath = curr.path;
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
                    if (!allowHazards) blockingTypes.push('lava', 'gas');
                    
                    const isPassable = !blockingTypes.includes(tile.type) || (tile.type === 'locked_door' && hasKey);
                    
                    if (((tile.explored && isPassable) || (!tile.explored && !blockingTypes.includes(tile.type))) && (!ent || !ent.isTownNPC || !ent.blocksMovement)) {
                        queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
                    }
                }
            }
        }
    }

    return stairsPath; // Fallback to stairs if no unexplored tiles
}

// Find a walkable item on the ground nearby
function autoplayFindNearestItem() {
    if (typeof items === 'undefined') return null;
    let best = null;
    let bestDist = Infinity;
    for (let item of items) {
        if (!map[item.x] || !map[item.x][item.y] || !map[item.x][item.y].visible) continue;
        let d = Math.abs(item.x - player.x) + Math.abs(item.y - player.y);
        // Prioritize Dungeon Keys heavily
        if (item.name === 'Dungeon Key') d -= 100;
        if (d < bestDist) { bestDist = d; best = item; }
    }
    return best;
}

function processAutoPlay() {
    // Close any open modal/NPC dialog immediately
    if (gameState !== 'PLAYING' && gameState !== 'PLAYER_DEAD' && gameState !== 'VICTORY' && gameState !== 'LEVEL_UP' && gameState !== 'TARGETING' && gameState !== 'RANGED_TARGETING') {
        if (window.closeAllModals) window.closeAllModals();
        gameState = 'PLAYING'; // Force back to playing
        return;
    }

    if (gameState === 'PLAYER_DEAD' || gameState === 'VICTORY') {
        window.isAutoPlayActive = false;
        return;
    }

    window.autoPlayTurns++;

    // --- STATE MACHINE RESOLUTION ---
    if (gameState === 'TARGETING' || gameState === 'RANGED_TARGETING') {
        const { target } = getNearestVisibleMonster();
        if (target) {
            window.targetX = target.x;
            window.targetY = target.y; 
            if (gameState === 'TARGETING') {
                window.executeTargetSpell();
            } else {
                window.executeRangedAttack();
            }
        } else {
            keys['Escape'] = true;
            setTimeout(() => { keys['Escape'] = false; }, 10);
        }
        return;
    }

    if (gameState === 'LEVEL_UP') {
        const buttons = document.querySelectorAll('#levelUpModal button, #skillModal button');
        const upgradeButtons = Array.from(buttons).filter(b => b.id !== 'btn-finish-levelup');
        if (upgradeButtons.length > 0) {
            const btn = upgradeButtons[Math.floor(Math.random() * upgradeButtons.length)];
            if(btn && btn.click) btn.click();
        } else {
             const finishBtn = document.getElementById('btn-finish-levelup');
             if(finishBtn && finishBtn.style.display !== 'none') finishBtn.click();
        }
        return;
    }
    
    if (gameState !== 'PLAYING') return;

    // --- STUCK DETECTION ---
    const posKey = `${player.x},${player.y}`;
    if (window._autoplayLastPos === posKey) {
        window._autoplayStuckCounter++;
    } else {
        window._autoplayStuckCounter = 0;
        window._autoplayLastPos = posKey;
    }

    // AI Maintenance
    if (window.autoPlayTurns % 50 === 0) autoDropJunk();

    // Priority 1: Healing
    if (player.hp < player.maxHp * 0.55) {
        const healIdx = player.inventory.findIndex(i => i.effect === 'heal' || i.effect === 'full_heal');
        if (healIdx >= 0) {
            window.useItem(healIdx);
            return;
        }
    }

    // Priority 2: Equip better gear
    if (window.autoPlayTurns % 20 === 0) {
        if (checkEquipment()) return;
    }

    const { target: monster, dist: mDist } = getNearestVisibleMonster();

    // Priority 3: Skill Usage
    if (player.skillCooldown <= 0 && player.energy >= window.ENERGY_THRESHOLD) {
        if (player.class === 'Warrior' && monster && mDist <= 2) {
            keys['q'] = true; setTimeout(() => keys['q']=false, 10);
            return;
        } else if (player.class === 'Mage' && monster && mDist <= 6) {
            keys['q'] = true; setTimeout(() => keys['q']=false, 10);
            return;
        } else if (player.class === 'Rogue' && monster && mDist <= 3) {
            keys['q'] = true; setTimeout(() => keys['q']=false, 10);
            return;
        }
    }

    // Priority 4: Melee combat (adjacent)
    const isAdjacent = monster && Math.abs(monster.x - player.x) <= 1 && Math.abs(monster.y - player.y) <= 1;
    if (isAdjacent) {
        window.attemptAction(player, { type: 'move', dx: monster.x - player.x, dy: monster.y - player.y });
        return;
    }
    
    // Priority 5: Chase visible monsters directly
    if (monster) {
        let path = window.findPath(player.x, player.y, monster.x, monster.y);
        if (!path || path.length === 0) {
            path = window.findPath(player.x, player.y, monster.x, monster.y, false, true);
        }
        if (path && path.length > 0) {
            let next = path[0];
            window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
            return;
        }
    }

    // Priority 6: Step on stairs if standing on them
    if (map[player.x][player.y].type === 'stairs_down') {
        window.checkStairs(player.x, player.y, true);
        return;
    }

    // Priority 7: Pick up nearby items
    const nearestItem = autoplayFindNearestItem();
    if (nearestItem) {
        let path = window.findPath(player.x, player.y, nearestItem.x, nearestItem.y);
        if ((!path || path.length === 0) && nearestItem.name === 'Dungeon Key') {
            path = window.findPath(player.x, player.y, nearestItem.x, nearestItem.y, false, true);
        }
        if (path && path.length > 0) {
            let next = path[0];
            window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
            return;
        }
    }

    // Priority 8: Explore (direct pathfinding, NOT auto-explore key)
    let explorePath = autoplayFindExploreTarget();
    if (explorePath && explorePath.length > 0) {
        let next = explorePath[0];
        window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
        return;
    }

    // Priority 9: Nothing to explore — find stairs and descend
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            if (map[x][y].type === 'stairs_down') {
                // Try with ignoreVisibility=true since we may know the stairs location
                let path = window.findPath(player.x, player.y, x, y, true);
                if (!path || path.length === 0) {
                    path = window.findPath(player.x, player.y, x, y, true, true);
                }
                if (path && path.length > 0) {
                    let next = path[0];
                    window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
                    return;
                }
            }
        }
    }

    // Priority 10: STUCK — random walk every tick (always fire, don't wait)
    let allDirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    // Prefer walkable, non-wall tiles. Allow hazards if very stuck.
    let safeDirs = allDirs.filter(d => {
        let tx = player.x + d[0]; let ty = player.y + d[1];
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false;
        let tile = map[tx][ty];
        if (!tile || tile.type === 'wall') return false;
        // Allow hazards after being stuck for 100 ticks
        if (window._autoplayStuckCounter < 100 && (tile.type === 'lava' || tile.type === 'gas')) return false;
        return true;
    });
    if (safeDirs.length === 0) safeDirs = allDirs;
    let d = safeDirs[Math.floor(Math.random() * safeDirs.length)];
    window.attemptAction(player, { type: 'move', dx: d[0], dy: d[1] });
}
