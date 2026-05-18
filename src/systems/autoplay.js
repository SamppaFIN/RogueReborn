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
window._autoplayCommittedTarget = null; // {x, y, type, ttl}
window._autoplayCommitTTL = 0;
window._autoplayCachedPath = null; // Cached path steps for committed target

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
    if (player.inventory.length < 28) return false;

    let lowestScore = 9999;
    let worstIndex = -1;

    for (let i = 0; i < player.inventory.length; i++) {
        let item = player.inventory[i];
        let score = 0;

        // Scoring rules
        if (item.name === 'Dungeon Key') score += 5000;
        if (item.artifact) score += 2000;
        if (Object.values(player.equipment).includes(item)) score += 10000;
        if (item.effect === 'heal' || item.effect === 'full_heal') score += 500;
        if (item.effect === 'food' || item.effect === 'food_heal') score += 300;
        if (item.name === 'Word of Recall') score += 1000;
        if (item.type === 'scroll' || item.type === 'potion' || item.type === 'wand') score += 100;
        
        // Unidentified items might be good
        if (!item.identified && !identifiedTypes[item.name]) score += 40;

        // Compare equipment stats
        if (['weapon', 'armor', 'helm', 'shield', 'ring', 'amulet'].includes(item.type)) {
            score += (item.atkBonus || 0) * 10 + (item.defBonus || 0) * 10 + (item.plusAtk || 0) * 10 + (item.plusDef || 0) * 10;
        }

        if (score < lowestScore) {
            lowestScore = score;
            worstIndex = i;
        }
    }

    // If inventory is critical (30), drop the worst item regardless of score, 
    // but try to keep equipment and keys.
    const critical = player.inventory.length >= 30;
    if (worstIndex >= 0 && (lowestScore < 500 || critical)) {
        console.log(`[Autoplay] Dropping junk to free space: ${player.inventory[worstIndex].name} (Score: ${lowestScore})`);
        window.dropItem(worstIndex, null, true); // true for silent/simulated drop
        return true;
    }
    return false;
}

function autoUseConsumables() {
    if (player.inventory.length < 25) return false;

    // 1. Identify scrolls if we have many
    const identifyIdx = player.inventory.findIndex(i => i.effect === 'identify');
    if (identifyIdx >= 0) {
        const unidIdx = player.inventory.findIndex(i => !i.identified && !identifiedTypes[i.name]);
        if (unidIdx >= 0) {
            console.log(`[Autoplay] Using Identify scroll to free space and learn.`);
            window.useItem(identifyIdx);
            return true;
        }
    }

    // 2. Mapping or detect items scrolls (just to use them up)
    const utilityIdx = player.inventory.findIndex(i => i.effect === 'mapping' || i.effect === 'detect_items');
    if (utilityIdx >= 0) {
        console.log(`[Autoplay] Using utility scroll to free space.`);
        window.useItem(utilityIdx);
        return true;
    }

    // 3. Potions if HP < 90%
    if (player.hp < player.maxHp * 0.9) {
        const healIdx = player.inventory.findIndex(i => i.effect === 'heal' || i.effect === 'full_heal');
        if (healIdx >= 0) {
            console.log(`[Autoplay] Using Potion early to free space.`);
            window.useItem(healIdx);
            return true;
        }
    }

    return false;
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
                    
                    const blockingTypes = ['wall', 'locked_door', 'shop', 'healer', 'blacksmith', 'wizard', 'bank', 'well', 'mayor', 'gambler', 'shrine', 'water', 'tree'];
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
        
        // If inventory is nearly full, ignore items that we would immediately drop as junk!
        if (player.inventory.length >= 28 && item.type !== 'gold' && item.name !== 'Dungeon Key' && !item.artifact) {
            let score = 0;
            if (item.effect === 'heal' || item.effect === 'full_heal') score += 500;
            if (item.effect === 'food' || item.effect === 'food_heal') score += 300;
            if (item.name === 'Word of Recall') score += 1000;
            if (item.type === 'scroll' || item.type === 'potion' || item.type === 'wand') score += 100;
            if (!item.identified && (typeof identifiedTypes === 'undefined' || !identifiedTypes[item.name])) score += 40;
            if (['weapon', 'armor', 'helm', 'shield', 'ring', 'amulet'].includes(item.type)) {
                score += (item.atkBonus || 0) * 10 + (item.defBonus || 0) * 10 + (item.plusAtk || 0) * 10 + (item.plusDef || 0) * 10;
            }
            if (score < 500) continue; // Skip junk item to avoid pickup-and-drop infinite loop
        }

        let d = Math.abs(item.x - player.x) + Math.abs(item.y - player.y);
        // Prioritize Dungeon Keys heavily
        if (item.name === 'Dungeon Key') d -= 100;
        if (d < bestDist) { bestDist = d; best = item; }
    }
    return best;
}

function processAutoPlay() {
    // Close any open modal/NPC dialog immediately
    if (gameState !== 'PLAYING' && gameState !== 'PLAYER_DEAD' && gameState !== 'VICTORY' && gameState !== 'LEVEL_UP' && gameState !== 'TARGETING' && gameState !== 'RANGED_TARGETING' && gameState !== 'SHOP' && gameState !== 'INNKEEPER') {
        if (window.closeAllModals) window.closeAllModals();
        gameState = 'PLAYING'; // Force back to playing
        return;
    }

    if (gameState === 'PLAYER_DEAD' || gameState === 'VICTORY') {
        window.isAutoPlayActive = false;
        return;
    }

    // --- MODAL INTERACTION ---
    if (gameState === 'SHOP') {
        // 1. Sell Junk first
        for (let i = 0; i < player.inventory.length; i++) {
            let item = player.inventory[i];
            if (!item) continue;
            // Scoring from autoDropJunk logic roughly
            // Use global identifiedTypes for consumables
            let isIdentified = item.identified || (identifiedTypes && identifiedTypes[item.name]);
            let isJunk = !isIdentified || (!item.artifact && (item.type === 'weapon' || item.type === 'armor' || item.type === 'helm' || item.type === 'shield'));
            
            // If it's not equipped and it's worse than current eq (or unidentified junk), it's junk
            // For now, we only sell non-consumable junk to avoid selling potions/scrolls
            if (isJunk && !Object.values(player.equipment).includes(item) && !['potion', 'scroll', 'wand'].includes(item.type)) {
                console.log(`[Autoplay] Selling junk: ${item.name}`);
                if (window.sellItem) window.sellItem(i);
                return; // Return to process next turn
            }
        }

        // 2. Buy Necessities
        const hasRecall = player.inventory.some(i => i.name === 'Word of Recall');
        const recallItem = currentShopItems.find(i => i.name === 'Word of Recall');
        const recallIdx = currentShopItems.indexOf(recallItem);
        
        if (!hasRecall && recallIdx >= 0 && player.gold >= recallItem.cost) {
            console.log(`[Autoplay] Buying Word of Recall (${recallItem.cost}g)`);
            window.buyItem(recallIdx);
            return;
        }

        const potionCount = player.inventory.filter(i => i.effect === 'heal' || i.effect === 'full_heal').length;
        const potionItem = currentShopItems.find(i => i.effect === 'heal' || i.effect === 'full_heal');
        const potionIdx = currentShopItems.indexOf(potionItem);
        
        if (potionCount < 2 && potionIdx >= 0 && player.gold >= potionItem.cost && player.inventory.length < 30) {
            console.log(`[Autoplay] Buying Potion (${potionItem.name})`);
            window.buyItem(potionIdx);
            return;
        }

        // Buy food if hungry
        const foodCount = player.inventory.filter(i => i.effect === 'food' || i.effect === 'food_heal').length;
        const foodItem = currentShopItems.find(i => i.effect === 'food');
        const foodIdx = currentShopItems.indexOf(foodItem);
        
        if (foodCount < 2 && foodIdx >= 0 && player.gold >= foodItem.cost && player.inventory.length < 30) {
            console.log(`[Autoplay] Buying Food (${foodItem.name})`);
            window.buyItem(foodIdx);
            return;
        }

        // 3. Nothing else to do, close
        console.log(`[Autoplay] Done shopping. Closing modal.`);
        window.closeAllModals();
        player._didShopThisVisit = true; 
        player._townActionCooldown = 5; 
        return;
    }

    if (gameState === 'INNKEEPER') {
        if (player.hp < player.maxHp && player.gold >= 20) {
            console.log(`[Autoplay] Healing at Inn`);
            window.buyHeal();
        } else {
            console.log(`[Autoplay] Done healing. Closing modal.`);
            window.closeAllModals();
            player._didHealThisVisit = true; 
            player._townActionCooldown = 5;
        }
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
        if (!window._levelUpOpenedTime) window._levelUpOpenedTime = Date.now();
        
        // Wait 300ms before AI takes over (just enough for render)
        if (Date.now() - window._levelUpOpenedTime < 300) return;

        // Class-aware stat allocation
        const skillPointsEl = document.getElementById('ui-skill-points');
        const remaining = skillPointsEl ? parseInt(skillPointsEl.textContent) : 0;
        
        if (remaining > 0) {
            // Choose stat based on class for optimal builds
            let statChoice;
            if (player.class === 'Warrior') {
                // Warriors: prioritize STR for damage, then DEX for defense
                statChoice = player.stats.str <= player.stats.dex ? 'str' : (Math.random() < 0.7 ? 'str' : 'dex');
            } else if (player.class === 'Mage') {
                // Mages: prioritize INT for spell power, occasional DEX for survival
                statChoice = Math.random() < 0.8 ? 'int' : 'dex';
            } else {
                // Rogues: balanced DEX/STR with DEX slightly favored
                statChoice = Math.random() < 0.6 ? 'dex' : 'str';
            }
            
            if (typeof spendSkillPoint === 'function') {
                spendSkillPoint(statChoice);
                console.log(`[Autoplay] Level Up: +1 ${statChoice.toUpperCase()} (${player.class} build)`);
            }
        } else {
            const finishBtn = document.getElementById('btn-finish-levelup');
            if (finishBtn && finishBtn.style.display !== 'none') finishBtn.click();
        }
        return;
    } else {
        window._levelUpOpenedTime = 0;
    }
    
    if (gameState !== 'PLAYING') return;

    // --- STUCK DETECTION (Enhanced) ---
    const posKey = `${player.x},${player.y}`;
    window._autoplayPosHistory = window._autoplayPosHistory || [];
    window._autoplayPosHistory.push(posKey);
    if (window._autoplayPosHistory.length > 20) window._autoplayPosHistory.shift();

    // Detect loops: if we've been in the same position too many times in the last 20 turns
    const occurrences = window._autoplayPosHistory.filter(p => p === posKey).length;
    if (occurrences > 5) {
        window._autoplayStuckCounter++;
        if (window._autoplayStuckCounter % 10 === 0) console.log(`[Autoplay] Stuck detected! Counter: ${window._autoplayStuckCounter}`);
    } else {
        // Decrease counter slowly if we are moving
        if (window._autoplayStuckCounter > 0) window._autoplayStuckCounter--;
    }
    window._autoplayLastPos = posKey;

    // Decay target commitment
    if (window._autoplayCommitTTL > 0) window._autoplayCommitTTL--;
    if (window._autoplayCommitTTL <= 0) window._autoplayCommittedTarget = null;

    // AI Maintenance & Inventory Management
    if (player.inventory.length >= 28) {
        if (autoUseConsumables()) return;
        autoDropJunk();
    }

    // Priority 0: Emergency Recall (Survival & Inventory)
    if (currentFloor > 0) {
        // Reset town flags ONLY when first entering dungeon (not every tick!)
        if (!player._inDungeon) {
            player._didShopThisVisit = false; 
            player._didHealThisVisit = false;
            player._didBankThisVisit = false;
            player._townActionCooldown = 0;
            player._inDungeon = true;
        }
        const needsRecall = (player.hp < player.maxHp * 0.25) || (player.inventory.length >= 29);
        if (needsRecall) {
            const recallIdx = player.inventory.findIndex(i => i.name === 'Word of Recall');
            if (recallIdx >= 0) {
                console.log(`[Autoplay] Emergency Recall! HP: ${player.hp}/${player.maxHp}, Inv: ${player.inventory.length}`);
                window._autoplayCommittedTarget = null;
                window.useItem(recallIdx);
                return;
            }
        }
    }

    // Priority 0.5: Town Logic (If in Town)
    if (currentFloor === 0) {
        player._inDungeon = false; // Mark that we left the dungeon
        if (player._townActionCooldown > 0) player._townActionCooldown--;

        // a. Deposit gold in bank if we have a lot
        const shouldDeposit = player.gold > 200 && !player._didBankThisVisit;
        
        // b. Heal if damaged
        const needsToHeal = player.hp < player.maxHp && player.gold >= 20 && !player._didHealThisVisit;
        
        // c. Shop if full inventory or low on supplies
        const hasRecall = player.inventory.some(i => i.name === 'Word of Recall');
        const potionCount = player.inventory.filter(i => i.effect === 'heal' || i.effect === 'full_heal').length;
        const needsToShop = ((player.inventory.length >= 28) || !hasRecall || (potionCount < 1)) && !player._didShopThisVisit;

        let townTarget = null;
        let targetType = '';

        if (shouldDeposit && player._townActionCooldown <= 0) {
            targetType = 'bank';
        } else if (needsToHeal && player._townActionCooldown <= 0) {
            targetType = 'healer';
        } else if (needsToShop && player._townActionCooldown <= 0) {
            targetType = 'shop';
        } else {
            targetType = 'stairs_down';
        }

        for (let x=0; x<MAP_WIDTH; x++) {
            for (let y=0; y<MAP_HEIGHT; y++) {
                if (map[x][y].type === targetType) { townTarget = {x,y}; break; }
            }
            if (townTarget) break;
        }

        if (townTarget) {
            const dist = Math.abs(player.x - townTarget.x) + Math.abs(player.y - townTarget.y);
            if (dist <= 1 && targetType !== 'stairs_down') {
                console.log(`[Autoplay] Interacting with ${targetType} at ${townTarget.x},${townTarget.y}`);
                
                // Special: bank interaction (deposit all gold)
                if (targetType === 'bank') {
                    if (typeof openBank === 'function') {
                        // Direct deposit without opening modal
                        if (typeof depositGold === 'function') {
                            depositGold('all');
                            console.log(`[Autoplay] Deposited all gold in bank`);
                        }
                        player._didBankThisVisit = true;
                        player._townActionCooldown = 3;
                    }
                    return;
                }
                
                window.attemptAction(player, { type: 'move', dx: townTarget.x - player.x, dy: townTarget.y - player.y });
                return;
            }

            if (player.x === townTarget.x && player.y === townTarget.y) {
                if (targetType === 'stairs_down') {
                    console.log(`[Autoplay] Descending to dungeon...`);
                    window.checkStairs(player.x, player.y, true);
                    return;
                }
            } else {
                let path = window.findPath(player.x, player.y, townTarget.x, townTarget.y, true);
                if (path && path.length > 0) {
                    let next = path[0];
                    window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
                    return;
                } else {
                    console.log(`[Autoplay] No path to ${targetType}!`);
                }
            }
        }
    }

    // Priority 1: Healing
    if (player.hp < player.maxHp * 0.55) {
        const healIdx = player.inventory.findIndex(i => i.effect === 'heal' || i.effect === 'full_heal');
        if (healIdx >= 0) {
            window.useItem(healIdx);
            return;
        }
    }

    // Priority 1.5: Eat food when hungry (TomeNet hunger system)
    if (typeof player.food !== 'undefined' && player.food < 500) {
        const foodIdx = player.inventory.findIndex(i => i.effect === 'food' || i.effect === 'food_heal');
        if (foodIdx >= 0) {
            console.log(`[Autoplay] Eating ${player.inventory[foodIdx].name} (hunger: ${player.food})`);
            window.useItem(foodIdx);
            return;
        }
    }

    // Priority 2: Equip better gear
    if (window.autoPlayTurns % 20 === 0) {
        if (checkEquipment()) return;
    }

    const { target: monster, dist: mDist } = getNearestVisibleMonster();

    // Priority 3: Skill Usage
    if (player.skillCooldown <= 0 && player.energy >= 40) {
        if (player.class === 'Warrior' && monster && mDist <= 2) {
            if (typeof window.useClassSkill === 'function') {
                console.log("[Autoplay] Warrior casts Class Skill!");
                window.useClassSkill();
                return;
            }
        } else if (player.class === 'Mage' && monster && mDist <= 6) {
            if (typeof window.useClassSkill === 'function') {
                console.log("[Autoplay] Mage casts Class Skill!");
                window.useClassSkill();
                return;
            }
        } else if (player.class === 'Rogue' && monster && mDist <= 3) {
            if (typeof window.useClassSkill === 'function') {
                console.log("[Autoplay] Rogue casts Class Skill!");
                window.useClassSkill();
                return;
            }
        }
    }

    // Priority 3.5: Ranged Combat (Rogue and Mage shoot back)
    if (monster && mDist > 1 && mDist <= 6 && (player.class === 'Rogue' || player.class === 'Mage')) {
        const wepEffect = player.equipment.weapon?.effect;
        if ((wepEffect === 'bow' || wepEffect === 'crossbow') && player.ammo > 0) {
            if (typeof window.getLine === 'function') {
                const line = window.getLine(player.x, player.y, monster.x, monster.y);
                let clear = true;
                for (let i = 1; i < line.length - 1; i++) {
                    if (map[line[i].x][line[i].y].type === 'wall' || map[line[i].x][line[i].y].type === 'locked_door') {
                        clear = false;
                        break;
                    }
                }
                if (clear) {
                    window.targetX = monster.x;
                    window.targetY = monster.y;
                    if (typeof window.executeRangedAttack === 'function') {
                        window.executeRangedAttack();
                        return;
                    }
                }
            }
        }
    }

    // Priority 4: Melee combat (adjacent)
    const isAdjacent = monster && Math.abs(monster.x - player.x) <= 1 && Math.abs(monster.y - player.y) <= 1;
    if (isAdjacent) {
        isAutoExploring = false;
        window._autoplayCommittedTarget = null;
        window._autoplayCachedPath = null;
        window.attemptAction(player, { type: 'move', dx: monster.x - player.x, dy: monster.y - player.y });
        return;
    }
    
    // Priority 5: Chase visible monsters directly
    if (monster) {
        isAutoExploring = false;
        window._autoplayCachedPath = null; // Invalidate explore cache
        let path = window.findPath(player.x, player.y, monster.x, monster.y);
        if (!path || path.length === 0) {
            path = window.findPath(player.x, player.y, monster.x, monster.y, false, true);
        }
        if (path && path.length > 0) {
            window._autoplayCommittedTarget = { x: monster.x, y: monster.y, type: 'monster', ttl: 15 };
            window._autoplayCommitTTL = 15;
            let next = path[0];
            window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
            return;
        }
    }

    // Priority 6: Step on stairs if standing on them
    if (map[player.x][player.y].type === 'stairs_down') {
        window._autoplayCommittedTarget = null;
        window.checkStairs(player.x, player.y, true);
        return;
    }

    // --- TARGET COMMITMENT SYSTEM (with cached path for speed) ---
    // If we have a committed target, use cached path steps instead of re-pathfinding
    if (window._autoplayCommittedTarget && window._autoplayCommitTTL > 0) {
        const ct = window._autoplayCommittedTarget;
        
        // Reached target? Clear.
        if (player.x === ct.x && player.y === ct.y) {
            window._autoplayCommittedTarget = null;
            window._autoplayCommitTTL = 0;
            window._autoplayCachedPath = null;
        } else if (window._autoplayCachedPath && window._autoplayCachedPath.length > 0) {
            // Use cached path (fast — no pathfinding!)
            let next = window._autoplayCachedPath.shift();
            // Verify step is still valid (tile not blocked by new entity)
            if (next && map[next.x] && map[next.x][next.y]) {
                const tile = map[next.x][next.y];
                const ent = getEntityAt(next.x, next.y);
                const blocked = tile.type === 'wall' || (ent && ent.hp > 0 && !ent.isPlayer && !ent.isTownNPC && !ent.isMerchant);
                if (!blocked) {
                    window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
                    return;
                }
            }
            // Step invalid — re-pathfind once
            window._autoplayCachedPath = null;
            let path = window.findPath(player.x, player.y, ct.x, ct.y, true);
            if (path && path.length > 0) {
                window._autoplayCachedPath = path.slice(1); // cache remaining
                let step = path[0];
                window.attemptAction(player, { type: 'move', dx: step.x - player.x, dy: step.y - player.y });
                return;
            } else {
                window._autoplayCommittedTarget = null;
                window._autoplayCommitTTL = 0;
            }
        } else {
            // No cached path — compute one
            let path = window.findPath(player.x, player.y, ct.x, ct.y, true);
            if (path && path.length > 0) {
                window._autoplayCachedPath = path.slice(1);
                let step = path[0];
                window.attemptAction(player, { type: 'move', dx: step.x - player.x, dy: step.y - player.y });
                return;
            } else {
                window._autoplayCommittedTarget = null;
                window._autoplayCommitTTL = 0;
                window._autoplayCachedPath = null;
            }
        }
    }

    // Priority 7: Pick up nearby items (Only if we have space)
    const nearestItem = autoplayFindNearestItem();
    if (nearestItem) {
        if (player.inventory.length >= 30) {
            if (autoUseConsumables()) return;
            autoDropJunk();
        }
        
        if (player.inventory.length < 30 || nearestItem.type === 'gold') {
            let path = window.findPath(player.x, player.y, nearestItem.x, nearestItem.y);
            if ((!path || path.length === 0) && nearestItem.name === 'Dungeon Key') {
                path = window.findPath(player.x, player.y, nearestItem.x, nearestItem.y, false, true);
            }
            if (path && path.length > 0) {
                isAutoExploring = false;
                window._autoplayCommittedTarget = { x: nearestItem.x, y: nearestItem.y, type: 'item', ttl: 20 };
                window._autoplayCommitTTL = 20;
                window._autoplayCachedPath = path.slice(1); // Cache path
                let next = path[0];
                window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
                return;
            }
        }
    }

    // Priority 8: Yield to Native Fast-Explore (Spacebar logic)
    if (isAutoExploring) {
        return; // Engine is handling it via getPendingAction()
    }
    let path = window.findNearestUnexplored(player.x, player.y);
    if (path && path.length > 0) {
        isAutoExploring = true;
        activePath = path; // Initialize so getPendingAction doesn't re-run BFS immediately
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
                    window._autoplayCommittedTarget = { x: x, y: y, type: 'stairs', ttl: 50 };
                    window._autoplayCommitTTL = 50;
                    window._autoplayCachedPath = path.slice(1);
                    let next = path[0];
                    window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
                    return;
                }
            }
        }
    }

    // Priority 10: STUCK — random walk to break loops
    if (window._autoplayStuckCounter > 15) {
        let allDirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
        let safeDirs = allDirs.filter(d => {
            let tx = player.x + d[0]; let ty = player.y + d[1];
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false;
            let tile = map[tx][ty];
            if (!tile || tile.type === 'wall' || tile.type === 'locked_door') return false;
            if (window._autoplayStuckCounter < 100 && (tile.type === 'lava' || tile.type === 'gas')) return false;
            return true;
        });
        if (safeDirs.length === 0) safeDirs = allDirs;
        let d = safeDirs[Math.floor(Math.random() * safeDirs.length)];
        console.log(`[Autoplay] Stuck loop! Force move: ${d[0]},${d[1]}`);
        window.attemptAction(player, { type: 'move', dx: d[0], dy: d[1] });
        return;
    }
}
