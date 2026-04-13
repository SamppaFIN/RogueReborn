const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TH_PATH = path.join(__dirname, 'test_harness.js');
const thCode = fs.readFileSync(TH_PATH, 'utf8');

(async () => {
    console.log("🚀 Testing World Building & Vaults (Batch 3)...");
    const url = 'http://127.0.0.1:8234/index.html';
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try { 
        await page.goto(url, { waitUntil: 'networkidle', timeout: 5000 }); 
        
        await page.evaluate((code) => {
            const el = document.createElement('script'); el.textContent = code; document.head.appendChild(el);
        }, thCode);

        const res = await page.evaluate(async () => {
            window.startGame('Warrior');
            
            // Generate multiple floors to increase chance of Vault/Ego
            let vaultFound = false;
            let egoFound = false;
            let artifactsDefined = ITEM_DB.some(i => i.artifact);

            for (let f = 1; f <= 10; f++) {
                currentFloor = f;
                window.generateDungeon();
                
                // Check for vaults
                // Note: we need to find if any room in generateDungeon was marked as vault
                // Since 'rooms' is local to generateDungeon, we check the map for '%' or special colors
                for (let x = 0; x < MAP_WIDTH; x++) {
                    for (let y = 0; y < MAP_HEIGHT; y++) {
                        if (map[x][y].type === 'wall' && map[x][y].color === '#8e44ad') vaultFound = true;
                    }
                }

                // Check for ego items
                for (let it of items) {
                    if (it.ego) egoFound = true;
                }
                
                if (vaultFound && egoFound) break;
            }

            return {
                vaultFound,
                egoFound,
                artifactsDefined,
                totalItems: items.length,
                totalEntities: entities.length
            };
        });

        console.log("✅ World Test Results:", res);
        if (res.egoFound) {
            console.log("🎉 SUCCESS: Ego items generated naturally!");
        }
        if (res.vaultFound) {
            console.log("🎉 SUCCESS: Vault architecture detected!");
        }
    } catch (e) {
        console.error("❌ World Test Failed:", e.message);
    } finally {
        await browser.close();
    }
})();
