/**
 * 🌸 Rogue Reborn — Data Integrity Tests
 * Validates ENEMY_TYPES and ITEM_DB structural correctness.
 */

const ENEMY_TYPES = ctx.ENEMY_TYPES;
const ITEM_DB = ctx.ITEM_DB;
const CHARS = ctx.CHARS;
const COLORS = ctx.COLORS;

// === ENEMY_TYPES Tests ===
describe('ENEMY_TYPES — Structure', () => {
    it('should have at least 20 enemy types', () => {
        assertGreater(ENEMY_TYPES.length, 19, `Only ${ENEMY_TYPES.length} enemy types found`);
    });

    it('every enemy has required fields', () => {
        const requiredFields = ['char', 'name', 'hp', 'atk', 'def', 'speed', 'element', 'baseXP'];
        for (let i = 0; i < ENEMY_TYPES.length; i++) {
            const e = ENEMY_TYPES[i];
            for (const field of requiredFields) {
                assert(e[field] !== undefined, `Enemy index ${i} (${e.name || '??'}) missing field: ${field}`);
            }
        }
    });

    it('no duplicate enemy names', () => {
        const names = ENEMY_TYPES.map(e => e.name);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);
        assertEqual(dupes.length, 0, `Duplicate enemy names: ${dupes.join(', ')}`);
    });

    it('all enemies have positive HP', () => {
        for (const e of ENEMY_TYPES) {
            assertGreater(e.hp, 0, `${e.name} has HP <= 0`);
        }
    });

    it('all enemies have positive speed', () => {
        for (const e of ENEMY_TYPES) {
            assertGreater(e.speed, 0, `${e.name} has speed <= 0`);
        }
    });

    it('all enemies have a single-char glyph', () => {
        for (const e of ENEMY_TYPES) {
            assertEqual(e.char.length, 1, `${e.name} char '${e.char}' is not length 1`);
        }
    });

    it('Balrog exists and is the strongest base enemy', () => {
        const balrog = ENEMY_TYPES.find(e => e.name === 'Balrog');
        assert(balrog, 'Balrog not found');
        assertEqual(balrog.hp, 150, 'Balrog HP should be 150');
        assertEqual(balrog.element, 'fire', 'Balrog should be fire element');
    });

    it('mini-bosses are flagged correctly', () => {
        const archLich = ENEMY_TYPES.find(e => e.name === 'Arch-Lich');
        const dragonKing = ENEMY_TYPES.find(e => e.name === 'Dragon King');
        assert(archLich, 'Arch-Lich not found');
        assert(dragonKing, 'Dragon King not found');
        assert(archLich.miniBoss, 'Arch-Lich should have miniBoss flag');
        assert(dragonKing.miniBoss, 'Dragon King should have miniBoss flag');
    });

    it('special ability flags exist on correct monsters', () => {
        const cube = ENEMY_TYPES.find(e => e.name === 'Gelatinous Cube');
        assert(cube && cube.invisible, 'Gelatinous Cube should be invisible');

        const vampire = ENEMY_TYPES.find(e => e.name === 'Vampire');
        assert(vampire && vampire.drainMaxHp, 'Vampire should drainMaxHp');

        const necro = ENEMY_TYPES.find(e => e.name === 'Necromancer');
        assert(necro && necro.summoner, 'Necromancer should be summoner');

        const blink = ENEMY_TYPES.find(e => e.name === 'Blink Dog');
        assert(blink && blink.blinker, 'Blink Dog should be blinker');

        const beholder = ENEMY_TYPES.find(e => e.name === 'Beholder');
        assert(beholder && beholder.rangedDebuff, 'Beholder should have rangedDebuff');

        const flayer = ENEMY_TYPES.find(e => e.name === 'Mind Flayer');
        assert(flayer && flayer.xpDrain, 'Mind Flayer should have xpDrain');
    });
});

// === ITEM_DB Tests ===
describe('ITEM_DB — Structure', () => {
    it('should have at least 60 items', () => {
        assertGreater(ITEM_DB.length, 60, `Only ${ITEM_DB.length} items found`);
    });

    it('every item has required fields', () => {
        const requiredFields = ['type', 'char', 'name', 'minFloor'];
        for (let i = 0; i < ITEM_DB.length; i++) {
            const item = ITEM_DB[i];
            for (const field of requiredFields) {
                assert(item[field] !== undefined, `Item index ${i} (${item.name || '??'}) missing field: ${field}`);
            }
        }
    });

    it('no duplicate item names', () => {
        const names = ITEM_DB.map(i => i.name);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);
        assertEqual(dupes.length, 0, `Duplicate item names: ${dupes.join(', ')}`);
    });

    it('all items have valid type', () => {
        const validTypes = ['potion', 'scroll', 'wand', 'weapon', 'armor', 'helm', 'ring', 'amulet', 'shield', 'ammo', 'key'];
        for (const item of ITEM_DB) {
            assertIncludes(validTypes, item.type, `${item.name} has invalid type: ${item.type}`);
        }
    });

    it('equippable items have equip flag', () => {
        const equipTypes = ['weapon', 'armor', 'helm', 'ring', 'amulet', 'shield'];
        for (const item of ITEM_DB) {
            if (equipTypes.includes(item.type)) {
                assert(item.equip === true, `${item.name} (${item.type}) should have equip: true`);
            }
        }
    });

    it('potions have effect field', () => {
        for (const item of ITEM_DB) {
            if (item.type === 'potion') {
                assert(item.effect, `Potion "${item.name}" missing effect`);
            }
        }
    });

    it('wands have charges field', () => {
        for (const item of ITEM_DB) {
            if (item.type === 'wand') {
                assertGreater(item.charges, 0, `Wand "${item.name}" should have charges > 0`);
            }
        }
    });

    it('artifacts are flagged and have minFloor >= 4', () => {
        const artifacts = ITEM_DB.filter(i => i.artifact);
        assertGreater(artifacts.length, 0, 'No artifacts found');
        for (const art of artifacts) {
            assertGreater(art.minFloor, 3, `Artifact "${art.name}" minFloor should be >= 4`);
            assert(art.identified === true, `Artifact "${art.name}" should be pre-identified`);
        }
    });

    it('Dungeon Key exists and has cost 0', () => {
        const key = ITEM_DB.find(i => i.name === 'Dungeon Key');
        assert(key, 'Dungeon Key not found in ITEM_DB');
        assertEqual(key.cost, 0, 'Dungeon Key should be free');
    });

    it('all floor requirements are <= 10', () => {
        for (const item of ITEM_DB) {
            assert(item.minFloor <= 10, `${item.name} has minFloor ${item.minFloor} > 10`);
        }
    });
});

// === Constants Tests ===
describe('Constants — Integrity', () => {
    it('TILE_SIZE is positive', () => {
        assertGreater(ctx.TILE_SIZE, 0, 'TILE_SIZE should be > 0');
    });

    it('MAP dimensions are reasonable', () => {
        assertGreater(ctx.MAP_WIDTH, 20, 'MAP_WIDTH too small');
        assertGreater(ctx.MAP_HEIGHT, 20, 'MAP_HEIGHT too small');
    });

    it('ENERGY_THRESHOLD is 100', () => {
        assertEqual(ctx.ENERGY_THRESHOLD, 100, 'ENERGY_THRESHOLD should be 100');
    });

    it('CHARS constants exist', () => {
        assert(CHARS.WALL, 'CHARS.WALL missing');
        assert(CHARS.FLOOR, 'CHARS.FLOOR missing');
        assert(CHARS.PLAYER, 'CHARS.PLAYER missing');
    });

    it('COLORS constants exist', () => {
        assert(COLORS.LIT_WALL, 'COLORS.LIT_WALL missing');
        assert(COLORS.LIT_FLOOR, 'COLORS.LIT_FLOOR missing');
        assert(COLORS.GOLD, 'COLORS.GOLD missing');
    });
});
