/**
 * 🌸 Rogue Reborn — Input & Targeting
 * Mouse/keyboard handlers, getPendingAction, spell/ranged targeting, getLine.
 * Extracted from engine.js for modularity.
 */

// --- Line-of-Sight / Bresenham ---
function getLine(x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    let line = [];

    while (true) {
        line.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    return line;
}

// --- Mouse Input ---
canvas.addEventListener('mousemove', e => {
    if (gameState === 'TARGETING') {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cx = Math.floor(canvas.width / 2);
        const cy = Math.floor(canvas.height / 2);
        const offsetX = cx - cameraX;
        const offsetY = cy - cameraY;

        let tx = Math.floor((x - offsetX) / TILE_SIZE);
        let ty = Math.floor((y - offsetY) / TILE_SIZE);

        tx = Math.max(0, Math.min(MAP_WIDTH - 1, tx));
        ty = Math.max(0, Math.min(MAP_HEIGHT - 1, ty));

        targetX = tx; targetY = ty;
        render();
        return;
    }

    // Hover tracker for tooltips
    if (gameState !== 'PLAYING') {
        hoverX = -1; hoverY = -1;
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const offsetX = Math.floor(cx - cameraX);
    const offsetY = Math.floor(cy - cameraY);

    const tx = Math.floor((x - offsetX) / TILE_SIZE);
    const ty = Math.floor((y - offsetY) / TILE_SIZE);

    if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
        hoverX = tx; hoverY = ty;
    } else {
        hoverX = -1; hoverY = -1;
    }
});

canvas.addEventListener('mousedown', e => {
    if (gameState === 'TARGETING') {
        executeTargetSpell();
        return;
    }
    if (gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);
    const offsetX = cx - cameraX;
    const offsetY = cy - cameraY;

    const tx = Math.floor((x - offsetX) / TILE_SIZE);
    const ty = Math.floor((y - offsetY) / TILE_SIZE);

    if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
        if (e.button === 2) { // Right click inspect
            const ent = getEntityAt(tx, ty);
            if (ent) logMessage(`Inspect: ${ent.name} (${ent.hp}/${ent.maxHp} HP)`, 'magic');
            const item = getItemAt(tx, ty);
            if (item) logMessage(`Inspect: ${item.name}`, 'magic');
            if (!ent && !item) logMessage(`Inspect: ${map[tx][ty].type.replace('_', ' ')}`);
        } else if (e.button === 0) { // Left click move
            if (!map[tx][ty].explored) {
                logMessage("You cannot path into the unknown.", 'damage');
                return;
            }
            if (map[tx][ty].type === 'wall') {
                logMessage("Cannot path into walls.", 'hint');
                return;
            }
            activePath = findPath(player.x, player.y, tx, ty);
            isAutoRunning = false;
            if (activePath && activePath.length > 0) {
                logMessage("Pathfinding...", "magic");
            }
        }
    }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mouseleave', () => { hoverX = -1; hoverY = -1; });

// --- Keyboard Input ---
window.addEventListener('keydown', e => {
    keys[e.key] = true;

    // Close Modals
    if (e.key === 'Escape') {
        closeAllModals();
        if (gameState === 'TARGETING' || gameState === 'RANGED_TARGETING') {
            logMessage("Cancelled action.", "hint");
            gameState = 'PLAYING';
            render();
        }
    }

    if (e.key === 'i' || e.key === 'I') {
        if (gameState === 'PLAYING') openInventory();
        else if (gameState === 'INVENTORY') closeInventory();
        return;
    }

    if (gameState === 'TARGETING') {
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === '8') dy = -1;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === '2') dy = 1;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === '4') dx = -1;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === '6') dx = 1;

        if (dx !== 0 || dy !== 0) {
            targetX = Math.max(0, Math.min(MAP_WIDTH - 1, targetX + dx));
            targetY = Math.max(0, Math.min(MAP_HEIGHT - 1, targetY + dy));
            render();
            return;
        }

        if (e.key === 'Enter') {
            executeTargetSpell();
            return;
        }
        if (e.key === 'Escape') {
            logMessage("Cancelled targeting.", "hint");
            gameState = 'PLAYING';
            render();
            return;
        }
    }

    if (gameState === 'RANGED_TARGETING') {
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === '8') dy = -1;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === '2') dy = 1;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === '4') dx = -1;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === '6') dx = 1;

        if (dx !== 0 || dy !== 0) {
            targetX = Math.max(0, Math.min(MAP_WIDTH - 1, targetX + dx));
            targetY = Math.max(0, Math.min(MAP_HEIGHT - 1, targetY + dy));
            render();
            return;
        }

        if (e.key === 'f' || e.key === 'F' || e.key === 'Enter') {
            executeRangedAttack();
            return;
        }
        if (e.key === 'Escape') {
            logMessage("Cancelled fire.", "hint");
            gameState = 'PLAYING';
            render();
            return;
        }
    }

    if (e.key === 't' || e.key === 'T') {
        // #12 Polearm reach attack
        if (gameState === 'PLAYING') {
            const wep = player.equipment.weapon;
            if (!wep || !wep.reach) {
                return;
            }
            const reachTargets = entities.filter(en => !en.isPlayer && en.hp > 0 &&
                Math.abs(en.x - player.x) <= wep.reach && Math.abs(en.y - player.y) <= wep.reach &&
                (Math.abs(en.x - player.x) + Math.abs(en.y - player.y)) > 1);
            if (reachTargets.length > 0) {
                const tgt = reachTargets[0];
                let atkPower = getEffectiveAtk();
                let defPower = tgt.def;
                let dmg = Math.max(1, atkPower - defPower + Math.floor(Math.random() * 3));
                tgt.hp -= dmg;
                spawnParticle(tgt.x, tgt.y, `-${dmg}`, '#95a5a6');
                logMessage(`You thrust your ${wep.name} at ${tgt.name} for ${dmg}!`, 'magic');
                if (tgt.hp <= 0) handleMonsterDeath(tgt);
                player.energy -= ENERGY_THRESHOLD;
                updateUI();
            } else {
                logMessage("No target in reach range (2 tiles). Move into range!", 'hint');
            }
        }
        return;
    }

    if (e.key === 'q' || e.key === 'Q') {
        if (gameState === 'PLAYING') {
            if (typeof useClassSkill === 'function') {
                useClassSkill();
            }
        }
        return;
    }

    if (e.key === 'f' || e.key === 'F') {
        if (gameState === 'PLAYING') {
            const wepEffect = player.equipment.weapon?.effect;
            if (!player.equipment.weapon || (wepEffect !== 'bow' && wepEffect !== 'crossbow')) {
                logMessage("You need a bow or crossbow to fire!", "damage");
                return;
            }
            if (player.ammo <= 0) {
                logMessage(wepEffect === 'crossbow' ? "Out of bolts!" : "Out of arrows!", "damage");
                return;
            }
            const nearest = getNearestMonster(player.x, player.y);
            if (nearest && !e.shiftKey) {
                targetX = nearest.x;
                targetY = nearest.y;
                executeRangedAttack(); // Instant Auto-fire
            } else {
                gameState = 'RANGED_TARGETING';
                targetX = nearest ? nearest.x : player.x;
                targetY = nearest ? nearest.y : player.y;
                logMessage("Targeting... (f to fire)", "hint");
                render();
            }
        }
        return;
    }

    // Inventory selection (1-9)
    if (gameState === 'PLAYING' && e.key >= '1' && e.key <= '9' && !e.altKey) {
        const index = parseInt(e.key) - 1;
        if (player.inventory[index]) {
            useItem(index);
        }
    }

    // Explicit Stairs
    if (gameState === 'PLAYING' && e.key === '>') {
        checkStairs(player.x, player.y, true);
    }
    if (gameState === 'PLAYING' && e.key === '<') {
        checkStairs(player.x, player.y, true);
    }

    // Explicit Pickup
    if (gameState === 'PLAYING' && (e.key === 'g' || e.key === ',')) {
        collectItems(player.x, player.y);
    }

    // --- DEBUG AUTOMATION SUITE (Alt + 1-8) ---
    if (e.altKey && gameState === 'PLAYING') {
        if (e.key === '1') { // Skip Floor
            currentFloor++;
            logMessage(`DEBUG: Skipping to Dungeon Level ${currentFloor}`, 'magic');
            generateDungeon();
            computeFOV();
            updateUI();
        }
        if (e.key === '2') { // Add Gold
            player.gold += 1000;
            logMessage("DEBUG: Added 1000 Gold.", "pickup");
            updateUI();
        }
        if (e.ctrlKey && e.key === '3') { // Full Heal
            player.hp = player.maxHp;
            logMessage("DEBUG: Full Heal Applied.", "magic");
            updateUI();
        }
        if (e.ctrlKey && e.key === '4') { // Level Up
            player.xp += 1000;
            logMessage("DEBUG: Added 1000 XP.", "magic");
            updateUI();
        }
        if (e.ctrlKey && e.key === '5') { // Reveal Map
            for (let x = 0; x < MAP_WIDTH; x++) {
                for (let y = 0; y < MAP_HEIGHT; y++) map[x][y].explored = true;
            }
            logMessage("DEBUG: Map Revealed.", "hint");
            render();
        }
        if (e.ctrlKey && e.key === '6') { // Nuke Floor
            entities.forEach(ent => {
                if (!ent.isPlayer && ent.hp > 0) {
                    ent.hp = 0;
                    ent.char = '%'; ent.color = '#888'; ent.blocksMovement = false;
                    ent.name = `${ent.name} remains`;
                }
            });
            logMessage("DEBUG: Floor Nuked!", "damage");
            render();
        }
        if (e.ctrlKey && e.key === '7') { // God Gear
            const gear = [
                ITEM_DB.find(i => i.name === 'Vorpal Sword'),
                ITEM_DB.find(i => i.name === 'Mithril Plate'),
                ITEM_DB.find(i => i.name === 'Helm of Telepathy')
            ];
            gear.forEach(i => {
                if (i) {
                    const instance = { ...i, identified: true };
                    player.inventory.push(instance);
                    let slot = instance.effect === 'esp' ? 'helm' : instance.type;
                    player.equipment[slot] = instance;
                    if (instance.effect === 'esp') player.hasESP = true;
                }
            });
            logMessage("DEBUG: God Gear Equipped.", "magic");
            updateUI();
        }
        if (e.ctrlKey && e.key === '8') { // Recall to Town
            currentFloor = 0;
            generateTown();
            logMessage("DEBUG: Recalled to Town.", "magic");
            computeFOV();
            updateUI();
        }
    }

    // 's' — #33 Search for secret rooms
    if (e.key === 's' && gameState === 'PLAYING') {
        const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
        let found = false;
        for (const [dx, dy] of dirs) {
            const sx = player.x + dx, sy = player.y + dy;
            if (sx >= 0 && sx < MAP_WIDTH && sy >= 0 && sy < MAP_HEIGHT && map[sx][sy].type === 'secret_wall') {
                map[sx][sy].type = 'floor'; map[sx][sy].char = CHARS.FLOOR;
                logMessage('You find a secret cache!', 'magic');
                spawnParticle(player.x, player.y, 'SECRET!', '#f1c40f');
                if (map[sx][sy].secretCache) spawnRandomItemAt(sx, sy);
                found = true;
            }
        }
        if (!found) logMessage('You search but find nothing.', 'hint');
        player.energy -= ENERGY_THRESHOLD;
    }

    // F5 — Save Game, F9 — Load Game
    if (e.key === 'F5' && gameState === 'PLAYING') { e.preventDefault(); saveGame(); }
    if (e.key === 'F9' && gameState === 'PLAYING') { e.preventDefault(); loadGame(); }

    if (gameState === 'PLAYING') {
        if (e.key === '<') {
            if (map[player.x][player.y].type === 'stairs_up') {
                checkStairs(player.x, player.y, true);
            } else {
                logMessage("There are no stairs up here.", "hint");
            }
        }
        if (e.key === '>') {
            if (map[player.x][player.y].type === 'stairs_down') {
                checkStairs(player.x, player.y, true);
            } else {
                logMessage("There are no stairs down here.", "hint");
            }
        }
        if (e.key === 'Enter') {
            if (map[player.x][player.y].type === 'stairs_down' || map[player.x][player.y].type === 'stairs_up') {
                checkStairs(player.x, player.y, true);
            }
        }
    }
});

window.addEventListener('keyup', e => {
    keys[e.key] = false;
});
window.addEventListener('blur', () => {
    for (let k in keys) keys[k] = false;
});
window.addEventListener('resize', resizeCanvas);

// --- Player Action Detection ---
function getPendingAction() {
    let dx = 0; let dy = 0;

    let cancelKeysPressed = false;
    const cancelKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'Escape'];
    for (let k of cancelKeys) {
        if (keys[k]) cancelKeysPressed = true;
    }

    // Cancel pathing/running/exploring on any directional keypress
    if (cancelKeysPressed) {
        activePath = null;
        isAutoRunning = false;
        isAutoExploring = false;
    }

    // Process active path if no cancel keys pressed
    if (activePath && activePath.length > 0) {
        const nextNode = activePath.shift();
        return { type: 'move', dx: nextNode.x - player.x, dy: nextNode.y - player.y };
    }

    // WASD Simultaneous Diagonals
    if (keys['w'] || keys['W'] || keys['ArrowUp'] || keys['8']) dy -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown'] || keys['2']) dy += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft'] || keys['4']) dx -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight'] || keys['6']) dx += 1;

    // Numpad exact diagonals overrides
    if (keys['7']) { dx = -1; dy = -1; }
    if (keys['9']) { dx = 1; dy = -1; }
    if (keys['1']) { dx = -1; dy = 1; }
    if (keys['3']) { dx = 1; dy = 1; }

    dx = Math.sign(dx);
    dy = Math.sign(dy);

    if (dx !== 0 || dy !== 0) {
        if (keys['Shift']) {
            isAutoRunning = true;
            runDirX = dx;
            runDirY = dy;
        }
        return { type: 'move', dx, dy };
    }

    if (keys[' '] || keys['5']) {
        // Auto-attack adjacent
        for (let e of entities) {
            if (!e.isPlayer && e.hp > 0 && Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1) {
                return { type: 'move', dx: e.x - player.x, dy: e.y - player.y };
            }
        }
        if (keys['5']) return { type: 'wait' };
        if (keys[' '] && !isAutoExploring) {
            isAutoExploring = true;
            activePath = null;
        }
    }
    if ((keys['o'] || keys['O']) && !isAutoExploring) {
        isAutoExploring = true;
        activePath = null;
    }

    // Persistent auto-explore
    if (isAutoExploring) {
        if (player.hp <= Math.floor(player.maxHp * 0.3)) {
            isAutoExploring = false;
            logMessage("Auto-explore halted — low HP!", "damage");
            return null;
        }
        if (!activePath || activePath.length === 0) {
            const now = performance.now();
            if (typeof lastAutoExploreCheck === 'undefined' || now - lastAutoExploreCheck > 25) {
                lastAutoExploreCheck = now;

                let path = findNearestUnexplored(player.x, player.y);

                // Floor 0 (Town) specific: explicitly target stairs if no unexplored tiles found
                if (!path && currentFloor === 0) {
                    for(let x=0; x<MAP_WIDTH; x++) {
                        for(let y=0; y<MAP_HEIGHT; y++) {
                            if (map[x][y].type === 'stairs_down') {
                                path = findPath(player.x, player.y, x, y);
                                break;
                            }
                        }
                        if (path) break;
                    }
                }

                if (path && path.length > 0) {
                    activePath = path;
                } else {
                    isAutoExploring = false;
                    logMessage("Nothing left to explore!", "hint");
                    return null;
                }
            } else {
                return null;
            }
        }
        return null;
    }

    // Auto-retaliate
    if (player.lastAttackedBy && player.lastAttackedBy.hp > 0 && Math.abs(player.lastAttackedBy.x - player.x) <= 1 && Math.abs(player.lastAttackedBy.y - player.y) <= 1) {
        return { type: 'move', dx: player.lastAttackedBy.x - player.x, dy: player.lastAttackedBy.y - player.y };
    }

    return null;
}

// --- Spell Targeting ---
function executeTargetSpell() {
    gameState = 'PLAYING';
    
    // Phase V: Class Skills routing
    if (activeSpell === 'dash_skill') {
        if (typeof executeDash === 'function') executeDash(targetX, targetY);
        return;
    }
    if (activeSpell === 'fireball_skill') {
        if (typeof executeFireball === 'function') executeFireball(targetX, targetY);
        return;
    }

    const item = player.inventory[activeItemIndex];
    if (!item || item.charges <= 0) return;

    item.charges--;
    const spellBoostBonus = player.equipment.armor?.spellBoost || 0;
    logMessage(`You fire a ${activeSpell}!`, 'magic');

    const line = getLine(player.x, player.y, targetX, targetY);
    let hitEntity = null;
    let hx = player.x, hy = player.y;

    for (let i = 1; i < line.length; i++) {
        const pt = line[i];
        if (map[pt.x][pt.y].type === 'wall') {
            hx = pt.x; hy = pt.y;
            break;
        }
        const e = getEntityAt(pt.x, pt.y);
        if (e) {
            hitEntity = e;
            hx = pt.x; hy = pt.y;
            break;
        }
        hx = pt.x; hy = pt.y;
        spawnParticle(pt.x, pt.y, "*", "#9b59b6");
    }

    if (hitEntity) {
        const lvlBonus = player.spellMastery ? player.level * 2 : 0;
        let spellDmg = 0;
        let spellColor = '#bd93f9';
        const sp = activeSpell;
        if (sp === 'magic_missile') { spellDmg = 10 + Math.floor(Math.random() * 5) + spellBoostBonus + lvlBonus; }
        else if (sp === 'frost') {
            logMessage(`Frost Nova erupts!`, 'magic');
            for (let x = hx - 1; x <= hx + 1; x++) {
                for (let y = hy - 1; y <= hy + 1; y++) {
                    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                        spawnParticle(x, y, '*', '#3498db');
                        let ent = getEntityAt(x, y);
                        if (ent && !ent.isPlayer && ent.hp > 0) {
                            ent.speed = Math.max(2, ent.speed - 5);
                            ent.paralyzedTimer = (ent.paralyzedTimer || 0) + 5;
                            logMessage(`${ent.name} is frozen!`, 'magic');
                            ent.hp -= (5 + spellBoostBonus + lvlBonus);
                            spawnParticle(ent.x, ent.y, `-Frozen`, '#3498db');
                            if (ent.hp <= 0) handleMonsterDeath(ent);
                        }
                    }
                }
            }
            hitEntity = null; // Prevent the single-target damage block below from running
        }
        else if (sp === 'lightning') {
            spellDmg = 15 + Math.floor(Math.random() * 6) + spellBoostBonus + lvlBonus;
            spellColor = '#f1c40f';
            const adjChain = entities.find(e => !e.isPlayer && e.hp > 0 && e !== hitEntity &&
                Math.abs(e.x - hitEntity.x) <= 2 && Math.abs(e.y - hitEntity.y) <= 2);
            if (adjChain) {
                const chainDmg = Math.floor(spellDmg * 0.6);
                adjChain.hp -= chainDmg;
                spawnParticle(adjChain.x, adjChain.y, `-${chainDmg} CHAIN`, '#f1c40f');
                logMessage(`Lightning chains to ${adjChain.name}!`, 'magic');
                if (adjChain.hp <= 0) handleMonsterDeath(adjChain);
            }
        }
        else if (sp === 'slow_bolt')  { spellDmg = 5; hitEntity.speed = Math.max(2, hitEntity.speed - 4); logMessage(`${hitEntity.name} is slowed!`, 'magic'); spellColor = '#2ecc71'; }
        else if (sp === 'drain_life') {
            spellDmg = 12 + Math.floor(Math.random() * 5) + spellBoostBonus + lvlBonus;
            player.hp = Math.min(player.maxHp, player.hp + Math.floor(spellDmg / 2));
            spawnParticle(player.x, player.y, `+${Math.floor(spellDmg/2)} HP`, '#2ecc71');
            spellColor = '#e74c3c';
        }
        else if (sp === 'fire_bolt')  { spellDmg = 14 + Math.floor(Math.random() * 6) + spellBoostBonus + lvlBonus; spellColor = '#e67e22'; }
        else if (sp === 'arcane_blast') { spellDmg = 20 + Math.floor(Math.random() * 10) + spellBoostBonus + lvlBonus; spellColor = '#9b59b6'; }
        else { spellDmg = 10 + Math.floor(Math.random() * 5) + spellBoostBonus + lvlBonus; }

        hitEntity.hp -= spellDmg;
        spawnParticle(hitEntity.x, hitEntity.y, `-${spellDmg}`, spellColor);
        logMessage(`The ${sp.replace('_',' ')} hits ${hitEntity.name}!`, 'magic');
        if (hitEntity.hp <= 0) {
            handleMonsterDeath(hitEntity);
        }
    } else {
        logMessage(`The missile hits the wall.`, 'hint');
    }

    if (item.charges <= 0) {
        logMessage(`${item.name} crumbles to dust.`, 'damage');
        player.inventory.splice(activeItemIndex, 1);
    }

    player.energy -= ENERGY_THRESHOLD;
    updateUI();
    render();
}

// --- Ranged Attack ---
function executeRangedAttack() {
    gameState = 'PLAYING';
    if (player.ammo <= 0) return;

    // #17 Heavy Crossbow reload mechanic
    const wep = player.equipment.weapon;
    if (wep && wep.effect === 'crossbow') {
        if (player.reloading > 0) {
            logMessage(`Reloading... (${player.reloading} turns left)`, 'hint');
            player.reloading--;
            player.energy -= ENERGY_THRESHOLD;
            return;
        }
        player.reloading = 2;
    }

    player.ammo--;
    logMessage(wep && wep.effect === 'crossbow' ? "You fire a bolt!" : "You loose an arrow!", 'pickup');

    const line = getLine(player.x, player.y, targetX, targetY);
    let hitEntity = null;
    let hx = player.x, hy = player.y;

    for (let i = 1; i < line.length; i++) {
        const pt = line[i];
        if (map[pt.x][pt.y].type === 'wall') {
            hx = pt.x; hy = pt.y;
            break;
        }
        const e = getEntityAt(pt.x, pt.y);
        if (e) {
            hitEntity = e;
            hx = pt.x; hy = pt.y;
            break;
        }
        hx = pt.x; hy = pt.y;
    }

    if (hitEntity) {
        let baseAtk = player.atk + (player.equipment.weapon.atkBonus || 0);
        let dist = Math.sqrt(Math.pow(hitEntity.x - player.x, 2) + Math.pow(hitEntity.y - player.y, 2));
        let falloff = Math.max(0.5, 1.0 - (dist * 0.05));
        let dmg = Math.max(1, Math.floor(baseAtk * falloff) - hitEntity.def + (Math.floor(Math.random() * 3) - 1));

        hitEntity.hp -= dmg;
        spawnParticle(hitEntity.x, hitEntity.y, `-${dmg}`, '#ecf0f1');
        logMessage(`Arrow hits ${hitEntity.name} for ${dmg}!`, 'magic');
        if (hitEntity.hp <= 0) {
            handleMonsterDeath(hitEntity);
        }
    }

    player.energy -= ENERGY_THRESHOLD;
    updateUI();
    render();
}
