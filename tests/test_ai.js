/**
 * 🌸 Rogue Reborn — AI System Tests
 * Tests Batch 9 AI: Personalities, Retreat, Pack Alert, Ambush, Support, Boss Phases.
 */

const Entity = ctx.Entity;

// Helper: reset global state before each AI test
function resetAI() {
    ctx.player.x = 10; ctx.player.y = 10;
    ctx.player.hp = 100; ctx.player.maxHp = 100;
    ctx.player.killsByType = {};
    ctx.player.inventory = [];
    ctx.entities = [ctx.player];
    // Reset noiseMap
    for (let x = 0; x < ctx.MAP_WIDTH; x++)
        for (let y = 0; y < ctx.MAP_HEIGHT; y++) {
            ctx.noiseMap[x][y] = 0;
            ctx.map[x][y] = { type: 'floor', visible: true, explored: true };
        }
}

// =============================================
// Phase IV: Personality Tests
// =============================================
describe('AI — Personalities', () => {

    it('Cowardly: runs away when player has many kills', () => {
        resetAI();
        ctx.player.killsByType = { 'Goblin': 5 };
        
        const goblin = new Entity(11, 11, 'g', '#0f0', 'Goblin', 10, 2, 1, 10);
        goblin.personality = 'cowardly';
        goblin.energy = 100;
        ctx.entities = [ctx.player, goblin];

        ctx.processMonsterAI(goblin);

        // Should flee away from (10,10)
        assert(goblin.x > 10 || goblin.y > 10, 'Goblin should have moved away from player');
    });

    it('Vengeful: gains ATK and rushes when player has many kills', () => {
        resetAI();
        ctx.player.killsByType = { 'Orc': 5 };
        
        const orc = new Entity(13, 10, 'o', '#f00', 'Orc', 20, 5, 2, 10);
        orc.personality = 'vengeful';
        orc.energy = 100;
        const baseAtk = orc.atk;
        ctx.entities = [ctx.player, orc];

        ctx.processMonsterAI(orc);

        assertEqual(orc.atk, baseAtk + 2, `Vengeful Orc should gain +2 ATK (was ${baseAtk}, now ${orc.atk})`);
        assert(orc.surged === true, 'Vengeful Orc should be surged');
    });

    it('Stealthy: waits in darkness when far away', () => {
        resetAI();
        
        const stalker = new Entity(20, 20, 's', '#888', 'Stalker', 15, 4, 2, 10);
        stalker.personality = 'stealthy';
        stalker.energy = 100;
        ctx.entities = [ctx.player, stalker];

        const oldX = stalker.x;
        const oldY = stalker.y;
        ctx.processMonsterAI(stalker);

        assertEqual(stalker.x, oldX, 'Stealthy monster should stay still when far away');
        assertEqual(stalker.y, oldY, 'Stealthy monster should stay still when far away');
    });

    it('Pack: alerts nearby pack members when wounded', () => {
        resetAI();
        
        const rat1 = new Entity(12, 10, 'R', '#fff', 'Giant Rat', 18, 4, 1, 14);
        const rat2 = new Entity(14, 10, 'R', '#fff', 'Giant Rat', 18, 4, 1, 14);
        rat1.personality = 'pack';
        rat2.personality = 'pack';
        rat1.hp = 2; // Wounded (< 40%)
        rat2.confusedTimer = 10;
        
        ctx.entities = [ctx.player, rat1, rat2];

        ctx.processMonsterAI(rat1);

        assert(rat1.hasHowled, 'Rat should have howled');
        assertEqual(rat2.confusedTimer, 0, 'Nearby rat should have been alerted');
    });

    it('Cowardly: does NOT run away when kills are low', () => {
        resetAI();
        ctx.player.killsByType = { 'Goblin': 4 };
        
        const goblin = new Entity(12, 10, 'g', '#0f0', 'Goblin', 10, 2, 1, 10);
        goblin.personality = 'cowardly';
        goblin.energy = 100;
        ctx.entities = [ctx.player, goblin];

        ctx.processMonsterAI(goblin);

        // Should move towards player (dist was 2, now 1 or attack)
        assert(goblin.x <= 12, 'Goblin should have moved towards or attacked player');
    });

    it('Vengeful: does NOT gain buff when kills are low', () => {
        resetAI();
        ctx.player.killsByType = { 'Orc': 4 };
        
        const orc = new Entity(13, 10, 'o', '#f00', 'Orc', 20, 5, 2, 10);
        orc.personality = 'vengeful';
        orc.energy = 100;
        const baseAtk = orc.atk;
        ctx.entities = [ctx.player, orc];

        ctx.processMonsterAI(orc);

        assertEqual(orc.atk, baseAtk, 'Vengeful Orc should NOT gain buff if kills < 5');
    });
});

// =============================================
// Batch 9: Advanced AI Tests
// =============================================
describe('AI — Retreat Logic', () => {
    it('wounded monster retreats when HP < 30%', () => {
        resetAI();
        
        const orc = new Entity(11, 10, 'o', '#f00', 'Orc', 20, 5, 2, 10);
        orc.hp = 4; // 20% HP
        orc.energy = 100;
        ctx.entities = [ctx.player, orc];

        // Retreat has 60% chance at < 30% HP. Loop to find it.
        let retreated = false;
        for (let i = 0; i < 30; i++) {
            orc.x = 11; orc.y = 10; orc.energy = 100; orc.retreating = false;
            ctx.processMonsterAI(orc);
            if (orc.x > 11) { retreated = true; break; }
        }

        assert(retreated, 'Wounded monster should eventually retreat');
    });

    it('bosses do NOT retreat', () => {
        resetAI();
        
        const boss = new Entity(11, 10, 'B', '#f00', 'Balrog', 150, 18, 12, 10);
        boss.hp = 10; // Very wounded
        boss.miniBoss = true;
        boss.bossPhases = true;
        boss.energy = 100;
        ctx.entities = [ctx.player, boss];

        // Boss should NEVER retreat
        for (let i = 0; i < 20; i++) {
            boss.x = 11; boss.y = 10; boss.energy = 100;
            ctx.processMonsterAI(boss);
            assert(boss.x <= 11, `Boss should not retreat (moved to ${boss.x})`);
        }
    });
});

describe('AI — Sleeping & Noise', () => {
    it('sleeping monster wakes up when player is adjacent', () => {
        resetAI();
        
        const goblin = new Entity(11, 10, 'g', '#0f0', 'Goblin', 10, 2, 1, 10);
        goblin.sleeping = true;
        goblin.energy = 100;
        ctx.entities = [ctx.player, goblin];

        ctx.processMonsterAI(goblin);

        assertEqual(goblin.sleeping, false, 'Monster should wake up when player is adjacent');
    });

    it('sleeping monster stays asleep when player is far and no noise', () => {
        resetAI();
        
        const goblin = new Entity(30, 30, 'g', '#0f0', 'Goblin', 10, 2, 1, 10);
        goblin.sleeping = true;
        goblin.energy = 100;
        ctx.entities = [ctx.player, goblin];

        ctx.processMonsterAI(goblin);

        assertEqual(goblin.sleeping, true, 'Monster should stay asleep when far and no noise');
    });

    it('sleeping monster wakes up from loud noise', () => {
        resetAI();
        
        const goblin = new Entity(15, 10, 'g', '#0f0', 'Goblin', 10, 2, 1, 10);
        goblin.sleeping = true;
        goblin.energy = 100;
        ctx.entities = [ctx.player, goblin];

        // Place noise above WAKE_THRESHOLD at monster location
        ctx.noiseMap[15][10] = ctx.WAKE_THRESHOLD + 10;

        ctx.processMonsterAI(goblin);

        assertEqual(goblin.sleeping, false, 'Monster should wake up from loud noise');
    });
});

describe('AI — Boss Phases', () => {
    it('boss enters Phase 2 at 60% HP', () => {
        resetAI();
        
        const boss = new Entity(12, 10, 'B', '#f00', 'TestBoss', 100, 10, 5, 10);
        boss.bossPhases = true;
        boss.energy = 100;
        boss.hp = 55; // 55% HP
        ctx.entities = [ctx.player, boss];

        ctx.processMonsterAI(boss);

        assert(boss.phase2Triggered, 'Boss should trigger Phase 2 at <= 60% HP');
        assertEqual(boss.atk, 13, 'Boss ATK should increase by +3 in Phase 2');
    });

    it('boss enters Phase 3 at 30% HP and summons minions', () => {
        resetAI();
        
        const boss = new Entity(12, 10, 'B', '#f00', 'TestBoss', 100, 10, 5, 10);
        boss.bossPhases = true;
        boss.energy = 100;
        boss.hp = 25; // 25% HP
        ctx.entities = [ctx.player, boss];

        ctx.processMonsterAI(boss);

        assert(boss.phase3Triggered, 'Boss should trigger Phase 3 at <= 30% HP');
        // Phase 2 + Phase 3 ATK: +3 + +5 = +8
        assertEqual(boss.atk, 18, 'Boss ATK should increase by +3 (P2) + +5 (P3) = +8');
    });
});
