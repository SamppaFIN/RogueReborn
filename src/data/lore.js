/**
 * 🌸 Rogue Reborn — Lore Fragment Database
 * Phase V: Environmental storytelling through dungeon discoveries.
 * These fragments are found at Lore Altars (special dungeon tiles) or unlocked by quests.
 */

const LORE_FRAGMENTS = {
    // Main Arc lore unlocks
    lore_inscription_1: {
        title: "The First Inscription",
        text: "Carved deep into the stone: 'We delved too greedily. The fire below answered. — Last words of the Miners\' Guild'",
        color: '#f1c40f'
    },
    lore_earendil: {
        title: "The Legend of Eärendil",
        text: "King Eärendil wielded the Crown of Kings and the spear Aeglos. With them, he bound the Balrog in chains of light. But the chains are weakening...",
        color: '#3498db'
    },
    lore_binding: {
        title: "The Binding Scroll",
        text: "To weaken the ancient fire: 'Speak the name of the mountain. Strike with cold iron. The beast shall falter.' The Balrog can be wounded, but only by those who know.",
        color: '#9b59b6'
    },
    lore_dragon_guard: {
        title: "The Dragon Sentinels",
        text: "The Dragons do not serve willingly. They are bound by the same ancient magic that holds the Balrog. When the master falls, they too shall be freed.",
        color: '#e67e22'
    },
    lore_victory: {
        title: "The End of Darkness",
        text: "With the Balrog destroyed, light returns to the deep places of the world. The mines can be reclaimed. But somewhere, in the deepest dark, something else stirs...",
        color: '#2ecc71'
    },

    // Random dungeon lore (found at altars)
    lore_miners: {
        title: "Miner's Journal",
        text: "Day 47: We found something. A cavern of purple crystal. Beautiful. Day 48: The crystal hums at night. Day 49: Thorin didn't come back from the lower shaft.",
        color: '#bdc3c7'
    },
    lore_wizard_warning: {
        title: "A Wizard's Warning",
        text: "To whoever reads this: do NOT open the sealed vaults without preparation. The guardians inside are bound to protect their charge unto death.",
        color: '#9b59b6'
    },
    lore_old_hero: {
        title: "The Nameless Hero",
        text: "Before you, there was another. A warrior who descended alone into the dark. She reached Floor 12 before the Mimics took her. Her sword, Ringil, was never recovered.",
        color: '#3498db'
    },
    lore_orc_tribes: {
        title: "Orcish War-Chant",
        text: "'BLOOD FOR THE DEEP! BONES FOR THE FIRE! THE BIG ONE SLEEPS BUT WE KEEP WATCH!' Crude orcish glyphs surround these words.",
        color: '#27ae60'
    },
    lore_ancient_map: {
        title: "Fragment of an Ancient Map",
        text: "The faded parchment shows pathways deeper than any known dungeon level. A note in the margin reads: 'The Abyss has no bottom.'",
        color: '#e67e22'
    },
    lore_balrog_origin: {
        title: "On the Nature of Balrogs",
        text: "They were not always creatures of flame. Once, they were architects — builders of the great underground cities. Corruption twisted them into living fire.",
        color: '#c0392b'
    },
    lore_town_history: {
        title: "Town Charter",
        text: "This town was founded by the survivors of the Great Collapse, when the mines fell to darkness. The dungeon entrance was sealed for 300 years. Until now.",
        color: '#f39c12'
    },
    lore_alchemy_notes: {
        title: "Alchemist's Secret Notes",
        text: "BREAKTHROUGH: Mimic tissue, when dissolved in moonwater, produces a potent regeneration compound. If only I could harvest enough without being eaten...",
        color: '#2ecc71'
    },
    // Phase VI — Round 6: New Lore Fragments
    lore_frost_wolves: {
        title: "The Frost Wolf Pack",
        text: "They came from the frozen north when the mines opened. The cold air rising from the depths drew them in. Now they hunt in packs, their howls echoing through caverns of ice.",
        color: '#85c1e9'
    },
    lore_golem_makers: {
        title: "The Golem Forge",
        text: "The dwarves built Iron Golems to guard their deepest vaults. When the dwarves fell, the Golems kept patrolling. They will forever guard treasures whose owners turned to dust.",
        color: '#aab7b8'
    },
    lore_hydra_lair: {
        title: "Warning: Hydra Nesting Ground",
        text: "DANGER — Multiple heads, multiple deaths. The Hydra regenerates if you don't kill it fast. Use fire or ice to seal the wounds. DO NOT ENGAGE ALONE.",
        color: '#1abc9c'
    },
    lore_wyvern_riders: {
        title: "The Wyvern Riders",
        text: "Once, an order of knights rode Wyverns into battle against the Dragon hordes. The last rider fell here, his mount gone feral. Their poison is slow but certain.",
        color: '#16a085'
    },
    lore_demon_gate: {
        title: "The Demon Gate",
        text: "This inscription is burned into the stone: 'WHEN THE BALROG FALLS, THE GATE OPENS. WHAT COMES AFTER IS WORSE.' Someone has tried to scratch it out.",
        color: '#c0392b'
    },
    lore_wyrm_prophecy: {
        title: "The Wyrm Prophecy",
        text: "And in the deepest dark, the Ancient Wyrm sleeps. Older than the Balrog. Older than the mountains. When it wakes, fire and shadow will be as children before it.",
        color: '#f39c12'
    }
};

// Pool of random lore keys for dungeon altar spawning
const RANDOM_LORE_POOL = [
    'lore_miners', 'lore_wizard_warning', 'lore_old_hero', 'lore_orc_tribes',
    'lore_ancient_map', 'lore_balrog_origin', 'lore_town_history', 'lore_alchemy_notes',
    'lore_frost_wolves', 'lore_golem_makers', 'lore_hydra_lair', 'lore_wyvern_riders',
    'lore_demon_gate', 'lore_wyrm_prophecy'
];
