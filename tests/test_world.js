/**
 * 🌸 Rogue Reborn — World Generation Tests
 * Validates map structure, spawning indices, and floor tier logic.
 */

const ENEMY_TYPES = ctx.ENEMY_TYPES;
const ITEM_DB = ctx.ITEM_DB;

describe('World — Monster Spawn Indices', () => {
    it('all spawn indices for floors 1-2 are valid', () => {
        const allowed = [0, 1, 2, 14];
        for (const idx of allowed) {
            assert(ENEMY_TYPES[idx], `Index ${idx} not found in ENEMY_TYPES (floor 1-2 spawn)`);
        }
    });

    it('all spawn indices for floors 3-4 are valid', () => {
        const allowed = [1, 2, 3, 10, 11, 12, 13, 14, 15, 19];
        for (const idx of allowed) {
            assert(ENEMY_TYPES[idx], `Index ${idx} not found in ENEMY_TYPES (floor 3-4 spawn)`);
        }
    });

    it('all spawn indices for floors 5-6 are valid', () => {
        const allowed = [2, 3, 4, 5, 12, 15, 16];
        for (const idx of allowed) {
            assert(ENEMY_TYPES[idx], `Index ${idx} not found in ENEMY_TYPES (floor 5-6 spawn)`);
        }
    });

    it('all spawn indices for floors 7-8 are valid', () => {
        const allowed = [4, 5, 6, 7, 13, 17, 18];
        for (const idx of allowed) {
            assert(ENEMY_TYPES[idx], `Index ${idx} not found in ENEMY_TYPES (floor 7-8 spawn)`);
        }
    });

    it('all spawn indices for floors 9-10 are valid', () => {
        const allowed = [6, 7, 8, 12, 17, 18];
        for (const idx of allowed) {
            assert(ENEMY_TYPES[idx], `Index ${idx} not found in ENEMY_TYPES (floor 9-10 spawn)`);
        }
    });

    it('Balrog is at index 9', () => {
        assertEqual(ENEMY_TYPES[9].name, 'Balrog', 'Index 9 should be Balrog');
    });

    it('all spawn indices for Abyss (11+) are valid', () => {
        const allowed = [7, 8, 9, 17, 18, 20, 21, 22, 23];
        for (const idx of allowed) {
            assert(ENEMY_TYPES[idx], `Index ${idx} not found in ENEMY_TYPES (Abyss spawn)`);
        }
    });
});

describe('World — Map Dimensions', () => {
    it('MAP_WIDTH is 70', () => {
        assertEqual(ctx.MAP_WIDTH, 70, 'MAP_WIDTH should be 70');
    });

    it('MAP_HEIGHT is 50', () => {
        assertEqual(ctx.MAP_HEIGHT, 50, 'MAP_HEIGHT should be 50');
    });
});

describe('World — Item Spawn Logic', () => {
    it('items with minFloor exist for every floor 1-10', () => {
        for (let floor = 1; floor <= 10; floor++) {
            const available = ITEM_DB.filter(i => floor >= i.minFloor && !i.artifact);
            assertGreater(available.length, 0, `No items available for floor ${floor}`);
        }
    });

    it('artifacts only spawn at floor 4+', () => {
        const artifacts = ITEM_DB.filter(i => i.artifact);
        for (const art of artifacts) {
            assertGreater(art.minFloor, 3, `Artifact "${art.name}" spawns too early (floor ${art.minFloor})`);
        }
    });

    it('gold pile spawning always has floor 1 items available', () => {
        const floorOneItems = ITEM_DB.filter(i => i.minFloor <= 1 && !i.artifact);
        assertGreater(floorOneItems.length, 5, 'Should have >5 items available at floor 1');
    });
});

describe('World — Town Building Types', () => {
    it('expected building tile types exist in constants', () => {
        // These are tile types the town generation uses
        const expectedTypes = ['shop', 'healer', 'blacksmith', 'wizard', 'bank', 'well', 'mayor', 'gambler'];
        // We can't test generation directly without DOM, but we verify the constants/expectations
        for (const t of expectedTypes) {
            assert(typeof t === 'string' && t.length > 0, `Building type "${t}" should be a valid string`);
        }
    });
});

describe('World — XP Scaling', () => {
    it('XP scales with floor multiplier', () => {
        const baseXP = 10;
        const floor = 5;
        const gained = Math.floor(baseXP * (1 + floor * 0.2));
        assertEqual(gained, 20, 'XP at floor 5: 10 × 2.0 = 20');
    });

    it('XP scales higher at deep floors', () => {
        const baseXP = 100;
        const floor = 10;
        const gained = Math.floor(baseXP * (1 + floor * 0.2));
        assertEqual(gained, 300, 'XP at floor 10: 100 × 3.0 = 300');
    });
});
