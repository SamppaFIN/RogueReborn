/**
 * Rogue Reborn - AI & Pathfinding
 * Monster AI, A* pathfinding, exploration algorithms.
 * Extracted from engine.js for modularity.
 *
 * Batch 9: Pack Mentality, Retreat Logic, Ambusher AI, Support Units, Boss Phases
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

// ============================================================
// Batch 9: AI Helper Functions
// ============================================================

// #41 Pack Mentality — Enhanced Alert System
function handlePackAlert(e, dist, visible) {
    let baseName = e.name.replace('Elite ', '').replace('Mini-Boss ', '');
    let template = typeof ENEMY_TYPES !== 'undefined' ? ENEMY_TYPES.find(t => t.name === baseName) : null;
    let isPack = (e.personality === 'pack') || (template && template.personality === 'pack');
    if (!isPack) return false;

    // Trigger alert when pack member first spots the player
    if (visible && !e.packAlerted && !e.sleeping) {
        e.packAlerted = true;

        // Cascade alert to all nearby pack members within radius 10
        entities.forEach(other => {
            if (other === e || other.isPlayer || other.hp <= 0) return;
            const odist = Math.abs(other.x - e.x) + Math.abs(other.y - e.y);
            if (odist > 10) return;

            let oBase = other.name.replace('Elite ', '').replace('Mini-Boss ', '');
            let oTemp = typeof ENEMY_TYPES !== 'undefined' ? ENEMY_TYPES.find(t => t.name === oBase) : null;
            let oIsPack = (other.personality === 'pack') || (oTemp && oTemp.personality === 'pack');

            if (oIsPack && !other.packAlerted) {
                other.packAlerted = true;
                other.sleeping = false;
                other.alertTarget = { x: player.x, y: player.y };
                other.alertSpeedBoost = 10; // 10 tick speed boost
                spawnParticle(other.x, other.y, '!', '#e74c3c');
            }
        });

        if (dist < 10) {
            logMessage(`${e.name} alerts the pack!`, 'damage');
            spawnParticle(e.x, e.y, 'RALLY!', '#e74c3c');
        }
    }

    // Apply speed boost decay
    if (e.alertSpeedBoost && e.alertSpeedBoost > 0) {
        e.alertSpeedBoost--;
    }

    // Move toward alert target if not seeing player directly
    if (e.alertTarget && !visible) {
        const adx = e.alertTarget.x - e.x;
        const ady = e.alertTarget.y - e.y;
        if (Math.abs(adx) + Math.abs(ady) <= 1) {
            e.alertTarget = null; // Arrived at alert point
        } else {
            let mdx = 0, mdy = 0;
            if (Math.abs(adx) > Math.abs(ady)) mdx = Math.sign(adx);
            else mdy = Math.sign(ady);
            attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
            return true; // Handled
        }
    }
    return false; // Not handled, continue normal AI
}

// #42 Retreat Logic — Smart Flee
function handleRetreat(e, dist) {
    let hpRatio = e.hp / e.maxHp;
    let baseName = e.name.replace('Elite ', '').replace('Mini-Boss ', '');
    let template = typeof ENEMY_TYPES !== 'undefined' ? ENEMY_TYPES.find(t => t.name === baseName) : null;
    let pers = e.personality || (template && template.personality) || null;

    // Bosses don't retreat
    if (e.miniBoss || e.bossPhases) return false;

    // Cowardly retreats at <50% HP always, others at <30% with 60% chance
    let shouldRetreat = false;
    if (pers === 'cowardly' && hpRatio < 0.5) {
        shouldRetreat = true;
    } else if (hpRatio < 0.30 && Math.random() < 0.6) {
        shouldRetreat = true;
    }

    if (!shouldRetreat) {
        e.retreating = false;
        return false;
    }

    e.retreating = true;

    // Priority 1: Move toward nearest healer support unit
    let nearestHealer = null;
    let healerDist = Infinity;
    entities.forEach(other => {
        if (other === e || other.isPlayer || other.hp <= 0) return;
        if (other.support === 'healer') {
            const d = Math.abs(other.x - e.x) + Math.abs(other.y - e.y);
            if (d < healerDist && d <= 12) {
                healerDist = d;
                nearestHealer = other;
            }
        }
    });

    if (nearestHealer) {
        let mdx = Math.sign(nearestHealer.x - e.x);
        let mdy = Math.sign(nearestHealer.y - e.y);
        if (mdx === 0 && mdy === 0) mdx = 1;
        attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
        return true;
    }

    // Priority 2: Move toward nearest allied monster
    let nearestAlly = null;
    let allyDist = Infinity;
    entities.forEach(other => {
        if (other === e || other.isPlayer || other.hp <= 0 || other.isTownNPC) return;
        const d = Math.abs(other.x - e.x) + Math.abs(other.y - e.y);
        if (d < allyDist && d > 1 && d <= 8) {
            allyDist = d;
            nearestAlly = other;
        }
    });

    if (nearestAlly && Math.random() < 0.6) {
        let mdx = Math.sign(nearestAlly.x - e.x);
        let mdy = Math.sign(nearestAlly.y - e.y);
        attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
        return true;
    }

    // Priority 3: Move away from player (fallback)
    let mdx = Math.sign(e.x - player.x), mdy = Math.sign(e.y - player.y);
    if (mdx === 0 && mdy === 0) mdx = 1;
    attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
    return true;
}

// #43 Ambusher AI — Shadow Predators
function handleAmbush(e, dist, visible) {
    if (!e.ambusher || e.ambushed) return false;

    // Ambusher hides until player is close
    if (dist > 2) {
        e.ambushHidden = true;
        attemptAction(e, { type: 'wait' });
        return true;
    }

    // Spring the ambush!
    e.ambushed = true;
    e.ambushHidden = false;
    e.invisible = false; // Become visible

    // First-strike bonus: +50% ATK
    let bonusAtk = Math.floor(e.atk * 0.5);
    e.atk += bonusAtk;
    e.ambushBonusAtk = bonusAtk; // Track for removal after first hit

    logMessage(`${e.name} lunges from the shadows!`, 'damage');
    spawnParticle(e.x, e.y, 'AMBUSH!', '#e67e22');
    addNoise(e.x, e.y, NOISE_LEVELS.SHOUT);

    // Immediately attack toward player
    attemptAction(e, { type: 'move', dx: Math.sign(player.x - e.x), dy: Math.sign(player.y - e.y) });
    return true;
}

// #44 Support Units — Healers & Buffers
function handleSupportAI(e, dist, visible) {
    if (!e.support) return false;

    // Cooldown management
    if (!e.supportCooldown) e.supportCooldown = 0;
    if (e.supportCooldown > 0) {
        e.supportCooldown--;
        // While on cooldown, stay away from player
        if (dist <= 3) {
            let mdx = Math.sign(e.x - player.x), mdy = Math.sign(e.y - player.y);
            if (mdx === 0 && mdy === 0) mdx = 1;
            attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
            return true;
        }
        return false; // Let normal AI handle movement
    }

    if (e.support === 'healer') {
        // Find nearest wounded ally within radius 5 (not bosses, not self)
        let bestTarget = null;
        let bestDist = Infinity;
        entities.forEach(other => {
            if (other === e || other.isPlayer || other.hp <= 0 || other.isTownNPC) return;
            if (other.miniBoss) return; // Don't heal bosses
            if (other.hp >= other.maxHp) return; // Not wounded
            const d = Math.abs(other.x - e.x) + Math.abs(other.y - e.y);
            if (d <= 5 && d < bestDist) {
                bestDist = d;
                bestTarget = other;
            }
        });

        if (bestTarget) {
            const healAmount = Math.floor(bestTarget.maxHp * (0.15 + Math.random() * 0.10));
            bestTarget.hp = Math.min(bestTarget.maxHp, bestTarget.hp + healAmount);
            e.supportCooldown = 3; // 3 tick cooldown
            e.energy -= ENERGY_THRESHOLD;
            spawnParticle(bestTarget.x, bestTarget.y, `+${healAmount} HP`, '#2ecc71');
            if (dist < 10) {
                logMessage(`${e.name} heals ${bestTarget.name}!`, 'damage');
            }
            spawnParticle(e.x, e.y, '\u271A', '#2ecc71');
            return true;
        }
    } else if (e.support === 'buffer') {
        // Find nearest ally within radius 5 that isn't already buffed
        let bestTarget = null;
        let bestDist = Infinity;
        entities.forEach(other => {
            if (other === e || other.isPlayer || other.hp <= 0 || other.isTownNPC) return;
            if (other.supportBuffTimer && other.supportBuffTimer > 0) return; // Already buffed
            const d = Math.abs(other.x - e.x) + Math.abs(other.y - e.y);
            if (d <= 5 && d < bestDist) {
                bestDist = d;
                bestTarget = other;
            }
        });

        if (bestTarget) {
            bestTarget.atk += 2;
            bestTarget.supportBuffTimer = 15; // 15 tick buff
            bestTarget.supportBuffAtk = 2;    // Track for removal
            e.supportCooldown = 5; // 5 tick cooldown
            e.energy -= ENERGY_THRESHOLD;
            spawnParticle(bestTarget.x, bestTarget.y, 'BUFF!', '#f1c40f');
            if (dist < 10) {
                logMessage(`${e.name} empowers ${bestTarget.name}!`, 'damage');
            }
            return true;
        }
    }

    // Self-preservation: stay away from player if close
    if (dist <= 4) {
        let mdx = Math.sign(e.x - player.x), mdy = Math.sign(e.y - player.y);
        if (mdx === 0 && mdy === 0) mdx = 1;
        attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
        return true;
    }

    return false; // Let normal AI handle
}

// #45 Boss Phases — HP Threshold Behaviors
function handleBossPhase(e, dist, visible) {
    if (!e.bossPhases && !e.miniBoss) return false;

    let hpRatio = e.hp / e.maxHp;

    // Phase 2 transition: 60% HP
    if (hpRatio <= 0.60 && !e.phase2Triggered) {
        e.phase2Triggered = true;
        e.atk += 3;
        e.speed = Math.min(20, (e.speed || 10) + 2);
        if (dist < 12) {
            logMessage(`${e.name} enters a frenzy!`, 'damage');
            spawnParticle(e.x, e.y, 'ENRAGE!', '#e74c3c');
        }

        // Boss-specific Phase 2
        if (e.name === 'The Butcher' || e.name.includes('Butcher')) {
            e.lifeSteal = true;
            if (dist < 12) logMessage(`The Butcher's blade drips with dark energy!`, 'damage');
        }
    }

    // Phase 3 transition: 30% HP
    if (hpRatio <= 0.30 && !e.phase3Triggered) {
        e.phase3Triggered = true;
        e.atk += 5;
        if (dist < 12) {
            logMessage(`${e.name} is desperate! BEWARE!`, 'damage');
            spawnParticle(e.x, e.y, 'PHASE 3!', '#ff0000');
        }

        // Boss-specific Phase 3
        if (e.name === 'Shadow Queen' || e.name.includes('Shadow Queen')) {
            e.invisible = true;
            e.speed = Math.min(20, (e.speed || 10) + 4);
            if (dist < 12) logMessage(`The Shadow Queen vanishes into darkness!`, 'damage');
        }

        // Summon minions (once)
        if (!e.phase3Summoned) {
            e.phase3Summoned = true;
            let summoned = 0;
            const skeleDirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]];
            for (const sd of skeleDirs) {
                if (summoned >= 2) break;
                const sx = e.x + sd[0], sy = e.y + sd[1];
                if (sx >= 0 && sx < MAP_WIDTH && sy >= 0 && sy < MAP_HEIGHT && map[sx][sy].type === 'floor' && !getEntityAt(sx, sy)) {
                    // Summon a contextually appropriate minion
                    let minionName = 'Skeleton';
                    if (e.element === 'fire') minionName = 'Fire Hound';
                    if (e.element === 'poison') minionName = 'Giant Spider';
                    const sk = ENEMY_TYPES.find(t => t.name === minionName);
                    if (sk) {
                        const ne = new Entity(sx, sy, sk.char, sk.color, sk.name, sk.hp, sk.atk, sk.def, sk.speed);
                        ne.element = sk.element; ne.baseXP = sk.baseXP;
                        ne.sleeping = false;
                        entities.push(ne);
                        summoned++;
                    }
                }
            }
            if (summoned > 0 && dist < 12) {
                logMessage(`${e.name} summons reinforcements!`, 'damage');
            }
        }
    }

    // Balrog Phase 3: periodic fire breath
    if (e.name === 'Balrog' && e.phase3Triggered && visible && dist <= 5) {
        if (!e.breathCooldown) e.breathCooldown = 0;
        e.breathCooldown--;
        if (e.breathCooldown <= 0) {
            e.breathCooldown = 3;
            if (typeof executeBreathAttack === 'function') {
                e.breather = true;
                e.element = 'fire';
                executeBreathAttack(e);
                e.energy -= ENERGY_THRESHOLD * 1.5;
                return true;
            }
        }
    }

    return false; // Don't override movement, just modify stats
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

    // Support buff decay
    if (e.supportBuffTimer && e.supportBuffTimer > 0) {
        e.supportBuffTimer--;
        if (e.supportBuffTimer <= 0 && e.supportBuffAtk) {
            e.atk -= e.supportBuffAtk;
            e.supportBuffAtk = 0;
        }
    }

    // Ambush bonus ATK removal after first combat
    if (e.ambushBonusAtk && e.ambushed && e.hp < e.maxHp) {
        e.atk -= e.ambushBonusAtk;
        e.ambushBonusAtk = 0;
    }

    // 1. Sleeping State Check
    if (e.sleeping) {
        let noiseLevel = (noiseMap[e.x] && noiseMap[e.x][e.y]) ? noiseMap[e.x][e.y] : 0;
        if (dist <= 2 || noiseLevel > WAKE_THRESHOLD) {
            e.sleeping = false;
            if (dist < 8) {
                logMessage(`${e.name} wakes up!`, 'damage');
                spawnParticle(e.x, e.y, '!', '#e74c3c');
            }
        } else {
            attemptAction(e, { type: 'wait' });
            return;
        }
    }

    // #43 Ambusher AI — check before anything else
    if (e.ambusher && handleAmbush(e, dist, visible)) return;

    // #45 Boss Phases — process phase transitions
    if ((e.bossPhases || e.miniBoss) && handleBossPhase(e, dist, visible)) return;

    // #44 Support Units — healers and buffers act before combat
    if (e.support && handleSupportAI(e, dist, visible)) return;

    // #41 Pack Mentality — alert cascade on sight
    if (handlePackAlert(e, dist, visible)) return;

    // #27 Blink Dog — teleport randomly when adjacent and hurt
    if (e.blinker && dist <= 2 && e.hp < e.maxHp * 0.5) {
        let bx, by, tries = 0;
        do { bx = e.x + Math.floor(Math.random() * 7) - 3; by = e.y + Math.floor(Math.random() * 7) - 3; tries++; }
        while (tries < 20 && (bx < 0 || bx >= MAP_WIDTH || by < 0 || by >= MAP_HEIGHT || map[bx][by].type !== 'floor' || getEntityAt(bx, by)));
        if (tries < 20) { e.x = bx; e.y = by; e.energy -= ENERGY_THRESHOLD; spawnParticle(e.x, e.y, 'blink!', '#3498db'); return; }
    }

    // #24 Necromancer — summon skeleton if not too many
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
                        e.energy -= ENERGY_THRESHOLD;
                        return;
                    }
                    break;
                }
            }
        }
    }

    // #22 Ancient Dragons — elemental breath attack at range 2-5
    if (e.breather && dist >= 2 && dist <= 5 && visible && Math.random() < 0.25) {
        if (typeof executeBreathAttack === 'function') {
            executeBreathAttack(e);
            e.energy -= ENERGY_THRESHOLD * 1.5;
            return;
        }
    }

    // Phase IV: AI Personalities & Reputation
    let baseName = e.name.replace('Elite ', '').replace('Mini-Boss ', '');
    let kills = (player.killsByType && player.killsByType[baseName]) ? player.killsByType[baseName] : 0;

    let template = typeof ENEMY_TYPES !== 'undefined' ? ENEMY_TYPES.find(t => t.name === baseName) : null;
    let pers = e.personality || (template && template.personality) || null;

    if (pers && map[e.x] && map[e.x][e.y] && map[e.x][e.y].visible) {
        if (!e.chattedTimer) e.chattedTimer = 0;
        if (e.chattedTimer > 0) e.chattedTimer--;

        // Cowardly: Run away if kills >= 5
        if (pers === 'cowardly' && kills >= 5) {
            if (e.chattedTimer === 0 && Math.random() < 0.2) {
                logMessage(`${e.name} shrieks: "The madman is here! RUN!"`, 'damage');
                e.chattedTimer = 30;
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

        // Pack: Call for help if HP < 40% (enhanced — also triggers full pack alert)
        if (pers === 'pack' && e.hp < e.maxHp * 0.4 && !e.hasHowled) {
            logMessage(`${e.name} howls for the pack!`, 'damage');
            e.hasHowled = true;
            spawnParticle(e.x, e.y, 'AWOO!', '#3498db');

            entities.forEach(other => {
                if (!other.isPlayer && other.hp > 0 && Math.abs(other.x - e.x) + Math.abs(other.y - e.y) < 10) {
                    let oBase = other.name.replace('Elite ', '').replace('Mini-Boss ', '');
                    let oTemp = typeof ENEMY_TYPES !== 'undefined' ? ENEMY_TYPES.find(t => t.name === oBase) : null;
                    let oIsPack = (other.personality === 'pack') || (oTemp && oTemp.personality === 'pack');
                    if (oIsPack && other !== e) {
                        other.confusedTimer = 0;
                        other.sleeping = false;
                        other.packAlerted = true;
                        other.alertTarget = { x: player.x, y: player.y };
                        other.alertSpeedBoost = 10;
                        spawnParticle(other.x, other.y, '!', '#e74c3c');
                    }
                }
            });
        }
    }

    // #42 Retreat Logic — Smart flee (replaces old #54 Fear)
    if (handleRetreat(e, dist)) return;

    if (dist <= 1 && (visible || dist < 2)) {
        attemptAction(e, { type: 'move', dx: Math.sign(dx), dy: Math.sign(dy) });
    } else if (visible) {
        // Memory update
        e.lastSeenPlayerPos = { x: player.x, y: player.y };

        let mdx = 0; let mdy = 0;
        if (Math.abs(dx) > Math.abs(dy)) mdx = Math.sign(dx);
        else mdy = Math.sign(dy);
        attemptAction(e, { type: 'move', dx: mdx, dy: mdy });
    } else {
        // Investigating Noise or Memory
        if (e.lastSeenPlayerPos) {
            const path = findPath(e.x, e.y, e.lastSeenPlayerPos.x, e.lastSeenPlayerPos.y);
            if (path && path.length > 0) {
                const step = path[0];
                attemptAction(e, { type: 'move', dx: step.x - e.x, dy: step.y - e.y });
                if (e.x === e.lastSeenPlayerPos.x && e.y === e.lastSeenPlayerPos.y) {
                    e.lastSeenPlayerPos = null;
                }
                return;
            } else {
                e.lastSeenPlayerPos = null;
            }
        }

        // Sensing Noise
        let loudestX = -1, loudestY = -1, maxNoise = 0;
        const r = e.sensingRadius || BASE_SENSING_RADIUS;
        for (let ix = e.x - r; ix <= e.x + r; ix++) {
            for (let iy = e.y - r; iy <= e.y + r; iy++) {
                if (ix >= 0 && ix < MAP_WIDTH && iy >= 0 && iy < MAP_HEIGHT) {
                    let n = noiseMap[ix][iy];
                    if (n > maxNoise && n > WAKE_THRESHOLD/2) {
                        maxNoise = n;
                        loudestX = ix; loudestY = iy;
                    }
                }
            }
        }

        if (loudestX !== -1) {
            const path = findPath(e.x, e.y, loudestX, loudestY);
            if (path && path.length > 0) {
                const step = path[0];
                attemptAction(e, { type: 'move', dx: step.x - e.x, dy: step.y - e.y });
                return;
            }
        }

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
            // #43 Ambushers stay hidden until they spring
            if (e.ambushHidden) continue;
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
