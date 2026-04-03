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
function logMessage(text, className = '') {
    const msgs = msgLog.querySelectorAll('.log-msg');
    msgs.forEach(m => m.classList.remove('newest'));
    const div = document.createElement('div');
    div.className = `log-msg newest ${className}`; div.innerText = text;
    msgLog.appendChild(div);
    msgLog.scrollTop = msgLog.scrollHeight;
    if (msgLog.children.length > 15) msgLog.removeChild(msgLog.children[0]);
}

// --- UI Update ---
function updateUI() {
    if (!player) return;
    document.getElementById('ui-location').innerText = currentFloor === 0 ? 'Town' : currentFloor > 10 ? `Abyss Lvl ${currentFloor}` : `Dungeon Lvl ${currentFloor}`;
    document.getElementById('ui-speed').innerText = getEffectiveSpeed();

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

        statusEl.innerHTML = statuses.join(' ') || '';
    }

    // Add null checks for ATK/DEF elements in case index.html isn't loaded right
    if (document.getElementById('ui-atk')) document.getElementById('ui-atk').innerText = getEffectiveAtk();
    if (document.getElementById('ui-def')) document.getElementById('ui-def').innerText = getEffectiveDef();

    if (document.getElementById('ui-xp')) document.getElementById('ui-xp').innerText = `${player.xp} / ${player.nextXp} (Lvl ${player.level})`;

    document.getElementById('ui-gold').innerText = player.gold;
    document.getElementById('ui-hp').innerText = player.hp;
    document.getElementById('ui-maxhp').innerText = player.maxHp;
    document.getElementById('ui-hp-bar').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;

    const displayEnergy = Math.max(0, Math.min(110, Math.floor(player.energy)));
    document.getElementById('ui-energy').innerText = displayEnergy;
    document.getElementById('ui-energy-bar').style.width = `${Math.min(100, (player.energy / 100) * 100)}%`;

    // Inventory
    const invDom = document.getElementById('ui-inventory');
    invDom.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const item = player.inventory[i];
        let h = `<li style="display:flex; justify-content:space-between; align-items:center; cursor:${item ? 'pointer' : 'default'}">`;
        h += `<span onclick="if(gameState==='PLAYING' && ${item ? 'true' : 'false'}) openItemModal(${i})" style="flex-grow:1; display:flex; align-items:center;">`;
        h += `<span class="inv-key" style="margin-right:5px">[${i + 1}]</span> <span class="inv-item" style="color:${item ? item.color : 'inherit'}">`;

        if (item) {
            h += `${getItemName(item)}`;
            const isEquipped = Object.values(player.equipment).includes(item);
            if (isEquipped) h += ` <span class="inv-equip" style="color:#f1c40f; font-size:0.8em">(Eq)</span>`;
            h += `</span></span>`;
            // Explicit Drop Button
            h += `<button onclick="if(gameState==='PLAYING') dropItem(${i}, event)" style="background:#552222; color:#ff9999; border:1px solid #ff3333; border-radius:3px; cursor:pointer; padding:2px 6px; font-size:0.7em;" title="Click to Drop. Shift+Click to Destroy.">DROP</button>`;
        } else {
            h += `<span style="opacity:0.3">Empty</span></span></span>`;
        }
        h += `</li>`;
        invDom.innerHTML += h;
    }
}

// --- Canvas Resize ---
function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
}

// --- Main Render ---
function render() {
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${TILE_SIZE}px "Fira Code", monospace`;
    ctx.textBaseline = 'top';

    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height / 2);

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
                if (tile.isTown && tile.visible) {
                    color = tile.type === 'wall' ? COLORS.TOWN_WALL : COLORS.TOWN_FLOOR;
                }
                if (tile.type === 'stairs_up' || tile.type === 'stairs_down') color = tile.visible ? COLORS.STAIRS : '#666';
                if (tile.type === 'shop' || tile.type === 'healer' || tile.type === 'blacksmith' || tile.type === 'wizard' || tile.type === 'alchemist' || tile.type === 'trainer' || tile.type === 'bank' || tile.type === 'cartographer') {
                    if (timeOfDay === 'Night' && tile.visible) color = '#f1c40f'; // Glow yellow at night
                    else if (tile.type === 'healer') color = tile.visible ? '#e74c3c' : '#666';
                    else if (tile.type === 'shop') color = tile.visible ? COLORS.GOLD : '#666';
                }

                ctx.fillStyle = color;
                ctx.fillText(tile.char, offsetX + x * TILE_SIZE, offsetY + y * TILE_SIZE);
            }
        }
    }

    // Draw Items
    items.forEach(i => {
        if (map[i.x][i.y].visible) {
            ctx.fillStyle = i.color;
            ctx.fillText(i.char, offsetX + i.x * TILE_SIZE, offsetY + i.y * TILE_SIZE);
        }
    });

    // Draw Corpses
    entities.filter(e => e.hp <= 0).forEach(e => {
        if (map[e.x][e.y].visible) {
            ctx.fillStyle = e.color;
            ctx.fillText(e.char, offsetX + e.x * TILE_SIZE, offsetY + e.y * TILE_SIZE);
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
        if (isVisible) {
            if (e.isPlayer) {
                ctx.shadowBlur = player.hasESP ? 20 : 10;
                ctx.shadowColor = e.color;
            } else if (!map[e.x][e.y].visible && player.hasESP) {
                ctx.globalAlpha = 0.5;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.fillStyle = e.color;
            ctx.fillText(e.char, offsetX + e.x * TILE_SIZE, offsetY + e.y * TILE_SIZE);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;

            // #62 Monster HP bars drawn below glyph
            if (!e.isPlayer && e.maxHp) {
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

    // Draw Particles
    ctx.textAlign = 'center';
    ctx.font = `bold ${TILE_SIZE * 0.7}px "Fira Code", monospace`;
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, offsetX + p.x * TILE_SIZE + TILE_SIZE / 2, offsetY + p.y * TILE_SIZE);
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

    // Native Canvas Tooltip Rendering
    if (gameState === 'PLAYING' && hoverX >= 0 && hoverY >= 0) {
        if (map[hoverX] && map[hoverX][hoverY] && map[hoverX][hoverY].explored) {
            const tx = hoverX; const ty = hoverY;
            let text = "";
            const ent = getEntityAt(tx, ty);
            if (ent) {
                if (ent.isPlayer) text = "You (@)";
                else text = `${ent.name} (${ent.hp > 0 ? ent.hp + '/' + ent.maxHp + ' HP' : 'Corpse'})`;
            } else {
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
            }

            if (text) {
                ctx.font = '14px "Fira Code", monospace';
                const metrics = ctx.measureText(text);
                const w = metrics.width + 16;
                const h = 26;
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
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                ctx.fillText(text, boxX + 8, boxY + h / 2);
            }
        }
    }
}
