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
        page.on('console', msg => {
            console.log('BROWSER:', msg.text());
        });
        page.on('pageerror', err => {
            console.log('BROWSER ERROR:', err.message);
        });
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
            return new Promise((resolve, reject) => {
                try {
                    let turns = 0;
                    let stuckCount = 0;
                    let lastFloor = -1;
                    let interval = setInterval(() => {
                        try {
                            turns++;
                            if (typeof gameState === 'undefined') return;
                            
                            if (currentFloor !== lastFloor) {
                                console.log(`(In-Game) Floor: ${currentFloor}`);
                                lastFloor = currentFloor;
                            }

                            if (gameState === 'PLAYER_DEAD' || gameState === 'VICTORY') {
                                clearInterval(interval);
                                resolve({ status: gameState, turns, floor: currentFloor, level: player ? player.level : 0, score: player ? player.gold : 0 });
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
                                    if (turns % 100 === 0) console.log(`(In-Game) Fighting...`);
                                } else if (map[player.x][player.y].type === 'stairs_down') {
                                    console.log(`(In-Game) Descending to Floor ${currentFloor + 1}...`);
                                    checkStairs(player.x, player.y, true);
                                    keys['o'] = false;
                                    stuckCount = 0;
                                } else if (!isAutoRunning && (!activePath || activePath.length === 0)) {
                                    keys['o'] = true; // Hold explore
                                    keys[' '] = false; // Stop attacking
                                    stuckCount++;
                                    if (turns % 100 === 0) {
                                let sx = -1, sy = -1;
                                for(let x=0;x<70;x++) for(let y=0;y<50;y++) if(map[x][y].type==='stairs_down'){sx=x;sy=y;break;}
                                console.log(`(In-Game) Auto-exploring... Turn: ${turns}, Pos: ${player.x},${player.y}, Stairs: ${sx},${sy}, isAutoExploring: ${isAutoExploring}, State: ${gameState}, Path: ${activePath ? activePath.length : 'N/A'}`);
                            }
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
                                
                                if (turns > 20000) {
                                    clearInterval(interval);
                                    resolve({ status: 'TIMEOUT', turns, floor: currentFloor, level: player ? player.level : 0, score: player ? player.gold : 0 });
                                }
                            } else if (gameState !== 'START') {
                                // Modal open (Shop, Healer, etc.)
                                if (typeof closeAllModals === 'function') {
                                    closeAllModals();
                                } else if (typeof window.closeAllModals === 'function') {
                                    window.closeAllModals();
                                }
                                stuckCount = 0;
                            }
                        } catch (e) {
                            console.log(`(In-Game) Interval Error: ${e.message}`);
                            clearInterval(interval);
                            reject(e.message);
                        }
                    }, 10);
                } catch (e) {
                    console.log(`(In-Game) Eval Start Error: ${e.message}`);
                    reject(e.message);
                }
            });
        });

        const floor = result.floor;
        const level = result.level;
        const score = result.score;
        const cause = result.status === 'TIMEOUT' ? 'Timeout' : (await page.$eval('#go-killer', el => el.innerText).catch(() => result.status));
        const turns = result.turns;

        console.log(`Result: Floor ${floor}, Cause: ${cause}, Score: ${score}, Level: ${level}, Turns: ${turns}`);
        stats.push({ run: i, class: 'Warrior', floor, level, score, cause, turns });
        fs.writeFileSync('playtest_stats.json', JSON.stringify(stats, null, 2));
        
        await context.close();
    }
    
    console.table(stats);
    fs.writeFileSync('playtest_stats.json', JSON.stringify(stats, null, 2));
    await browser.close();
})();
