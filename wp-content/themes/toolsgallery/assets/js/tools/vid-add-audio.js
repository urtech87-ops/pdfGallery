/**
 * ToolsGallery — Add Audio to Video
 * Handler: vid-add-audio
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-add-audio' };
  var _audioFile = null;

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Add or replace the audio track on your video.') : '';
    return notice +
      '<div style="margin-bottom:12px">' +
        '<label class="tg-opt-label" style="display:block;margin-bottom:6px">Audio File (MP3, WAV, AAC, OGG)</label>' +
        '<input type="file" id="vaa-audio-file" accept="audio/*,.mp3,.aac,.wav,.ogg" style="font-size:13px">' +
        '<div id="vaa-audio-info" style="font-size:12px;color:#666;margin-top:4px"></div>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Audio Behavior</label>' +
        '<select id="vaa-mode" class="tg-select">' +
          '<option value="replace">Replace existing audio</option>' +
          '<option value="mix">Mix with existing audio</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Audio Offset (MM:SS)</label>' +
        '<input type="text" id="vaa-offset" class="tg-text-input" value="0:00" placeholder="0:00" style="width:80px">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Loop audio if shorter</label>' +
        '<select id="vaa-loop" class="tg-select">' +
          '<option value="yes">Yes</option><option value="no">No</option>' +
        '</select>' +
      '</div>';
  }

  function wireOptions(container) {
    _audioFile = null;
    var af = container.querySelector('#vaa-audio-file');
    var ai = container.querySelector('#vaa-audio-info');
    if (af) {
      af.addEventListener('change', function () {
        _audioFile = af.files[0] || null;
        if (ai && _audioFile) ai.textContent = _audioFile.name + ' (' + (_audioFile.size / 1024).toFixed(0) + ' KB)';
      });
    }
  }

  function getOptions(el) {
    if (!el) return {};
    var mode = el.querySelector('#vaa-mode');
    var offset = el.querySelector('#vaa-offset');
    var loop = el.querySelector('#vaa-loop');
    return {
      mode: mode ? mode.value : 'replace',
      offset: offset ? offset.value : '0:00',
      loop: loop ? loop.value : 'yes',
      audioFile: _audioFile,
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');
    if (!options.audioFile) throw new Error('Please select an audio file to add.');

    var inV = 'input.' + U.getExt(file.name);
    var inA = 'audio.' + U.getExt(options.audioFile.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading files...');
      await U.writeFile(ffmpeg, inV, file);
      await U.writeFile(ffmpeg, inA, options.audioFile);

      var offset = U.parseTime(options.offset || '0:00');
      var args;

      if (options.mode === 'mix') {
        var amixFilter = offset > 0
          ? '[1:a]adelay=' + (offset * 1000) + '|' + (offset * 1000) + '[da];[0:a][da]amix=inputs=2:duration=first[a]'
          : '[0:a][1:a]amix=inputs=2:duration=first[a]';
        args = ['-i', inV, '-i', inA, '-filter_complex', amixFilter, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', outName];
      } else if (options.loop === 'yes') {
        args = ['-i', inV, '-stream_loop', '-1', '-i', inA, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-shortest', outName];
      } else if (offset > 0) {
        args = ['-i', inV, '-itsoffset', String(offset), '-i', inA, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-shortest', outName];
      } else {
        args = ['-i', inV, '-i', inA, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-shortest', outName];
      }

      onProgress && onProgress(0.15, 'Adding audio to video...');
      await U.exec(ffmpeg, args);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-with-audio.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inV, inA, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();
