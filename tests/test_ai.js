/**
 * 🌸 Rogue Reborn — AI System Tests
 * Tests monster personalities: Cowardly, Vengeful, Stealthy, Pack.
 */

const Entity = ctx.Entity;

describe('AI — Personalities', () => {

    it('Cowardly: runs away when player has many kills', () => {
        // Setup
        ctx.player.x = 10; ctx.player.y = 10;
        ctx.player.killsByType = { 'Goblin': 5 };
        
        const goblin = new Entity(11, 11, 'g', '#0f0', 'Goblin', 10, 2, 1, 10);
        goblin.personality = 'cowardly';
        goblin.energy = 100;
        ctx.entities = [ctx.player, goblin];

        // Process AI
        ctx.processMonsterAI(goblin);

        // Cowardly should move away. 
        // Player at 10,10. Goblin at 11,11. 
        // Away is 12,12 or similar.
        assert(goblin.x > 11 || goblin.y > 11, 'Goblin should have moved away from player');
    });

    it('Vengeful: gains ATK and rushes when player has many kills', () => {
        ctx.player.x = 10; ctx.player.y = 10;
        ctx.player.killsByType = { 'Orc': 5 };
        
        const orc = new Entity(13, 10, 'o', '#f00', 'Orc', 20, 5, 2, 10);
        orc.personality = 'vengeful';
        orc.energy = 100;
        const baseAtk = orc.atk;
        ctx.entities = [ctx.player, orc];

        ctx.processMonsterAI(orc);

        assertEqual(orc.atk, baseAtk + 2, 'Vengeful Orc should gain +2 ATK');
        assert(orc.x < 13, 'Vengeful Orc should move towards player');
    });

    it('Stealthy: waits in darkness when far away', () => {
        ctx.player.x = 10; ctx.player.y = 10;
        
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
        ctx.player.x = 10; ctx.player.y = 10;
        
        const rat1 = new Entity(12, 10, 'R', '#fff', 'Giant Rat', 18, 4, 1, 14);
        const rat2 = new Entity(14, 10, 'R', '#fff', 'Giant Rat', 18, 4, 1, 14);
        rat1.personality = 'pack';
        rat2.personality = 'pack';
        rat1.hp = 2; // Wounded (< 40%)
        rat2.confusedTimer = 10; // "Sleeping" or confused
        
        ctx.entities = [ctx.player, rat1, rat2];

        ctx.processMonsterAI(rat1);

        assert(rat1.hasHowled, 'Rat should have howled');
        assertEqual(rat2.confusedTimer, 0, `Nearby rat should have been alerted. Current timer: ${rat2.confusedTimer}`);
    });

    it('Cowardly: does NOT run away when kills are low', () => {
        ctx.player.x = 10; ctx.player.y = 10;
        ctx.player.killsByType = { 'Goblin': 4 }; // threshold is 5
        
        const goblin = new Entity(11, 11, 'g', '#0f0', 'Goblin', 10, 2, 1, 10);
        goblin.personality = 'cowardly';
        goblin.energy = 100;
        ctx.entities = [ctx.player, goblin];

        ctx.processMonsterAI(goblin);

        // Player at 10,10. Goblin at 11,11. 
        // If it doesn't flee, it should move TOWARDS player or stay adjacent.
        assert(goblin.x === 10 || goblin.y === 10, 'Goblin should HAVE moved towards the player (attacked)');
    });

    it('Vengeful: does NOT gain buff when kills are low', () => {
        ctx.player.x = 10; ctx.player.y = 10;
        ctx.player.killsByType = { 'Orc': 4 };
        
        const orc = new Entity(13, 10, 'o', '#f00', 'Orc', 20, 5, 2, 10);
        orc.personality = 'vengeful';
        orc.energy = 100;
        const baseAtk = orc.atk;
        ctx.entities = [ctx.player, orc];

        ctx.processMonsterAI(orc);

        assertEqual(orc.atk, baseAtk, 'Vengeful Orc should NOT gain buff if kills < 5');
    });

    it('Fear: wounded monsters (any personality) sometimes flee', () => {
        ctx.player.x = 10; ctx.player.y = 10;
        
        const rat = new Entity(11, 10, 'r', '#888', 'Rat', 10, 1, 0, 10);
        rat.hp = 1; // Very wounded (< 25%)
        rat.energy = 100;
        ctx.entities = [ctx.player, rat];

        // Fear fleeing is 50% chance. We loop a bit to find it or mock Math.random if we could.
        // But for a simple test, let's just run it until it moves away.
        let fled = false;
        for(let i=0; i<20; i++) {
            rat.x = 11; rat.y = 10; rat.energy = 100;
            ctx.processMonsterAI(rat);
            if (rat.x > 11) { fled = true; break; }
        }

        assert(fled, 'Wounded rat should eventually flee');
    });
});
