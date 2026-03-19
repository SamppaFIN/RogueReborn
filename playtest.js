const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log("Launching automated headless browser...");
    const browser = await chromium.launch({ headless: true });
    let stats = [];

    for (let i = 1; i <= 10; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('http://127.0.0.1:8080/');
        await page.waitForTimeout(500);

        console.log(`\n--- Run ${i} / 10 ---`);
        
        // Choose Warrior
        try {
            await page.click("button:has-text('Warrior')");
            await page.waitForTimeout(500);
        } catch (e) {
            console.log("Could not find class selection, maybe already started?");
        }

        let alive = true;
        let turn = 0;

        const result = await page.evaluate(async () => {
            return new Promise(resolve => {
                let turns = 0;
                let stuckCount = 0;
                let interval = setInterval(() => {
                    turns++;
                    if (typeof gameState === 'undefined') return;
                    if (gameState === 'PLAYER_DEAD' || gameState === 'VICTORY') {
                        clearInterval(interval);
                        resolve({ status: gameState, turns });
                        return;
                    }

                    if (gameState === 'PLAYING') {
                        let enemyAdjacent = false;
                        for (let e of entities) {
                            if (!e.isPlayer && typeof e.hp !== 'undefined' && e.hp > 0 && 
                                Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1) {
                                enemyAdjacent = true; break;
                            }
                        }

                        if (enemyAdjacent) {
                            keys[' '] = true; // Hold attack
                            keys['o'] = false; // Stop exploring
                            stuckCount = 0;
                        } else if (!isAutoRunning && (!activePath || activePath.length === 0)) {
                            keys['o'] = true; // Hold explore
                            keys[' '] = false; // Stop attacking
                            stuckCount++;
                            if (stuckCount > 100) {
                                keys['w'] = true; // Unstuck randomly
                                setTimeout(() => { keys['w'] = false; }, 50);
                                stuckCount = 0;
                            }
                        } else {
                            // Pathing/running, don't interfere
                            keys['o'] = false;
                            keys[' '] = false;
                            stuckCount = 0;
                        }
                        
                        if (turns > 15000) {
                            clearInterval(interval);
                            resolve({ status: 'TIMEOUT', turns });
                        }
                    }
                }, 20);
            });
        });

        const floor = await page.$eval('#go-floor', el => el.innerText).catch(() => 'VICTORY/UNKNOWN');
        const cause = await page.$eval('#go-killer', el => el.innerText).catch(() => 'Survivor');
        const score = await page.$eval('#go-score', el => el.innerText).catch(() => '0');
        const level = await page.$eval('#go-level', el => el.innerText).catch(() => '0');

        console.log(`Result: Floor ${floor}, Cause: ${cause}, Score: ${score}, Level: ${level}, Turns: ${result.turns}`);
        stats.push({ run: i, class: 'Warrior', floor, level, score, cause, turns: result.turns });
        
        await context.close();
    }
    
    console.table(stats);
    fs.writeFileSync('playtest_stats.json', JSON.stringify(stats, null, 2));
    await browser.close();
})();
