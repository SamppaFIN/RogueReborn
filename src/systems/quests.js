/**
 * 🌸 Rogue Reborn — Quest Engine
 * Phase V: Quest state machine, progress tracking, and reward system.
 * States: LOCKED → AVAILABLE → ACTIVE → COMPLETE → REWARDED
 */

// ─── Quest State Machine ───

function initQuestSystem() {
    if (!player.quests) player.quests = {};
    if (!player.questLog) player.questLog = [];
    if (!player.discoveredLore) player.discoveredLore = [];
    if (!player.skillPoints) player.skillPoints = 0;
    if (!player.vaultsOpened) player.vaultsOpened = 0;

    // Unlock the first main arc quest
    if (!player.quests['arc_1_whispers']) {
        player.quests['arc_1_whispers'] = 'AVAILABLE';
    }

    // Side quest availability is checked dynamically
    updateSideQuestAvailability();
}

function updateSideQuestAvailability() {
    for (const sq of SIDE_QUESTS) {
        if (!player.quests[sq.id]) {
            if ((player.maxFloor || 0) >= (sq.minFloor || 0)) {
                player.quests[sq.id] = 'AVAILABLE';
            }
        }
    }
}

function getQuestById(id) {
    for (const q of MAIN_ARC) { if (q.id === id) return q; }
    for (const q of SIDE_QUESTS) { if (q.id === id) return q; }
    return null;
}

function acceptQuest(questId) {
    if (player.quests[questId] !== 'AVAILABLE') return false;
    player.quests[questId] = 'ACTIVE';
    const quest = getQuestById(questId);
    if (quest) {
        player.questLog.push(questId);
        // Initialize kill tracking
        if (quest.type === 'kill') {
            if (!player.questKills) player.questKills = {};
            player.questKills[questId] = 0;
        }
        if (quest.type === 'kill_multi') {
            if (!player.questKills) player.questKills = {};
            player.questKills[questId] = {};
            for (const t of quest.targets) {
                player.questKills[questId][t.name] = 0;
            }
        }
        if (quest.type === 'open_vault') {
            if (!player.questVaultCount) player.questVaultCount = {};
            player.questVaultCount[questId] = 0;
        }
        logMessage(`Quest Accepted: ${quest.title}`, 'magic');
        spawnParticle(player.x, player.y, 'QUEST!', '#f1c40f');
    }
    return true;
}

// ─── Progress Tracking ───

function onMonsterKilled(monsterName) {
    if (!player.questKills) return;
    for (const qid of (player.questLog || [])) {
        if (player.quests[qid] !== 'ACTIVE') continue;
        const quest = getQuestById(qid);
        if (!quest) continue;

        if (quest.type === 'kill' && monsterName.includes(quest.target)) {
            player.questKills[qid] = (player.questKills[qid] || 0) + 1;
            let remaining = (quest.count || 1) - player.questKills[qid];
            if (remaining > 0) {
                logMessage(`Quest "${quest.title}": ${quest.target} slain (${player.questKills[qid]}/${quest.count})`, 'hint');
            }
            if (player.questKills[qid] >= (quest.count || 1)) {
                completeQuest(qid);
            }
        }
        if (quest.type === 'kill_multi') {
            for (const t of quest.targets) {
                if (monsterName.includes(t.name)) {
                    player.questKills[qid][t.name] = (player.questKills[qid][t.name] || 0) + 1;
                }
            }
            let allDone = quest.targets.every(t => (player.questKills[qid][t.name] || 0) >= t.count);
            if (allDone) completeQuest(qid);
        }
    }
}

function onFloorReached(floor) {
    for (const qid of (player.questLog || [])) {
        if (player.quests[qid] !== 'ACTIVE') continue;
        const quest = getQuestById(qid);
        if (quest && quest.type === 'reach_floor' && floor >= quest.target) {
            completeQuest(qid);
        }
    }
    updateSideQuestAvailability();
}

function onVaultOpened() {
    player.vaultsOpened = (player.vaultsOpened || 0) + 1;
    if (!player.questVaultCount) player.questVaultCount = {};
    for (const qid of (player.questLog || [])) {
        if (player.quests[qid] !== 'ACTIVE') continue;
        const quest = getQuestById(qid);
        if (quest && quest.type === 'open_vault') {
            player.questVaultCount[qid] = (player.questVaultCount[qid] || 0) + 1;
            if (player.questVaultCount[qid] >= quest.target) {
                completeQuest(qid);
            }
        }
    }
}

function completeQuest(questId) {
    if (player.quests[questId] === 'COMPLETE' || player.quests[questId] === 'REWARDED') return;
    player.quests[questId] = 'COMPLETE';
    const quest = getQuestById(questId);
    if (quest) {
        logMessage(`✦ Quest Complete: "${quest.title}"! Return to ${quest.giver} for your reward.`, 'kill');
        spawnParticle(player.x, player.y, 'COMPLETE!', '#f1c40f');
    }
}

function claimQuestReward(questId) {
    if (player.quests[questId] !== 'COMPLETE') return false;
    const quest = getQuestById(questId);
    if (!quest) return false;

    player.quests[questId] = 'REWARDED';

    // Grant rewards
    if (quest.rewards.xp) {
        player.xp += quest.rewards.xp;
        logMessage(`+${quest.rewards.xp} XP!`, 'magic');
    }
    if (quest.rewards.gold) {
        player.gold += quest.rewards.gold;
        logMessage(`+${quest.rewards.gold} Gold!`, 'pickup');
    }
    if (quest.rewards.skillPoints) {
        player.skillPoints = (player.skillPoints || 0) + quest.rewards.skillPoints;
        logMessage(`+${quest.rewards.skillPoints} Skill Point(s)!`, 'kill');
    }
    if (quest.rewards.item) {
        const itemTemplate = ITEM_DB.find(i => i.name === quest.rewards.item);
        if (itemTemplate && player.inventory.length < 18) {
            player.inventory.push({ ...itemTemplate, identified: true });
            logMessage(`Received: ${quest.rewards.item}!`, 'pickup');
        }
    }

    // Unlock lore
    if (quest.loreUnlock) {
        discoverLore(quest.loreUnlock);
    }

    // Unlock next quest in chain
    if (quest.nextQuest) {
        player.quests[quest.nextQuest] = 'AVAILABLE';
        const nextQ = getQuestById(quest.nextQuest);
        if (nextQ) {
            logMessage(`New Quest Available: "${nextQ.title}"`, 'magic');
        }
    }

    // Check level up from quest XP
    while (player.xp >= player.nextXp) {
        player.level++;
        player.maxHp += 5;
        player.hp = player.maxHp;
        player.atk += 1;
        player.nextXp = Math.floor(player.nextXp * 1.8);
        // Award 1 skill point every 2 levels
        if (player.level % 2 === 0) {
            player.skillPoints = (player.skillPoints || 0) + 1;
            logMessage(`Skill Point earned! (Total: ${player.skillPoints})`, 'kill');
        }
        logMessage(`LEVEL UP! You are now level ${player.level}.`, 'magic');
    }

    spawnParticle(player.x, player.y, 'REWARDED!', '#f1c40f');
    return true;
}

// ─── Lore System ───

function discoverLore(loreId) {
    if (!player.discoveredLore) player.discoveredLore = [];
    if (player.discoveredLore.includes(loreId)) return;
    player.discoveredLore.push(loreId);
    const frag = LORE_FRAGMENTS[loreId];
    if (frag) {
        logMessage(`═══ ${frag.title} ═══`, 'magic');
        logMessage(frag.text, 'hint');
        spawnParticle(player.x, player.y, '📜 LORE', frag.color || '#f1c40f');
    }
}

// ─── NPC Quest Interaction ───

function handleQuestNPC(npcType) {
    // Get all quests where this NPC is the giver
    let availableQuests = [];
    let completedQuests = [];

    const allQuests = [...MAIN_ARC, ...SIDE_QUESTS];
    for (const q of allQuests) {
        if (q.giver !== npcType) continue;
        const state = player.quests[q.id];
        if (state === 'AVAILABLE') availableQuests.push(q);
        if (state === 'COMPLETE') completedQuests.push(q);
        if (state === 'ACTIVE' && q.dialogue && q.dialogue.progress) {
            logMessage(`${npcType}: "${q.dialogue.progress}"`, 'hint');
        }
    }

    // Claim completed quests
    for (const q of completedQuests) {
        if (q.dialogue && q.dialogue.complete) {
            logMessage(`${npcType}: "${q.dialogue.complete}"`, 'magic');
        }
        claimQuestReward(q.id);
    }

    // Offer available quests
    for (const q of availableQuests) {
        if (q.dialogue && q.dialogue.offer) {
            logMessage(`${npcType}: "${q.dialogue.offer}"`, 'magic');
        }
        acceptQuest(q.id);
    }
}

// ─── Quest Journal UI ───

function openQuestJournal() {
    let modal = document.getElementById('questModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'questModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h2 style="text-align:center; color: #f1c40f;">📜 Quest Journal</h2>
            <div id="quest-list"></div>
            <h2 style="text-align:center; color: #9b59b6; margin-top: 20px;">📖 Discovered Lore</h2>
            <div id="lore-list"></div>
            <button onclick="document.getElementById('questModal').classList.remove('active'); gameState='PLAYING';" style="margin-top: 15px; width: 100%;">Close (Q)</button>
        </div>`;
        document.body.appendChild(modal);
    }

    const questDiv = document.getElementById('quest-list');
    const loreDiv = document.getElementById('lore-list');

    // Render quests
    let html = '';
    const allQuests = [...MAIN_ARC, ...SIDE_QUESTS];
    for (const q of allQuests) {
        let state = player.quests[q.id];
        if (!state || state === 'LOCKED') continue;

        let stateIcon = '⬜';
        let stateColor = '#888';
        if (state === 'AVAILABLE') { stateIcon = '📋'; stateColor = '#3498db'; }
        if (state === 'ACTIVE') { stateIcon = '⚔️'; stateColor = '#f39c12'; }
        if (state === 'COMPLETE') { stateIcon = '✅'; stateColor = '#2ecc71'; }
        if (state === 'REWARDED') { stateIcon = '🏆'; stateColor = '#f1c40f'; }

        let progressText = '';
        if (state === 'ACTIVE') {
            if (q.type === 'kill') {
                let kills = (player.questKills && player.questKills[q.id]) || 0;
                progressText = ` (${kills}/${q.count || 1})`;
            }
            if (q.type === 'kill_multi') {
                let parts = q.targets.map(t => {
                    let k = (player.questKills && player.questKills[q.id] && player.questKills[q.id][t.name]) || 0;
                    return `${t.name}: ${k}/${t.count}`;
                });
                progressText = ` (${parts.join(', ')})`;
            }
            if (q.type === 'open_vault') {
                let v = (player.questVaultCount && player.questVaultCount[q.id]) || 0;
                progressText = ` (${v}/${q.target})`;
            }
        }

        let isMainArc = MAIN_ARC.some(m => m.id === q.id);
        html += `<div style="padding: 8px; margin: 4px 0; border-left: 3px solid ${stateColor}; background: rgba(255,255,255,0.05);">
            <span style="color: ${stateColor};">${stateIcon}</span>
            <strong style="color: ${isMainArc ? '#f1c40f' : '#66fcf1'};">${isMainArc ? '⭐ ' : ''}${q.title}</strong>${progressText}
            <div style="color: #aaa; font-size: 0.85em; margin-top: 4px;">${q.description}</div>
            ${state === 'COMPLETE' ? '<div style="color: #2ecc71; font-size: 0.85em;">Return to NPC for reward!</div>' : ''}
        </div>`;
    }
    if (!html) html = '<div style="color: #888; text-align: center;">No quests yet. Talk to town NPCs!</div>';
    questDiv.innerHTML = html;

    // Render lore
    let loreHtml = '';
    for (const loreId of (player.discoveredLore || [])) {
        const frag = LORE_FRAGMENTS[loreId];
        if (frag) {
            loreHtml += `<div style="padding: 8px; margin: 4px 0; border-left: 3px solid ${frag.color}; background: rgba(255,255,255,0.03);">
                <strong style="color: ${frag.color};">${frag.title}</strong>
                <div style="color: #bbb; font-size: 0.85em; font-style: italic; margin-top: 4px;">"${frag.text}"</div>
            </div>`;
        }
    }
    if (!loreHtml) loreHtml = '<div style="color: #888; text-align: center;">No lore discovered yet.</div>';
    loreDiv.innerHTML = loreHtml;

    modal.classList.add('active');
    gameState = 'QUEST_JOURNAL';
}

// ─── Skill Menu UI ───

function openSkillMenu() {
    if (!player.class || !SKILL_TREES[player.class]) return;
    const tree = SKILL_TREES[player.class];

    let modal = document.getElementById('skillModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'skillModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content" style="max-width: 550px; max-height: 80vh; overflow-y: auto;">
            <h2 id="skill-tree-title" style="text-align:center;"></h2>
            <div id="skill-points-display" style="text-align:center; margin-bottom: 10px;"></div>
            <div id="skill-list"></div>
            <button onclick="document.getElementById('skillModal').classList.remove('active'); gameState='PLAYING';" style="margin-top: 15px; width: 100%;">Close (K)</button>
        </div>`;
        document.body.appendChild(modal);
    }

    document.getElementById('skill-tree-title').innerHTML = `<span style="color: ${tree.color};">⚔ ${tree.name}</span>`;
    document.getElementById('skill-points-display').innerHTML = `<span style="color: #f1c40f;">Skill Points: ${player.skillPoints || 0}</span>`;

    if (!player.unlockedSkills) player.unlockedSkills = [];

    let html = '';
    for (const skill of tree.skills) {
        let isUnlocked = skill.unlocked || player.unlockedSkills.includes(skill.id);
        let canUnlock = !isUnlocked && player.level >= skill.level && (player.skillPoints || 0) >= skill.cost;
        let isLevelLocked = !isUnlocked && player.level < skill.level;

        let bgColor = isUnlocked ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255,255,255,0.05)';
        let borderColor = isUnlocked ? '#2ecc71' : canUnlock ? '#f39c12' : '#555';
        let typeLabel = skill.type === 'active' ? '⚡ Active' : '🔵 Passive';

        html += `<div style="padding: 10px; margin: 6px 0; border-left: 3px solid ${borderColor}; background: ${bgColor};">
            <div><strong style="color: ${tree.color};">${skill.name}</strong> <span style="color: #888; font-size: 0.8em;">${typeLabel} | Lv ${skill.level}${skill.cost > 0 ? ' | Cost: ' + skill.cost + ' SP' : ''}</span></div>
            <div style="color: #bbb; font-size: 0.85em; margin-top: 4px;">${skill.description}</div>
            ${isUnlocked ? '<div style="color: #2ecc71; font-size: 0.85em;">✓ Unlocked</div>' : ''}
            ${canUnlock ? `<button onclick="unlockSkill('${skill.id}')" style="margin-top: 6px; padding: 4px 12px; font-size: 0.85em; background: #f39c12; color: #000; border: none; cursor: pointer;">Unlock (${skill.cost} SP)</button>` : ''}
            ${isLevelLocked ? `<div style="color: #e74c3c; font-size: 0.85em;">Requires Level ${skill.level}</div>` : ''}
        </div>`;
    }
    document.getElementById('skill-list').innerHTML = html;

    modal.classList.add('active');
    gameState = 'SKILL_MENU';
}

function unlockSkill(skillId) {
    if (!player.class || !SKILL_TREES[player.class]) return;
    const tree = SKILL_TREES[player.class];
    const skill = tree.skills.find(s => s.id === skillId);
    if (!skill) return;
    if (player.unlockedSkills && player.unlockedSkills.includes(skillId)) return;
    if ((player.skillPoints || 0) < skill.cost) return;
    if (player.level < skill.level) return;

    if (!player.unlockedSkills) player.unlockedSkills = [];
    player.unlockedSkills.push(skillId);
    player.skillPoints -= skill.cost;

    // Apply passive effects
    if (skill.type === 'passive') {
        applyPassiveSkill(skill);
    }

    logMessage(`Skill Unlocked: ${skill.name}!`, 'kill');
    spawnParticle(player.x, player.y, skill.name + '!', tree.color);

    // Refresh the menu
    openSkillMenu();
}

function applyPassiveSkill(skill) {
    if (!skill.effect) return;
    if (skill.effect.type === 'stat_bonus') {
        if (skill.effect.maxHp) { player.maxHp += skill.effect.maxHp; player.hp += skill.effect.maxHp; }
        if (skill.effect.def) player.def += skill.effect.def;
        if (skill.effect.speed) player.speed += skill.effect.speed;
    }
}
