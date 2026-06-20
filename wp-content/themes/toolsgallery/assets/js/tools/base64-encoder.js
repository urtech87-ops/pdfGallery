/* Base64 Encoder — Phase 7 Tool 12 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'base64-encoder', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.b64-tabs{display:flex;gap:4px;margin-bottom:16px}
.b64-tab{padding:8px 20px;border:none;background:#f0f0f0;color:#333;cursor:pointer;border-radius:4px 4px 0 0;font-size:14px}
.b64-tab.active{background:#0073aa;color:#fff}
.b64-panel{display:none}.b64-panel.active{display:block}
.b64-field{margin-bottom:12px}
.b64-field label{display:block;font-size:13px;color:#555;margin-bottom:4px;font-weight:500}
.b64-field textarea,.b64-field input,.b64-field select{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:14px;box-sizing:border-box}
.b64-field textarea{font-family:monospace;resize:vertical}
.b64-btn{padding:8px 20px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px}
.b64-btn:hover{background:#005f8a}
.b64-stats{font-size:12px;color:#888;margin-top:6px}
</style>
<div class="b64-tabs">
  <button class="b64-tab active" onclick="b64SwitchTab('text')">Text to Base64</button>
  <button class="b64-tab" onclick="b64SwitchTab('file')">File to Base64</button>
</div>

<div id="b64-text-panel" class="b64-panel active">
  <div class="b64-field">
    <label>Input Text</label>
    <textarea id="b64-text-input" rows="5" placeholder="Enter text to encode…"></textarea>
  </div>
  <div class="b64-field">
    <label>Encoding Type</label>
    <select id="b64-text-type">
      <option value="standard">Standard (RFC 4648)</option>
      <option value="urlsafe">URL-safe</option>
      <option value="mime">MIME (76-char line wrap)</option>
    </select>
  </div>
  <div class="b64-field">
    <label>Result</label>
    <textarea id="b64-text-output" rows="4" readonly placeholder="Base64 output appears here…"></textarea>
    <div class="b64-stats" id="b64-text-stats"></div>
  </div>
  <div style="display:flex;gap:8px;margin-top:8px">
    <button class="b64-btn" onclick="b64CopyText()">Copy</button>
    <button class="b64-btn" onclick="b64DownloadText()" style="background:#555">Download .txt</button>
  </div>
</div>

<div id="b64-file-panel" class="b64-panel">
  <div class="b64-field">
    <label>Select File</label>
    <input type="file" id="b64-file-input">
  </div>
  <div class="b64-field">
    <label>Output Format</label>
    <select id="b64-file-format">
      <option value="raw">Raw Base64</option>
      <option value="dataurl">Data URL (data:type;base64,…)</option>
    </select>
  </div>
  <button class="b64-btn" onclick="b64EncodeFile()">Encode File</button>
  <div class="b64-field" style="margin-top:12px">
    <label>Result</label>
    <textarea id="b64-file-output" rows="4" readonly placeholder="Base64 output appears here…"></textarea>
    <div class="b64-stats" id="b64-file-stats"></div>
  </div>
  <div style="display:flex;gap:8px;margin-top:8px">
    <button class="b64-btn" onclick="b64CopyFile()">Copy</button>
    <button class="b64-btn" onclick="b64DownloadFile()" style="background:#555">Download .txt</button>
  </div>
</div>`;

    // Live encoding
    const textInput = document.getElementById('b64-text-input');
    const typeSelect = document.getElementById('b64-text-type');
    function doEncode() {
      const text = textInput.value;
      if (!text) { document.getElementById('b64-text-output').value = ''; document.getElementById('b64-text-stats').textContent = ''; return; }
      let b64 = btoa(unescape(encodeURIComponent(text)));
      if (typeSelect.value === 'urlsafe') b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      else if (typeSelect.value === 'mime') b64 = b64.match(/.{1,76}/g).join('\r\n');
      document.getElementById('b64-text-output').value = b64;
      const pct = Math.round((b64.replace(/\s/g,'').length / new TextEncoder().encode(text).length - 1) * 100);
      document.getElementById('b64-text-stats').textContent = `Input: ${text.length} chars → Base64: ${b64.replace(/\s/g,'').length} chars (+${pct}%)`;
    }
    textInput.addEventListener('input', doEncode);
    typeSelect.addEventListener('change', doEncode);

    window.b64SwitchTab = function(tab) {
      document.querySelectorAll('.b64-tab').forEach((t, i) => t.classList.toggle('active', (i === 0) === (tab === 'text')));
      document.getElementById('b64-text-panel').classList.toggle('active', tab === 'text');
      document.getElementById('b64-file-panel').classList.toggle('active', tab === 'file');
    };
    window.b64CopyText = function() { navigator.clipboard.writeText(document.getElementById('b64-text-output').value); };
    window.b64DownloadText = function() {
      const v = document.getElementById('b64-text-output').value;
      if (!v) return;
      download(new Blob([v], { type: 'text/plain' }), 'encoded.txt', 'text/plain');
    };
    window.b64EncodeFile = function() {
      const file = document.getElementById('b64-file-input').files[0];
      if (!file) { alert('Please select a file first.'); return; }
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataUrl = e.target.result;
        const b64 = document.getElementById('b64-file-format').value === 'dataurl' ? dataUrl : dataUrl.split(',')[1];
        document.getElementById('b64-file-output').value = b64;
        const rawSize = file.size;
        const b64Size = b64.replace(/\s/g,'').length;
        document.getElementById('b64-file-stats').textContent = `File: ${(rawSize/1024).toFixed(1)} KB → Base64: ${(b64Size/1024).toFixed(1)} KB (+${Math.round((b64Size/rawSize-1)*100)}%)`;
      };
      reader.readAsDataURL(file);
    };
    window.b64CopyFile = function() { navigator.clipboard.writeText(document.getElementById('b64-file-output').value); };
    window.b64DownloadFile = function() {
      const v = document.getElementById('b64-file-output').value;
      if (!v) return;
      download(new Blob([v], { type: 'text/plain' }), 'encoded.txt', 'text/plain');
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
