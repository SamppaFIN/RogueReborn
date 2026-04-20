/**
 * Rogue Reborn - Autoplay Interface
 * Built-in AI module for testing and user automated gameplay (idle gaming).
 */

window.isAutoPlayActive = false;
window.autoPlayTurns = 0;

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

function processAutoPlay() {
    if (gameState === 'START' || gameState.includes('MENU') || gameState === 'INVENTORY' || gameState === 'QUEST_JOURNAL') {
        if (window.closeAllModals) window.closeAllModals();
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
            // Nobody around, cancel
            keys['Escape'] = true;
            setTimeout(() => { keys['Escape'] = false; }, 10);
        }
        return;
    }

    if (gameState === 'LEVEL_UP') {
        // Automatically pick the first available stat / skill randomly
        const buttons = document.querySelectorAll('#levelUpModal button, #skillModal button');
        // Filter out finish buttons that might not be stats
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

    // Priority 4: Movement / Combat
    const isAdjacent = monster && Math.abs(monster.x - player.x) <= 1 && Math.abs(monster.y - player.y) <= 1;
    if (isAdjacent) {
        window.attemptAction(player, { type: 'move', dx: monster.x - player.x, dy: monster.y - player.y });
        return;
    } else if (monster) {
        // AI specifically pathfinds to visible monsters instead of relying on Auto-explore
        let path = window.findPath(player.x, player.y, monster.x, monster.y);
        if (path && path.length > 0) {
            let next = path.shift();
            window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
            return;
        }
    } else if (map[player.x][player.y].type === 'stairs_down') {
        window.checkStairs(player.x, player.y, true);
        return;
    }

    // Try to auto-explore via built-in system
    keys['o'] = true;
    
    // Stuck override fallback
    if (window.autoPlayTurns % 100 === 0 && (!window.activePath || window.activePath.length === 0)) {
        let dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        // Filter out hazard tiles if possible
        let safeDirs = dirs.filter(d => {
            let tx = player.x + d[0]; let ty = player.y + d[1];
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false;
            let tile = map[tx][ty];
            return tile && tile.type !== 'lava' && tile.type !== 'gas';
        });
        if (safeDirs.length === 0) safeDirs = dirs; // Force move if completely surrounded
        let d = safeDirs[Math.floor(Math.random() * safeDirs.length)];
        window.attemptAction(player, { type: 'move', dx: d[0], dy: d[1] });
    }
}
