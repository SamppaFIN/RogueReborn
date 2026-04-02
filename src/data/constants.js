/**
 * 🌸 Rogue Reborn — Game Constants
 * Core configuration values, tile definitions, and color palette.
 */

const TILE_SIZE = 24;
const MAP_WIDTH = 70;
const MAP_HEIGHT = 50;

const CHARS = {
    WALL: '#', FLOOR: '.',
    PLAYER: '@', STAIRS_DOWN: '>', STAIRS_UP: '<',
    GOLD: '$', POTION: '!', SCROLL: '?', HELM: ']', RING: '='
};

const COLORS = {
    DARK_WALL: '#1f2833', DARK_FLOOR: '#0b0c10',
    LIT_WALL: '#45a29e', LIT_FLOOR: '#1a1f24',
    TOWN_WALL: '#825a3d', TOWN_FLOOR: '#5c402a',
    PLAYER: '#66fcf1', STAIRS: '#f1c40f',
    GOLD: '#f1c40f', POTION: '#ff79c6', SCROLL: '#bd93f9', HELM: '#8be9fd', RING: '#ffb86c',
    GOBLIN: '#2ecc71', FIRE_HOUND: '#ff3b3b', TROLL: '#e74c3c'
};

const ENERGY_THRESHOLD = 100;
const TICK_RATE = 1000 / 60; // 60 ticks per second baseline

const POTION_COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Clear', 'Swirling'];
const SCROLL_TITLES = ['ZELGO MER', 'FOO BAR', 'BREAD MAKES YOU FAT', 'KLAATU BARADA NIKTO', 'XYZZY', 'ABAB', 'YENDOR'];
const WAND_WOODS = ['Oak', 'Pine', 'Iron', 'Bone', 'Glass', 'Ebony', 'Ivory'];
