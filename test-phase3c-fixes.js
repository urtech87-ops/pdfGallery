// Phase 3C fixes verification test
const fs = require('fs');

// Test 1: Verify docx library works
async function testDocx() {
  try {
    const docx = require('docx');
    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: [
          new docx.Paragraph({
            children: [new docx.TextRun({ text: 'Test content' })]
          })
        ]
      }]
    });
    const buf = await docx.Packer.toBuffer(doc);
    if (buf.length > 0) {
      console.log('PASS: docx library works, size:', buf.length);
    } else {
      console.log('FAIL: docx returned empty buffer');
    }
  } catch (e) {
    console.log('FAIL: docx error:', e.message);
  }
}

// Test 2: Verify functions.php contains required keys
const functionsPhp = fs.readFileSync(
  'wp-content/themes/toolsgallery/functions.php', 'utf8'
);

if (functionsPhp.includes("'pdf-summarize'")) {
  console.log('PASS: pdf-summarize prompt exists in functions.php');
} else {
  console.log('FAIL: pdf-summarize prompt missing from functions.php');
}

if (functionsPhp.includes("'pdf-translate'")) {
  console.log('PASS: pdf-translate prompt exists');
} else {
  console.log('FAIL: pdf-translate prompt missing');
}

if (functionsPhp.includes('html2canvas')) {
  console.log('PASS: html2canvas enqueued for url-to-pdf');
} else {
  console.log('FAIL: html2canvas not found in functions.php');
}

if (functionsPhp.includes('unpkg.com/docx')) {
  console.log('PASS: docx CDN uses unpkg');
} else {
  console.log('FAIL: docx CDN not updated to unpkg');
}

if (functionsPhp.includes('jsdelivr.net/npm/pptxgenjs')) {
  console.log('PASS: PptxGenJS CDN uses jsdelivr');
} else {
  console.log('FAIL: PptxGenJS CDN not updated');
}

if (functionsPhp.includes("'{length}'")) {
  console.log('PASS: {length} placeholder handled in functions.php');
} else {
  console.log('FAIL: {length} placeholder missing from functions.php');
}

// Test 3: Verify pdf-to-word.js exists
if (fs.existsSync('wp-content/themes/toolsgallery/assets/js/tools/pdf-to-word.js')) {
  const pdftw = fs.readFileSync('wp-content/themes/toolsgallery/assets/js/tools/pdf-to-word.js', 'utf8');
  if (pdftw.includes('waitForDocx') && pdftw.includes('window.docx.Document')) {
    console.log('PASS: pdf-to-word.js exists with docx retry logic');
  } else {
    console.log('FAIL: pdf-to-word.js missing waitForDocx or docx usage');
  }
} else {
  console.log('FAIL: pdf-to-word.js does not exist');
}

// Test 4: Verify ppt-to-pdf.js shows inline instructions (no window.open)
const pptToPdf = fs.readFileSync(
  'wp-content/themes/toolsgallery/assets/js/tools/ppt-to-pdf.js', 'utf8'
);
if (!pptToPdf.includes('window.open')) {
  console.log('PASS: ppt-to-pdf.js does not open popup window');
} else {
  console.log('FAIL: ppt-to-pdf.js still uses window.open');
}
if (pptToPdf.includes('tg-ppt-instructions') || pptToPdf.includes('libreoffice')) {
  console.log('PASS: ppt-to-pdf.js has inline instructions content');
} else {
  console.log('FAIL: ppt-to-pdf.js missing inline instructions');
}

// Test 5: Verify tool-runner.js has html2canvas logic
const toolRunner = fs.readFileSync(
  'wp-content/themes/toolsgallery/assets/js/tool-runner.js', 'utf8'
);
if (toolRunner.includes('html2canvas')) {
  console.log('PASS: tool-runner.js uses html2canvas for url-to-pdf');
} else {
  console.log('FAIL: tool-runner.js missing html2canvas logic');
}
if (toolRunner.includes('result.html') && toolRunner.includes('tg-inline-html-result')) {
  console.log('PASS: tool-runner.js handles inline HTML result for ppt-to-pdf');
} else {
  console.log('FAIL: tool-runner.js missing inline HTML result handler');
}

testDocx();
