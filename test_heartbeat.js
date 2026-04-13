const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TH_PATH = path.join(__dirname, 'test_harness.js');
const thCode = fs.readFileSync(TH_PATH, 'utf8');

(async () => {
    console.log("🚀 Testing Heartbeat & Energy System (Batch 1)...");
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
            if (typeof window.initQuestSystem === 'function') window.initQuestSystem();
            
            let moveCount = 0;
            // Run for 100 logical steps
            while(gameState === 'PLAYING' && moveCount < 100) {
                moveCount++;
                const step = await window.TH.autoPlayFloor();
                if (step && step.phase === 'ready_to_descend') await window.TH.descendStairs();
                if (gameState === 'PLAYER_DEAD') break;
            }
            return {
                floor: currentFloor,
                hp: player.hp,
                energy: player.energy,
                moves: moveCount,
                result: gameState
            };
        });

        console.log("✅ Stability Test Passed:", res);
    } catch (e) {
        console.error("❌ Stability Test Failed:", e.message);
    } finally {
        await browser.close();
    }
})();
