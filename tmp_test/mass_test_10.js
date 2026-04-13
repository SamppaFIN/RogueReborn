const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log("🚀 Starting Mass Playtest Simulation (200 runs, Optimized)...");
    
    const url = 'http://127.0.0.1:8234/index.html';
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
        console.error("❌ Could not connect.");
        await browser.close();
        return;
    }

    await page.evaluate(() => {
        window.MassSim = {
            async simulateOne(className) {
                window.startGame(className);
                
                // Jump to dungeon
                let stairs = null;
                for(let x=0; x<70; x++) for(let y=0; y<50; y++) if(map[x][y].type==='stairs_down') stairs={x,y};
                if(stairs) {
                    player.x = stairs.x; player.y = stairs.y;
                    window.checkStairs(player.x, player.y, true);
                }

                let turns = 0;
                const maxTurns = 15000;
                
                while (gameState === 'PLAYING' && turns < maxTurns) {
                    turns++;
                    
                    // Priority 1: Healing
                    if (player.hp < player.maxHp * 0.5) {
                        const healIdx = player.inventory.findIndex(i => i.effect === 'heal');
                        if (healIdx >= 0) {
                            window.useItem(healIdx);
                            // Process monsters turns after item use
                            for (let e of entities) { if (!e.isPlayer && e.hp > 0) { e.energy = 100; window.processMonsterAI(e); } }
                            continue;
                        }
                    }

                    // Priority 2: Combat (Adjacent)
                    const monster = window.getNearestMonster(player.x, player.y);
                    const dist = monster ? (Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y)) : 999;
                    if (monster && dist <= 1) {
                        window.attemptAction(player, { type: 'move', dx: monster.x - player.x, dy: monster.y - player.y });
                    } else if (map[player.x][player.y].type === 'stairs_down') {
                        // Priority 3: Stairs Down
                        window.checkStairs(player.x, player.y, true);
                    } else {
                        // Priority 4: Explore or Move to Monster
                        let goalPath = window.findNearestUnexplored(player.x, player.y);
                        if (!goalPath && monster) {
                            goalPath = window.findPath(player.x, player.y, monster.x, monster.y);
                        }
                        
                        if (goalPath && goalPath.length > 0) {
                            const step = goalPath[0];
                            window.attemptAction(player, { type: 'move', dx: step.x - player.x, dy: step.y - player.y });
                        } else {
                            // Stuck fallback: random move
                            const d = [[1,0],[-1,0],[0,1],[0,-1]][Math.floor(Math.random()*4)];
                            window.attemptAction(player, { type: 'move', dx: d[0], dy: d[1] });
                        }
                    }

                    // Process Monsters
                    for (let e of entities) {
                        if (!e.isPlayer && e.hp > 0 && e.blocksMovement) {
                            e.energy = 100;
                            window.processMonsterAI(e);
                        }
                    }

                    if (player.hp < player.maxHp && turns % 20 === 0) player.hp++;
                    if (gameState !== 'PLAYING') break;
                }

                return {
                    class: className,
                    level: player.level,
                    floor: currentFloor,
                    gold: player.gold,
                    causeOfDeath: gameState === 'VICTORY' ? 'VICTORY' : (document.getElementById('go-killer')?.innerText || (gameState === 'PLAYER_DEAD' ? "Unknown" : (turns >= maxTurns ? "Timeout" : "Ongoing"))),
                    turns,
                    inventory: player.inventory.map(i => i.name)
                };
            }
        };
    });

    const results = [];
    const totalRuns = 10;
    for (let i = 0; i < totalRuns; i++) {
        try {
            await new Promise(r => setTimeout(r, 2000)); // Wait for page logic to settle
            const res = await page.evaluate((c) => window.MassSim.simulateOne(c), ['Warrior', 'Mage', 'Rogue'][i%3]);
            results.push(res);
            console.log(`📉 Progress: ${i+1}/${totalRuns}... Class: ${res.class}, Floor: ${res.floor}`);
        } catch (e) {
            console.error(`❌ Run ${i+1} failed:`, e.message);
            // Take a screenshot on failure
            await page.screenshot({ path: `failure_run_${i+1}.png` });
            break;
        }
    }

    fs.writeFileSync('mass_stats.json', JSON.stringify(results, null, 2));

    const winners = results.filter(r => r.causeOfDeath === 'VICTORY');
    const avgFloor = (results.reduce((s, r) => s + r.floor, 0) / totalRuns).toFixed(2);
    console.log(`\n📊 --- Results (${totalRuns} runs) ---`);
    console.log(`Victories: ${winners.length}`);
    console.log(`Avg Floor: ${avgFloor}`);
    console.log(`Max Floor: ${Math.max(...results.map(r => r.floor))}`);
    
    await browser.close();
})();
