/**
 * Rogue Reborn - Shop, NPC & Modal Systems
 * Extracted from engine.js for modularity.
 * Dependencies: constants.js, items.js, enemies.js (loaded before this)
 */
function randomizeFlavors() {
    let pColors = [...POTION_COLORS].sort(() => Math.random() - 0.5);
    let sTitles = [...SCROLL_TITLES].sort(() => Math.random() - 0.5);
    let wWoods = [...WAND_WOODS].sort(() => Math.random() - 0.5);

    ITEM_DB.forEach(item => {
        if (item.type === 'potion') item.flavor = `${pColors.pop() || 'Strange'} Potion`;
        if (item.type === 'scroll') item.flavor = `Scroll labeled '${sTitles.pop() || 'UNKNOWN'}'`;
        if (item.type === 'wand') item.flavor = `${wWoods.pop() || 'Weird'} Wand`;
    });
}
randomizeFlavors();

function getItemName(item) {
    if (!item) return "Empty";
    let name = item.name;
    let isUnid = false;

    if (['potion', 'scroll', 'wand'].includes(item.type)) {
        if (identifiedTypes[item.name]) return item.name;
        name = item.flavor || item.name;
        isUnid = true;
    } else if (['weapon', 'armor', 'helm', 'ring', 'amulet'].includes(item.type)) {
        if (item.identified) {
            name = item.name;
            if (item.blessed) name = `Blessed ${name}`;
            if (item.cursed) name = `Cursed ${name}`;
        } else {
            name = `Unidentified ${item.name.split(' (')[0]}`;
            isUnid = true;
        }
    }
    return name + (isUnid ? " (?)" : "");
}

window.startGame = function (className) {
    const nameInput = document.getElementById('charName').value || 'Nameless';
    player.name = nameInput;
    player.level = 1;
    player.xp = 0;
    player.nextXp = 50;

    player.class = className; // #VIII store class
    player.killCount = 0;     // track total kills for perks
    player.killsByType = {};  // Phase IV: track kills per species for AI reputation
    player.combatSurgeTimer = 0; // Warrior perk
    player.inventory = [];    // FIX: Clear inventory on start to avoid duplication
    player.equipment = { weapon: null, armor: null, helm: null, ring: null, amulet: null, offhand: null };
    currentFloor = 0;         // FIX: Ensure we start in town

    if (className === 'Warrior') {
        player.maxHp = 40; player.hp = 40; player.atk = 7; player.def = 4; player.speed = 8;
        logMessage("Warrior Perk: Combat Surge every 5 kills (+2 Atk, 20 ticks)", 'magic');
    } else if (className === 'Mage') {
        player.maxHp = 25; player.hp = 25; player.atk = 4; player.def = 2; player.speed = 10;
        player.spellMastery = true; // Spells scale with level
        player.inventory.push({ ...ITEM_DB.find(i => i.name === 'Wand of Magic Missile'), identified: true });
        identifiedTypes['Wand of Magic Missile'] = true;
        // Mage Robes
        const robes = { ...ITEM_DB.find(i => i.name === 'Mage Robes'), identified: true };
        player.inventory.push(robes);
        player.equipment.armor = robes;
        logMessage("Mage Perk: Spell Mastery â€” spell damage scales with level", 'magic');
    } else if (className === 'Rogue') {
        player.maxHp = 30; player.hp = 30; player.atk = 5; player.def = 3; player.speed = 14;
        player.backstab = true; // First hit from unseen = double damage
        logMessage("Rogue Perk: Backstab â€” first hit from unseen = 2x damage", 'magic');
    }
    const modal = document.getElementById('charCreateModal');
    if (modal) modal.classList.remove('active');
    
    // Drop focus so Spacebar doesn't click the start button again!
    if (document.activeElement) document.activeElement.blur();

    gameState = 'PLAYING';
    generateTown();
    if (typeof initQuestSystem === 'function') initQuestSystem();
    computeFOV();
    updateUI();
    logMessage("Welcome to Autonomous Rogue. [J]ournal [K]ills [I]nventory [Q]Skill", "hint");
};

window.showGameOverModal = function (killerName) {
    gameState = 'PLAYER_DEAD';

    // Calculate Score
    const score = Math.floor(player.xp + (player.gold * 2) + (currentFloor * 100));

    document.getElementById('go-killer').innerText = killerName;
    document.getElementById('go-floor').innerText = currentFloor === 0 ? "Town" : currentFloor;
    document.getElementById('go-level').innerText = player.level;
    document.getElementById('go-gold').innerText = player.gold;
    document.getElementById('go-score').innerText = score;

    // Record Score to Guildhall
    let scores = JSON.parse(localStorage.getItem('tomenet_highscores') || '[]');
    scores.push({
        score: score,
        name: player.name,
        class: player.class || 'Unknown',
        level: player.level,
        floor: currentFloor === 0 ? "Town" : currentFloor,
        killer: killerName
    });
    scores.sort((a,b) => b.score - a.score);
    scores = scores.slice(0, 10); // keep top 10
    localStorage.setItem('tomenet_highscores', JSON.stringify(scores));

    // Reveal all items
    const list = document.getElementById('go-items');
    list.innerHTML = '';

    // Combine equipment and backpack
    let allItems = [];
    Object.values(player.equipment).forEach(eq => { if (eq) allItems.push(eq); });
    player.inventory.forEach(item => {
        if (!Object.values(player.equipment).includes(item)) allItems.push(item);
    });

    if (allItems.length === 0) {
        list.innerHTML = '<li><span style="color:#666">No items carried.</span></li>';
    } else {
        allItems.forEach(item => {
            // Force identify
            if (['potion', 'scroll', 'wand'].includes(item.type)) {
                identifiedTypes[item.name] = true;
            } else {
                item.identified = true;
            }
            list.innerHTML += `<li><span style="color:${item.color}">${getItemName(item)}</span></li>`;
        });
    }

    document.getElementById('deathModal').classList.add('active');
    updateUI();
};

window.openShop = function () {
    gameState = 'SHOP';
    document.getElementById('shopModal').classList.add('active');
    document.getElementById('shopGold').innerText = player.gold;

    currentShopItems = ITEM_DB.filter(i => i.cost).map(i => ({ ...i }));
    currentShopItems.sort(() => Math.random() - 0.5);
    currentShopItems = currentShopItems.slice(0, 6); // 6 random items

    renderShop();
};

window.closeAllModals = function () {
    const modals = [
        'shopModal', 'innkeeperModal', 'blacksmithModal', 'wizardModal',
        'bankModal', 'inventoryModal', 'alchemistModal', 'trainerModal',
        'cartographerModal', 'guildhallModal', 'stashModal', 'deathModal'
    ];
    modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    gameState = 'PLAYING';
    updateUI();
};

window.closeShop = function () {
    closeAllModals();
};

window.buyItem = function buyItem(idx, isWizard = false) {
    const item = isWizard ? wizardInventory[idx] : currentShopItems[idx];
    if (player.gold >= item.cost) {
        if (player.inventory.length >= 18) {
            logMessage(`Inventory full!`, 'damage');
            return;
        }
        player.gold -= item.cost;
        let pItem = { ...item };

        // Items bought are identified
        if (['potion', 'scroll', 'wand'].includes(pItem.type)) {
            identifiedTypes[pItem.name] = true;
        } else {
            pItem.identified = true;
        }

        player.inventory.push(pItem);
        logMessage(`Bought ${getItemName(pItem)}.`, 'magic');
        if (isWizard) openWizard(); else openShop();
    } else {
        logMessage(`Not enough gold!`, 'damage');
    }
}

function sellItem(idx) {
    const item = player.inventory[idx];
    if (Object.values(player.equipment).includes(item)) {
        logMessage(`Cannot sell equipped item!`, 'damage');
        return;
    }
    const sellValue = Math.max(1, Math.floor((item.cost || 5) * 0.4));
    player.gold += sellValue;
    player.inventory.splice(idx, 1);
    logMessage(`Sold ${getItemName(item)} for ${sellValue}g.`);
    openShop();
}

// --- Innkeeper Modal ---
window.openInnkeeper = function () {
    gameState = 'INNKEEPER';
    document.getElementById('innkeeperModal').classList.add('active');
};

window.buyHeal = function () {
    if (player.hp === player.maxHp) {
        logMessage("You are already at full health.");
        return;
    }
    if (player.gold >= 20) {
        player.gold -= 20;
        player.hp = player.maxHp;
        player.energy = 0; // Resting passes a little time safely
        logMessage("You rest at the inn. Fully healed!", 'magic');
        closeInnkeeper();
    } else {
        logMessage("Not enough gold!", 'damage');
    }
};

window.closeInnkeeper = function () {
    closeAllModals();
};

// --- Blacksmith Modal ---
function getUpgradeCost(item) {
    if (!item) return 0;
    const currentBonus = (item.atkBonus || 0) + (item.defBonus || 0);
    return 50 * Math.pow(2, Math.max(0, currentBonus));
}

window.openBlacksmith = function () {
    gameState = 'BLACKSMITH';
    const modal = document.getElementById('blacksmithModal');

    // Weapon
    const w = player.equipment.weapon;
    const wName = document.getElementById('bs-weapon-name');
    const wBtn = document.getElementById('bs-btn-weapon');
    if (w) {
        wName.innerText = getItemName(w);
        wName.style.color = w.color;
        const cost = getUpgradeCost(w);
        document.getElementById('bs-cost-weapon').innerText = cost;
        wBtn.style.display = 'block';
        wBtn.disabled = player.gold < cost;
    } else {
        wName.innerText = "Empty";
        wName.style.color = '#888';
        wBtn.style.display = 'none';
    }

    // Armor
    const a = player.equipment.armor;
    const aName = document.getElementById('bs-armor-name');
    const aBtn = document.getElementById('bs-btn-armor');
    if (a) {
        aName.innerText = getItemName(a);
        aName.style.color = a.color;
        const cost = getUpgradeCost(a);
        document.getElementById('bs-cost-armor').innerText = cost;
        aBtn.style.display = 'block';
        aBtn.disabled = player.gold < cost;
    } else {
        aName.innerText = "Empty";
        aName.style.color = '#888';
        aBtn.style.display = 'none';
    }

    modal.classList.add('active');
};

window.upgradeEquipped = function (slot) {
    const item = player.equipment[slot];
    if (!item) return;
    const cost = getUpgradeCost(item);
    if (player.gold >= cost) {
        player.gold -= cost;
        if (slot === 'weapon') {
            item.atkBonus = (item.atkBonus || 0) + 1;
        } else if (slot === 'armor') {
            item.defBonus = (item.defBonus || 0) + 1;
        }
        item.identified = true; // Upgrading forces ID
        logMessage(`Blacksmith upgrades your ${getItemName(item)}!`, 'magic');
        openBlacksmith(); // Refresh
        updateUI();
    }
};

window.closeBlacksmith = function () {
    gameState = 'PLAYING';
    document.getElementById('blacksmithModal').classList.remove('active');
    updateUI();
};

// --- Wizard Modal ---
let wizardInventory = [];
function generateWizardInventory() {
    wizardInventory = [];
    const magicItems = ITEM_DB.filter(i => ['potion', 'scroll', 'wand'].includes(i.type));
    for (let i = 0; i < 6; i++) {
        const t = magicItems[Math.floor(Math.random() * magicItems.length)];
        wizardInventory.push({ ...t });
    }
}

window.openWizard = function () {
    gameState = 'WIZARD';
    if (wizardInventory.length === 0) generateWizardInventory();

    document.getElementById('wizGold').innerText = player.gold;
    const list = document.getElementById('wizItems');
    list.innerHTML = '';

    wizardInventory.forEach((item, idx) => {
        const canAfford = player.gold >= item.cost;
        const btnClass = canAfford ? 'shop-btn' : 'shop-btn-disabled';
        const typePrefix = `[${item.type.toUpperCase()}] `;

        let visualName = item.name;
        if (!identifiedTypes[item.name]) {
            if (item.type === 'potion') visualName = item.flavor;
            if (item.type === 'scroll') visualName = item.flavor;
            if (item.type === 'wand') visualName = item.flavor;
        }

        list.innerHTML += `
            <li>
                <span>${typePrefix}<span style="color:${item.color}">${visualName}</span> - ${item.cost}g</span>
                <button class="${btnClass}" onclick="buyItem(${idx}, true)" ${!canAfford ? 'disabled' : ''}>Buy</button>
            </li>
        `;
    });

    document.getElementById('wizardModal').classList.add('active');
};

window.closeWizard = function () {
    gameState = 'PLAYING';
    document.getElementById('wizardModal').classList.remove('active');
    updateUI();
};

// --- Bank Modal ---
window.openBank = function () {
    gameState = 'BANK';
    let vaultGold = parseInt(localStorage.getItem('vaultGold') || '0');
    document.getElementById('bank-hand-gold').innerText = player.gold + "g";
    document.getElementById('bank-vault-gold').innerText = vaultGold + "g";
    document.getElementById('bankModal').classList.add('active');
};
// --- Alchemist Modal ---
let alchemistInventory = [];
function generateAlchemistInventory() {
    alchemistInventory = [];
    const potionItems = ITEM_DB.filter(i => i.type === 'potion');
    for (let i = 0; i < 4; i++) {
        const t = potionItems[Math.floor(Math.random() * potionItems.length)];
        alchemistInventory.push({ ...t });
    }
}

window.openAlchemist = function () {
    gameState = 'ALCHEMIST';
    if (alchemistInventory.length === 0) generateAlchemistInventory();

    document.getElementById('alchemistGold').innerText = player.gold;
    const list = document.getElementById('alchemistItems');
    list.innerHTML = '';

    alchemistInventory.forEach((item, idx) => {
        const canAfford = player.gold >= item.cost;
        const btnClass = canAfford ? 'shop-btn' : 'shop-btn-disabled';
        
        // Alchemist always sells identified potions
        identifiedTypes[item.name] = true;

        list.innerHTML += `
            <li>
                <span><span style="color:${item.color}">${item.name}</span> - ${item.cost}g</span>
                <button class="${btnClass}" onclick="buyAlchemistItem(${idx})" ${!canAfford ? 'disabled' : ''}>Buy</button>
            </li>
        `;
    });

    // Check for 2 minor healing potions for transmute
    const minorHeals = player.inventory.filter(i => i.name === 'Potion of Minor Healing');
    const transmuteBtn = document.getElementById('btn-transmute-heal');
    if (minorHeals.length >= 2 && player.gold >= 50) {
        transmuteBtn.disabled = false;
        transmuteBtn.className = 'btn shop-btn';
    } else {
        transmuteBtn.disabled = true;
        transmuteBtn.className = 'btn shop-btn-disabled';
    }

    document.getElementById('alchemistModal').classList.add('active');
};

window.buyAlchemistItem = function(idx) {
    const item = alchemistInventory[idx];
    if (player.gold >= item.cost) {
        if (player.inventory.length >= 18) {
            logMessage(`Inventory full!`, 'damage');
            return;
        }
        player.gold -= item.cost;
        let pItem = { ...item, identified: true };
        player.inventory.push(pItem);
        logMessage(`Bought ${pItem.name}.`, 'magic');
        openAlchemist();
    }
}

window.transmutePotions = function() {
    const minorHeals = player.inventory.filter(i => i.name === 'Potion of Minor Healing');
    if (minorHeals.length >= 2 && player.gold >= 50) {
        player.gold -= 50;
        // Remove two minor heals
        let removed = 0;
        for (let i = player.inventory.length - 1; i >= 0; i--) {
            if (player.inventory[i].name === 'Potion of Minor Healing' && removed < 2) {
                player.inventory.splice(i, 1);
                removed++;
            }
        }
        // Add greater healing
        const greaterHeal = { ...ITEM_DB.find(i => i.name === 'Potion of Greater Healing'), identified: true };
        identifiedTypes['Potion of Greater Healing'] = true;
        player.inventory.push(greaterHeal);
        
        logMessage("The Alchemist brews your potions together. Transmutation successful!", "magic");
        openAlchemist();
    }
};

window.closeAlchemist = function () {
    gameState = 'PLAYING';
    document.getElementById('alchemistModal').classList.remove('active');
    updateUI();
};

// --- Trainer Modal ---
window.openTrainer = function () {
    gameState = 'TRAINER';
    document.getElementById('trainerGold').innerText = player.gold;
    document.getElementById('trainerModal').classList.add('active');
};

window.buyStatTraining = function(stat, cost) {
    if (player.gold >= cost) {
        player.gold -= cost;
        if (stat === 'hp') {
            player.maxHp += 10;
            player.hp += 10;
            logMessage("You feel hardier! (+10 Max HP)", "magic");
        } else if (stat === 'atk') {
            player.atk += 1;
            logMessage("Your strikes are more precise! (+1 ATK)", "magic");
        } else if (stat === 'def') {
            player.def += 1;
            logMessage("Your footwork improves! (+1 DEF)", "magic");
        }
        openTrainer();
    } else {
        logMessage("Trainer: 'Come back when you have the coin.'", "damage");
    }
};

window.closeTrainer = function () {
    gameState = 'PLAYING';
    document.getElementById('trainerModal').classList.remove('active');
    updateUI();
};

// --- Cartographer Modal ---
window.openCartographer = function () {
    gameState = 'CARTOGRAPHER';
    document.getElementById('cartGold').innerText = player.gold;
    document.getElementById('cartographerModal').classList.add('active');
};

window.buyIntel = function() {
    if (player.gold >= 100) {
        player.gold -= 100;
        const targetFloor = currentFloor + Math.floor(Math.random() * 3) + 1;
        const elites = ENEMY_TYPES.filter(e => e.elite || e.miniBoss);
        const randomElite = elites[Math.floor(Math.random() * elites.length)];
        
        document.getElementById('cart-intel-text').innerText = `"Beware... My scouts report a ${randomElite.name} roaming around Floor ${targetFloor}..."`;
        document.getElementById('btn-buy-intel').disabled = true;
        document.getElementById('btn-buy-intel').className = 'btn shop-btn-disabled';
        
        logMessage(`Cartographer sold you intel on ${randomElite.name}.`, "magic");
        document.getElementById('cartGold').innerText = player.gold;
    } else {
        logMessage("Cartographer: 'No gold, no secrets.'", "damage");
    }
};

window.closeCartographer = function () {
    gameState = 'PLAYING';
    document.getElementById('cartographerModal').classList.remove('active');
    // Reset intel button for next time
    document.getElementById('cart-intel-text').innerText = `"Pay me, and I'll tell you what hazards lie ahead..."`;
    document.getElementById('btn-buy-intel').disabled = false;
    document.getElementById('btn-buy-intel').className = 'btn shop-btn';
    updateUI();
};

window.depositGold = function (amount) {
    let vaultGold = parseInt(localStorage.getItem('vaultGold') || '0');
    let toDeposit = amount === 'all' ? player.gold : Math.min(player.gold, amount);
    if (toDeposit > 0) {
        player.gold -= toDeposit;
        vaultGold += toDeposit;
        localStorage.setItem('vaultGold', vaultGold);
        logMessage(`Deposited ${toDeposit}g.`, 'magic');
        openBank(); // Refresh
        updateUI();
    }
};

window.withdrawGold = function (amount) {
    let vaultGold = parseInt(localStorage.getItem('vaultGold') || '0');
    let toWithdraw = amount === 'all' ? vaultGold : Math.min(vaultGold, amount);
    if (toWithdraw > 0) {
        vaultGold -= toWithdraw;
        player.gold += toWithdraw;
        localStorage.setItem('vaultGold', vaultGold);
        logMessage(`Withdrew ${toWithdraw}g.`, 'pickup');
        openBank(); // Refresh
        updateUI();
    }
};

window.closeBank = function () {
    gameState = 'PLAYING';
    document.getElementById('bankModal').classList.remove('active');
    updateUI();
};

// --- Stash Modal ---
window.openStash = function () {
    gameState = 'STASH';
    document.getElementById('stashModal').classList.add('active');
    renderStashModal();
};

window.renderStashModal = function() {
    let stashItems = JSON.parse(localStorage.getItem('tomenet_stash') || '[]');
    
    document.getElementById('stash-count').innerText = stashItems.length;
    
    const sList = document.getElementById('stash-list');
    sList.innerHTML = '';
    stashItems.forEach((item, idx) => {
        sList.innerHTML += `
            <li style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                <span style="color:${item.color}">${getItemName(item)}</span>
                <button class="btn" style="padding:2px 5px; font-size:0.7em;" onclick="takeFromStash(${idx})">Take</button>
            </li>
        `;
    });

    const bList = document.getElementById('stash-inv-list');
    bList.innerHTML = '';
    player.inventory.forEach((item, idx) => {
        // Can't stash equipped items directly
        if (Object.values(player.equipment).includes(item)) return;
        bList.innerHTML += `
            <li style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                <span style="color:${item.color}">${getItemName(item)}</span>
                <button class="btn" style="padding:2px 5px; font-size:0.7em;" onclick="putInStash(${idx})">Store</button>
            </li>
        `;
    });
};

window.putInStash = function(invIdx) {
    let stashItems = JSON.parse(localStorage.getItem('tomenet_stash') || '[]');
    if (stashItems.length >= 5) {
        logMessage("Stash is full (Max 5 items).", "damage");
        return;
    }
    const item = player.inventory[invIdx];
    stashItems.push(item);
    localStorage.setItem('tomenet_stash', JSON.stringify(stashItems));
    player.inventory.splice(invIdx, 1);
    logMessage(`Stored ${getItemName(item)} in Stash.`, "magic");
    renderStashModal();
};

window.takeFromStash = function(stashIdx) {
    let stashItems = JSON.parse(localStorage.getItem('tomenet_stash') || '[]');
    if (player.inventory.length >= 18) {
        logMessage("Inventory full!", "damage");
        return;
    }
    const item = stashItems[stashIdx];
    player.inventory.push(item);
    stashItems.splice(stashIdx, 1);
    localStorage.setItem('tomenet_stash', JSON.stringify(stashItems));
    logMessage(`Took ${getItemName(item)} from Stash.`, "pickup");
    renderStashModal();
};

window.closeStash = function () {
    gameState = 'PLAYING';
    document.getElementById('stashModal').classList.remove('active');
    updateUI();
};

// --- Guildhall Modal ---
window.openGuildhall = function () {
    gameState = 'GUILDHALL';
    
    let scores = JSON.parse(localStorage.getItem('tomenet_highscores') || '[]');
    const list = document.getElementById('guildhall-scores');
    list.innerHTML = '';
    
    if (scores.length === 0) {
        list.innerHTML = "<li>No legends recorded yet.</li>";
    } else {
        scores.forEach(s => {
            list.innerHTML += `<li><span style="color:#f1c40f">${s.score} pts</span> - <span style="color:#66fcf1">${s.name}</span> the Lvl ${s.level} ${s.class} (Floor ${s.floor})</li>`;
        });
    }

    document.getElementById('guildhallModal').classList.add('active');
};

window.closeGuildhall = function () {
    gameState = 'PLAYING';
    document.getElementById('guildhallModal').classList.remove('active');
    updateUI();
};

window.saveGame = function () {
    if (gameState !== 'PLAYING') return;
    const data = { map, entities, items, player, currentFloor, fullMessageHistory };
    try {
        localStorage.setItem('tomenet_save', JSON.stringify(data));
        logMessage("Game Saved.", "magic");
    } catch (e) {
        logMessage("Failed to save.", "damage");
    }
};

window.loadGame = function () {
    const raw = localStorage.getItem('tomenet_save');
    if (!raw) {
        logMessage("No save file.", "damage");
        return;
    }
    try {
        const data = JSON.parse(raw);
        map = data.map;
        items = data.items;
        currentFloor = data.currentFloor;
        fullMessageHistory = data.fullMessageHistory || [];
        entities = data.entities;
        player = entities.find(e => e.isPlayer);
        logMessage("Game Loaded.", "magic");

        updateUI();
        computeFOV();
        render();
    } catch (e) {
        logMessage("Failed to load.", "damage");
    }
};

function renderShop() {
    const ul = document.getElementById('shopItems');
    ul.innerHTML = '<li><strong style="color:#45a29e">FOR SALE:</strong></li>';
    currentShopItems.forEach((item, i) => {
        const canAfford = player.gold >= item.cost;
        const btnClass = canAfford ? 'shop-btn' : 'shop-btn-disabled';
        ul.innerHTML += `
            <li style="margin-left: 10px;">
                <span style="color:${item.color}">[${item.type.toUpperCase()}] ${getItemName(item)}</span>
                <span>
                    <span style="color:#f1c40f">${item.cost}g</span>
                    <button class="${btnClass}" onclick="buyItem(${i})" ${!canAfford ? 'disabled' : ''}>Buy</button>
                </span>
            </li>
        `;
    });

    ul.innerHTML += '<li style="margin-top:15px"><strong style="color:#45a29e">SELL ITEMS:</strong></li>';
    let hasSellables = false;
    player.inventory.forEach((item, i) => {
        if (!Object.values(player.equipment).includes(item)) {
            hasSellables = true;
            const sellPrice = Math.floor((item.cost || 10) * 0.5);
            ul.innerHTML += `
                <li style="margin-left: 10px;">
                    <span style="color:${item.color}">${getItemName(item)}</span>
                    <span>
                        <span style="color:#f1c40f">+${sellPrice}g</span>
                        <button class="btn shop-btn" onclick="sellItem(${i})">Sell</button>
                    </span>
                </li>
            `;
        }
    });
    if (!hasSellables) {
        ul.innerHTML += '<li style="margin-left: 10px; opacity:0.5;">No unequipped items to sell.</li>';
    }
}

window.openInventory = function () {
    if (gameState !== 'PLAYING') return;
    gameState = 'INVENTORY';
    document.getElementById('inventoryModal').classList.add('active');
    renderInventoryModal();
};

window.closeInventory = function () {
    document.getElementById('inventoryModal').classList.remove('active');
    gameState = 'PLAYING';
    updateUI();
};

window.renderInventoryModal = function () {
    const elist = document.getElementById('equip-modal-list');
    elist.innerHTML = '';
    const slots = ['weapon', 'offhand', 'armor', 'helm', 'ring', 'amulet'];
    const slotLabels = { weapon: 'WEAPON', offhand: 'OFFHAND (Shield)', armor: 'ARMOR', helm: 'HELM', ring: 'RING', amulet: 'AMULET' };
    slots.forEach(slot => {
        const item = player.equipment[slot];
        let h = `<li style="display:flex; justify-content:space-between; margin-bottom: 5px; align-items: center;"><strong>${slotLabels[slot] || slot.toUpperCase()}:</strong> `;
        if (item) {
            h += `<span>
                <span style="color:${item.color}; margin-right: 10px;">${getItemName(item)}</span> 
                <button class="btn" style="padding:2px 5px; font-size:0.7em; color:#bd93f9; margin-right: 5px;" onclick="openItemModal(player.inventory.indexOf(player.equipment['${slot}'])); closeInventory();">Info</button>
                <button class="btn" style="padding:2px 5px; font-size:0.7em" onclick="unequipSlot('${slot}')">Unequip</button>
            </span>`;
        } else {
            h += `<span style="color:#666">Empty</span>`;
        }
        h += `</li>`;
        elist.innerHTML += h;
    });

    const blist = document.getElementById('inv-modal-list');
    blist.innerHTML = '';

    const unequippedItems = player.inventory.filter(item => !Object.values(player.equipment).includes(item));
    document.getElementById('inv-count').innerText = unequippedItems.length;

    player.inventory.forEach((item, i) => {
        if (Object.values(player.equipment).includes(item)) return;

        let h = `<li style="display:flex; justify-content:space-between; margin-bottom: 5px; align-items: center;">
            <span style="color:${item.color}; cursor:pointer;" title="Click for Info" onclick="openItemModal(${i}); closeInventory();">${getItemName(item)}</span>
            <span>`;
        h += `<button class="btn" style="padding:2px 5px; font-size:0.7em; margin-right:5px; color:#bd93f9;" onclick="openItemModal(${i}); closeInventory();">Info</button>`;
        if (item.equip) h += `<button class="btn" style="padding:2px 5px; font-size:0.7em; margin-right:5px;" onclick="useItem(${i}); renderInventoryModal();">Equip</button>`;
        else h += `<button class="btn" style="padding:2px 5px; font-size:0.7em; margin-right:5px;" onclick="useItem(${i}); renderInventoryModal();">Use</button>`;

        h += `<button class="btn" style="padding:2px 5px; font-size:0.7em; background:#552222;" onclick="dropItem(${i}); renderInventoryModal();">Drop</button>
            </span></li>`;
        blist.innerHTML += h;
    });
};

window.unequipSlot = function (slot) {
    const item = player.equipment[slot];
    if (item) {
        if (item.cursed) {
            logMessage(`You cannot unequip the ${getItemName(item)}! It is cursed!`, 'damage');
            return;
        }
        player.equipment[slot] = null;
        if (item.effect === 'esp') player.hasESP = false;
        logMessage(`You unequip ${getItemName(item)}.`, 'magic');
        renderInventoryModal();
    }
};

// --- Item Info Modal ---
let currentItemModalIndex = -1;

window.openItemModal = function (index) {
    if (index < 0 || index >= player.inventory.length) return;
    const item = player.inventory[index];
    if (!item) return;

    currentItemModalIndex = index;
    gameState = 'ITEM_MODAL';

    document.getElementById('itemModalName').innerText = getItemName(item);
    document.getElementById('itemModalName').style.color = item.color;

    // Flavor text & Stats
    let flavor = "A mundane object.";
    let stats = "";

    if (item.identified || identifiedTypes[item.name]) {
        if (item.type === 'weapon') flavor = `A deadly ${item.name}.`;
        if (item.type === 'armor') flavor = `Sturdy protective gear.`;
        if (item.type === 'potion') flavor = `A magical concoction. Effect: ${(item.effect || '').replace('_', ' ')}.`;
        if (item.type === 'scroll') flavor = `Ancestral magic inscribed on parchment. Effect: ${item.effect}.`;
        if (item.type === 'wand') flavor = `A channel completely focused on a specific spell.`;
        
        if (item.atkBonus) stats += `ATK ${item.atkBonus > 0 ? '+' : ''}${item.atkBonus} `;
        if (item.defBonus) stats += `DEF ${item.defBonus > 0 ? '+' : ''}${item.defBonus} `;
        if (item.speedBonus) stats += `SPD ${item.speedBonus > 0 ? '+' : ''}${item.speedBonus} `;
        if (item.speedPenalty) stats += `SPD -${item.speedPenalty} `;
        if (item.charges !== undefined) stats += `Charges: ${item.charges} `;
        if (item.range) stats += `Range: ${item.range} `;
    } else {
        if (['weapon', 'armor', 'helm', 'ring', 'amulet', 'shield'].includes(item.type)) {
            flavor = `An unidentified piece of equipment. You must equip it or use a Scroll of Identify to reveal its properties.`;
        } else {
            flavor = `An unknown ${item.type}. Quaffing or reading it might be dangerous.`;
        }
        stats = "Stats: ???";
    }

    document.getElementById('itemModalFlavor').innerText = flavor;
    document.getElementById('itemModalStats').innerText = stats || "No additional stats.";

    // Gut feeling
    const feelingEl = document.getElementById('itemModalFeeling');
    if (!item.identified && item.gutFeeling) {
        feelingEl.style.display = 'block';
        feelingEl.innerText = item.gutFeeling;
    } else {
        feelingEl.style.display = 'none';
        feelingEl.innerText = "";
    }

    // Buttons
    const btnID = document.getElementById('btnItemIdentify');
    if (item.identified || identifiedTypes[item.name]) {
        btnID.style.display = 'none';
    } else {
        btnID.style.display = 'inline-block';
        if (item.idAttemptedAtLevel && item.idAttemptedAtLevel >= player.level) {
            btnID.disabled = true;
            btnID.innerText = "Too complex (Level up to retry)";
            btnID.style.opacity = '0.5';
        } else {
            btnID.disabled = false;
            btnID.innerText = "Try to Identify";
            btnID.style.opacity = '1';
        }
    }

    let isEquir = Object.values(player.equipment).includes(item);
    document.getElementById('btnItemUse').innerText = isEquir ? 'Unequip' : (item.equip ? 'Equip' : 'Use');

    document.getElementById('itemModal').classList.add('active');
};

window.closeItemModal = function () {
    gameState = 'PLAYING';
    document.getElementById('itemModal').classList.remove('active');
    currentItemModalIndex = -1;
    updateUI();
};

window.modalUseItem = function () {
    if (currentItemModalIndex >= 0) {
        let idx = currentItemModalIndex;
        closeItemModal(); // Need to close first so gameState allows useItem
        useItem(idx);
    }
};

window.modalDropItem = function () {
    if (currentItemModalIndex >= 0) {
        let idx = currentItemModalIndex;
        closeItemModal();
        dropItem(idx);
    }
};

window.modalIdentifyItem = function () {
    if (currentItemModalIndex >= 0) {
        if (typeof attemptIdentify === 'function') {
            attemptIdentify(currentItemModalIndex);
            // Refresh modal directly
            openItemModal(currentItemModalIndex);
        } else {
            logMessage("Identify mechanic missing!", "damage");
        }
    }
};

