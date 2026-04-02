/**
 * 🌸 Rogue Reborn — Test Runner
 * Minimal Node.js test harness. No external dependencies.
 * Usage: node tests/run_tests.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- Minimal Test Framework ---
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let currentSuite = '';

function describe(name, fn) {
    currentSuite = name;
    console.log(`\n📦 ${name}`);
    fn();
}

function it(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failedTests++;
        console.log(`  ❌ ${name}`);
        console.log(`     → ${e.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertGreater(actual, expected, message) {
    if (!(actual > expected)) {
        throw new Error(message || `Expected ${actual} > ${expected}`);
    }
}

function assertIncludes(arr, item, message) {
    if (!arr.includes(item)) {
        throw new Error(message || `Expected array to include ${item}`);
    }
}

// --- Load Game Code in Sandbox ---
function loadGameContext() {
    // Create a mock DOM/browser environment
    const mockContext = {
        document: {
            getElementById: () => ({ 
                classList: { add: () => {}, remove: () => {} },
                innerHTML: '', innerText: '', style: {},
                clientWidth: 800, clientHeight: 600,
                querySelectorAll: () => [],
                appendChild: () => {},
                scrollTop: 0, scrollHeight: 0,
                children: { length: 0 },
                removeChild: () => {}
            }),
            createElement: () => ({ className: '', innerText: '', style: {} }),
            querySelectorAll: () => []
        },
        window: { addEventListener: () => {}, onload: null },
        localStorage: { getItem: () => null, setItem: () => {} },
        requestAnimationFrame: () => {},
        performance: { now: () => 0 },
        setTimeout: () => {},
        console: console,
        Math: Math,
        Set: Set,
        Infinity: Infinity,
        parseInt: parseInt,
        parseFloat: parseFloat,
        JSON: JSON,
        Object: Object,
        Array: Array,
        Map: Map
    };

    const context = vm.createContext(mockContext);

    // Load files in order
    const files = [
        'src/data/constants.js',
        'src/data/enemies.js',
        'src/data/items.js'
    ];

    const root = path.resolve(__dirname, '..');
    for (const file of files) {
        const code = fs.readFileSync(path.join(root, file), 'utf8');
        // Node VM doesn't expose top-level 'const' to the context object directly.
        // We evaluate and then explicitly extract known global variables.
        vm.runInContext(code, context, { filename: file });
        
        if (file.includes('constants.js')) {
            context.TILE_SIZE = vm.runInContext('TILE_SIZE', context);
            context.MAP_WIDTH = vm.runInContext('MAP_WIDTH', context);
            context.MAP_HEIGHT = vm.runInContext('MAP_HEIGHT', context);
            context.CHARS = vm.runInContext('CHARS', context);
            context.COLORS = vm.runInContext('COLORS', context);
            context.ENERGY_THRESHOLD = vm.runInContext('ENERGY_THRESHOLD', context);
        }
        if (file.includes('enemies.js')) {
            context.ENEMY_TYPES = vm.runInContext('ENEMY_TYPES', context);
        }
        if (file.includes('items.js')) {
            context.ITEM_DB = vm.runInContext('ITEM_DB', context);
        }
    }

    return context;
}

// --- Run Test Suites ---
console.log('🌸 Rogue Reborn — Test Suite');
console.log('═'.repeat(50));

const ctx = loadGameContext();

// Load test files
const testFiles = [
    'tests/test_data.js',
    'tests/test_combat.js',
    'tests/test_world.js'
];

const root = path.resolve(__dirname, '..');
for (const tf of testFiles) {
    const fullPath = path.join(root, tf);
    if (fs.existsSync(fullPath)) {
        // Execute test file with our framework functions available
        const testCode = fs.readFileSync(fullPath, 'utf8');
        const testFn = new Function('describe', 'it', 'assert', 'assertEqual', 'assertGreater', 'assertIncludes', 'ctx', testCode);
        testFn(describe, it, assert, assertEqual, assertGreater, assertIncludes, ctx);
    } else {
        console.log(`\n⚠️  Missing: ${tf}`);
    }
}

// --- Summary ---
console.log('\n' + '═'.repeat(50));
console.log(`📊 Results: ${passedTests}/${totalTests} passed, ${failedTests} failed`);
if (failedTests > 0) {
    console.log('💔 Some tests failed!');
    process.exit(1);
} else {
    console.log('🌸 All tests passed!');
    process.exit(0);
}
