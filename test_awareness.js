const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TH_PATH = path.join(__dirname, 'test_harness.js');
const thCode = fs.readFileSync(TH_PATH, 'utf8');

(async () => {
    console.log("🚀 Testing Monster Awareness & Sound System (Batch 2)...");
    const url = 'http://127.0.0.1:8234/index.html';
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try { 
        await page.goto(url, { waitUntil: 'networkidle', timeout: 5000 }); 
        
        await page.evaluate((code) => {
            const el = document.createElement('script'); el.textContent = code; document.head.appendChild(el);
        }, thCode);

        await page.evaluate(() => {
            window.updateUI = () => {}; window.render = () => {}; window.logMessage = () => {}; window.spawnParticle = () => {};
            window.TH.sleep = () => Promise.resolve();
        });

        const res = await page.evaluate(async () => {
            window.startGame('Warrior');
            
            // 1. Find a monster or spawn one
            let mon = entities.find(e => !e.isPlayer && e.hp > 0);
            if (!mon) {
                // If no monster, spawn one at a distance
                mon = new Entity(player.x + 5, player.y, 'g', '#f1c40f', 'Test Goblin', 10, 2, 1, 10);
                entities.push(mon);
            }
            
            const initialSleeping = mon.sleeping;
            
            // 2. Player moves to generate noise
            // We need to run enough heartbeats for noise to accumulate or for AI to process
            let wakesUp = false;
            let movedTowards = false;
            let initialDist = Math.abs(mon.x - player.x) + Math.abs(mon.y - player.y);

            for (let i = 0; i < 50; i++) {
                // Force player to move back and forth to create noise
                const dx = (i % 2 === 0) ? 1 : -1;
                window.attemptAction(player, { type: 'move', dx: dx, dy: 0 }, 100);
                
                // Allow logical ticks to pass
                // Usually heartbeat is 100ms. In test, we can manually call runLogicalTick if we want to speed up.
                window.runLogicalTick();
                
                if (!mon.sleeping) wakesUp = true;
                let currentDist = Math.abs(mon.x - player.x) + Math.abs(mon.y - player.y);
                if (currentDist < initialDist) movedTowards = true;
                
                if (wakesUp && movedTowards) break;
            }

            return {
                initialSleeping,
                wakesUp,
                movedTowards,
                finalDist: Math.abs(mon.x - player.x) + Math.abs(mon.y - player.y),
                finalNoise: noiseMap[player.x][player.y]
            };
        });

        console.log("✅ Awareness Test Results:", res);
        if (res.wakesUp && res.movedTowards) {
            console.log("🎉 SUCCESS: Monster woke up and investigated noise!");
        } else {
            console.log("⚠️ WARNING: Monster behavior did not meet all criteria.");
        }
    } catch (e) {
        console.error("❌ Awareness Test Failed:", e.message);
    } finally {
        await browser.close();
    }
})();
