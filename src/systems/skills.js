/**
 * 🌸 Rogue Reborn — Phase V Class Skills & Magic
 * Contains logic for Q-skills, AoE calculations, and Line of Sight.
 */

window.SKILL_COOLDOWNS = {
    'Warrior': 40,
    'Rogue': 30,
    'Mage': 60
};

window.getLineOfSight = function(x0, y0, x1, y1) {
    let pts = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        pts.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    return pts;
};

window.useClassSkill = function() {
    if (player.skillCooldown > 0) {
        logMessage(`Skill is on cooldown! (${player.skillCooldown} actions left)`, 'damage');
        return;
    }
    
    if (player.class === 'Warrior') {
        if (player.level >= 5) castBerserk();
        else castCleave();
    } else if (player.class === 'Rogue') {
        if (player.level >= 5) castVanish();
        else castDash();
    } else if (player.class === 'Mage') {
        targetX = player.x; targetY = player.y;
        activeSpell = 'fireball_skill';
        activeItemIndex = -1;
        gameState = 'TARGETING';
        logMessage("Select target for Fireball (AoE) - F or Enter to fire", "hint");
        render(); 
    }
};

window.castCleave = function() {
    logMessage("You swing your weapon in a massive arc! CLEAVE!", 'magic');
    spawnParticle(player.x, player.y, "CLEAVE!", '#f1c40f');
    
    const dmg = Math.max(1, Math.floor(getEffectiveAtk() * 0.8)); // 80% damage
    let hits = 0;
    
    for (let e of entities) {
        if (!e.isPlayer && e.hp > 0) {
            // Hit all adjacent
            if (Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1) {
                e.hp -= dmg;
                spawnParticle(e.x, e.y, `-${dmg}`, '#f1c40f');
                hits++;
                if (e.hp <= 0) handleMonsterDeath(e);
            }
        }
    }
    
    if (hits > 0) logMessage(`Cleave strikes ${hits} enemies!`, 'kill');
    player.skillCooldown = SKILL_COOLDOWNS['Warrior'];
    player.energy -= ENERGY_THRESHOLD;
    updateUI();
};

window.castDash = function() {
    targetX = player.x; targetY = player.y;
    activeSpell = 'dash_skill';
    activeItemIndex = -1;
    gameState = 'TARGETING';
    logMessage("Select direction to Dash - F or Enter to execute", "hint");
    render();
};

window.executeDash = function(tx, ty) {
    if (tx === player.x && ty === player.y) {
        gameState = 'PLAYING';
        return;
    }
    
    let dx = Math.sign(tx - player.x);
    let dy = Math.sign(ty - player.y);
    
    let hitCount = 0;
    let dist = 0;
    let dmg = getEffectiveAtk() * 1.5; // 150% damage pierce
    
    for (let i = 1; i <= 3; i++) {
        let nx = player.x + dx;
        let ny = player.y + dy;
        
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT || map[nx][ny].type === 'wall' || map[nx][ny].type === 'locked_door') {
            break;
        }
        
        player.x = nx;
        player.y = ny;
        dist++;
        spawnParticle(player.x, player.y, '-', '#bd93f9');
        
        let ent = getEntityAt(player.x, player.y);
        if (ent && !ent.isPlayer && ent.hp > 0) {
            ent.hp -= dmg;
            spawnParticle(ent.x, ent.y, `-${dmg} PIERCE`, '#bd93f9');
            hitCount++;
            if (ent.hp <= 0) handleMonsterDeath(ent);
        }
    }
    
    if (dist > 0) {
        logMessage(`You dashed ${dist} tiles and pierced ${hitCount} enemies.`, 'magic');
        player.skillCooldown = SKILL_COOLDOWNS['Rogue'];
        player.energy -= ENERGY_THRESHOLD;
    } else {
        logMessage("Path blocked!", 'damage');
    }
    
    computeFOV();
    gameState = 'PLAYING';
    updateUI();
};

window.executeFireball = function(tx, ty) {
    let los = getLineOfSight(player.x, player.y, tx, ty);
    let hitX = tx; let hitY = ty;
    
    for (let pt of los) {
        if (map[pt.x] && map[pt.x][pt.y] && (map[pt.x][pt.y].type === 'wall' || map[pt.x][pt.y].type === 'locked_door')) {
            hitX = pt.x; hitY = pt.y; // detonate on wall
            break;
        }
    }
    
    logMessage(`A massive fireball erupts!`, 'magic');
    spawnParticle(hitX, hitY, 'BOOM!', '#e74c3c');
    
    let dmg = Math.floor(getEffectiveAtk() + player.level * 2 + 15);
    
    for (let x = hitX - 1; x <= hitX + 1; x++) {
        for (let y = hitY - 1; y <= hitY + 1; y++) {
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                if (map[x][y].type !== 'wall' && map[x][y].type !== 'locked_door') {
                    spawnParticle(x, y, '*', '#e67e22');
                    let ent = getEntityAt(x, y);
                    if (ent && !ent.isPlayer && ent.hp > 0) {
                        ent.hp -= dmg;
                        spawnParticle(ent.x, ent.y, `-${dmg}`, '#e74c3c');
                        if (ent.hp <= 0) handleMonsterDeath(ent);
                    }
                    // Self-damage if caught in blast
                    if (x === player.x && y === player.y) {
                        let sdmg = Math.floor(dmg / 2);
                        player.hp -= sdmg;
                        logMessage("You are burned by your own spell!", 'damage');
                        spawnParticle(player.x, player.y, `-${sdmg}`, '#e74c3c');
                        if (player.hp <= 0) handleDeath();
                    }
                }
            }
        }
    }
    
    player.skillCooldown = SKILL_COOLDOWNS['Mage'];
    player.energy -= ENERGY_THRESHOLD;
    gameState = 'PLAYING';
    updateUI();
};
window.castBerserk = function() {
    logMessage("RAAAAAGH! You enter a primal BERSERK rage!", 'kill');
    spawnParticle(player.x, player.y, "BERSERK!", '#e74c3c');
    
    player.berserkTimer = 20;
    player.skillCooldown = SKILL_COOLDOWNS['Warrior'] * 1.5;
    player.energy -= ENERGY_THRESHOLD;
    updateUI();
};

window.castVanish = function() {
    logMessage("You vanish into the shadows...", 'magic');
    spawnParticle(player.x, player.y, "VANISH", '#333');
    
    player.invisible = true;
    player.vanishTimer = 15;
    player.skillCooldown = SKILL_COOLDOWNS['Rogue'] * 1.2;
    player.energy -= ENERGY_THRESHOLD;
    updateUI();
};
