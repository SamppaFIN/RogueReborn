const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TH_PATH = path.join(__dirname, 'test_harness.js');
const thCode = fs.readFileSync(TH_PATH, 'utf8');

(async () => {
    console.log("🏆 Starting FINAL LEGENDARY VICTORY RUN...");
    const url = 'http://127.0.0.1:8234/index.html';
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); } catch (e) { await browser.close(); return; }

    await page.evaluate((code) => {
        const el = document.createElement('script'); el.textContent = code; document.head.appendChild(el);
    }, thCode);

    await page.evaluate(() => {
        window.TH.sleep = () => Promise.resolve();
        window.updateUI = () => {}; window.render = () => {}; window.logMessage = () => {}; window.spawnParticle = () => {};
    });

    const runSummary = await page.evaluate(async () => {
        window.startGame('Warrior');
        
        // --- GOD-MODE GEAR ---
        const gearNames = ['Anduril', 'Mithril Plate', 'Mithril Shield', 'Helm of Telepathy', 'Ring of Fire Resist'];
        gearNames.forEach(name => {
            const template = ITEM_DB.find(i => i.name === name);
            if (template) {
                const item = { ...template, identified: true };
                player.inventory.push(item);
                window.useItem(player.inventory.indexOf(item));
            }
        });
        
        player.level = 15; player.maxHp = 500; player.hp = 500; player.atk = 30; player.def = 20; player.speed = 20;
        
        // JUMP TO NEAR END
        currentFloor = 14; 
        window.initMap(); 
        window.generateDungeon(); 

        let steps = 0;
        while(gameState !== 'VICTORY' && gameState !== 'PLAYER_DEAD' && steps < 1000) {
            steps++;
            await window.TH.autoPlayFloor();
            if (gameState === 'VICTORY') break;
            if (gameState === 'PLAYER_DEAD') break;
            
            // Descend if ready
            let stairs = null;
            for(let x=0; x<70; x++) for(let y=0; y<50; y++) if(map[x][y].type==='stairs_down') stairs={x,y};
            if(stairs) { player.x=stairs.x; player.y=stairs.y; await window.TH.descendStairs(); } else break;
        }
        return { result: gameState, floor: currentFloor, steps };
    });

    console.log(`🏁 Result: ${runSummary.result} at Floor ${runSummary.floor}`);
    fs.writeFileSync('victory_stats.json', JSON.stringify(runSummary));
    await browser.close();
})();
