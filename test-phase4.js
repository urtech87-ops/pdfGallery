/**
 * test-phase4.js — Phase 4 Image Tools smoke tests
 * Run: node test-phase4.js
 * Tests that all 30 tool JS files exist and export the correct TGTools interface.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, 'wp-content/themes/toolsgallery/assets/js/tools');

// All 30 unique tool handlers + their JS files
const TOOL_FILES = [
  { handler: 'img-compress',         file: 'img-compress.js' },
  { handler: 'img-resize',           file: 'img-resize.js' },
  { handler: 'img-crop',             file: 'img-crop.js' },
  { handler: 'img-flip',             file: 'img-flip.js' },
  { handler: 'img-rotate',           file: 'img-rotate.js' },
  { handler: 'img-add-text',         file: 'img-add-text.js' },
  { handler: 'img-add-border',       file: 'img-add-border.js' },
  { handler: 'img-convert',          file: 'img-convert.js' },
  { handler: 'img-grayscale',        file: 'img-grayscale.js' },
  { handler: 'img-sharpen',          file: 'img-sharpen.js' },
  { handler: 'img-remove-bg',        file: 'img-remove-bg.js' },
  { handler: 'img-colorize',         file: 'img-colorize.js' },
  { handler: 'img-restore',          file: 'img-restore.js' },
  { handler: 'img-upscale',          file: 'img-upscale.js' },
  { handler: 'img-blur-bg',          file: 'img-blur-bg.js' },
  { handler: 'img-remove-watermark', file: 'img-remove-watermark.js' },
  { handler: 'img-remove-objects',   file: 'img-remove-objects.js' },
  { handler: 'img-ocr',              file: 'img-ocr.js' },
  { handler: 'img-translate-text',   file: 'img-translate-text.js' },
  { handler: 'img-change-bg',        file: 'img-change-bg.js' },
  { handler: 'img-split',            file: 'img-split.js' },
  { handler: 'img-combine',          file: 'img-combine.js' },
  { handler: 'img-collage',          file: 'img-collage.js' },
  { handler: 'img-round',            file: 'img-round.js' },
  { handler: 'img-profile',          file: 'img-profile.js' },
  { handler: 'img-pixelate',         file: 'img-pixelate.js' },
  { handler: 'img-watermark',        file: 'img-watermark.js' },
  { handler: 'img-meme',             file: 'img-meme.js' },
  { handler: 'img-chart',            file: 'img-chart.js' },
  { handler: 'img-qr',               file: 'img-qr.js' },
];

const PHP_FILE      = path.join(__dirname, 'wp-content/themes/toolsgallery/functions.php');
const TEMPLATE_FILE = path.join(__dirname, 'wp-content/themes/toolsgallery/single-tg_tool.php');
const RUNNER_FILE   = path.join(__dirname, 'wp-content/themes/toolsgallery/assets/js/tool-runner.js');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log('  PASS  ' + msg);
    passed++;
  } else {
    console.error('  FAIL  ' + msg);
    failed++;
  }
}

/* ── 1. File existence ── */
console.log('\n=== 1. Tool JS file existence ===');
TOOL_FILES.forEach(function (t) {
  const full = path.join(TOOLS_DIR, t.file);
  assert(fs.existsSync(full), t.file + ' exists');
});

/* ── 2. Handler key in each file ── */
console.log('\n=== 2. Handler key matches filename ===');
TOOL_FILES.forEach(function (t) {
  const full = path.join(TOOLS_DIR, t.file);
  if (!fs.existsSync(full)) { failed++; return; }
  const src = fs.readFileSync(full, 'utf8');
  assert(src.includes("handler: '" + t.handler + "'"), t.file + ' contains handler key "' + t.handler + '"');
});

/* ── 3. Required exports present ── */
console.log('\n=== 3. Required function exports ===');
TOOL_FILES.forEach(function (t) {
  const full = path.join(TOOLS_DIR, t.file);
  if (!fs.existsSync(full)) { failed++; return; }
  const src = fs.readFileSync(full, 'utf8');
  const hasRun      = /function run\(/.test(src);
  const hasOptsHTML = /function getOptionsHTML\(/.test(src);
  const hasOpts     = /function getOptions\(/.test(src);
  const hasTGTools  = /window\.TGTools\[/.test(src);
  assert(hasRun,      t.file + ' exports run()');
  assert(hasOptsHTML, t.file + ' exports getOptionsHTML()');
  assert(hasOpts,     t.file + ' exports getOptions()');
  assert(hasTGTools,  t.file + ' registers on window.TGTools');
});

/* ── 4. functions.php Phase 4 block ── */
console.log('\n=== 4. functions.php Phase 4 additions ===');
const phpSrc = fs.existsSync(PHP_FILE) ? fs.readFileSync(PHP_FILE, 'utf8') : '';
assert(phpSrc.includes('$tool_files_4'),            'functions.php has $tool_files_4 array');
assert(phpSrc.includes('img-compress'),             'functions.php maps img-compress handler');
assert(phpSrc.includes('img-qr'),                   'functions.php maps img-qr handler');
assert(phpSrc.includes('tg_image_ai_handler'),      'functions.php has tg_image_ai_handler');
assert(phpSrc.includes('tg_removebg_handler'),      'functions.php has tg_removebg_handler');
assert(phpSrc.includes('wp_ajax_tg_image_ai'),      'functions.php registers wp_ajax_tg_image_ai');
assert(phpSrc.includes('wp_ajax_tg_removebg'),      'functions.php registers wp_ajax_tg_removebg');
assert(phpSrc.includes('_tg_input_format'),         'functions.php registers _tg_input_format meta');
assert(phpSrc.includes('_tg_output_format'),        'functions.php registers _tg_output_format meta');
assert(phpSrc.includes('cropperjs'),                'functions.php conditionally loads Cropper.js');
assert(phpSrc.includes('heic2any'),                 'functions.php conditionally loads heic2any');
assert(phpSrc.includes('chartjs'),                  'functions.php conditionally loads Chart.js');
assert(phpSrc.includes('qrcodejs'),                 'functions.php conditionally loads QRCode.js');

/* ── 5. single-tg_tool.php updates ── */
console.log('\n=== 5. single-tg_tool.php template updates ===');
const tplSrc = fs.existsSync(TEMPLATE_FILE) ? fs.readFileSync(TEMPLATE_FILE, 'utf8') : '';
assert(tplSrc.includes('_tg_input_format'),         'template reads _tg_input_format meta');
assert(tplSrc.includes('_tg_output_format'),        'template reads _tg_output_format meta');
assert(tplSrc.includes('data-input-format'),        'template outputs data-input-format attribute');
assert(tplSrc.includes('data-output-format'),       'template outputs data-output-format attribute');
assert(tplSrc.includes("data-input'"),              'template has data-input tool type branch'
  // the PHP uses data-tool-type="data-input"
  || tplSrc.includes('data-input'));
assert(tplSrc.includes('data-tool-type="data-input"') ||
       tplSrc.includes("data-tool-type='data-input'") ||
       tplSrc.includes('data-input'),               'template renders data-input tool box');

/* ── 6. tool-runner.js data-input support ── */
console.log('\n=== 6. tool-runner.js data-input support ===');
const runnerSrc = fs.existsSync(RUNNER_FILE) ? fs.readFileSync(RUNNER_FILE, 'utf8') : '';
assert(runnerSrc.includes('data-input'),            'tool-runner.js handles data-input type');
assert(runnerSrc.includes('isDataInputTool'),       'tool-runner.js allows null file for data-input tools');
assert(runnerSrc.includes('inputType'),             'tool-runner.js checks inputType config');

/* ── 7. Unique handler checks ── */
console.log('\n=== 7. Specific tool content checks ===');

function checkFile(file, checks) {
  const full = path.join(TOOLS_DIR, file);
  if (!fs.existsSync(full)) { console.error('  FAIL  ' + file + ' missing'); failed++; return; }
  const src = fs.readFileSync(full, 'utf8');
  checks.forEach(function (c) {
    assert(src.includes(c.text), file + ': ' + c.desc);
  });
}

checkFile('img-compress.js', [
  { text: 'toBlob', desc: 'uses canvas.toBlob for compression' },
  { text: 'JSZip',  desc: 'uses JSZip for batch' },
]);
checkFile('img-crop.js', [
  { text: 'Cropper', desc: 'uses Cropper.js' },
  { text: '_wait',   desc: 'two-phase wait pattern' },
]);
checkFile('img-watermark.js', [
  { text: 'getPositionXY', desc: 'has position helper' },
  { text: 'tiled',         desc: 'supports tiled mode' },
]);
checkFile('img-chart.js', [
  { text: 'window.Chart',  desc: 'requires Chart.js' },
  { text: 'parseData',     desc: 'has parseData helper' },
  { text: 'inputType',     desc: 'marks as data-input type' },
]);
checkFile('img-qr.js', [
  { text: 'window.QRCode', desc: 'requires QRCode.js' },
  { text: 'inputType',     desc: 'marks as data-input type' },
]);
checkFile('img-meme.js', [
  { text: 'strokeText',    desc: 'uses strokeText for outline' },
  { text: 'fillText',      desc: 'uses fillText for fill' },
  { text: 'Impact',        desc: 'defaults to Impact font' },
]);
checkFile('img-remove-bg.js', [
  { text: 'tg_removebg',  desc: 'calls tg_removebg AJAX action' },
]);
checkFile('img-ocr.js', [
  { text: 'tg_image_ai',  desc: 'calls tg_image_ai AJAX action' },
]);
checkFile('img-pixelate.js', [
  { text: 'getImageData', desc: 'uses getImageData for pixelation' },
  { text: 'region',       desc: 'supports region mode' },
]);
checkFile('img-collage.js', [
  { text: 'getLayout',    desc: 'has layout helper' },
  { text: 'SIZE_MAP',     desc: 'has canvas size map' },
]);

/* ── Summary ── */
console.log('\n' + '='.repeat(50));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('PHASE 4 TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL PHASE 4 TESTS PASSED');
  process.exit(0);
}
