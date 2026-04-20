const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const numRuns = 5;
    const targetClass = 'Warrior';
    console.log(`🚀 Starting ${numRuns} Mass Simulations [Class: ${targetClass}]`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
        if(msg.text().includes('[Autoplay]')) return; // ignore equip spam
        console.log('BROWSER:', msg.text());
    });
    
    page.on('pageerror', err => {
        console.log('BROWSER ERROR:', err.message);
    });

    let allStats = [];

    for (let run = 1; run <= numRuns; run++) {
        await page.goto('http://127.0.0.1:8234/index.html', { waitUntil: 'load' });
        
        const result = await page.evaluate(async (className) => {
            return new Promise((resolve) => {
                let maxTicks = 150000;
                
                // Override render to bypass requestAnimationFrame bottlenecks safely
                if (typeof window !== 'undefined') {
                    window.render = () => {};
                    window.resizeCanvas = () => {};
                    window.updateUI = () => {};
                    window.logMessage = () => {};
                    window.spawnParticle = () => {};
                }
                
                // Start
                if (window.startGame) {
                    window.startGame(className);
                    if (typeof window.toggleAutoPlay === 'function') window.toggleAutoPlay(true);
                }

                async function loop() {
                    let loopCount = 0;
                    while (true) {
                        loopCount++;
                        if (typeof gameState === 'undefined') {
                            await new Promise(r => setTimeout(r, 5));
                            continue;
                        }

                        // remove console.log spam for speed

                        // Pump the game loop slightly per JS macro-task
                        for (let i = 0; i < 100; i++) {
                            if (gameState === 'PLAYER_DEAD' || gameState === 'VICTORY') {
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

                            if (typeof window.processAutoPlay === 'function' && window.isAutoPlayActive) {
                                window.processAutoPlay();
                            }
                            if (typeof window.runLogicalTick === 'function') {
                                window.runLogicalTick();
                            }
                        }

                        if (window.autoPlayTurns > maxTicks) {
                            let mapDump = '';
                            for (let y = player.y - 5; y <= player.y + 5; y++) {
                                let row = '';
                                for (let x = player.x - 5; x <= player.x + 5; x++) {
                                    if (x===player.x && y===player.y) row += '@';
                                    else if (x<0 || x>=MAP_WIDTH || y<0 || y>=MAP_HEIGHT) row += 'X';
                                    else row += getEntityAt(x,y) ? getEntityAt(x,y).char : map[x][y].char;
                                }
                                mapDump += row + '\n';
                            }
                            console.log(`[DEBUG] TIMEOUT STATE:\nPlayer: ${player.x},${player.y}\nactivePath: ${JSON.stringify(activePath)}\nMap around player:\n${mapDump}`);
                            resolve({ status: 'TIMEOUT', floor: window.currentFloor, level: window.player?.level, score: window.player?.gold, turns: window.autoPlayTurns, killer: 'Time' });
                            return;
                        }

                        await new Promise(r => setTimeout(r, 1)); // Yield to event loop
                    }
                }
                
                loop();
            });
        }, targetClass);

        allStats.push(result);
        console.log(`[Run ${run}/${numRuns}] Status: ${result.status} | Floor: ${result.floor} | Lvl: ${result.level} | Killer: ${result.killer} | Turns: ${result.turns}`);
    }

    await browser.close();

    fs.writeFileSync('mass_stats.json', JSON.stringify(allStats, null, 2));

    let avgFloor = allStats.reduce((s, r) => s + r.floor, 0) / numRuns;
    let avgLvl = allStats.reduce((s, r) => s + r.level, 0) / numRuns;
    let timeouts = allStats.filter(r => r.status === 'TIMEOUT').length;
    let dead = allStats.filter(r => r.status === 'PLAYER_DEAD').length;
    let victory = allStats.filter(r => r.status === 'VICTORY').length;

    let killers = {};
    for (let s of allStats) {
        if (!killers[s.killer]) killers[s.killer] = 0;
        killers[s.killer]++;
    }

    console.log(`\n==== SIMULATION RESULTS ====`);
    console.log(`Total Runs: ${numRuns}`);
    console.log(`Avg Floor: ${avgFloor.toFixed(2)}`);
    console.log(`Avg Level: ${avgLvl.toFixed(2)}`);
    console.log(`Timeouts: ${timeouts}`);
    console.log(`Deaths: ${dead}`);
    console.log(`Victories: ${victory}`);
    console.log(`Killers:`);
    let sortedKillers = Object.entries(killers).sort((a, b) => b[1] - a[1]);
    for (let [k, v] of sortedKillers) {
        console.log(`  ${k}: ${v}`);
    }
})();
