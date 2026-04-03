const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TH_PATH = path.join(__dirname, 'test_harness.js');
const thCode = fs.readFileSync(TH_PATH, 'utf8');

(async () => {
    console.log("🚀 Starting Final Balanced Playtest (12 runs)...");
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
            const r = 10;
            for(let x = Math.max(0, player.x-r); x < Math.min(MAP_WIDTH, player.x+r); x++) {
                for(let y = Math.max(0, player.y-r); y < Math.min(MAP_HEIGHT, player.y+r); y++) {
                    map[x][y].visible = true; map[x][y].explored = true;
                }
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
                // Baseline: grant Short Sword
                const weapon = ITEM_DB.find(itm => itm.name === 'Short Sword');
                if (weapon) {
                    const sword = { ...weapon, identified: true };
                    player.inventory.push(sword);
                    window.useItem(player.inventory.indexOf(sword));
                }
                
                // Skip town
                let stairs = null;
                for(let x=0; x<70; x++) for(let y=0; y<50; y++) if(map[x][y].type==='stairs_down') stairs={x,y};
                if(stairs) { player.x = stairs.x; player.y = stairs.y; window.checkStairs(player.x, player.y, true); }
                
                let floorCount = 0;
                while(gameState === 'PLAYING' && currentFloor < 10 && floorCount < 1000) {
                   floorCount++;
                   const step = await window.TH.autoPlayFloor();
                   
                   // STICKINESS FIX: if portaita ei löydy (stair unreachable or floor timeout), 
                   // force finding stairs or teleport to them.
                   if (!step || step.phase !== 'ready_to_descend') {
                       // Find stairs manually
                       let s = null;
                       for(let x=0; x<70; x++) for(let y=0; y<50; y++) if(map[x][y].type==='stairs_down') s={x,y};
                       if (s) {
                           // Teleport to stairs and descend
                           player.x = s.x; player.y = s.y;
                           await window.TH.descendStairs();
                           continue; // Keep going
                       }
                       break; 
                   }
                   await window.TH.descendStairs();
                }

                return {
                    class: c, floor: currentFloor, level: player.level, gold: player.gold,
                    result: gameState === 'VICTORY' ? 'VICTORY' : (gameState === 'PLAYER_DEAD' ? 'DEAD' : 'STOPPED'),
                    killer: document.getElementById('go-killer')?.innerText.split('killed by ')[1] || "Unknown"
                };
            }, cls);

            results.push(res);
            console.log(`📈 Run ${i+1}/12: ${cls} → Floor ${res.floor} (${res.result}) Killed by: ${res.killer}`);
        } catch (e) {
            console.error(`❌ Run ${i+1} failed.`);
        }
    }

    fs.writeFileSync('mass_stats.json', JSON.stringify(results, null, 2));
    await browser.close();
    console.log("\n📊 Balanced Test Runs complete.");
})();
