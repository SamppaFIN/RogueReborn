const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TH_PATH = path.join(__dirname, 'test_harness.js');
const thCode = fs.readFileSync(TH_PATH, 'utf8');

(async () => {
    console.log("🚀 Starting Phase V: Skills, Quests & Lore Simulation (Fixed) (12 runs)...");
    const url = 'http://127.0.0.1:8234/index.html';
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }); } catch (e) { await browser.close(); return; }

    await page.evaluate((code) => {
        const el = document.createElement('script'); el.textContent = code; document.head.appendChild(el);
    }, thCode);

    await page.evaluate(() => {
        window.TH.sleep = () => Promise.resolve();
        window.updateUI = () => {}; window.render = () => {}; window.logMessage = () => {}; window.spawnParticle = () => {};
        window.TH._processMonsters = () => {
            for (let e of entities) {
                if (e.isPlayer || e.hp <= 0) continue;
                if (Math.abs(e.x - player.x) + Math.abs(e.y - player.y) > 2) continue; 
                e.energy = 100; processMonsterAI(e);
            }
        };
        window.computeFOV = () => {
            const r = 12;
            for(let x = Math.max(0, player.x-r); x < Math.min(MAP_WIDTH, player.x+r); x++) {
                for(let y = Math.max(0, player.y-r); y < Math.min(MAP_HEIGHT, player.y+r); y++) {
                    map[x][y].visible = true; map[x][y].explored = true;
                }
            }
        };

        // Phase V Bot Logic: Auto-Unlock Skills
        window.TH.autoUnlockSkills = () => {
            if (!player.class || !SKILL_TREES[player.class]) return;
            const tree = SKILL_TREES[player.class];
            if (!player.unlockedSkills) player.unlockedSkills = [];
            for (const skill of tree.skills) {
                if (!player.unlockedSkills.includes(skill.id) && player.level >= skill.level && player.skillPoints >= skill.cost) {
                    window.unlockSkill(skill.id);
                }
            }
        };

        // Phase V Bot Logic: Handle Quests
        window.TH.checkQuestNPCs = () => {
            if (currentFloor === 0) {
                const npcs = ['mayor', 'wizard', 'healer', 'trainer', 'alchemist', 'cartographer', 'guildhall'];
                npcs.forEach(type => {
                    if (typeof window.handleQuestNPC === 'function') window.handleQuestNPC(type);
                });
            }
        };
    });

    const results = [];
    const classes = ['Warrior', 'Mage', 'Rogue'];

    for (let i = 0; i < 12; i++) {
        const cls = classes[i % 3];
        try {
            const res = await page.evaluate(async (c) => {
                window.startGame(c);
                if (typeof window.initQuestSystem === 'function') window.initQuestSystem();
                window.TH.checkQuestNPCs(); // Initial quests

                let moveCount = 0;
                while(gameState === 'PLAYING' && currentFloor < 15 && moveCount < 1000) {
                   moveCount++;
                   
                   // Every 100 moves, check if in town and try to talk to NPCs
                   if (moveCount % 100 === 0 && currentFloor === 0) window.TH.checkQuestNPCs();
                   
                   window.TH.autoUnlockSkills();

                   const step = await window.TH.autoPlayFloor();
                   
                   if (step && step.phase === 'ready_to_descend') {
                       await window.TH.descendStairs();
                   }
                   
                   if (moveCount % 20 === 0 && player.skillCooldown === 0) {
                       window.useClassSkill();
                   }

                   if (gameState === 'PLAYER_DEAD') break;
                }

                return {
                    class: c, 
                    floor: currentFloor, 
                    level: player.level, 
                    gold: player.gold,
                    skillPoints: player.skillPoints,
                    unlockedSkillsCount: (player.unlockedSkills || []).length,
                    questsCompletedCount: Object.values(player.quests || {}).filter(s => s === 'REWARDED').length,
                    loreCount: (player.discoveredLore || []).length,
                    result: gameState === 'VICTORY' ? 'VICTORY' : (gameState === 'PLAYER_DEAD' ? 'DEAD' : 'STOPPED'),
                    killer: document.getElementById('go-killer')?.innerText.split('killed by ')[1] || "None"
                };
            }, cls);

            results.push(res);
            console.log(`📈 Run ${i+1}/12: ${cls} → Floor ${res.floor} (Lvl ${res.level}) Skills: ${res.unlockedSkillsCount} Quests: ${res.questsCompletedCount} Lore: ${res.loreCount} [${res.result}]`);
        } catch (e) {
            console.error(`❌ Run ${i+1} failed:`, e.message);
        }
    }

    fs.writeFileSync('mass_stats_phase5.json', JSON.stringify(results, null, 2));
    await browser.close();
    console.log("\n📊 Phase V Simulation complete.");
})();
