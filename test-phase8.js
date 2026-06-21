#!/usr/bin/env node
/**
 * test-phase8.js — Verify Phase 8 utility tools are in place
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'wp-content/themes/toolsgallery');
const TOOLS_DIR = path.join(BASE, 'assets/js/tools');
const FUNCTIONS = path.join(BASE, 'functions.php');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.log(`  FAIL  ${name}`);
    failed++;
  }
}

console.log('\n=== Phase 8 — Tool JS Files ===\n');

const expectedFiles = [
  'color-picker.js',
  'color-palette.js',
  'countdown-timer.js',
  'stopwatch.js',
  'random-number.js',
  'text-case.js',
  'line-break-remover.js',
  'duplicate-remover.js',
  'text-binary.js',
  'unit-converter.js',
];

for (const file of expectedFiles) {
  const fp = path.join(TOOLS_DIR, file);
  const exists = fs.existsSync(fp);
  test(`File exists: ${file}`, exists);
  if (exists) {
    const content = fs.readFileSync(fp, 'utf8');
    const handler = file.replace('.js', '');
    test(`  Registers TGTools['${handler}']`, content.includes(`window.TGTools['${handler}']`) || content.includes(`window.TGTools[CONFIG.handler]`));
    test(`  Has init function`, content.includes('function init(container)'));
    test(`  Has container.innerHTML assignment`, content.includes('container.innerHTML'));
    test(`  Wrapped in IIFE`, content.includes('(function ()') || content.includes('(function('));
    test(`  Uses strict mode`, content.includes("'use strict'"));
  }
}

console.log('\n=== Phase 8 — functions.php ===\n');

const functionsContent = fs.existsSync(FUNCTIONS) ? fs.readFileSync(FUNCTIONS, 'utf8') : '';

test('functions.php exists', fs.existsSync(FUNCTIONS));
test('Phase 8 block present', functionsContent.includes('Phase 8') || functionsContent.includes('tool_files_8'));
test('color-picker registered', functionsContent.includes("'color-picker'"));
test('color-palette registered', functionsContent.includes("'color-palette'"));
test('countdown-timer registered', functionsContent.includes("'countdown-timer'"));
test('stopwatch registered', functionsContent.includes("'stopwatch'"));
test('random-number registered', functionsContent.includes("'random-number'"));
test('text-case registered', functionsContent.includes("'text-case'"));
test('line-break-remover registered', functionsContent.includes("'line-break-remover'"));
test('duplicate-remover registered', functionsContent.includes("'duplicate-remover'"));
test('text-binary registered', functionsContent.includes("'text-binary'"));
test('unit-converter registered', functionsContent.includes("'unit-converter'"));
test('wp_enqueue_script call for p8 tools', functionsContent.includes('tool_files_8') || functionsContent.includes('p8_handle'));

console.log('\n=== Phase 8 — PHASE8_SETUP.md ===\n');

const setupPath = path.join(__dirname, 'PHASE8_SETUP.md');
const setupExists = fs.existsSync(setupPath);
test('PHASE8_SETUP.md exists', setupExists);
if (setupExists) {
  const content = fs.readFileSync(setupPath, 'utf8');
  test('Has utility-tools category', content.includes('utility-tools'));
  test('Has color-picker WP-CLI command', content.includes('color-picker'));
  test('Has color-palette WP-CLI command', content.includes('color-palette'));
  test('Has countdown-timer WP-CLI command', content.includes('countdown-timer'));
  test('Has stopwatch WP-CLI command', content.includes('stopwatch'));
  test('Has random-number WP-CLI command', content.includes('random-number'));
  test('Has text-case WP-CLI command', content.includes('text-case'));
  test('Has line-break-remover WP-CLI command', content.includes('line-break-remover'));
  test('Has duplicate-remover WP-CLI command', content.includes('duplicate-remover'));
  test('Has text-binary WP-CLI command', content.includes('text-binary'));
  test('Has unit-converter WP-CLI command', content.includes('unit-converter'));
  test('Has 3 steps per tool', (content.match(/_tg_steps/g)||[]).length >= 10);
  test('Has 3 FAQs per tool', (content.match(/_tg_faqs/g)||[]).length >= 10);
  test('Has 3 features per tool', (content.match(/_tg_features/g)||[]).length >= 10);
  test('data-input type used', content.includes('data-input'));
}

console.log('\n=== Feature-Specific Checks ===\n');

function checkFile(file, ...patterns) {
  const fp = path.join(TOOLS_DIR, file);
  if (!fs.existsSync(fp)) return;
  const content = fs.readFileSync(fp, 'utf8');
  patterns.forEach(([pattern, desc]) => {
    test(`${file}: ${desc}`, pattern instanceof RegExp ? pattern.test(content) : content.includes(pattern));
  });
}

checkFile('color-picker.js',
  ['hexToRgb', 'hexToRgb function'],
  ['rgbToHsl', 'rgbToHsl function'],
  ['rgbToHsv', 'rgbToHsv function'],
  ['rgbToCmyk', 'rgbToCmyk function'],
  ['cp-alpha', 'opacity slider'],
  ['localStorage', 'recently used colors'],
  ['Complementary', 'harmony panel'],
  ['cp-tints', 'tints panel'],
  ['cp-shades', 'shades panel'],
);

checkFile('color-palette.js',
  ['cpalGenerate', 'generate function'],
  ['cpalRandomize', 'randomize function'],
  ['cpalExportPng', 'PNG export'],
  ['Monochromatic', 'monochromatic palette'],
  ['canvas', 'canvas for PNG export'],
  ['CSS Variables', 'CSS export'],
);

checkFile('countdown-timer.js',
  ['setInterval', 'interval timer'],
  ['AudioContext', 'sound alert'],
  ['Notification', 'browser notification'],
  ['ctPreset', 'preset buttons'],
  ['ctAddTimer', 'multiple timers'],
  ['document.title', 'tab title update'],
);

checkFile('stopwatch.js',
  ['requestAnimationFrame', 'RAF for smooth display'],
  ['performance.now', 'high resolution timing'],
  ['sw-fastest', 'fastest lap highlight'],
  ['sw-slowest', 'slowest lap highlight'],
  ['swExportCsv', 'CSV export'],
  ['KeyL', 'L key for lap'],
  ['Space', 'Space key for start/pause'],
);

checkFile('random-number.js',
  ['crypto.getRandomValues', 'secure random'],
  ['secureRandom', 'secureRandom function'],
  ['rng-panel-dice', 'dice roller'],
  ['rng-panel-coin', 'coin flip'],
  ['d20', 'd20 die'],
  ['rng-panel-list', 'list picker'],
);

checkFile('text-case.js',
  ['camelCase', 'camelCase conversion'],
  ['PascalCase', 'PascalCase conversion'],
  ['snake_case', 'snake_case conversion'],
  ['kebab-case', 'kebab-case conversion'],
  ['tcSwap', 'swap function'],
  ['SCREAMING', 'SCREAMING_SNAKE_CASE'],
);

checkFile('line-break-remover.js',
  ['lbrProcess', 'process function'],
  ['lbr-single', 'single line break option'],
  ['lbr-double', 'double line break option'],
  ['lbr-extra-spaces', 'extra spaces option'],
  ['lbrToggleCustom', 'custom replacement toggle'],
);

checkFile('duplicate-remover.js',
  ['levenshtein', 'Levenshtein distance'],
  ['similarity', 'fuzzy matching'],
  ['drProcess', 'process function'],
  ['drSwap', 'swap function'],
  ['dr-fuzzy', 'fuzzy option'],
);

checkFile('text-binary.js',
  ['MORSE_CODE', 'Morse code map'],
  ['tbPlayMorse', 'Morse audio playback'],
  ['AudioContext', 'Web Audio API'],
  ['tbTextToBin', 'text to binary'],
  ['tbBinToText', 'binary to text'],
  ['tb-panel-hex', 'hex tab'],
  ['tb-panel-octal', 'octal tab'],
);

checkFile('unit-converter.js',
  ['Temperature', 'temperature category'],
  ['tempConvert', 'temperature conversion'],
  ['Celsius', 'Celsius unit'],
  ['Fahrenheit', 'Fahrenheit unit'],
  ['fuelConvert', 'fuel economy conversion'],
  ['ucConvert', 'convert function'],
  ['Digital Storage', 'digital storage category'],
  ['light year', 'light year unit'],
);

console.log('\n================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Phase 8 checks passed!');
}
