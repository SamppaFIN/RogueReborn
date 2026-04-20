const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    // Determine if we should run headless (e.g. CI) or visually
    const isHeadless = process.argv.includes('--headless');
    const targetClass = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'Warrior';

    console.log(`🚀 Starting Autoplay AI Bot [Class: ${targetClass}] (Headless: ${isHeadless})...`);
    
    // Assumes server is running on 8080 or change to 8234 depending on standard test runner
    const url = 'http://127.0.0.1:8234/index.html';
    const browser = await chromium.launch({ headless: isHeadless, slowMo: isHeadless ? 0 : 50 });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
        console.log('BROWSER:', msg.text());
    });
    
    page.on('pageerror', err => {
        console.log('BROWSER ERROR:', err.message);
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 5000 });
    } catch (e) {
        console.log("No server found on 8234, trying 8080...");
        try {
            await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle', timeout: 5000 });
        } catch (e2) {
             console.error("❌ Could not connect to any local server. Have you started the game server?");
             await browser.close();
             return;
        }
    }

    try {
        // Run the agent inside the page context via the new Autoplay Interface
        const result = await page.evaluate(async (className) => {
            return new Promise((resolve) => {
                let checkTicks = 0;
                let maxCheckTicks = 150000; // 150 seconds polling
                
                // Helper to start the game and toggle autoplay
                setTimeout(() => {
                    if (window.startGame) {
                         window.startGame(className);
                         console.log(`[AI] Started game as ${className}`);
                         if (typeof window.toggleAutoPlay === 'function') {
                             window.toggleAutoPlay(true);
                         } else {
                             resolve({ status: 'ERROR', killer: 'Autoplay missing' });
                         }
                    }
                }, 500);

                // Polling Loop since Autoplay runs in the engine's Heartbeat
                let loop = setInterval(() => {
                    if (typeof gameState === 'undefined') return;

                    // If headless, tick the game loop forward to simulate the browser window being focused
                    if (typeof window.runLogicalTick === 'function') {
                        window.runLogicalTick();
                    }

                    if (gameState === 'PLAYER_DEAD' || gameState === 'VICTORY') {
                        clearInterval(loop);
                        resolve({
                            status: gameState,
                            floor: typeof currentFloor !== 'undefined' ? currentFloor : 0,
                            level: player ? player.level : 0,
                            score: player ? player.gold : 0,
                            turns: typeof window.autoPlayTurns !== 'undefined' ? window.autoPlayTurns : 0,
                            killer: document.getElementById('go-killer') ? document.getElementById('go-killer').innerText : 'Unknown'
                        });
                        return;
                    }

                    checkTicks++;
                    if (checkTicks > maxCheckTicks) {
                        clearInterval(loop);
                        resolve({ status: 'TIMEOUT', floor: window.currentFloor, level: window.player?.level, score: window.player?.gold, turns: window.autoPlayTurns, killer: 'Time' });
                        return;
                    }

                    if (checkTicks % 1000 === 0) {
                        console.log(`[AI] Polling... Floor: ${window.currentFloor}, Level: ${window.player?.level}, HP: ${window.player?.hp}/${window.player?.maxHp}, Autoplay Turns: ${window.autoPlayTurns}`);
                    }
                }, 10);
            });
        }, targetClass);

        console.log(`\n============== REPORT ==============`);
        console.log(`Status: ${result.status}`);
        console.log(`Class: ${targetClass}`);
        console.log(`Level: ${result.level}`);
        console.log(`Floor Reached: ${result.floor}`);
        console.log(`Gold: ${result.score}`);
        console.log(`Autoplay Turns Survived: ${result.turns}`);
        console.log(`Cause of Ending: ${result.killer}`);
        console.log(`====================================\n`);

        await page.screenshot({ path: `autoplay_playtest_final_${targetClass}.png` });
        
    } catch (e) {
        console.error("❌ Playtest encountered an unhandled error:", e);
    } finally {
        await browser.close();
        console.log("Playtest closed.");
    }
})();
