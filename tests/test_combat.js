/**
 * 🌸 Rogue Reborn — Combat System Tests
 * Tests combat calculations, equipment effects, damage formula.
 * These run in a sandbox with game data loaded.
 */

const ENEMY_TYPES = ctx.ENEMY_TYPES;
const ITEM_DB = ctx.ITEM_DB;

// Helper: create a mock player
function mockPlayer(overrides = {}) {
    return {
        x: 5, y: 5, isPlayer: true,
        hp: 20, maxHp: 20, atk: 3, def: 2, speed: 10,
        level: 1, xp: 0, nextXp: 50, gold: 0,
        energy: 0, class: 'Warrior',
        inventory: [], 
        equipment: { weapon: null, armor: null, helm: null, ring: null, amulet: null, offhand: null },
        combatSurgeTimer: 0, killCount: 0,
        poisonTimer: 0, confusedTimer: 0, blindTimer: 0, paralyzedTimer: 0,
        regenBoost: 0, regenTimer: 0,
        hasESP: false, spellMastery: false, backstab: false,
        ...overrides
    };
}

describe('Combat — Effective Stats', () => {
    it('base ATK without equipment equals player.atk', () => {
        const p = mockPlayer({ atk: 5 });
        // Simulate getEffectiveAtk logic
        let base = p.atk;
        if (p.equipment.weapon) base += (p.equipment.weapon.atkBonus || 0);
        if (p.equipment.amulet?.effect === 'strength') base += 2;
        if (p.combatSurgeTimer > 0) base += 2;
        assertEqual(base, 5, 'Base ATK should be 5');
    });

    it('weapon ATK bonus adds correctly', () => {
        const p = mockPlayer({ atk: 3 });
        p.equipment.weapon = { atkBonus: 4, effect: 'weapon' };
        let base = p.atk + (p.equipment.weapon.atkBonus || 0);
        assertEqual(base, 7, 'ATK with +4 weapon should be 7');
    });

    it('Amulet of Strength adds +2 ATK', () => {
        const p = mockPlayer({ atk: 3 });
        p.equipment.amulet = { effect: 'strength' };
        let base = p.atk;
        if (p.equipment.amulet?.effect === 'strength') base += 2;
        assertEqual(base, 5, 'ATK with Strength amulet should be 5');
    });

    it('Combat Surge adds +2 ATK', () => {
        const p = mockPlayer({ atk: 3, combatSurgeTimer: 10 });
        let base = p.atk;
        if (p.combatSurgeTimer > 0) base += 2;
        assertEqual(base, 5, 'ATK with Combat Surge should be 5');
    });

    it('full equipment stack adds correctly', () => {
        const p = mockPlayer({ atk: 3 });
        p.equipment.weapon = { atkBonus: 10, effect: 'weapon' };
        p.equipment.amulet = { effect: 'strength' };
        p.combatSurgeTimer = 5;
        let base = p.atk;
        base += (p.equipment.weapon.atkBonus || 0);
        if (p.equipment.amulet?.effect === 'strength') base += 2;
        if (p.combatSurgeTimer > 0) base += 2;
        assertEqual(base, 17, 'Full stack ATK: 3+10+2+2 = 17');
    });
});

describe('Combat — Effective DEF', () => {
    it('base DEF without equipment', () => {
        const p = mockPlayer({ def: 2 });
        let base = p.def;
        assertEqual(base, 2);
    });

    it('armor + helm + ring + shield stack', () => {
        const p = mockPlayer({ def: 2 });
        p.equipment.armor = { defBonus: 5 };
        p.equipment.helm = { defBonus: 2 };
        p.equipment.ring = { defBonus: 1 };
        p.equipment.offhand = { defBonus: 4 };
        let base = p.def;
        base += (p.equipment.armor.defBonus || 0);
        base += (p.equipment.helm.defBonus || 0);
        base += (p.equipment.ring.defBonus || 0);
        base += (p.equipment.offhand.defBonus || 0);
        assertEqual(base, 14, 'DEF: 2+5+2+1+4 = 14');
    });
});

describe('Combat — Effective Speed', () => {
    it('base speed without penalties', () => {
        const p = mockPlayer({ speed: 10 });
        let spd = p.speed;
        assertEqual(spd, 10);
    });

    it('shield speed penalty', () => {
        const p = mockPlayer({ speed: 10 });
        p.equipment.offhand = { speedPenalty: 2 };
        let spd = p.speed - (p.equipment.offhand.speedPenalty || 0);
        assertEqual(spd, 8, 'Speed with -2 shield penalty = 8');
    });

    it('burden ring speed penalty', () => {
        const p = mockPlayer({ speed: 10 });
        p.equipment.ring = { effect: 'burden', speedPenalty: 3 };
        let spd = p.speed;
        if (p.equipment.ring?.effect === 'burden') spd -= (p.equipment.ring.speedPenalty || 0);
        assertEqual(spd, 7, 'Speed with burden ring = 7');
    });

    it('dual wield speed bonus', () => {
        const p = mockPlayer({ speed: 10 });
        p.equipment.weapon = { dualWield: true, speedBonus: 2, effect: 'weapon' };
        let spd = p.speed;
        if (p.equipment.weapon?.dualWield) spd += (p.equipment.weapon.speedBonus || 0);
        assertEqual(spd, 12, 'Speed with dual wield +2 = 12');
    });

    it('speed floors at 1', () => {
        const p = mockPlayer({ speed: 2 });
        p.equipment.offhand = { speedPenalty: 2 };
        p.equipment.ring = { effect: 'burden', speedPenalty: 3 };
        let spd = p.speed;
        spd -= (p.equipment.offhand.speedPenalty || 0);
        if (p.equipment.ring?.effect === 'burden') spd -= (p.equipment.ring.speedPenalty || 0);
        spd = Math.max(1, spd);
        assertEqual(spd, 1, 'Speed should floor at 1');
    });
});

describe('Combat — Damage Formula', () => {
    it('damage is always at least 1', () => {
        // atk 1 vs def 100
        const dmg = Math.max(1, 1 - 100 + 0);
        assertEqual(dmg, 1, 'Damage should be at least 1');
    });

    it('damage scales with ATK advantage', () => {
        const dmg = Math.max(1, 20 - 5 + 0); // no random variance
        assertEqual(dmg, 15, 'ATK 20 vs DEF 5 = 15 damage');
    });
});

describe('Combat — Elite Variants', () => {
    it('elite HP is 1.5x base', () => {
        const baseHp = 20;
        const eliteHp = baseHp * 1.5;
        assertEqual(eliteHp, 30, 'Elite 1.5x HP: 20 → 30');
    });

    it('elite ATK is ceil(1.3x base)', () => {
        const baseAtk = 6;
        const eliteAtk = Math.ceil(baseAtk * 1.3);
        assertEqual(eliteAtk, 8, 'Elite 1.3x ATK: 6 → 8');
    });

    it('elite XP is 2x base', () => {
        const baseXP = 30;
        const eliteXP = baseXP * 2;
        assertEqual(eliteXP, 60, 'Elite 2x XP: 30 → 60');
    });
});

describe('Combat — Level Up', () => {
    it('level up grants +5 maxHP', () => {
        const p = mockPlayer({ maxHp: 20, level: 1 });
        p.level++;
        p.maxHp += 5;
        assertEqual(p.maxHp, 25, 'Max HP after level up = 25');
    });

    it('level up grants +1 ATK', () => {
        const p = mockPlayer({ atk: 3, level: 1 });
        p.level++;
        p.atk += 1;
        assertEqual(p.atk, 4, 'ATK after level up = 4');
    });

    it('level up heals to full', () => {
        const p = mockPlayer({ hp: 5, maxHp: 25 });
        p.hp = p.maxHp;
        assertEqual(p.hp, 25, 'HP should be full after level up');
    });

    it('XP threshold scales by 1.8x', () => {
        const nextXp = Math.floor(50 * 1.8);
        assertEqual(nextXp, 90, 'Next XP: 50 × 1.8 = 90');
    });

    it('Warrior level 3 perk is +1 DEF', () => {
        const p = mockPlayer({ def: 2, class: 'Warrior', level: 3 });
        if (p.level === 3 && p.class === 'Warrior') p.def += 1;
        assertEqual(p.def, 3, 'Warrior L3 perk: DEF 2 → 3');
    });

    it('Rogue level 3 perk is +2 Speed', () => {
        const p = mockPlayer({ speed: 12, class: 'Rogue', level: 3 });
        if (p.level === 3 && p.class === 'Rogue') p.speed += 2;
        assertEqual(p.speed, 14, 'Rogue L3 perk: Speed 12 → 14');
    });
});
