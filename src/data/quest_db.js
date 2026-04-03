/**
 * 🌸 Rogue Reborn — Quest Database
 * Phase V: Main Arc + Side Quests + Dynamic Bounties
 *
 * Quest States: LOCKED → AVAILABLE → ACTIVE → COMPLETE → REWARDED
 */

const MAIN_ARC = [
    {
        id: 'arc_1_whispers',
        title: 'Whispers in the Dark',
        description: 'The Mayor speaks of ancient tremors beneath the town. Descend to Floor 3 and find the First Inscription.',
        type: 'reach_floor',
        target: 3,
        giver: 'mayor',
        rewards: { xp: 100, gold: 200, skillPoints: 1 },
        dialogue: {
            offer: "Hero, the earth trembles. Something ancient stirs below. Explore the dungeon to Floor 3 — find the inscription on the walls.",
            progress: "Have you reached the third level? The tremors grow stronger...",
            complete: "You found it! The inscription speaks of 'The Sleeper Below'. This is grave news indeed."
        },
        loreUnlock: 'lore_inscription_1',
        nextQuest: 'arc_2_fragment'
    },
    {
        id: 'arc_2_fragment',
        title: "The King's Fragment",
        description: 'An ancient scroll mentions the Shard of Eärendil. It lies guarded on Floor 6.',
        type: 'reach_floor',
        target: 6,
        giver: 'wizard',
        rewards: { xp: 250, gold: 400, skillPoints: 1, item: 'Potion of Greater Healing' },
        dialogue: {
            offer: "The inscription you found... I've seen these runes before. They speak of a shard — a fragment of King Eärendil's crown. It fell to the depths long ago. You must descend to Floor 6.",
            progress: "The shard resonates with ancient power. Keep descending.",
            complete: "Remarkable! The shard pulses with light. It confirms the legend — the Balrog was imprisoned by Eärendil himself."
        },
        loreUnlock: 'lore_earendil',
        nextQuest: 'arc_3_vault'
    },
    {
        id: 'arc_3_vault',
        title: 'The Sealed Vault',
        description: 'Find and open a Dungeon Vault. The Wizard believes one holds the Binding Scroll.',
        type: 'open_vault',
        target: 1,
        giver: 'wizard',
        rewards: { xp: 400, gold: 600, skillPoints: 1 },
        dialogue: {
            offer: "There are ancient vaults sealed with magic in the deep. One of them holds the Binding Scroll — the key to weakening the Balrog. Find a vault and open it.",
            progress: "The vaults are protected by powerful guardians. Be careful.",
            complete: "The Binding Scroll! With this knowledge, the Balrog can be weakened before the final confrontation."
        },
        loreUnlock: 'lore_binding',
        nextQuest: 'arc_4_dragon'
    },
    {
        id: 'arc_4_dragon',
        title: 'The Dragon Guardian',
        description: 'Slay a Dragon. They serve as the outer sentinels of the Balrog.',
        type: 'kill',
        target: 'Dragon',
        count: 1,
        giver: 'trainer',
        rewards: { xp: 600, gold: 1000, skillPoints: 2 },
        dialogue: {
            offer: "Before you face the Balrog, you must prove your worth. The Dragons that guard the deep passages are its sentinels. Slay one.",
            progress: "The Dragons are fierce. Train well before you face one.",
            complete: "You've slain a Dragon! You are truly ready for what lies below."
        },
        loreUnlock: 'lore_dragon_guard',
        nextQuest: 'arc_5_balrog'
    },
    {
        id: 'arc_5_balrog',
        title: 'The Sleeper Awakens',
        description: 'Descend to the deepest depths and destroy the Balrog. End the ancient evil.',
        type: 'kill',
        target: 'Balrog',
        count: 1,
        giver: 'mayor',
        rewards: { xp: 2000, gold: 5000, skillPoints: 3 },
        dialogue: {
            offer: "The time has come. The Binding Scroll will weaken it. The Dragon sentinels are slain. Now — descend and destroy the Balrog. Save us all.",
            progress: "The fate of the world rests on your shoulders. Go!",
            complete: "YOU HAVE DONE IT! The Balrog is destroyed! The kingdom is saved! Your name will echo through the ages!"
        },
        loreUnlock: 'lore_victory',
        nextQuest: null
    }
];

const SIDE_QUESTS = [
    {
        id: 'side_ratcatcher',
        title: 'The Rat Problem',
        description: 'Kill 5 Rats to clear the town entrance.',
        type: 'kill',
        target: 'Rat',
        count: 5,
        giver: 'mayor',
        repeatable: false,
        minFloor: 0,
        rewards: { xp: 30, gold: 50 },
        dialogue: {
            offer: "Rats infest the dungeon entrance. Clear out 5 of them.",
            complete: "Excellent work! The entrance is safer now."
        }
    },
    {
        id: 'side_spider_silk',
        title: 'Spider Silk Harvest',
        description: 'Kill 3 Giant Spiders and collect their silk.',
        type: 'kill',
        target: 'Giant Spider',
        count: 3,
        giver: 'alchemist',
        repeatable: false,
        minFloor: 2,
        rewards: { xp: 60, gold: 120, item: 'Potion of Regeneration' },
        dialogue: {
            offer: "I need Giant Spider silk for my potions. Kill 3 of them.",
            complete: "Perfect silk! Here, take this potion as thanks."
        }
    },
    {
        id: 'side_undead_purge',
        title: 'Purge the Undead',
        description: 'Destroy 3 Skeletons and 2 Wraiths.',
        type: 'kill_multi',
        targets: [{ name: 'Skeleton', count: 3 }, { name: 'Wraith', count: 2 }],
        giver: 'healer',
        repeatable: false,
        minFloor: 4,
        rewards: { xp: 150, gold: 300, skillPoints: 1 },
        dialogue: {
            offer: "The undead grow restless. Purge 3 Skeletons and 2 Wraiths from the dungeon.",
            complete: "The dead rest once more. Bless you, hero."
        }
    },
    {
        id: 'side_deep_explorer',
        title: 'Deep Explorer',
        description: 'Reach Floor 10 of the dungeon.',
        type: 'reach_floor',
        target: 10,
        giver: 'cartographer',
        repeatable: false,
        minFloor: 5,
        rewards: { xp: 300, gold: 500, skillPoints: 1 },
        dialogue: {
            offer: "I've mapped up to Floor 9... but I need data from Floor 10. Reach it for me.",
            complete: "Incredible! The depths are more vast than I imagined. Here's your payment."
        }
    },
    {
        id: 'side_vault_raider',
        title: 'Vault Raider',
        description: 'Open 3 Dungeon Vaults.',
        type: 'open_vault',
        target: 3,
        giver: 'guildhall',
        repeatable: false,
        minFloor: 3,
        rewards: { xp: 400, gold: 800, skillPoints: 1 },
        dialogue: {
            offer: "The Guild values daring. Open 3 of those ancient vaults in the deep.",
            complete: "Three vaults! You're a legend of the Guild now."
        }
    },
    // Phase VI — New Side Quests
    {
        id: 'side_frost_hunt',
        title: 'Frost Wolf Hunt',
        description: 'Kill 4 Frost Wolves that threaten the trade routes.',
        type: 'kill',
        target: 'Frost Wolf',
        count: 4,
        giver: 'mayor',
        repeatable: false,
        minFloor: 3,
        rewards: { xp: 80, gold: 200, item: 'Potion of Frost Resistance' },
        dialogue: {
            offer: "Frost Wolves are attacking merchants on the lower roads. Kill 4 of them.",
            complete: "The trade routes are safe again. Take this frost ward."
        }
    },
    {
        id: 'side_golem_breaker',
        title: 'Golem Breaker',
        description: 'Destroy 2 Iron Golems in the deep vaults.',
        type: 'kill',
        target: 'Iron Golem',
        count: 2,
        giver: 'trainer',
        repeatable: false,
        minFloor: 6,
        rewards: { xp: 250, gold: 500, skillPoints: 1 },
        dialogue: {
            offer: "The ancient Golems guard treasures we need. Break through 2 of them.",
            complete: "Incredible strength! Here — you've earned this."
        }
    },
    {
        id: 'side_wyvern_legacy',
        title: "Wyvern Rider's Legacy",
        description: 'Slay a Wyvern and recover its venom sac.',
        type: 'kill',
        target: 'Wyvern',
        count: 1,
        giver: 'alchemist',
        repeatable: false,
        minFloor: 6,
        rewards: { xp: 200, gold: 400, item: 'Potion of Greater Healing' },
        dialogue: {
            offer: "Wyvern venom is incredibly valuable for my potions. Slay one and bring me its sac.",
            complete: "This venom is pure! I can make wonders with this."
        }
    },
    {
        id: 'side_demon_hunter',
        title: 'Demon Hunter',
        description: 'Destroy a Demon Lord.',
        type: 'kill',
        target: 'Demon Lord',
        count: 1,
        giver: 'wizard',
        repeatable: false,
        minFloor: 8,
        rewards: { xp: 500, gold: 1000, skillPoints: 2 },
        dialogue: {
            offer: "A Demon Lord has been sighted in the deep. It must be destroyed before it opens a portal.",
            complete: "The demon is banished! You've prevented a catastrophe."
        }
    },
    {
        id: 'side_wyrm_seeker',
        title: 'Wyrm Seeker',
        description: 'Reach Floor 13 where the Ancient Wyrm dwells.',
        type: 'reach_floor',
        target: 13,
        giver: 'cartographer',
        repeatable: false,
        minFloor: 10,
        rewards: { xp: 600, gold: 1200, skillPoints: 2 },
        dialogue: {
            offer: "The prophecy speaks of Floor 13. I need someone brave enough to confirm it exists.",
            complete: "Floor 13 is real... The Wyrm Prophecy is true. We must prepare."
        }
    }
];
