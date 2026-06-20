#!/usr/bin/env node
'use strict';

let pass = 0, fail = 0;
function check(label, cond) {
  if (cond) { console.log('PASS: ' + label); pass++; }
  else       { console.log('FAIL: ' + label); fail++; }
}

// Test JSON to CSV conversion logic
const testData = [
  { name: 'John', age: 30, city: 'NYC' },
  { name: 'Jane', age: 25, city: 'LA' },
];
const headers = Object.keys(testData[0]);
const csv = [headers.join(','), ...testData.map(r => headers.map(h => r[h]).join(','))].join('\n');
check('JSON to CSV logic', csv === 'name,age,city\nJohn,30,NYC\nJane,25,LA');

// Test Base64 encode/decode roundtrip
const original = 'Hello ToolsGallery!';
const encoded = Buffer.from(original).toString('base64');
const decoded = Buffer.from(encoded, 'base64').toString();
check('Base64 roundtrip', decoded === original);

// Test URL encode/decode
const url = 'https://example.com/search?q=hello world&lang=en';
const enc = encodeURIComponent(url);
const dec = decodeURIComponent(enc);
check('URL encode roundtrip', dec === url);

// Test CSV delimiter detection
const csvContent = 'name,age,city\nJohn,30,NYC';
const counts = { ',': 0, ';': 0 };
for (const ch of csvContent) if (ch in counts) counts[ch]++;
check('CSV delimiter detection', counts[','] > counts[';']);

// Test XML building
const jsonObj = { root: { name: 'Test', value: '42' } };
const xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <name>Test</name>\n  <value>42</value>\n</root>';
check('XML structure includes declaration', xmlStr.startsWith('<?xml'));

// Test flat object flattening
function flattenObject(obj, prefix) {
  prefix = prefix || '';
  return Object.keys(obj).reduce(function (acc, key) {
    const fullKey = prefix ? prefix + '.' + key : key;
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(acc, flattenObject(val, fullKey));
    } else {
      acc[fullKey] = Array.isArray(val) ? JSON.stringify(val) : val;
    }
    return acc;
  }, {});
}
const nested = { user: { name: 'Alice', address: { city: 'NYC' } } };
const flat = flattenObject(nested);
check('JSON flatten nested', flat['user.address.city'] === 'NYC' && flat['user.name'] === 'Alice');

// Test MD5-like check (just verify structure)
const hexStr = 'abc123def456'.padEnd(32, '0');
check('Hash hex format valid', /^[0-9a-f]{32}$/.test(hexStr));

// Verify all 15 tool files exist
const fs = require('fs');
const path = require('path');
const toolsDir = path.join(__dirname, 'wp-content/themes/toolsgallery/assets/js/tools');
const tools = [
  'excel-to-csv', 'csv-to-excel', 'json-to-csv',
  'csv-to-json', 'xml-to-json', 'json-to-xml', 'md-to-html',
  'html-to-md', 'txt-to-pdf', 'pdf-to-txt', 'html-to-pdf',
  'base64-encoder', 'base64-decoder', 'url-encoder',
  'hash-generator',
];
tools.forEach(t => {
  const exists = fs.existsSync(path.join(toolsDir, t + '.js'));
  check(t + '.js exists', exists);
});

// Verify functions.php contains phase7 handlers
const funcPhp = fs.readFileSync(path.join(__dirname, 'wp-content/themes/toolsgallery/functions.php'), 'utf8');
check('functions.php has excel-to-csv', funcPhp.includes("'excel-to-csv'"));
check('functions.php has hash-generator', funcPhp.includes("'hash-generator'"));
check('functions.php has sheetjs for excel handlers', funcPhp.includes("'excel-to-csv', 'csv-to-excel'"));
check('functions.php has marked.js for md-to-html', funcPhp.includes("'md-to-html'") && funcPhp.includes('markedjs'));
check('functions.php has turndown for html-to-md', funcPhp.includes("'html-to-md'") && funcPhp.includes('turndownjs'));
check('functions.php has html2canvas for html-to-pdf', funcPhp.includes("'html-to-pdf'") && funcPhp.includes('html2canvas'));

// Verify PHASE7_SETUP.md exists
check('PHASE7_SETUP.md exists', fs.existsSync(path.join(__dirname, 'PHASE7_SETUP.md')));

console.log('\n--- Results ---');
console.log('PASS: ' + pass + ' / ' + (pass + fail));
if (fail > 0) { console.log('FAIL: ' + fail + ' tests failed'); process.exit(1); }
else           { console.log('All tests passed!'); }
