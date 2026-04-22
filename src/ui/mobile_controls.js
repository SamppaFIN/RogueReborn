/**
 * Mobile Controls Handler
 * Manages touch and click interactions for movement and actions.
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
    for (const [id, dir] of Object.entries(controls)) {
        handleAction(id, () => {
            if (gameState === 'PLAYING' && player.energy >= ENERGY_THRESHOLD) {
                if (typeof window.attemptAction === 'function') {
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
            }
        }
    });

    // Action buttons
    handleAction('btn-inv', () => {
        if (typeof window.openInventory === 'function') {
            if (gameState === 'INVENTORY') window.closeInventory();
            else window.openInventory();
        }
    });

    handleAction('btn-skill', () => {
        if (gameState === 'PLAYING') {
            if (typeof window.useClassSkill === 'function') {
                window.useClassSkill();
            }
        }
    });

    handleAction('btn-auto', () => {
        if (typeof window.toggleAutoPlay === 'function') window.toggleAutoPlay();
    });
}

// Call initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileControls);
} else {
    initMobileControls();
}
