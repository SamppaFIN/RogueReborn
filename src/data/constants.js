/**
 * 🌸 Rogue Reborn — Game Constants
 * Core configuration values, tile definitions, and color palette.
 */

var TILE_SIZE = 24;
var MAP_WIDTH = 70;
var MAP_HEIGHT = 50;

var CHARS = {
    WALL: '#', FLOOR: '.',
    PLAYER: '@', STAIRS_DOWN: '>', STAIRS_UP: '<',
    GOLD: '$', POTION: '!', SCROLL: '?', HELM: ']', RING: '=',
    LAVA: '~', ICE: '*', GAS: '░', TRAPDOOR: '^'
};

var COLORS = {
    DARK_WALL: '#1f2833', DARK_FLOOR: '#0b0c10',
    LIT_WALL: '#45a29e', LIT_FLOOR: '#1a1f24',
    TOWN_WALL: '#825a3d', TOWN_FLOOR: '#5c402a',
    PLAYER: '#66fcf1', STAIRS: '#f1c40f',
    GOLD: '#f1c40f', POTION: '#ff79c6', SCROLL: '#bd93f9', HELM: '#8be9fd', RING: '#ffb86c',
    GOBLIN: '#2ecc71', FIRE_HOUND: '#ff3b3b', TROLL: '#e74c3c',
    LAVA: '#e67e22', ICE: '#85c1e9', GAS: '#2ecc71', TRAPDOOR: '#888'
};

var ENERGY_THRESHOLD = 100;
var TICK_RATE = 1000 / 60; // Rendering FPS (60fps)
var HEARTBEAT_INTERVAL = 50; // Logical Tick (20 ticks per second, TomeNET style)

var ACTION_COSTS = {
    MOVE: 100,
    ATTACK: 150,
    CAST: 130,
    USE: 100,
    WAIT: 100
};

var NOISE_DECAY_RATE = 0.8; // 20% decay per heartbeat
var BASE_SENSING_RADIUS = 8;
var WAKE_THRESHOLD = 50;
var NOISE_LEVELS = {
    MOVE: 15,
    ATTACK: 45,
    CAST: 30,
    SHOUT: 80
};

var POTION_COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Clear', 'Swirling'];
var SCROLL_TITLES = ['ZELGO MER', 'FOO BAR', 'BREAD MAKES YOU FAT', 'KLAATU BARADA NIKTO', 'XYZZY', 'ABAB', 'YENDOR'];
var WAND_WOODS = ['Oak', 'Pine', 'Iron', 'Bone', 'Glass', 'Ebony', 'Ivory'];
