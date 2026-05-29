/**
 * 🌸 Rogue Reborn — Renderer & UI
 * Particle system, map/entity rendering, UI updates, tooltips, message log.
 * Extracted from engine.js for modularity.
 */

// --- Particle System ---
class Particle {
    constructor(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.vx = (Math.random() - 0.5) * 0.05;
        this.vy = -0.05 - Math.random() * 0.05;
        this.life = 1.0; this.maxLife = 1.0;
    }
}
let particles = [];

function spawnParticle(x, y, text, color) {
    particles.push(new Particle(x, y, text, color));
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.life -= dt / 1000;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// --- Message Log ---
// Full message history
const fullMessageLog = [];

function logMessage(text, className = '') {
    fullMessageLog.push({ text, className, time: Date.now() });
    if (fullMessageLog.length > 500) fullMessageLog.shift(); // cap at 500

    const msgs = msgLog.querySelectorAll('.log-msg');
    msgs.forEach(m => m.classList.remove('newest'));
    const div = document.createElement('div');
    div.className = `log-msg newest ${className}`; div.innerText = text;
    msgLog.appendChild(div);
    msgLog.scrollTop = msgLog.scrollHeight;
    if (msgLog.children.length > 15) msgLog.removeChild(msgLog.children[0]);
}

window.openHistory = function() {
    const modal = document.getElementById('historyModal');
    const log = document.getElementById('fullHistoryLog');
    if (!modal || !log) return;
    log.innerHTML = fullMessageLog.slice().reverse().map(m =>
        `<div class="log-msg ${m.className}" style="margin-bottom:3px;">${m.text}</div>`
    ).join('');
    modal.classList.add('active');
};

window.closeHistory = function() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.remove('active');
};

// --- UI Update ---
function updateUI() {
    if (!player) return;
    document.getElementById('ui-location').innerText = currentFloor === 0 ? 'Town' : currentFloor > 10 ? `Abyss Lvl ${currentFloor}` : `Dungeon Lvl ${currentFloor}`;
    document.getElementById('ui-location').title = 'Ctrl+G: Toggle tile graphics';
    // Show render mode indicator
    const gfxEl = document.getElementById('ui-gfx');
    if (gfxEl) {
        gfxEl.innerText = isTileMode() ? '🎨 Tiles' : '⌨ ASCII';
        gfxEl.style.color = isTileMode() ? '#2ecc71' : '#7f8c8d';
    }
    
    const timeEl = document.getElementById('ui-time');
    if (timeEl) {
        let moonStr = window.isBloodMoon ? 'Blood Moon' : window.moonPhases[window.moonPhaseIndex];
        timeEl.innerText = `Day ${window.gameDay} (${moonStr})`;
        timeEl.style.color = window.isBloodMoon ? '#e74c3c' : '#c5c6c7';
    }

    document.getElementById('ui-speed').innerText = getEffectiveSpeed();

    // Ammo display
    const ammoEl = document.getElementById('ui-ammo');
    if (ammoEl) {
        const rangedEq = player.equipment.ranged;
        ammoEl.innerText = rangedEq ? `${player.ammo || 0} 🏹 (${getItemName(rangedEq)})` : `${player.ammo || 0} 🏹`;
    }

    // Status HUD indicators
    const statusEl = document.getElementById('ui-status');
    if (statusEl) {
        const statuses = [];
        if (player.poisonTimer > 0) statuses.push(`<span style="color:#27ae60">☠ POISONED(${player.poisonTimer})</span>`);
        if (player.confusedTimer > 0) statuses.push(`<span style="color:#9b59b6">? CONFUSED(${player.confusedTimer})</span>`);
        if (player.blindTimer > 0) statuses.push(`<span style="color:#888">👁 BLIND(${player.blindTimer})</span>`);
        if (player.paralyzedTimer > 0) statuses.push(`<span style="color:#e0c080">🔒 PARALYZED(${player.paralyzedTimer})</span>`);
        if (player.combatSurgeTimer > 0) statuses.push(`<span style="color:#f1c40f">⚡ SURGE(${player.combatSurgeTimer})</span>`);
        if (player.regenBoost > 0) statuses.push(`<span style="color:#2ecc71">♥ REGEN(${player.regenBoost})</span>`);
        
        // Phase V: Q Skill Cooldown tracking
        let skillName = (player.class === 'Warrior') ? 'Cleave' : (player.class === 'Rogue') ? 'Dash' : 'Fireball';
        let skillReady = (player.skillCooldown && player.skillCooldown > 0) ? `<span style="color:#e74c3c">Cd: ${player.skillCooldown}</span>` : `<span style="color:#66fcf1">Rdy</span>`;
        statuses.push(`<span style="color:#bd93f9; border: 1px solid #333; padding: 2px;">[Q] ${skillName} (${skillReady})</span>`);

        // TomeNet-inspired Hunger Display
        if (typeof player.food !== 'undefined') {
            let hungerLabel, hungerColor;
            if (player.food > 2000) { hungerLabel = 'Full'; hungerColor = '#2ecc71'; }
            else if (player.food > 500) { hungerLabel = 'Sated'; hungerColor = '#f1c40f'; }
            else if (player.food > 0) { hungerLabel = 'Hungry'; hungerColor = '#e67e22'; }
            else { hungerLabel = 'Starving!'; hungerColor = '#e74c3c'; }
            statuses.push(`<span style="color:${hungerColor}">🍖 ${hungerLabel}</span>`);
        }

        statusEl.innerHTML = statuses.join(' ') || '';
    }

    // Add null checks for ATK/DEF elements in case index.html isn't loaded right
    if (document.getElementById('ui-atk')) document.getElementById('ui-atk').innerText = getEffectiveAtk();
    if (document.getElementById('ui-def')) document.getElementById('ui-def').innerText = getEffectiveDef();

    if (document.getElementById('ui-stats')) {
        document.getElementById('ui-stats').innerText = `${player.stats.str} / ${player.stats.int} / ${player.stats.dex}`;
    }

    if (document.getElementById('ui-xp')) {
        let xpText = `${player.xp} / ${player.nextXp} (Lvl ${player.level})`;
        if (player.skillPoints > 0) xpText += ` [+${player.skillPoints} PTS]`;
        document.getElementById('ui-xp').innerText = xpText;
    }

    document.getElementById('ui-gold').innerText = player.gold;
    document.getElementById('ui-hp').innerText = player.hp;
    document.getElementById('ui-maxhp').innerText = player.maxHp;
    document.getElementById('ui-hp-bar').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;

    // Phase XII: Mana bar for Mage
    const manaRow = document.getElementById('mana-row');
    const manaBarBg = document.getElementById('mana-bar-bg');
    if (player.mana !== undefined) {
        if (manaRow) manaRow.style.display = 'flex';
        if (manaBarBg) manaBarBg.style.display = 'block';
        document.getElementById('ui-mana').innerText = player.mana;
        document.getElementById('ui-maxmana').innerText = player.maxMana || 0;
        document.getElementById('ui-mana-bar').style.width = `${Math.max(0, (player.mana / (player.maxMana || 1)) * 100)}%`;
    } else {
        if (manaRow) manaRow.style.display = 'none';
        if (manaBarBg) manaBarBg.style.display = 'none';
    }

    const displayEnergy = Math.max(0, Math.min(110, Math.floor(player.energy)));
    document.getElementById('ui-energy').innerText = displayEnergy;
    document.getElementById('ui-energy-bar').style.width = `${Math.min(100, (player.energy / 100) * 100)}%`;

    // Inventory Quickbar (Usable items only)
    const invDom = document.getElementById('ui-inventory');
    if (invDom) {
        invDom.innerHTML = '';
        
        window.quickbarMap = [];
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            if (item && !item.equip && item.type !== 'crafting' && item.type !== 'material' && item.type !== 'quest' && item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'shield' && item.type !== 'ring' && item.type !== 'amulet' && item.type !== 'helm') {
                window.quickbarMap.push({ item: item, index: i });
            }
        }

        for (let i = 0; i < 9; i++) {
            const mapped = window.quickbarMap[i];
            const item = mapped ? mapped.item : null;
            const realIdx = mapped ? mapped.index : -1;

            let h = `<li style="display:flex; justify-content:space-between; align-items:center; cursor:${item ? 'pointer' : 'default'}">`;
            h += `<span onclick="if(gameState==='PLAYING' && ${item ? 'true' : 'false'}) { event.stopPropagation(); openItemModal(${realIdx}); }" style="flex-grow:1; display:flex; align-items:center;">`;
            h += `<span class="inv-key" style="margin-right:5px">[${i + 1}]</span> <span class="inv-item" style="color:${item ? item.color : 'inherit'}">`;

            if (item) {
                h += `${getItemName(item)}`;
                h += `</span></span>`;
            } else {
                h += `<span style="opacity:0.3">Empty</span></span></span>`;
            }
            h += `</li>`;
            invDom.innerHTML += h;
        }
    }

    // Auto-hide sidebar on narrow screens
    if (window.innerWidth < 900 && window.sidebarVisible === undefined) {
        window.sidebarVisible = false;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('mobile-sidebar-hidden');
        const sBtn = document.getElementById('btn-toggle-sidebar');
        if (sBtn) { sBtn.innerText = '📖'; sBtn.title = 'Show sidebar'; }
    }

    // Mobile Controls visibility — actions ALWAYS visible, d-pad toggleable
    const mobileActions = document.getElementById('mobile-actions');
    if (mobileActions) {
        if (gameState === 'PLAYING') {
            mobileActions.classList.remove('mobile-hidden');
        } else {
            mobileActions.classList.add('mobile-hidden');
        }
    }
    // Use centralized helper for d-pad (handles inline style + class)
    if (typeof window.applyMobileDPadVisibility === 'function') {
        window.applyMobileDPadVisibility();
    }
}

// --- Canvas Resize ---
function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
}

// --- Main Render ---

// Phase XI: Tile drawing helpers
const TILE_PAD = 1; // padding inside each tile cell

function drawTileRect(ox, oy, color, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(ox + TILE_PAD, oy + TILE_PAD, w - TILE_PAD * 2, h - TILE_PAD * 2);
}

function drawTileWall(ox, oy, color, w, h) {
    drawTileRect(ox, oy, color, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(ox + TILE_PAD, oy + TILE_PAD, w - TILE_PAD * 2, h - TILE_PAD * 2);
}

function drawTileChar(ox, oy, char, color, w, h) {
    // Monster: colored circle avatar on dark bg — bigger char for readability
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(ox + TILE_PAD, oy + TILE_PAD, w - TILE_PAD * 2, h - TILE_PAD * 2);
    const cx = ox + w / 2, cy = oy + h / 2, r = (w - TILE_PAD * 2) / 2.2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Monster char with dark outline — readable on any background color
    ctx.font = `bold ${TILE_SIZE * 0.7}px "Fira Code", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(char, cx, cy - 1);
    ctx.fillStyle = '#fff';
    ctx.fillText(char, cx, cy - 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 1;
}

function drawTilePlayer(ox, oy, color, w, h) {
    // Player: bright circle on dark bg
    ctx.fillStyle = '#000';
    ctx.fillRect(ox + TILE_PAD, oy + TILE_PAD, w - TILE_PAD * 2, h - TILE_PAD * 2);
    const cx = ox + w / 2, cy = oy + h / 2, r = (w - TILE_PAD * 2) / 2.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${TILE_SIZE * 0.5}px "Fira Code", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('@', cx, cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
}

function drawTileItem(ox, oy, char, color, w, h) {
    ctx.fillStyle = color;
    const s = (w - TILE_PAD * 2) * 0.35;
    ctx.fillRect(ox + w / 2 - s / 2, oy + h / 2 - s / 2, s, s);
    ctx.fillStyle = '#fff';
    ctx.font = `${TILE_SIZE * 0.4}px "Fira Code", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, ox + w / 2, oy + h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
}

function drawTileStairs(ox, oy, color, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(ox + TILE_PAD, oy + TILE_PAD, w - TILE_PAD * 2, h - TILE_PAD * 2);
    // Stairs: chevron-like pattern
    ctx.fillStyle = color;
    ctx.font = `bold ${TILE_SIZE * 0.7}px "Fira Code", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('>', ox + w / 2, oy + h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
}

function drawTileBuilding(ox, oy, char, color, w, h) {
    // Building: warm glow rectangle
    drawTileRect(ox, oy, '#2a1a0a', w, h);
    ctx.fillStyle = color;
    ctx.font = `bold ${TILE_SIZE * 0.7}px "Fira Code", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, ox + w / 2, oy + h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
}

function isTileMode() { return window.renderMode === 'tiles'; }

// ── Pinch-to-zoom (mobile) ──
window.zoomScale = 1.0;
window.zoomTarget = 1.0;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;

function setZoom(scale) {
    window.zoomTarget = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale));
}

function render() {
    if (!player || !map || !map.length) return;

    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Smooth zoom lerp
    window.zoomScale += (window.zoomTarget - window.zoomScale) * 0.12;

    ctx.font = `${TILE_SIZE}px "Fira Code", monospace`;
    ctx.textBaseline = 'top';

    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);

    // Apply zoom transform (around center)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(window.zoomScale, window.zoomScale);
    ctx.translate(-cx, -cy);

    // Smooth Camera Lerp
    const targetCamX = player.x * TILE_SIZE;
    const targetCamY = player.y * TILE_SIZE;
    const lerpSpeed = (isAutoRunning || activePath) ? 0.30 : 0.15;
    if (cameraX === 0 && cameraY === 0) {
        cameraX = targetCamX; cameraY = targetCamY;
    } else {
        cameraX += (targetCamX - cameraX) * lerpSpeed;
        cameraY += (targetCamY - cameraY) * lerpSpeed;
    }

    const offsetX = cx - cameraX;
    const offsetY = cy - cameraY;

    // Draw Map
    for (let x = 0; x < MAP_WIDTH; x++) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            const tile = map[x][y];
            if (tile.explored || player.hasESP) {
                let color = tile.visible ? (tile.type === 'wall' ? COLORS.LIT_WALL : COLORS.LIT_FLOOR)
                    : (tile.type === 'wall' ? COLORS.DARK_WALL : COLORS.DARK_FLOOR);
                
                if (tile.color) {
                    if (tile.type !== 'floor' && tile.type !== 'wall') color = tile.color;
                    else if (tile.isTown && tile.visible) color = tile.color;
                } else if (tile.isTown && tile.visible) {
                    color = tile.type === 'wall' ? COLORS.TOWN_WALL : COLORS.TOWN_FLOOR;
                }

                if (tile.type === 'stairs_up' || tile.type === 'stairs_down') color = tile.visible ? COLORS.STAIRS : '#666';
                if (tile.type === 'shop' || tile.type === 'healer' || tile.type === 'blacksmith' || tile.type === 'wizard' || tile.type === 'alchemist' || tile.type === 'trainer' || tile.type === 'bank' || tile.type === 'cartographer' || tile.type === 'altar' || tile.type === 'stash') {
                    if (timeOfDay === 'Night' && tile.visible) color = '#f1c40f';
                    else if (tile.type === 'healer') color = tile.visible ? '#e74c3c' : '#666';
                    else if (tile.type === 'shop') color = tile.visible ? COLORS.GOLD : '#666';
                }

                const ox = offsetX + x * TILE_SIZE, oy = offsetY + y * TILE_SIZE;

                if (isTileMode()) {
                    // --- TILE MODE ---
                    const t = tile.type;
                    if (t === 'wall' || t === 'locked_door' || t === 'secret_wall') {
                        drawTileWall(ox, oy, tile.visible ? color : '#1a1a2e', TILE_SIZE, TILE_SIZE);
                    } else if (t === 'stairs_down' || t === 'stairs_up') {
                        drawTileStairs(ox, oy, color, TILE_SIZE, TILE_SIZE);
                    } else if (['shop','healer','blacksmith','wizard','alchemist','trainer','bank','cartographer','altar','stash','mayor','gambler','shrine','guildhall'].includes(t)) {
                        drawTileBuilding(ox, oy, tile.char, color, TILE_SIZE, TILE_SIZE);
                    } else if (t === 'lava') {
                        ctx.fillStyle = '#3a1500';
                        ctx.fillRect(ox + TILE_PAD, oy + TILE_PAD, TILE_SIZE - TILE_PAD*2, TILE_SIZE - TILE_PAD*2);
                        ctx.fillStyle = color;
                        ctx.font = `bold ${TILE_SIZE*0.5}px "Fira Code", monospace`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText('~', ox+TILE_SIZE/2, oy+TILE_SIZE/2);
                        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    } else if (t === 'ice') {
                        drawTileRect(ox, oy, tile.visible ? '#0a2030' : '#0a0a15', TILE_SIZE, TILE_SIZE);
                    } else if (t === 'gas') {
                        drawTileRect(ox, oy, tile.visible ? '#0a1a0a' : '#0a0a15', TILE_SIZE, TILE_SIZE);
                    } else if (t === 'water') {
                        drawTileRect(ox, oy, tile.visible ? '#0a1030' : '#0a0a15', TILE_SIZE, TILE_SIZE);
                    } else if (t === 'trap' || t === 'trapdoor') {
                        drawTileRect(ox, oy, tile.visible ? '#1a0a0a' : '#0a0a15', TILE_SIZE, TILE_SIZE);
                        if (tile.visible) {
                            ctx.fillStyle = color;
                            ctx.font = `${TILE_SIZE*0.5}px "Fira Code", monospace`;
                            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                            ctx.fillText(tile.char, ox+TILE_SIZE/2, oy+TILE_SIZE/2);
                            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                        }
                    } else if (t === 'lore_altar') {
                        drawTileBuilding(ox, oy, '&', color, TILE_SIZE, TILE_SIZE);
                    } else {
                        // Floor / default
                        drawTileRect(ox, oy, tile.visible ? color : COLORS.DARK_FLOOR, TILE_SIZE, TILE_SIZE);
                    }
                } else {
                    // --- ASCII MODE ---
                    ctx.fillStyle = color;
                    ctx.fillText(tile.char, ox, oy);
                }
            }
        }
    }

    // Draw Items
    items.forEach(i => {
        if (map[i.x][i.y].visible) {
            const ox = offsetX + i.x * TILE_SIZE, oy = offsetY + i.y * TILE_SIZE;
            if (isTileMode()) {
                drawTileItem(ox, oy, i.char, i.color, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = i.color;
                ctx.fillText(i.char, ox, oy);
            }
        }
    });

    // Draw Corpses
    entities.filter(e => e.hp <= 0).forEach(e => {
        if (map[e.x][e.y].visible) {
            const ox = offsetX + e.x * TILE_SIZE, oy = offsetY + e.y * TILE_SIZE;
            if (isTileMode()) {
                ctx.globalAlpha = 0.3;
                drawTileChar(ox, oy, e.char, e.color, TILE_SIZE, TILE_SIZE);
                ctx.globalAlpha = 1.0;
            } else {
                ctx.fillStyle = e.color;
                ctx.fillText(e.char, ox, oy);
            }
        }
    });

    // Draw living entities
    entities.filter(e => e.hp > 0).forEach(e => {
        const isVisible = e.isPlayer || map[e.x][e.y].visible || (player.hasESP && !e.isPlayer);
        // #21 Gelatinous Cube: invisible unless adjacent
        if (e.invisible && !e.isPlayer) {
            const adjDist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
            if (adjDist > 1 && !player.hasESP) return; // skip rendering
        }
        const ox = offsetX + e.x * TILE_SIZE, oy = offsetY + e.y * TILE_SIZE;
        const ew = e.w || 1, eh = e.h || 1;
        if (isVisible) {
            // Phase XI: Large monster rendering (2x1, 1x2, 2x2)
            if (ew > 1 || eh > 1) {
                if (!e.isPlayer && !map[e.x][e.y].visible && player.hasESP) ctx.globalAlpha = 0.5;
                // Large colored block with border
                const totalW = TILE_SIZE * ew - TILE_PAD * 2;
                const totalH = TILE_SIZE * eh - TILE_PAD * 2;
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.fillRect(ox + TILE_PAD, oy + TILE_PAD, totalW, totalH);
                ctx.fillStyle = e.color;
                ctx.fillRect(ox + TILE_PAD + 2, oy + TILE_PAD + 2, totalW - 4, totalH - 4);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 2;
                ctx.strokeRect(ox + TILE_PAD + 2, oy + TILE_PAD + 2, totalW - 4, totalH - 4);
                ctx.lineWidth = 1;
                // Monster char + name
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${TILE_SIZE * 0.6}px "Fira Code", monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const labelY = oy + totalH / 2 - (eh > 1 ? TILE_SIZE * 0.3 : 0);
                ctx.fillText(e.char, ox + totalW / 2, labelY);
                // Small name label below char
                ctx.font = `${TILE_SIZE * 0.28}px "Fira Code", monospace`;
                ctx.fillText(e.name.length > 14 ? e.name.slice(0,12)+'..' : e.name, ox + totalW / 2, labelY + TILE_SIZE * 0.4);
                // HP bar
                const barW = totalW - 8, barH = 4, barX = ox + TILE_PAD + 4, barY = oy + totalH - barH - 4;
                const pct = Math.max(0, e.hp / e.maxHp);
                ctx.fillStyle = '#111';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
                ctx.fillRect(barX, barY, Math.floor(barW * pct), barH);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.globalAlpha = 1.0;
            } else if (e.isPlayer) {
                ctx.shadowBlur = player.hasESP ? 20 : 10;
                ctx.shadowColor = e.color;
                if (isTileMode()) {
                    ctx.shadowBlur = 0;
                    drawTilePlayer(ox, oy, e.color, TILE_SIZE, TILE_SIZE);
                } else {
                    ctx.fillStyle = e.color;
                    ctx.fillText(e.char, ox, oy);
                }
            } else if (!map[e.x][e.y].visible && player.hasESP) {
                ctx.globalAlpha = 0.5;
                if (isTileMode()) {
                    drawTileChar(ox, oy, e.char, e.color, TILE_SIZE, TILE_SIZE);
                } else {
                    ctx.fillStyle = e.color;
                    ctx.fillText(e.char, ox, oy);
                }
            } else {
                ctx.shadowBlur = 0;
                if (isTileMode()) {
                    // Monster tile: colored rectangle with monster char
                    drawTileChar(ox, oy, e.char, e.color, TILE_SIZE, TILE_SIZE);
                } else {
                    ctx.fillStyle = e.color;
                    ctx.fillText(e.char, ox, oy);
                }
            }
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;

            // #62 Monster HP bars drawn below glyph (skip large monsters — already drawn)
            if (!e.isPlayer && e.maxHp && (e.w || 1) <= 1 && (e.h || 1) <= 1) {
                const barW = TILE_SIZE;
                const barH = 3;
                const barX = offsetX + e.x * TILE_SIZE;
                const barY = offsetY + e.y * TILE_SIZE + 2;
                const pct = Math.max(0, e.hp / e.maxHp);
                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
                ctx.fillRect(barX, barY, Math.floor(barW * pct), barH);
            }
        }
    });

    // Draw Targeting Reticle
    if (gameState === 'TARGETING' || gameState === 'RANGED_TARGETING') {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
        let rx = targetX;
        let ry = targetY;
        let sw = TILE_SIZE;
        let sh = TILE_SIZE;
        
        let area = 0;
        if (typeof activeSpell !== 'undefined' && gameState === 'TARGETING') {
            if (activeSpell === 'fireball_skill' || activeSpell === 'frost') area = 1;
        }
        
        if (area > 0) {
            rx -= area;
            ry -= area;
            sw += area * 2 * TILE_SIZE;
            sh += area * 2 * TILE_SIZE;
        }

        ctx.fillRect(offsetX + rx * TILE_SIZE, offsetY + ry * TILE_SIZE - TILE_SIZE * 0.8, sw, sh);
        ctx.strokeStyle = '#e74c3c';
        ctx.strokeRect(offsetX + rx * TILE_SIZE, offsetY + ry * TILE_SIZE - TILE_SIZE * 0.8, sw, sh);

        ctx.beginPath();
        ctx.moveTo(offsetX + player.x * TILE_SIZE + TILE_SIZE / 2, offsetY + player.y * TILE_SIZE - TILE_SIZE / 2);
        ctx.lineTo(offsetX + targetX * TILE_SIZE + TILE_SIZE / 2, offsetY + targetY * TILE_SIZE - TILE_SIZE / 2);
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.2)';
        ctx.stroke();
    }

    // Draw Particles & Speech Bubbles
    particles.forEach(p => {
        const alpha = Math.max(0, p.life / p.maxLife);
        const px = offsetX + p.x * TILE_SIZE + TILE_SIZE / 2;
        const py = offsetY + p.y * TILE_SIZE;
        ctx.globalAlpha = alpha;

        if (p.isSpeech) {
            // Speech bubble: dark background, yellow border, white text
            ctx.font = `bold ${TILE_SIZE * 0.55}px "Fira Code", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const metrics = ctx.measureText(p.text);
            const bw = metrics.width + 10, bh = TILE_SIZE * 0.8;
            const bx = px - bw / 2, by = py - bh - 4;
            // Bubble background
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = `rgba(241,196,15,${alpha})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, bw, bh);
            // Text
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(p.text, px, by + bh - 6);
            ctx.lineWidth = 1;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
        } else {
            ctx.font = `bold ${TILE_SIZE * 0.7}px "Fira Code", monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, px, py);
        }
    });
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;

    // Draw darkness vignette filter
    if (gameState !== 'SHOP' && gameState !== 'CHAR_CREATE' && gameState !== 'HEALER') {
        const sightRadius = currentFloor === 0 ? 15 * TILE_SIZE : 7 * TILE_SIZE;
        const gradient = ctx.createRadialGradient(
            cx, cy, sightRadius * 0.4,
            cx, cy, Math.max(sightRadius, canvas.width / 2)
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(1, "rgba(11, 12, 16, 0.95)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Restore zoom transform before drawing UI overlays
    ctx.restore();

    // --- Minimap (top-left corner) ---
    if (currentFloor > 0 && gameState === 'PLAYING') {
        const mmScale = 2;
        const mmPad = 10;
        const mmW = MAP_WIDTH * mmScale;
        const mmH = MAP_HEIGHT * mmScale;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(mmPad - 2, mmPad - 2, mmW + 4, mmH + 4);
        ctx.strokeStyle = 'rgba(69, 162, 158, 0.4)';
        ctx.strokeRect(mmPad - 2, mmPad - 2, mmW + 4, mmH + 4);
        
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                const tile = map[x][y];
                if (tile.explored) {
                    if (tile.type === 'wall') ctx.fillStyle = 'rgba(69, 162, 158, 0.3)';
                    else if (tile.type === 'stairs_down') ctx.fillStyle = '#f1c40f';
                    else if (tile.type === 'stairs_up') ctx.fillStyle = '#3498db';
                    else ctx.fillStyle = 'rgba(26, 31, 36, 0.8)';
                    ctx.fillRect(mmPad + x * mmScale, mmPad + y * mmScale, mmScale, mmScale);
                }
            }
        }
        
        // Draw entities on minimap
        entities.forEach(e => {
            if (e.hp > 0 && !e.isPlayer && !e.isTownNPC && map[e.x] && map[e.x][e.y] && map[e.x][e.y].visible) {
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(mmPad + e.x * mmScale, mmPad + e.y * mmScale, mmScale, mmScale);
            }
        });
        
        // Player blip (pulsing)
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
        ctx.fillStyle = `rgba(102, 252, 241, ${pulse})`;
        ctx.fillRect(mmPad + player.x * mmScale - 1, mmPad + player.y * mmScale - 1, mmScale + 2, mmScale + 2);

        // ── Mini-HUD: HP / Energy / Mana / Shield next to minimap ──
        const hudX = mmPad + mmW + 10;
        const hudY = mmPad;
        const hudW = 120;
        const barH = 8;
        const gap = 4;
        const labelW = 28;

        ctx.save();
        ctx.font = '9px "Fira Code", monospace';
        ctx.textBaseline = 'top';

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        const panelH = (player.mana !== undefined ? 4 : 3) * (barH + gap) + 6 + (player.equipment?.offhand ? (barH + gap + 4) : 0);
        ctx.fillRect(hudX - 4, hudY - 2, hudW + 8, panelH);

        function drawMiniBar(label, current, max, color, yOffset) {
            const pct = Math.max(0, Math.min(1, current / (max || 1)));
            ctx.fillStyle = '#1f2833';
            ctx.fillRect(hudX + labelW, hudY + yOffset, hudW - labelW - 4, barH);
            ctx.fillStyle = color;
            ctx.fillRect(hudX + labelW, hudY + yOffset, (hudW - labelW - 4) * pct, barH);
            ctx.fillStyle = '#c5c6c7';
            ctx.textAlign = 'left';
            ctx.fillText(label, hudX, hudY + yOffset - 1);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.floor(current)}/${max}`, hudX + hudW - 2, hudY + yOffset - 1);
        }

        drawMiniBar('HP', player.hp, player.maxHp, '#ff3b3b', 0);
        drawMiniBar('⚡', player.energy, 100, '#f1c40f', barH + gap);
        let offsetY = 2 * (barH + gap);
        if (player.mana !== undefined) {
            drawMiniBar('🔮', player.mana, player.maxMana || 1, '#3498db', offsetY);
            offsetY += barH + gap;
        }
        // Equipped shield icon
        const shieldItem = player.equipment?.offhand || player.equipment?.shield;
        if (shieldItem) {
            const shieldY = hudY + offsetY + 2;
            ctx.font = '14px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = shieldItem.color || '#d35400';
            ctx.fillText('🛡', hudX, shieldY);
            ctx.font = '9px "Fira Code", monospace';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#c5c6c7';
            const sName = shieldItem.name || 'Shield';
            ctx.fillText(sName.length > 12 ? sName.slice(0, 11) + '…' : sName, hudX + 18, shieldY);
            ctx.textBaseline = 'top';
        }

        // Zoom indicator (bottom-right of minimap area)
        if (window.zoomScale && Math.abs(window.zoomScale - 1.0) > 0.05) {
            ctx.save();
            ctx.font = '10px "Fira Code", monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            const zText = `${Math.round(window.zoomScale * 100)}%`;
            const zW = ctx.measureText(zText).width + 8;
            const zY = mmPad + mmH + 6;
            ctx.fillRect(mmPad, zY, zW, 16);
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(zText, mmPad + 4, zY + 3);
            ctx.restore();
        }

        ctx.restore();
    }

    // Native Canvas Tooltip Rendering
    if (gameState === 'PLAYING' && hoverX >= 0 && hoverY >= 0) {
        if (map[hoverX] && map[hoverX][hoverY] && map[hoverX][hoverY].explored) {
            const tx = hoverX; const ty = hoverY;
            let tooltipLines = [];
            const ent = getEntityAt(tx, ty);
            if (ent) {
                if (ent.isPlayer) {
                    tooltipLines.push("You (@)");
                } else if (ent.hp <= 0) {
                    tooltipLines.push(`${ent.name} (Corpse)`);
                } else {
                    tooltipLines.push(`${ent.name} (${ent.hp}/${ent.maxHp} HP)`);
                    if (ent.isMerchant || ent.isTownNPC) {
                        tooltipLines.push("Friendly NPC");
                    } else {
                        // Bestiary logic
                        let baseName = ent.name.replace('Elite ', '').replace('Mini-Boss ', '').replace('Hoarder ', '');
                        let kills = (player.killsByType && player.killsByType[baseName]) ? player.killsByType[baseName] : 0;
                        let multiplier = (player.class === 'Mage') ? 2 : 1;
                        let effectiveKills = kills * multiplier;

                        if (effectiveKills >= 1) {
                            tooltipLines.push(`ATK: ${ent.atk} | DEF: ${ent.def}`);
                        }
                        if (effectiveKills >= 3) {
                            tooltipLines.push(`Speed: ${ent.speed} | Element: ${ent.element || 'None'}`);
                        }
                        if (effectiveKills >= 6) {
                            let traits = [];
                            if (ent.blinker) traits.push("Blinker");
                            if (ent.invisible) traits.push("Invisible");
                            if (ent.breather) traits.push("Breather");
                            if (ent.summoner) traits.push("Summoner");
                            if (ent.lifeSteal) traits.push("Life Steal");
                            if (ent.dissolver) traits.push("Acidic");
                            if (ent.drainMaxHp) traits.push("Drains Max HP");
                            if (ent.xpDrain) traits.push("XP Drain");
                            if (ent.confuser) traits.push("Confuses");
                            if (ent.fearAura) traits.push("Fear Aura");
                            if (ent.statDrain) traits.push("Stat Drain");
                            if (ent.regenerator) traits.push("Regenerates");
                            if (ent.webber) traits.push("Webber");
                            if (traits.length > 0) tooltipLines.push(`Traits: ${traits.join(', ')}`);
                            else tooltipLines.push("Traits: None");
                        }
                    }
                }
            } else {
                let text = "";
                const itm = getItemAt(tx, ty);
                if (itm) text = getItemName(itm);
                else {
                    const mType = map[tx][ty].type;
                    if (mType === 'shop') text = "Shop (S)";
                    else if (mType === 'healer') text = "Innkeeper (H)";
                    else if (mType === 'blacksmith') text = "Blacksmith (B)";
                    else if (mType === 'wizard') text = "Wizard's Tower (W)";
                    else if (mType === 'bank') text = "Bank (£)";
                    else if (mType === 'well') text = "Town Well (O)";
                    else if (mType === 'mayor') text = "Mayor's Office (M)";
                    else if (mType === 'gambler') text = "Gambler's Den (G)";
                    else if (mType === 'stairs_down') text = "Stairs Down (>)";
                    else if (mType === 'stairs_up') text = "Stairs Up (<)";
                    else if (mType === 'trap') text = map[tx][ty].hidden ? '' : `${map[tx][ty].trapKind} Trap (^)`;
                    else if (mType === 'lava') text = "Lava (~) DANGER";
                    else if (mType === 'shrine') text = map[tx][ty].used ? 'Spent Shrine' : 'Shrine (A) - Step to activate';
                }
                if (text) tooltipLines.push(text);
            }

            if (tooltipLines.length > 0) {
                ctx.font = '14px "Fira Code", monospace';
                let maxWidth = 0;
                tooltipLines.forEach(line => {
                    const metrics = ctx.measureText(line);
                    if (metrics.width > maxWidth) maxWidth = metrics.width;
                });
                const w = maxWidth + 16;
                const h = (tooltipLines.length * 20) + 6;
                let boxX = offsetX + tx * TILE_SIZE + 20;
                let boxY = offsetY + ty * TILE_SIZE + 20;

                if (boxX + w > canvas.width) boxX = canvas.width - w - 5;
                if (boxY + h > canvas.height) boxY = canvas.height - h - 5;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.fillRect(boxX, boxY, w, h);
                ctx.strokeStyle = '#4FC3F7';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX, boxY, w, h);

                ctx.fillStyle = 'white';
                ctx.textBaseline = 'top';
                ctx.textAlign = 'left';
                tooltipLines.forEach((line, idx) => {
                    ctx.fillText(line, boxX + 8, boxY + 5 + (idx * 20));
                });
            }
        }
    }
}
