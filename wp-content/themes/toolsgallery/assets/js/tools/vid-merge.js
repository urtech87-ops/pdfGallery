/**
 * ToolsGallery — Merge Videos
 * Handler: vid-merge
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-merge', multiFile: true };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Each video is first normalized to MP4, so merging takes time proportional to the total size.') : '';
    return notice +
      '<p style="font-size:13px;color:#666">Upload 2&ndash;5 videos. They will be merged in the order shown in the file list above.</p>';
  }

  function getOptions(el) { return {}; }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];

    if (files.length < 2) throw new Error('Please upload at least 2 videos to merge.');
    if (files.length > 5) throw new Error('Maximum 5 videos can be merged at once.');

    var ffmpeg = null;
    var tempNames = ['concat.txt', 'output.mp4'];

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      /* Write each file and normalize to the same codec/container so
         concat with stream copy works. */
      var concatList = '';
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var inN = 'input' + i + '.' + U.getExt(f.name);
        var normN = 'norm' + i + '.mp4';
        tempNames.push(inN, normN);

        onProgress && onProgress(0.05, 'Loading file ' + (i + 1) + '/' + files.length + '...');
        await U.writeFile(ffmpeg, inN, f);

        onProgress && onProgress(0.1, 'Preparing video ' + (i + 1) + '/' + files.length + '...');
        await U.exec(ffmpeg, ['-i', inN, '-vcodec', 'libx264', '-acodec', 'aac', '-crf', '23', normN]);
        U.unlinkFile(ffmpeg, inN);
        concatList += 'file ' + normN + '\n';
      }

      onProgress && onProgress(0.85, 'Merging videos...');
      U.writeText(ffmpeg, 'concat.txt', concatList);
      await U.exec(ffmpeg, ['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output.mp4']);

      onProgress && onProgress(0.95, 'Creating output file...');
      var data = U.readFile(ffmpeg, 'output.mp4');
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: 'merged.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, tempNames);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
