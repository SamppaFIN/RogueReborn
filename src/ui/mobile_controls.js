/**
 * Mobile Controls Handler v3
 * Stairs-down, Fire, Fade feedback labels
 */

function initMobileControls() {
    const controls = {
        'btn-up': { dx: 0, dy: -1 },
        'btn-down': { dx: 0, dy: 1 },
        'btn-left': { dx: -1, dy: 0 },
        'btn-right': { dx: 1, dy: 0 },
        'btn-nw': { dx: -1, dy: -1 },
        'btn-ne': { dx: 1, dy: -1 },
        'btn-sw': { dx: -1, dy: 1 },
        'btn-se': { dx: 1, dy: 1 }
    };

    // Fade feedback helper
    function showFadeFeedback(btnId, text, color) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        const original = btn.innerText;
        btn.innerText = text;
        btn.style.color = color;
        btn.style.background = 'rgba(31,40,51,0.9)';
        setTimeout(() => {
            btn.innerText = original;
            btn.style.color = '';
            btn.style.background = '';
        }, 600);
    }

    const handleAction = (id, actionFn) => {
        const btn = document.getElementById(id);
        if (btn) {
            const trigger = (e) => {
                e.preventDefault();
                actionFn();
            };
            btn.addEventListener('touchstart', trigger, { passive: false });
            btn.addEventListener('mousedown', trigger);
        }
    };

    // Movement buttons
    for (const [id] of Object.entries(controls)) {
        handleAction(id, () => {
            if (gameState === 'PLAYING' && player.energy >= ENERGY_THRESHOLD) {
                if (typeof window.attemptAction === 'function') {
                    const dir = controls[id];
                    window.attemptAction(player, { type: 'move', dx: dir.dx, dy: dir.dy });
                    if (typeof window.computeFOV === 'function') window.computeFOV();
                    if (typeof window.render === 'function') window.render();
                }
            }
        });
    }

    // Wait button
    handleAction('btn-wait', () => {
        if (gameState === 'PLAYING' && player.energy >= ENERGY_THRESHOLD) {
            if (typeof window.attemptAction === 'function') {
                window.attemptAction(player, { type: 'wait' }, ACTION_COSTS.WAIT);
                if (typeof window.render === 'function') window.render();
                showFadeFeedback('btn-wait', 'WAIT', '#f1c40f');
            }
        }
    });

    // Inventory toggle
    handleAction('btn-inv', () => {
        if (typeof window.openInventory === 'function') {
            if (gameState === 'INVENTORY') window.closeInventory();
            else window.openInventory();
        }
    });

    // Class skill
    handleAction('btn-skill', () => {
        if (gameState === 'PLAYING') {
            if (typeof window.useClassSkill === 'function') {
                window.useClassSkill();
                showFadeFeedback('btn-skill', 'SKILL!', '#bd93f9');
            }
        }
    });

    // Autoplay toggle
    handleAction('btn-auto', () => {
        if (typeof window.toggleAutoPlay === 'function') window.toggleAutoPlay();
    });

    // Stairs down
    handleAction('btn-stairs', () => {
        if (gameState === 'PLAYING' && player && map[player.x] && map[player.x][player.y]) {
            const tile = map[player.x][player.y];
            if (tile.type === 'stairs_down' || tile.type === 'stairs_up') {
                if (typeof window.checkStairs === 'function') {
                    window.checkStairs(player.x, player.y, true);
                    showFadeFeedback('btn-stairs', 'DOWN', '#2ecc71');
                }
            } else {
                let sx = -1, sy = -1;
                for (let x = 0; x < MAP_WIDTH; x++) {
                    for (let y = 0; y < MAP_HEIGHT; y++) {
                        if (map[x][y].type === 'stairs_down') { sx = x; sy = y; break; }
                    }
                    if (sx !== -1) break;
                }
                if (sx !== -1 && window.findPath) {
                    const path = window.findPath(player.x, player.y, sx, sy, true);
                    if (path && path.length > 0) {
                        const next = path[0];
                        window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
                        if (typeof window.computeFOV === 'function') window.computeFOV();
                        if (typeof window.render === 'function') window.render();
                        showFadeFeedback('btn-stairs', 'GO', '#f1c40f');
                    } else {
                        showFadeFeedback('btn-stairs', 'BLOCK', '#e74c3c');
                    }
                } else {
                    showFadeFeedback('btn-stairs', 'NONE', '#e74c3c');
                }
            }
        } else {
            showFadeFeedback('btn-stairs', 'BUSY', '#e74c3c');
        }
    });

    // Fire button
    handleAction('btn-fire', () => {
        if (gameState !== 'PLAYING' || !player) {
            showFadeFeedback('btn-fire', 'BUSY', '#e74c3c');
            return;
        }

        let nearest = null;
        let nearestDist = 99;
        if (typeof entities !== 'undefined') {
            for (let e of entities) {
                if (!e.isPlayer && e.hp > 0 && !e.isTownNPC && !e.isMerchant && 
                    map[e.x] && map[e.x][e.y] && map[e.x][e.y].visible) {
                    const d = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                    if (d < nearestDist) { nearestDist = d; nearest = e; }
                }
            }
        }

        if (!nearest) {
            if (typeof logMessage === 'function') logMessage("No visible target.", 'hint');
            showFadeFeedback('btn-fire', 'NO TGT', '#e74c3c');
            return;
        }

        const wep = player.equipment?.weapon;
        const wepEffect = wep?.effect;
        const isRanged = (wepEffect === 'bow' || wepEffect === 'crossbow') && player.ammo > 0;

        if (isRanged && nearestDist <= 6 && typeof window.getLine === 'function' && typeof window.executeRangedAttack === 'function') {
            const line = window.getLine(player.x, player.y, nearest.x, nearest.y);
            let clear = true;
            for (let i = 1; i < line.length - 1; i++) {
                if (map[line[i].x][line[i].y].type === 'wall' || map[line[i].x][line[i].y].type === 'locked_door') {
                    clear = false; break;
                }
            }
            if (clear) {
                window.targetX = nearest.x;
                window.targetY = nearest.y;
                window.executeRangedAttack();
                showFadeFeedback('btn-fire', 'FIRE!', '#e74c3c');
                return;
            }
        }

        if (nearestDist <= 1.5) {
            window.attemptAction(player, { type: 'move', dx: nearest.x - player.x, dy: nearest.y - player.y });
            if (typeof window.computeFOV === 'function') window.computeFOV();
            if (typeof window.render === 'function') window.render();
            showFadeFeedback('btn-fire', 'ATK!', '#e74c3c');
            return;
        }

        if (typeof window.findPath === 'function') {
            const path = window.findPath(player.x, player.y, nearest.x, nearest.y);
            if (path && path.length > 0) {
                const next = path[0];
                window.attemptAction(player, { type: 'move', dx: next.x - player.x, dy: next.y - player.y });
                if (typeof window.computeFOV === 'function') window.computeFOV();
                if (typeof window.render === 'function') window.render();
                showFadeFeedback('btn-fire', 'CHASE', '#f1c40f');
            } else {
                showFadeFeedback('btn-fire', 'BLOCK', '#e74c3c');
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileControls);
} else {
    initMobileControls();
}