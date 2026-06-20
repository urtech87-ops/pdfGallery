/**
 * ToolsGallery — Add Audio to Video
 * Handler: vid-add-audio
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-add-audio' };
  var _ffmpeg = null, _loaded = false;
  var _audioFile = null;

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Add or replace the audio track on your video. Processing runs in your browser.</div>';

  function getOptionsHTML() {
    return NOTICE +
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
      '</div>' +
      '<script>(function(){' +
        'var af=document.getElementById("vaa-audio-file"),ai=document.getElementById("vaa-audio-info");' +
        'if(af)af.addEventListener("change",function(){' +
          'if(af.files[0]){ai.textContent=af.files[0].name+" ("+(af.files[0].size/1024).toFixed(0)+" KB)";}' +
          'window._vaaAudioFile=af.files[0];' +
        '});' +
      '})();<\/script>';
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
      audioFile: window._vaaAudioFile || null,
    };
  }

  function parseMMSS(s) {
    var p = s.split(':');
    return p.length === 2 ? parseInt(p[0]) * 60 + parseInt(p[1]) : parseInt(s) || 0;
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Processing... ' + Math.round(e.progress * 100) + '%');
    });
    onProgress && onProgress(5, 'Loading processor...');
    var base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await _ffmpeg.load({
      coreURL: await toBlobURL(base + '/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL(base + '/ffmpeg-core.wasm', 'application/wasm'),
    });
    _loaded = true;
  }

  async function run(file, options, onProgress) {
    if (!options.audioFile) throw new Error('Please select an audio file to add.');

    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var vExt = file.name.split('.').pop().toLowerCase() || 'mp4';
    var aExt = options.audioFile.name.split('.').pop().toLowerCase() || 'mp3';
    var inV = 'input.' + vExt;
    var inA = 'audio.' + aExt;

    onProgress && onProgress(15, 'Reading files...');
    await _ffmpeg.writeFile(inV, await fetchFile(file));
    await _ffmpeg.writeFile(inA, await fetchFile(options.audioFile));

    var offset = parseMMSS(options.offset || '0:00');
    var args;

    if (options.mode === 'mix') {
      var amixFilter = offset > 0
        ? '[1:a]adelay=' + (offset * 1000) + '|' + (offset * 1000) + '[da];[0:a][da]amix=inputs=2:duration=first[a]'
        : '[0:a][1:a]amix=inputs=2:duration=first[a]';
      args = ['-i', inV, '-i', inA, '-filter_complex', amixFilter, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', 'output.mp4'];
    } else {
      var aArgs = offset > 0 ? ['-itsoffset', String(offset), '-i', inA] : ['-i', inA];
      var shortest = options.loop === 'yes' ? ['-stream_loop', '-1', '-i', inA] : [];
      if (options.loop === 'yes') {
        args = ['-i', inV, '-stream_loop', '-1', '-i', inA, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-shortest', 'output.mp4'];
      } else {
        args = ['-i', inV].concat(aArgs).concat(['-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-shortest', 'output.mp4']);
      }
    }

    onProgress && onProgress(20, 'Adding audio to video...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'with-audio.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
