/**
 * Rogue Reborn - Combat System
 * Entity class, combat mechanics, item usage, death handling.
 * Extracted from engine.js for modularity.
 */
// --- Entity System ---
class Entity {
    constructor(x, y, char, color, name, hp, atk, def, speed) {
        this.x = x; this.y = y;
        this.char = char; this.color = color;
        this.name = name;
        this.maxHp = hp; this.hp = hp;
        this.atk = atk; this.def = def;
        this.speed = speed; 
        this.energy = 0;    
        this.isPlayer = false;
        this.blocksMovement = true;

        // Awareness & AI State
        this.sleeping = true;
        this.vigilance = 0;
        this.lastSeenPlayerPos = null;
        this.sensingRadius = BASE_SENSING_RADIUS;

        // stats - str/int/dex
        this.stats = { str: 10, int: 10, dex: 10 };
        this.skillPoints = 0;
    }
}

function getNearestMonster(mx, my) {
    let nearest = null;
    let minDist = Infinity;
    for (let e of entities) {
        if (!e.isPlayer && e.hp > 0 && e.blocksMovement && !e.isTownNPC && !e.isMerchant) {
            const d = Math.abs(e.x - mx) + Math.abs(e.y - my);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        }
    }
    return nearest;
}

function getEntityAt(x, y) {
    return entities.find(e => e.x === x && e.y === y && e.blocksMovement && e.hp > 0);
}

function getItemAt(x, y) {
    return items.find(i => i.x === x && i.y === y);
}

// --- Action Logic ---
function attemptAction(entity, action, energyCost = ENERGY_THRESHOLD) {
    if (action.type === 'wait') {
        entity.energy -= energyCost; // consume energy
        return;
    }

    if (action.type === 'move') {
        const tx = entity.x + action.dx;
        const ty = entity.y + action.dy;

        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
            isAutoRunning = false;
            return;
        }

        const targetEntity = getEntityAt(tx, ty);
        if (targetEntity) {
            // Interact with NPCs
            if (targetEntity.isTownNPC) {
                isAutoRunning = false;
                activePath = null;
                if (targetEntity.npcType === 'villager') {
                    const gossip = [
                        "Have you checked the well today?",
                        "The Mayor is looking for someone brave.",
                        "I heard the Balrog is weak to... something.",
                        "Don't drink glowing potions.",
                        "The Bank is safe. The dungeon is not."
                    ];
                    logMessage(`Villager says: "${gossip[Math.floor(Math.random() * gossip.length)]}"`, 'magic');
                } else if (targetEntity.npcType === 'beggar') {
                    logMessage("Beggar rattles a cup. 'Spare some gold for a poor soul?'", 'hint');
                    if (player.gold >= 5) {
                        player.gold -= 5;
                        if (Math.random() < 0.1) {
                            let unId = player.inventory.find(i => !i.identified && !['potion', 'scroll', 'wand'].includes(i.type));
                            if (unId) {
                                unId.identified = true;
                                logMessage(`The beggar whispers: 'That's a ${unId.name}.'`, 'magic');
                            } else {
                                logMessage("The beggar smiles toothlessly. 'Bless you.'");
                            }
                        } else {
                            logMessage("The beggar grins. 'They say the dungeon has a bottom. I don't believe it.'");
                        }
                    } else {
                        logMessage("You don't have enough gold.");
                    }
                }
                entity.energy -= energyCost;
                updateUI();
                return;
            }

            // #40 Goblin Merchant bump-to-trade
            if (targetEntity.isMerchant) {
                isAutoRunning = false;
                // Offer random dungeon items to buy
                const merchantItems = ITEM_DB.filter(i => (i.minFloor || 1) <= currentFloor + 2 && !['key'].includes(i.type)).sort(() => Math.random()-0.5).slice(0,4);
                let msg = 'Goblin Merchant: ';
                merchantItems.forEach((itm, ii) => msg += `[${ii+1}] ${itm.name} (${itm.cost}g) `);
                logMessage(msg, 'magic');
                // Quick buy: press 1-4 (handled via global gmState)
                player._merchantItems = merchantItems;
                player._merchantMode = true;
                entity.energy -= energyCost;
                return;
            }

            // Combat
            isAutoRunning = false;
            activePath = null;
            combat(entity, targetEntity);
                entity.energy -= energyCost;
            return;
        }

        // Action: move tile interaction
        const mapTile = map[tx][ty];

        // #30 Secret Door detection
        if (entity.isPlayer && mapTile.type === 'wall' && mapTile.secret) {
            if (Math.random() < 0.25) {
                mapTile.secret = false;
                mapTile.type = 'floor';
                mapTile.char = CHARS.FLOOR;
                logMessage("You've discovered a secret passageway!", 'magic');
                spawnParticle(tx, ty, 'SECRET!', '#f1c40f');
                computeFOV();
                entity.energy -= energyCost;
                return;
            }
        }

        if (mapTile.type === 'wall' || mapTile.type === 'shop' || mapTile.type === 'healer' || mapTile.type === 'blacksmith' || mapTile.type === 'wizard' || mapTile.type === 'bank' || mapTile.type === 'well' || mapTile.type === 'mayor' || mapTile.type === 'gambler' || mapTile.type === 'shrine' || mapTile.type === 'altar' || mapTile.type === 'stash') {
            isAutoRunning = false;
            activePath = null;

            if (entity.isPlayer) {
                if (mapTile.type === 'shop') {
                    openShop();
                } else if (mapTile.type === 'healer') {
                    openInnkeeper();
                    if (typeof handleQuestNPC === 'function') handleQuestNPC('healer');
                } else if (mapTile.type === 'blacksmith') {
                    if (timeOfDay === 'Day') openBlacksmith();
                    else logMessage("The forge is quiet tonight.", "hint");
                } else if (mapTile.type === 'wizard') {
                    openWizard();
                    if (typeof handleQuestNPC === 'function') handleQuestNPC('wizard');
                } else if (mapTile.type === 'bank') {
                    if (timeOfDay === 'Day') openBank();
                    else logMessage("The bank is closed until morning.", "hint");
                } else if (mapTile.type === 'mayor') {
                    // Only bark if the player isn't in high-speed auto-explore mode
                    if (!isAutoExploring && !activePath) {
                        if (!bountyTarget) {
                            const targets = ['Rat', 'Goblin', 'Kobold', 'Fire Hound', 'Orc'];
                            bountyTarget = targets[Math.floor(Math.random() * targets.length)];
                            logMessage(`Mayor says: "Bounty active for a ${bountyTarget}! Return when it's dead."`, 'magic');
                        } else if (bountyClaimed) {
                            logMessage(`Mayor says: "Excellent work! Wait for the next bounty."`, 'hint');
                        } else {
                            logMessage(`Mayor says: "Have you slain the ${bountyTarget} yet?"`, 'hint');
                        }
                    }
                    if (typeof handleQuestNPC === 'function') handleQuestNPC('mayor');
                } else if (mapTile.type === 'gambler') {
                    logMessage("Gambler: '50g for a mystery box?'", 'hint');
                    if (player.gold >= 50) {
                        player.gold -= 50;
                        const randomItem = { ...ITEM_DB[Math.floor(Math.random() * ITEM_DB.length)] };
                        player.inventory.push(randomItem);
                        logMessage(`Gambler hands you a ${getItemName(randomItem)}!`, 'pickup');
                    } else {
                        logMessage("Gambler sneers: 'Come back when you're rich.'");
                    }
                } else if (mapTile.type === 'alchemist') {
                    openAlchemist();
                    if (typeof handleQuestNPC === 'function') handleQuestNPC('alchemist');
                } else if (mapTile.type === 'trainer') {
                    openTrainer();
                    if (typeof handleQuestNPC === 'function') handleQuestNPC('trainer');
                } else if (mapTile.type === 'cartographer') {
                    openCartographer();
                    if (typeof handleQuestNPC === 'function') handleQuestNPC('cartographer');
                } else if (mapTile.type === 'guildhall') {
                    openGuildhall();
                    if (typeof handleQuestNPC === 'function') handleQuestNPC('guildhall');
                } else if (mapTile.type === 'altar') {
                    openRelicAltar();
                } else if (mapTile.type === 'stash') {
                    openStash();
                } else if (mapTile.type === 'well') {
                    if (!mapTile.used) {
                        mapTile.used = true;
                        mapTile.color = '#7f8c8d';
                        let r = Math.random();
                        if (r < 0.4) {
                            player.hp = Math.min(player.maxHp, player.hp + 5);
                            logMessage("You drink from the well. Refreshing!", 'magic');
                            spawnParticle(player.x, player.y, "+5 HP", '#2ecc71');
                        } else if (r < 0.8) {
                            player.energy += 50;
                            logMessage("You drink from the well. Invigorating!", 'magic');
                        } else {
                            player.poisonTimer = (player.poisonTimer || 0) + 10;
                            logMessage("The water tastes foul! Poison!", 'damage');
                        }
                    } else {
                        logMessage("The well is dry.");
                    }
                } else if (mapTile.type === 'shrine') {
                    // #34 Shrine
                    if (!mapTile.used) {
                        mapTile.used = true; mapTile.color = '#888';
                        if (Math.random() < 0.5) {
                            player.hp = Math.min(player.maxHp, player.hp + 10);
                            logMessage('The shrine blesses you! (+10 HP)', 'magic');
                            spawnParticle(player.x, player.y, 'BLESSED!', '#f1c40f');
                        } else {
                            player.def = Math.max(0, player.def - 1);
                            logMessage('The shrine curses you! (-1 DEF)', 'damage');
                            spawnParticle(player.x, player.y, 'CURSED!', '#e74c3c');
                        }
                    } else { logMessage('The shrine is spent.', 'hint'); }
                } else if (mapTile.type === 'lore_altar') {
                    if (mapTile.loreKey && typeof discoverLore === 'function') {
                        discoverLore(mapTile.loreKey);
                        mapTile.type = 'floor';
                        mapTile.char = CHARS.FLOOR;
                        mapTile.color = undefined;
                        player.xp += 15;
                        logMessage('+15 XP from ancient knowledge.', 'magic');
                    }
                } else if (mapTile.type === 'well') {
                    logMessage("The Town Well is cool and refreshing.", "magic");
                    if (player.hp < player.maxHp) {
                        player.hp = Math.min(player.maxHp, player.hp + 5);
                        logMessage("You drink from the well and feel better.", "magic");
                        spawnParticle(player.x, player.y, "+5 HP", "#2ecc71");
                    }
                    if (Math.random() < 0.1) {
                         logMessage("You toss a coin into the well for luck.");
                         player.gold = Math.max(0, player.gold - 1);
                    }
                    entity.energy -= energyCost;
                    return;
                } else if (mapTile.type === 'lava') {
                    // Handled in move execution below
                } else if (mapTile.hp <= 0) {
                    mapTile.type = 'floor';
                    mapTile.char = CHARS.FLOOR;
                    logMessage("You break through the rock.", 'pickup');
                    computeFOV();
                } else {
                    logMessage("You dig into the wall...");
                }
                entity.energy -= energyCost;
            }
            return;
        }

        // #32 Locked Door — requires Dungeon Key
        if (mapTile.type === 'locked_door') {
            isAutoRunning = false; activePath = null;
            const keyIdx = entity.isPlayer ? player.inventory.findIndex(i => i.name === 'Dungeon Key') : -1;
            if (keyIdx >= 0) {
                player.inventory.splice(keyIdx, 1);
                mapTile.type = 'floor'; mapTile.char = CHARS.FLOOR;
                logMessage('You use a Dungeon Key to unlock the door!', 'magic');
                spawnParticle(tx, ty, 'UNLOCKED!', '#f1c40f');
                if (typeof onVaultOpened === 'function') onVaultOpened();
                entity.energy -= energyCost;
            } else { logMessage('This door is locked!', 'damage'); }
            return;
        }

        // Move execution
        entity.x = tx; entity.y = ty;
        entity.energy -= (action.isSliding ? 0 : energyCost);

        // Noise
        if (entity.isPlayer) {
            let n = NOISE_LEVELS.MOVE;
            if (player.equipment.armor && player.equipment.armor.weight > 10) n += 5;
            addNoise(tx, ty, n);
            
            // #28 Lava Damage
            if (mapTile.type === 'lava') {
                const dmg = 4 + currentFloor;
                player.hp -= dmg;
                spawnParticle(tx, ty, `-${dmg} LAVA`, '#e67e22');
                logMessage("The lava burns you!", 'damage');
                if (player.hp <= 0) showGameOverModal('Lava');
            }

            // #29 Trapdoor
            if (mapTile.type === 'trapdoor') {
                logMessage("The floor gives way! You fall!", 'damage');
                spawnParticle(tx, ty, 'FALL!', '#888');
                player.hp -= 5;
                checkStairs(tx, ty, true); // force descend
                return;
            }

            // #27 Ice Sliding
            if (mapTile.type === 'ice' && !action.isSliding) {
                setTimeout(() => {
                    attemptAction(entity, { type: 'move', dx: action.dx, dy: action.dy, isSliding: true }, 0);
                }, 50);
            }

            totalTurns++; 
            checkStairs(tx, ty); 
            checkAutoRunStop(tx, ty); 
            collectItems(tx, ty);
        }
        return;

        // #31 Trap trigger
        if (entity.isPlayer && map[tx][ty].type === 'trap' && map[tx][ty].hidden) {
            map[tx][ty].hidden = false;
            map[tx][ty].color = '#c0392b';
            const kind = map[tx][ty].trapKind;
            logMessage(`You triggered a ${kind} trap!`, 'damage');
            if (kind === 'dart')     { player.hp -= 5; spawnParticle(player.x, player.y, '-5 DART', '#e74c3c'); }
            if (kind === 'poison')   { player.poisonTimer = (player.poisonTimer||0)+15; spawnParticle(player.x, player.y, 'POISON!', '#27ae60'); }
            if (kind === 'teleport') {
                let rx, ry, tries=0;
                do { rx=Math.floor(Math.random()*MAP_WIDTH); ry=Math.floor(Math.random()*MAP_HEIGHT); tries++; }
                while(tries<50 && (map[rx][ry].type !== 'floor' || getEntityAt(rx,ry)));
                if(tries<50){ player.x=rx; player.y=ry; logMessage('You are teleported!','magic'); computeFOV(); }
            }
            if (player.hp <= 0) { showGameOverModal('Trap'); }
        }

        if (entity.isPlayer) {
            totalTurns++;
            if (totalTurns % 500 === 0) {
                timeOfDay = timeOfDay === 'Day' ? 'Night' : 'Day';
                logMessage(`The sun ${timeOfDay === 'Day' ? 'rises' : 'sets'}. It is now ${timeOfDay}.`, 'magic');
                if (currentFloor === 0) {
                    generateTown();
                    computeFOV();
                    updateUI();
                }
            }

            checkStairs(tx, ty);
            checkAutoRunStop(tx, ty);
            collectItems(tx, ty);
        }
    }
}

function checkStairs(x, y, force = false) {
    if (!force) {
        isAutoRunning = false;
        activePath = null;
        if (map[x][y].type === 'stairs_down') {
            logMessage(`There are stairs here. Press '>' or 'Enter' to descend.`, 'hint');
        } else if (map[x][y].type === 'stairs_up') {
            logMessage(`There are stairs here. Press '<' or 'Enter' to ascend.`, 'hint');
        }
        return;
    }
    const tile = map[x][y];
    // DEBUG: console.log(`Checking stairs at ${x},${y}: ${tile.type}`);
    if (map[x][y].type === 'stairs_down') {
        currentFloor++;
        if (currentFloor > (player.maxFloor || 0)) {
            player.maxFloor = currentFloor;
        }
        console.log(`(DEBUG) Descending to Floor ${currentFloor}`);
        logMessage(`You dive to Dungeon Level ${currentFloor}.`, 'pickup');
        generateDungeon();
        if (typeof onFloorReached === 'function') onFloorReached(currentFloor);
        computeFOV();
        updateUI();
    } else if (map[x][y].type === 'stairs_up') {
        if (currentFloor === 1) {
            currentFloor = 0;
            generateTown();
        } else {
            currentFloor--;
            logMessage(`You ascend to Dungeon Level ${currentFloor}.`, 'pickup');
            generateDungeon();
        }
        computeFOV();
        updateUI();
    } else if (force) {
        logMessage("There are no stairs here.", "damage");
    }
}

function checkAutoRunStop(x, y) {
    if (!isAutoRunning) return;

    // Stop on intersections (openness)
    let openPaths = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let d of dirs) {
        const nx = x + d[0]; const ny = y + d[1];
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
            if (map[nx][ny].type !== 'wall') openPaths++;
        }
    }

    // Narrow corridors have ~3 open spaces. Open rooms have ~8. T-junctions ~5.
    if (openPaths > 4) isAutoRunning = false;
}

function collectItems(x, y) {
    const itemIdx = items.findIndex(i => i.x === x && i.y === y);
    if (itemIdx !== -1) {
        const item = items[itemIdx];
        if (item.isMimic) {
            logMessage(`The ${item.name} comes alive! It's a Mimic!`, "damage");
            items.splice(itemIdx, 1);
            let m = new Entity(x, y, 'm', '#d35400', "Mimic", 40 + Math.floor((currentFloor || 1) * 7), 8 + Math.floor((currentFloor || 1) * 1.5), 5, 9);
            m.baseXP = 40;
            entities.push(m);
            isAutoRunning = false;
            return;
        }

        if (item.type === 'gold') {
            player.gold += item.amount;
            logMessage(`You pick up ${item.amount} gold.`, 'pickup');
        } else {
            if (player.inventory.length < 18) {
                player.inventory.push(item);
                logMessage(`You pick up ${getItemName(item)}.`, 'pickup');
            } else {
                logMessage(`Inventory full! Cannot pick up ${getItemName(item)}.`, 'damage');
                return; // don't splice
            }
        }
        items.splice(itemIdx, 1);
        isAutoRunning = false;
        // Auto-explore continues after picking up items
    }
}

function getEffectiveAtk() {
    let base = player.atk;
    const wep = player.equipment.weapon;
    if (wep && (wep.durability === undefined || wep.durability > 0)) {
        base += (wep.atkBonus || 0);
        base += (wep.plusAtk || 0); // #Infinite: Enhancement bonus
        // #38 Sentient Weapon Level Bonus
        if (wep.sentient && wep.itemLvl) base += (wep.itemLvl * 2);
    }
    if (player.equipment.ring && player.equipment.ring.name === 'Eye of Chaos') base += 25;
    if (player.equipment.amulet?.effect === 'strength') base += 2;
    // #16 Attribute Scaling (STR)
    base += Math.floor((player.stats.str - 10) / 2);
    // #19 Berserk Bonus
    if (player.berserkTimer > 0) base += 10;
    // #VIII Combat Surge
    if (player.combatSurgeTimer > 0) base += 2;
    return base;
}

function getEffectiveDef() {
    let base = player.def;
    const eq = player.equipment;
    if (eq.armor && (eq.armor.durability === undefined || eq.armor.durability > 0)) {
        base += (eq.armor.defBonus || 0);
        base += (eq.armor.plusDef || 0); // #Infinite: Enhancement bonus
    }
    if (eq.helm && (eq.helm.durability === undefined || eq.helm.durability > 0)) {
        base += (eq.helm.defBonus || 0);
        base += (eq.helm.plusDef || 0); // #Infinite: Enhancement bonus
    }
    if (eq.shield && (eq.shield.durability === undefined || eq.shield.durability > 0)) {
        base += (eq.shield.defBonus || 0);
        base += (eq.shield.plusDef || 0); // #Infinite: Enhancement bonus
    }
    if (eq.ring) {
        base += (eq.ring.defBonus || 0);
        base += (eq.ring.plusDef || 0);
    }
    if (eq.amulet) {
        base += (eq.amulet.defBonus || 0);
        base += (eq.amulet.plusDef || 0);
    }

    // #37 Set Bonuses (Sun Set: 3 pieces = +5 DEF)
    let sunCount = 0;
    Object.values(player.equipment).forEach(i => { if (i && i.set === 'Sun') sunCount++; });
    if (sunCount >= 3) base += 5;

    // #13 Shield / Offhand (legacy check)
    if (eq.offhand && (eq.offhand.durability === undefined || eq.offhand.durability > 0)) {
        base += (eq.offhand.defBonus || 0);
        base += (eq.offhand.plusDef || 0);
    }
    // #16 Attribute Scaling (DEX)
    base += Math.floor((player.stats.dex - 10) / 2);
    // #19 Berserk Penalty
    if (player.berserkTimer > 0) base -= 5;
    return Math.max(0, base);
}

// #13 Speed accounting for shield and burden penalties
function getEffectiveSpeed() {
    let spd = player.speed;
    if (player.equipment.offhand) spd -= (player.equipment.offhand.speedPenalty || 0);
    if (player.equipment.ring?.effect === 'burden') spd -= (player.equipment.ring.speedPenalty || 0);
    // #14 Dual Wield speed bonus
    if (player.equipment.weapon?.dualWield) spd += (player.equipment.weapon.speedBonus || 0);
    // #19 Berserk Speed
    if (player.berserkTimer > 0) spd += 5;
    return Math.max(1, spd);
}

function combat(attacker, defender) {
    let atkPower = attacker.isPlayer ? getEffectiveAtk() : attacker.atk;
    let defPower = defender.isPlayer ? getEffectiveDef() : defender.def;

    // If monster is disarmed, reduce its attack
    if (attacker.disarmed) {
        atkPower = Math.max(1, Math.floor(atkPower * 0.5));
        attacker.disarmTimer = (attacker.disarmTimer || 0) - 1;
        if (attacker.disarmTimer <= 0) { attacker.disarmed = false; logMessage(`${attacker.name} picks up its weapon!`, 'damage'); }
    }

    // Elemental checks
    if (attacker.element === 'fire' && defender.isPlayer) {
        if (defender.equipment.ring && defender.equipment.ring.effect === 'resist_fire') {
            atkPower = Math.floor(atkPower / 2);
            logMessage(`Your ring resists the flames!`, 'magic');
        } else {
            logMessage(`The ${attacker.name} breathes fire!`, 'damage');
        }
    }
    // #15 Sting does bonus damage vs Orcs
    if (attacker.isPlayer && attacker.equipment?.weapon?.name === 'Sting' && defender.name && defender.name.includes('Orc')) {
        atkPower += 5;
        logMessage(`Sting glows blue against the ${defender.name}!`, 'magic');
    }
    
    // #15 Glamdring has fire element
    if (attacker.isPlayer && attacker.equipment?.weapon?.name === 'Glamdring') {
        atkPower += Math.floor(Math.random() * 4);
    }

    // Final Damage Calculation
    let dmg = Math.max(1, atkPower - defPower + (Math.floor(Math.random() * 3) - 1));
    defender.hp -= dmg;

    // #36 Cursed Life Steal (Bloodied Shard)
    if (attacker.isPlayer && player.equipment.armor?.name === 'Bloodied Shard') {
        const heal = Math.floor(dmg * 1.0);
        player.hp = Math.min(player.maxHp, player.hp + heal);
        spawnParticle(player.x, player.y, `+${heal} LIFE`, '#e74c3c');
    }

    // #31 Durability Loss ⚒️
    if (attacker.isPlayer && player.equipment.weapon) {
        if (player.equipment.weapon.durability !== undefined) {
            player.equipment.weapon.durability--;
            if (player.equipment.weapon.durability === 0) {
                logMessage(`Your ${player.equipment.weapon.name} has broken!`, 'damage');
                spawnParticle(player.x, player.y, 'BROKEN!', '#888');
            }
        }
    }
    if (defender.isPlayer) {
        ['armor', 'shield', 'helm'].forEach(slot => {
            const itm = player.equipment[slot];
            if (itm && itm.durability !== undefined && itm.durability > 0) {
                if (Math.random() < 0.3) {
                    itm.durability--;
                    if (itm.durability === 0) {
                        logMessage(`Your ${itm.name} has broken!`, 'damage');
                        spawnParticle(player.x, player.y, 'BROKEN!', '#888');
                    }
                }
            }
        });
    }

    // Noise Generation
    if (attacker.isPlayer || defender.isPlayer) {
        addNoise(attacker.x, attacker.y, NOISE_LEVELS.ATTACK);
    }

    // Phase III Special Monster Effects
    if (!attacker.isPlayer && defender.isPlayer) {
        defender.lastAttackedBy = attacker;
        // #23 Vampire drains max HP
        if (attacker.drainMaxHp && Math.random() < 0.2) {
            defender.maxHp = Math.max(10, defender.maxHp - 1);
            logMessage(`${attacker.name} drains your life force! Max HP reduced!`, 'damage');
            spawnParticle(defender.x, defender.y, '-1 MaxHP', '#8e44ad');
        }
        // #26 Rust Monster degrades armor
        if (attacker.element === 'rust' && defender.equipment?.armor) {
            defender.equipment.armor.defBonus = (defender.equipment.armor.defBonus || 0) - 1;
            logMessage(`${attacker.name} corrodes your armor! (-1 Def)`, 'damage');
            spawnParticle(defender.x, defender.y, 'RUST!', '#d35400');
        }
        // #29 Mind Flayer drains XP
        if (attacker.xpDrain && Math.random() < 0.3) {
            const drained = Math.min(player.xp, 15 + currentFloor * 3);
            player.xp = Math.max(0, player.xp - drained);
            logMessage(`${attacker.name} feasts on your mind! Lost ${drained} XP!`, 'damage');
            spawnParticle(defender.x, defender.y, `-${drained} XP`, '#9b59b6');
        }
        // #21 Gelatinous Cube Dissolves Item
        if (attacker.dissolver && Math.random() < 0.2) {
            const unequipped = player.inventory.filter(i => !Object.values(player.equipment).includes(i));
            if (unequipped.length > 0) {
                const targetIdx = Math.floor(Math.random() * unequipped.length);
                const item = unequipped[targetIdx];
                const realIdx = player.inventory.indexOf(item);
                player.inventory.splice(realIdx, 1);
                logMessage(`${attacker.name} dissolves your ${getItemName(item)}!`, 'damage');
                spawnParticle(player.x, player.y, 'DISSOLVED!', '#2ecc71');
            }
        }
    }

    if (attacker.lifeSteal && !attacker.isPlayer) {
        const heal = Math.floor(dmg * 0.5);
        if (heal > 0) {
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            logMessage(`${attacker.name} siphons your life! Healed ${heal} HP.`, 'damage');
            spawnParticle(attacker.x, attacker.y, `+${heal} HP`, '#e74c3c');
        }
    }

    if (attacker.isPlayer) {
        // #VIII Rogue Backstab â€” double dmg if monster was not adjacent last tick
        if (player.backstab && !map[defender.x][defender.y].visible) {
            dmg = dmg * 2;
            spawnParticle(defender.x, defender.y, 'BACKSTAB!', '#e67e22');
            logMessage(`Backstab! Double damage!`, 'magic');
        }
        if (dmg > atkPower + 5) spawnParticle(defender.x, defender.y, `CRIT ${dmg}`, '#f1c40f');
        else spawnParticle(defender.x, defender.y, `-${dmg}`, '#ff3b3b');

        // #16 Whip: disarm on hit
        const wep = attacker.equipment?.weapon;
        if (wep && wep.disarm && Math.random() < wep.disarm && !defender.isPlayer) {
            defender.disarmed = true;
            defender.disarmTimer = 5;
            logMessage(`You crack the whip! ${defender.name} drops its weapon!`, 'magic');
            spawnParticle(defender.x, defender.y, 'DISARMED!', '#f39c12');
        }
        // #14 Dual Wield: second strike at -2 atk
        if (wep && wep.dualWield && defender.hp > 0) {
            const dmg2 = Math.max(1, (atkPower - 2) - defPower + (Math.floor(Math.random() * 3) - 1));
            defender.hp -= dmg2;
            spawnParticle(defender.x, defender.y, `-${dmg2}`, '#e67e22');
            logMessage(`Second strike hits for ${dmg2}!`, 'magic');
        }
    } else if (defender.isPlayer) {
        spawnParticle(defender.x, defender.y, `-${dmg}`, '#e74c3c');
    }

    let msgClass = attacker.isPlayer ? 'magic' : 'damage';
    logMessage(`${attacker.name} hits ${defender.name} for ${dmg}.`, msgClass);

    // #14 Dual Wielding: If player has weapon in offhand, 50% chance for second strike
    if (attacker.isPlayer && attacker.equipment.offhand && attacker.equipment.offhand.type === 'weapon' && defender.hp > 0) {
        if (Math.random() < 0.5) {
            let dmg2 = Math.floor(dmg * 0.6);
            if (dmg2 < 1) dmg2 = 1;
            defender.hp -= dmg2;
            spawnParticle(defender.x, defender.y, `Strike! -${dmg2}`, '#e67e22');
            logMessage(`Second strike hits ${defender.name} for ${dmg2}!`, 'magic');
            if (defender.hp <= 0) handleMonsterDeath(defender);
        }
    }

    // Poison Effect
    if (attacker.element === 'poison' && Math.random() < 0.25) {
        defender.poisonTimer = (defender.poisonTimer || 0) + 20;
        if (defender.isPlayer) logMessage(`You are poisoned!`, 'damage');
        else logMessage(`${defender.name} is poisoned!`, 'magic');
    }

    if (defender.hp <= 0) {
        if (defender.isPlayer) {
            defender.name = `${defender.name} remains`;
            showGameOverModal(attacker.name);
        } else {
            handleMonsterDeath(defender);
        }
    }
}

function executeBreathAttack(attacker) {
    if (!player) return;
    const dx = player.x - attacker.x;
    const dy = player.y - attacker.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist > 6) return;

    logMessage(`${attacker.name} uses ${attacker.element.toUpperCase()} BREATH!`, 'damage');
    
    // Breath hits player and all adjacent tiles to the player (AoE)
    const targets = [{x: player.x, y: player.y}];
    const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    dirs.forEach(d => targets.push({x: player.x + d.dx, y: player.y + d.dy}));

    targets.forEach(t => {
        // Visuals
        const pColor = attacker.element === 'fire' ? '#e67e22' : attacker.element === 'ice' ? '#3498db' : '#2ecc71';
        spawnParticle(t.x, t.y, '*', pColor);

        // Check if player or entity at target
        if (t.x === player.x && t.y === player.y) {
            let dmg = Math.floor(attacker.atk * 1.5) - getEffectiveDef();
            if (dmg < 5) dmg = 5; // Minimum breath damage
            
            // Resist checks
            if (attacker.element === 'fire' && player.equipment.ring?.effect === 'resist_fire') dmg = Math.floor(dmg / 3);
            
            player.hp -= dmg;
            logMessage(`You are scorched by ${attacker.element}! -${dmg} HP`, 'damage');
            spawnParticle(player.x, player.y, `-${dmg}`, '#e74c3c');
            if (player.hp <= 0) showGameOverModal(`${attacker.name}'s Breath`);
        } else {
            const ent = getEntityAt(t.x, t.y);
            if (ent && !ent.isPlayer) {
                let dmg = Math.floor(attacker.atk * 1.2);
                ent.hp -= dmg;
                if (ent.hp <= 0) handleMonsterDeath(ent);
            }
        }
    });
    updateUI();
}

function handleMonsterDeath(defender) {
    if (defender.name.includes("Balrog")) {
        // Quest hook for Balrog kill
        if (typeof onMonsterKilled === 'function') onMonsterKilled(defender.name);
        gameState = 'VICTORY';
        document.getElementById('victoryModal').classList.add('active');
        return;
    }

    logMessage(`${defender.name} is destroyed.`, 'kill');
    
    // Phase IV: AI Reputation tracking
    let baseName = defender.name.replace('Elite ', '').replace('Mini-Boss ', '');
    if (!player.killsByType) player.killsByType = {};
    player.killsByType[baseName] = (player.killsByType[baseName] || 0) + 1;
    
    // Phase V: Quest progress tracking
    if (typeof onMonsterKilled === 'function') onMonsterKilled(baseName);

    defender.char = '%'; defender.color = '#888'; defender.blocksMovement = false;

    // Bounty Check
    if (typeof bountyTarget !== 'undefined' && bountyTarget && typeof bountyClaimed !== 'undefined' && !bountyClaimed && defender.name === bountyTarget) {
        bountyClaimed = true;
        player.gold += 150;
        logMessage("You have slain the Mayor's Bounty! Received 150g.", 'magic');
    }

    defender.name = `${defender.name} remains`;

    if (Math.random() > 0.6) player.gold += 5 * (currentFloor || 1);

    // XP logic (inline — addXp was lost during refactoring)
    let gainedXp = defender.baseXP || 5;
    if (currentFloor) gainedXp = Math.floor(gainedXp * (1 + currentFloor * 0.2));
    player.xp += gainedXp;
    logMessage(`Gained ${gainedXp} XP.`);
    spawnParticle(defender.x, defender.y, `+${gainedXp} XP`, '#2ecc71');

    if (player.xp >= player.nextXp) {
        player.level++;
        player.maxHp += 5;
        player.hp = player.maxHp;
        player.atk += 1;
        player.skillPoints = (player.skillPoints || 0) + 1;
        player.nextXp = Math.floor(player.nextXp * 1.8);
        logMessage(`LEVEL UP! You are now level ${player.level}.`, 'magic');
        spawnParticle(player.x, player.y, 'LEVEL UP!', '#f1c40f');
        // Class perks at level 3 & 5
        if (player.level === 3) {
            if (player.class === 'Warrior') { player.def += 1; logMessage('Warrior Level 3 Perk: +1 Defense!', 'kill'); }
            if (player.class === 'Mage')    { player.maxHp += 5; player.hp += 5; logMessage('Mage Level 3 Perk: +5 Max HP!', 'kill'); }
            if (player.class === 'Rogue')   { player.speed += 2; logMessage('Rogue Level 3 Perk: +2 Speed!', 'kill'); }
        }
        if (player.level === 5) {
            if (player.class === 'Warrior') { player.atk += 2; logMessage('Warrior Level 5 Perk: +2 Attack!', 'kill'); }
            if (player.class === 'Mage')    { if (player.equipment.armor) player.equipment.armor.spellBoost = (player.equipment.armor.spellBoost||0)+3; logMessage('Mage Level 5 Perk: +3 SpellBoost!', 'kill'); }
            if (player.class === 'Rogue')   { player.atk += 1; player.def += 1; logMessage('Rogue Level 5 Perk: +1 Atk, +1 Def!', 'kill'); }
        }
        if (typeof openLevelUpModal === 'function') openLevelUpModal();
    } else {
        player.hp = Math.min(player.maxHp, player.hp + 2);
    }
    // #38 Sentient Weapon XP
    const wep = player.equipment.weapon;
    if (wep && wep.sentient && (wep.itemLvl || 1) < 10) {
        wep.itemXp = (wep.itemXp || 0) + Math.ceil(defender.baseXP / 2);
        const nextXp = (wep.itemLvl || 1) * 100;
        if (wep.itemXp >= nextXp) {
            wep.itemLvl = (wep.itemLvl || 1) + 1;
            wep.itemXp = 0;
            logMessage(`Your ${wep.name} pulses with power! (Level ${wep.itemLvl})`, 'magic');
            spawnParticle(player.x, player.y, 'ITEM LEVEL UP!', '#66fcf1');
        }
    }

    // Item Drop Logic
    if (Math.random() < 0.25) {
        // #35 Scrap & Component Loot
        const r = Math.random();
        if (r < 0.4) {
            spawnItem(defender.x, defender.y, { ...ITEM_DB.find(i => i.name === 'Scrap Metal') });
        } else if (r < 0.5 && currentFloor >= 4) {
            spawnItem(defender.x, defender.y, { ...ITEM_DB.find(i => i.name === 'Magic Component') });
        } else {
            spawnRandomItemAt(defender.x, defender.y);
        }
    }
}

// Global wrapper for tests and console
window.addXp = function(gainedXp) {
    player.xp += gainedXp;
    logMessage(`Gained ${gainedXp} XP.`);
    if (player.xp >= player.nextXp) {
        player.level++;
        player.maxHp += 5;
        player.hp = player.maxHp;
        player.atk += 1;
        player.skillPoints = (player.skillPoints || 0) + 1;
        player.nextXp = Math.floor(player.nextXp * 1.8);
        logMessage(`LEVEL UP! You are now level ${player.level}.`, 'magic');
        if (typeof openLevelUpModal === 'function') openLevelUpModal();
    }
    updateUI();
};



// === useItem + dropItem (appended) ===

window.attemptIdentify = function(index) {
    const item = player.inventory[index];
    if (item.identified || identifiedTypes[item.name]) return;

    if (item.idAttemptedAtLevel && item.idAttemptedAtLevel >= player.level) {
        logMessage("This item is currently too complex for you to identify.", "damage");
        return;
    }

    let chance = 0.15;
    if (player.class === 'Mage') chance += 0.30;
    if (player.class === 'Rogue' && ['weapon', 'armor', 'helm', 'ring', 'amulet', 'shield'].includes(item.type)) chance += 0.10;
    chance += (player.level * 0.02);

    if (Math.random() < chance) {
        if (['potion', 'scroll', 'wand'].includes(item.type)) {
            identifiedTypes[item.name] = true;
        } else {
            item.identified = true;
        }
        logMessage(`Success! You identified: ${item.name}`, "kill");
    } else {
        item.idAttemptedAtLevel = player.level;
        logMessage("You failed to identify it. It looks too complex for now.", "damage");
    }
    
    player.energy -= energyCost; // Takes a turn!
    updateUI();
};

function useItem(index) {
    const item = player.inventory[index];
    if (item.equip) {
        let slot = item.effect;
        if (slot === 'esp') slot = 'helm';
        if (slot === 'resist_fire' || slot === 'protection' || slot === 'burden') slot = 'ring';
        if (slot === 'strength' || slot === 'regeneration') slot = 'amulet';
        if (slot === 'shield') slot = 'offhand'; // #13 shields go to offhand

        if (player.equipment[slot] === item) {
            unequipSlot(slot);
            return;
        }

        if (player.equipment[slot] && player.equipment[slot].cursed) {
            logMessage(`You cannot remove the ${getItemName(player.equipment[slot])}! It is cursed!`, 'damage');
            return;
        }

        if (player.equipment[slot]) unequipSlot(slot);

        player.equipment[slot] = item;
        item.identified = true;
        if (item.effect === 'esp') player.hasESP = true;
        // #14 Dual Wield speed bonus is applied via getEffectiveSpeed()
        // #13 Shield speed penalty applied via getEffectiveSpeed()

        if (item.cursed) logMessage(`The ${getItemName(item)} binds to you! It is cursed!`, 'damage');
        else {
            let equipMsg = `You equip ${getItemName(item)}.`;
            if (item.artifact) equipMsg = `âœ¨ You wield ${getItemName(item)}! A legendary weapon!`;
            logMessage(equipMsg, item.artifact ? 'kill' : 'magic');
        }
        updateUI();
        return;
    }

    // Consumables
    if (item.type === 'ammo') {
        player.ammo = (player.ammo || 0) + (item.amount || 20);
        logMessage(`You add ${item.amount} arrows to your quiver. (Total: ${player.ammo})`, 'pickup');
        player.inventory.splice(index, 1);
        closeInventory();
        updateUI();
        return;
    }

    // Identifies item upon use
    if (['potion', 'scroll', 'wand'].includes(item.type)) {
        identifiedTypes[item.name] = true;
    }

    if (item.effect === 'heal') {
        player.hp = Math.min(player.maxHp, player.hp + item.value);
        spawnParticle(player.x, player.y, `+${item.value}`, '#2ecc71');
        logMessage(`You drink ${getItemName(item)}. You feel better.`, 'magic');
    } else if (item.effect === 'poison') {
        player.poisonTimer = (player.poisonTimer || 0) + 10;
        spawnParticle(player.x, player.y, "Poison!", '#2ecc71');
        logMessage(`You drink ${getItemName(item)}... It's poison!`, 'damage');
    } else if (item.effect === 'recall') {
        logMessage(`You read the ${getItemName(item)}!`, 'magic');
        spawnParticle(player.x, player.y, "RECALL!", '#3498db');
        if (currentFloor > 0) {
            logMessage("You are pulled back to the safety of Town.", "pickup");
            currentFloor = 0;
            generateTown();
        } else {
            let targetFloor = player.maxFloor || 1;
            logMessage(`You are pulled back to Dungeon Level ${targetFloor}.`, "damage");
            currentFloor = targetFloor;
            generateDungeon();
        }
        computeFOV();
        updateUI();
    } else if (item.effect === 'uncurse') {
        logMessage(`You read the ${getItemName(item)}! A pure light washes over you.`, 'magic');
        let uncursedAny = false;
        Object.values(player.equipment).forEach(eq => {
            if (eq && eq.cursed) {
                eq.cursed = false;
                uncursedAny = true;
            }
        });
        if (uncursedAny) spawnParticle(player.x, player.y, "Purified!", '#f1c40f');
        else logMessage("Nothing happens.", "hint");
        updateUI();
    } else if (item.effect === 'slow') {
        player.speed = Math.max(2, player.speed - 3);
        spawnParticle(player.x, player.y, "Slow!", '#3498db');
        logMessage(`You drink ${getItemName(item)}... You feel sluggish.`, 'damage');
    } else if (item.effect === 'confuse_self') {
        // #51 Potion of Confusion
        player.confusedTimer = (player.confusedTimer || 0) + 10;
        spawnParticle(player.x, player.y, "CONFUSED!", '#9b59b6');
        logMessage(`You drink ${getItemName(item)}... The world spins!`, 'damage');
    } else if (item.effect === 'blind_self') {
        // #52 Potion of Blindness
        player.blindTimer = (player.blindTimer || 0) + 8;
        spawnParticle(player.x, player.y, "BLIND!", '#888');
        logMessage(`You drink ${getItemName(item)}... You can't see!`, 'damage');
    } else if (item.effect === 'paralyze_self') {
        // #53 Potion of Paralysis
        player.paralyzedTimer = (player.paralyzedTimer || 0) + 6;
        spawnParticle(player.x, player.y, 'PARALYZED!', '#e0c080');
        logMessage(`You drink ${getItemName(item)}... You can't move!`, 'damage');
    } else if (item.effect === 'regen_boost') {
        // #56 Potion of Regeneration — speeds up regen for 30 ticks
        player.regenBoost = (player.regenBoost || 0) + 30;
        spawnParticle(player.x, player.y, "REGEN!", '#2ecc71');
        logMessage(`You drink ${getItemName(item)}. You feel your wounds closing!`, 'magic');
    } else if (item.effect === 'strength_boost') {
        player.stats.str++;
        spawnParticle(player.x, player.y, "STR +1!", '#e74c3c');
        logMessage(`You drink ${getItemName(item)}. You feel incredibly strong!`, 'magic');
    } else if (item.effect === 'intellect_boost') {
        player.stats.int++;
        spawnParticle(player.x, player.y, "INT +1!", '#3498db');
        logMessage(`You drink ${getItemName(item)}. Your mind expands!`, 'magic');
    } else if (item.effect === 'dexterity_boost') {
        player.stats.dex++;
        spawnParticle(player.x, player.y, "DEX +1!", '#f1c40f');
        logMessage(`You drink ${getItemName(item)}. Your reflexes quicken!`, 'magic');
    } else if (item.effect === 'repair') {
        // #32 Repair Kit logic
        let itemsToRepair = Object.values(player.equipment).filter(i => i && i.durability !== undefined && i.durability < i.maxDurability);
        if (itemsToRepair.length > 0) {
            itemsToRepair.forEach(i => {
                i.durability = Math.min(i.maxDurability, i.durability + item.value);
            });
            logMessage(`You use the ${getItemName(item)}. Your equipment is restored!`, 'magic');
            spawnParticle(player.x, player.y, 'REPAIRED!', '#3498db');
        } else {
            logMessage(`You use the ${getItemName(item)} but your gear is already in top shape.`, 'hint');
        }
    } else if (item.effect === 'enchant') {
        // #34 Enchantment Orb logic
        if (player.equipment.weapon) {
            player.equipment.weapon.element = item.element;
            logMessage(`The ${getItemName(item)} glows and infuses your weapon with ${item.element}!`, 'magic');
            spawnParticle(player.x, player.y, `ENCHANTED!`, '#f1c40f');
        } else {
            logMessage("You need a weapon equipped to use this orb.", "damage");
            return; // Don't consume
        }
    } else if (item.effect === 'confuse_monster') {
        // Scroll of Confusion â€” confuses nearest visible monster
        const nearestVis = [...entities].filter(e => !e.isPlayer && e.hp > 0 && map[e.x][e.y].visible)
            .sort((a,b) => (Math.abs(a.x-player.x)+Math.abs(a.y-player.y)) - (Math.abs(b.x-player.x)+Math.abs(b.y-player.y)))[0];
        if (nearestVis) {
            nearestVis.confused = true;
            nearestVis.confusedTimer = 12;
            logMessage(`You read the ${getItemName(item)}! ${nearestVis.name} is confused!`, 'magic');
            spawnParticle(nearestVis.x, nearestVis.y, 'CONFUSED!', '#9b59b6');
        } else {
            logMessage(`You read the ${getItemName(item)}... No target in sight.`, 'hint');
        }
    } else if (item.effect === 'xp') {
        player.xp = player.nextXp;
        spawnParticle(player.x, player.y, "XP!", '#f1c40f');
        logMessage(`You drink ${getItemName(item)}. You feel enlightened!`, 'magic');
    } else if (item.effect === 'recall') {
        logMessage(`The ${getItemName(item)} is read!`, 'magic');
        setTimeout(() => {
            currentFloor = 0;
            generateTown();
            computeFOV();
        }, 1000);
    } else if (item.effect === 'identify') {
        logMessage(`You read the ${getItemName(item)}! All objects are identified.`, 'magic');
        player.inventory.forEach(i => {
            identifiedTypes[i.name] = true;
        });
        spawnParticle(player.x, player.y, "?!", '#f1c40f');
        updateUI();
    } else if (item.effect === 'summon') {
        logMessage(`You read the ${getItemName(item)}! Monsters appear!`, 'damage');
        const pool = ENEMY_TYPES.filter(t => t.hp > 0);
        for (let i = 0; i < 3; i++) {
            const t = pool[Math.floor(Math.random() * pool.length)];
            const hp = t.hp + Math.floor(Math.random() * currentFloor * 2);
            let e = new Entity(player.x, player.y, t.char, t.color, t.name, hp, t.atk + currentFloor, t.def, t.speed);
            e.element = t.element; e.baseXP = t.baseXP;
            entities.push(e);
        }
    } else if (item.effect === 'haste_self') {
        // Phase V â€” Wand of Haste: self-speed buff
        item.charges = (item.charges || 1) - 1;
        player.speed = Math.min(20, player.speed + 4);
        player.hasteTimer = (player.hasteTimer || 0) + 15;
        spawnParticle(player.x, player.y, 'HASTE!', '#66fcf1');
        logMessage(`You zap the ${getItemName(item)}. You feel lightning fast!`, 'magic');
        if (item.charges <= 0) { logMessage(`${item.name} crumbles.`, 'damage'); player.inventory.splice(index, 1); }
        updateUI(); return;
    } else if (item.effect === 'teleport_self') {
        // Phase V â€” Wand of Teleportation
        item.charges = (item.charges || 1) - 1;
        let rx, ry, tries = 0;
        do { rx = Math.floor(Math.random() * MAP_WIDTH); ry = Math.floor(Math.random() * MAP_HEIGHT); tries++; }
        while (tries < 80 && (map[rx][ry].type !== 'floor' || getEntityAt(rx, ry)));
        if (tries < 80) { player.x = rx; player.y = ry; computeFOV(); spawnParticle(player.x, player.y, 'POOF!', '#9b59b6'); logMessage('You blink away!', 'magic'); }
        if (item.charges <= 0) { logMessage(`${item.name} crumbles.`, 'damage'); player.inventory.splice(index, 1); }
        updateUI(); return;
    } else if (item.effect === 'target_spell') {
        if (item.charges <= 0) {
            logMessage("The wand is empty.", "damage");
            return;
        }
        activeSpell = item.spell;
        activeItemIndex = index;
        
        const nearest = getNearestMonster(player.x, player.y);
        if (nearest) {
            targetX = nearest.x; 
            targetY = nearest.y;
            if (typeof executeTargetSpell === 'function') {
                executeTargetSpell();
            } else if (typeof window.executeTargetSpell === 'function') {
                window.executeTargetSpell();
            }
            return;
        }

        targetX = player.x; targetY = player.y;
        gameState = 'TARGETING';
        logMessage("Select target (mouse or arrows, Enter/Click to fire)", "hint");
        return;
    } else if (item.effect === 'enchant_weapon') {
        // #20 Scroll of Enchant Weapon
        if (player.equipment.weapon) {
            player.equipment.weapon.atkBonus = (player.equipment.weapon.atkBonus || 0) + 1;
            player.equipment.weapon.identified = true;
            const wName = player.equipment.weapon.name;
            logMessage(`The ${getItemName(item)} enchants your ${wName}! (+1 Atk)`, 'magic');
            spawnParticle(player.x, player.y, '+1 ATK!', '#f39c12');
        } else {
            logMessage(`You read the ${getItemName(item)}... but hold no weapon! Wasted.`, 'damage');
        }
    } else if (item.effect === 'fireball_aoe') {
        // Phase V â€” Scroll of Fireball: AoE around player
        logMessage(`You read the ${getItemName(item)}! FIREBALL!`, 'damage');
        let aoeKills = 0;
        for (const e of [...entities]) {
            if (!e.isPlayer && e.hp > 0) {
                const d = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                if (d <= 3) {
                    const dmg = Math.floor((4 - d) * (8 + Math.floor(Math.random() * 6)));
                    e.hp -= dmg;
                    spawnParticle(e.x, e.y, `-${dmg} FIRE`, '#e67e22');
                    if (e.hp <= 0) { handleMonsterDeath(e); aoeKills++; }
                }
            }
        }
        spawnParticle(player.x, player.y, '\uD83D\uDD25 FIREBALL!', '#e67e22');
        if (aoeKills > 1) logMessage(`${aoeKills} enemies consumed by fire!`, 'kill');
    } else if (item.effect === 'frost_nova') {
        // Phase V â€” Scroll of Frost Nova: freeze all adjacent enemies
        logMessage(`You read the ${getItemName(item)}! FROST NOVA!`, 'magic');
        for (const e of entities) {
            if (!e.isPlayer && e.hp > 0) {
                const d = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                if (d <= 2) {
                    const dmg = 8 + Math.floor(Math.random() * 5);
                    e.hp -= dmg;
                    e.speed = Math.max(1, e.speed - 4);
                    spawnParticle(e.x, e.y, 'FROZEN!', '#3498db');
                    if (e.hp <= 0) handleMonsterDeath(e);
                }
            }
        }
    } else if (item.effect === 'enchant_armor') {
        if (player.equipment.armor) {
            player.equipment.armor.defBonus = (player.equipment.armor.defBonus || 0) + 1;
            player.equipment.armor.identified = true;
            logMessage(`The ${getItemName(item)} reinforces your armor! (+1 Def)`, 'magic');
            spawnParticle(player.x, player.y, '+1 DEF!', '#3498db');
        } else {
            logMessage(`You read the ${getItemName(item)}... but wear no armor! Wasted.`, 'damage');
        }
    }

    player.inventory.splice(index, 1);
    updateUI();
}

window.dropItem = function (index, ev) {
    const item = player.inventory[index];
    if (ev) ev.stopPropagation(); // prevent useItem if dropping from UI
    if (item.equip) {
        const slotKey = Object.keys(player.equipment).find(key => player.equipment[key] === item);
        if (slotKey) {
            logMessage(`Unequip first.`, 'damage');
            return;
        }
    }
    if (ev && ev.shiftKey) {
        logMessage(`Destroyed ${getItemName(item)}.`, 'damage');
        player.inventory.splice(index, 1);
    } else {
        items.push({ x: player.x, y: player.y, ...item });
        player.inventory.splice(index, 1);
        logMessage(`Dropped ${getItemName(item)}.`);
    }
    updateUI();
};

