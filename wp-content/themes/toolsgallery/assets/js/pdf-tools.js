/* ToolsGallery — pdf-tools.js
   Client-side PDF processing handlers using pdf-lib.
   Exposes window.TGPdfTools registry; each key returns a Promise<Blob>.
*/
window.TGPdfTools = {
  merge: async function (files) {
    var mergedPdf = await PDFLib.PDFDocument.create();
    for (var i = 0; i < files.length; i++) {
      var ab = await files[i].arrayBuffer();
      var doc = await PDFLib.PDFDocument.load(ab);
      var copied = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copied.forEach(function (page) { mergedPdf.addPage(page); });
    }
    var bytes = await mergedPdf.save();
    return new Blob([bytes], { type: 'application/pdf' });
  }
};
