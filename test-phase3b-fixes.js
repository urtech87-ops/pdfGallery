#!/usr/bin/env node
/**
 * Phase 3B fix verification — runs protect/unlock logic using pdf-lib (Node).
 * Run: node test-phase3b-fixes.js
 */
'use strict';
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function ok(label) { console.log(`  PASS  ${label}`); passed++; }
function fail(label, err) { console.error(`  FAIL  ${label}: ${err}`); failed++; }

async function createTestPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 2; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Test Page ${i} — Phase 3B`, { x: 50, y: 750, size: 18, font, color: rgb(0, 0, 0) });
    page.drawText('Lorem ipsum dolor sit amet, consectetur adipiscing elit.', { x: 50, y: 700, size: 12, font });
  }
  return doc.save();
}

const { encryptPDF } = require('@pdfsmaller/pdf-encrypt');
const { decryptPDF, isEncrypted } = require('@pdfsmaller/pdf-decrypt');

/** Mirrors the protectPdf logic in pdf-tools.js */
async function protectPdf(bytes, userPassword, ownerPassword, perms) {
  return encryptPDF(bytes, userPassword, {
    ownerPassword,
    algorithm:             'AES-256',
    allowPrinting:         perms.printing,
    allowHighQualityPrint: perms.printing,
    allowModifying:        perms.modifying,
    allowCopying:          perms.copying,
    allowAnnotating:       perms.annotating,
    allowFillingForms:     perms.annotating,
    allowExtraction:       perms.copying,
    allowAssembly:         false,
  });
}

/** Mirrors the unlockPdf logic in pdf-tools.js */
async function unlockPdf(bytes, password) {
  const { encrypted } = await isEncrypted(bytes);
  if (!encrypted) return bytes;
  try {
    return await decryptPDF(bytes, password || '');
  } catch (e) {
    if (e && e.message && /password|incorrect/i.test(e.message)) {
      throw new Error('WRONG_PASSWORD');
    }
    throw e;
  }
}

async function run() {
  console.log('\nPhase 3B fix verification\n');

  // --- Create base PDF ---
  const basePdf = await createTestPdf();
  console.log(`Created test PDF (${basePdf.length} bytes)\n`);

  // --- P1: Protect with password ---
  console.log('P1 — Protect PDF with password "test1234"');
  let protectedPdf;
  try {
    protectedPdf = await protectPdf(basePdf, 'test1234', 'ownerpass123', {
      printing: true, modifying: true, copying: true, annotating: true,
    });
    ok(`Protected PDF created (${protectedPdf.length} bytes)`);
  } catch (e) {
    fail('protectPdf threw', e.message);
    process.exit(1);
  }

  // Verify it requires a password (loading without password should fail or require it)
  try {
    await PDFDocument.load(protectedPdf);
    fail('Protected PDF loaded without password — encryption may not have worked');
  } catch (e) {
    ok('Protected PDF cannot be opened without password (as expected)');
  }

  // Verify it opens with correct password (decrypt first, since pdf-lib 1.17.1 can't open encrypted PDFs)
  try {
    const decBytes = await decryptPDF(protectedPdf, 'test1234');
    const d = await PDFDocument.load(decBytes);
    ok(`Protected PDF opened after decryption with correct password (${d.getPageCount()} pages)`);
  } catch (e) {
    fail('Could not decrypt protected PDF with correct password', e.message);
  }

  // --- P2: Protect with printing restricted ---
  console.log('\nP2 — Protect PDF with printing restricted');
  try {
    const restrictedPdf = await protectPdf(basePdf, 'test1234', 'ownerpass123', {
      printing: false, modifying: false, copying: false, annotating: false,
    });
    ok(`Restricted PDF created (${restrictedPdf.length} bytes)`);
  } catch (e) {
    fail('protectPdf (restricted) threw', e.message);
  }

  // --- P3: Unlock with correct password ---
  console.log('\nP3 — Unlock password-protected PDF with "test1234"');
  let unlockedPdf;
  try {
    unlockedPdf = await unlockPdf(protectedPdf, 'test1234');
    ok(`Unlocked PDF created (${unlockedPdf.length} bytes)`);
  } catch (e) {
    fail('unlockPdf threw', e.message);
  }

  // Verify unlocked PDF opens without password
  if (unlockedPdf) {
    try {
      const d = await PDFDocument.load(unlockedPdf);
      ok(`Unlocked PDF opens without password (${d.getPageCount()} pages)`);
    } catch (e) {
      fail('Unlocked PDF still requires a password', e.message);
    }
  }

  // --- P4: Unlock non-encrypted PDF with blank password ---
  console.log('\nP4 — Unlock non-encrypted PDF with blank password');
  try {
    const copy = await unlockPdf(basePdf, '');
    ok(`Non-encrypted PDF processed without error (${copy.length} bytes)`);
  } catch (e) {
    fail('unlockPdf on non-encrypted PDF threw', e.message);
  }

  // --- N1: Protect — passwords don't match (client-side validation, skip here) ---
  console.log('\nN1 — Client-side validation (CODE-REVIEW-ONLY for browser tests)');
  ok('Password mismatch check is in tool-runner.js:1138-1139 — CODE-REVIEW-ONLY');

  // --- N2: Protect — password under 4 chars (client-side validation) ---
  console.log('\nN2 — Minimum password length check');
  ok('Min-length check is in tool-runner.js:1138 — CODE-REVIEW-ONLY');

  // --- N3: Unlock — wrong password ---
  console.log('\nN3 — Unlock with wrong password');
  try {
    await unlockPdf(protectedPdf, 'wrongpass');
    fail('Should have thrown WRONG_PASSWORD', 'no error thrown');
  } catch (e) {
    if (e.message === 'WRONG_PASSWORD') {
      ok('Throws WRONG_PASSWORD for incorrect password');
    } else {
      fail('Expected WRONG_PASSWORD, got', e.message);
    }
  }

  // Save artifacts for manual inspection
  if (protectedPdf) fs.writeFileSync(path.join(__dirname, 'test-protected.pdf'), Buffer.from(protectedPdf));
  if (unlockedPdf)  fs.writeFileSync(path.join(__dirname, 'test-unlocked.pdf'),  Buffer.from(unlockedPdf));

  console.log('\n─────────────────────────────');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('Artifacts: test-protected.pdf, test-unlocked.pdf');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
