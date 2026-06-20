/* Base64 Decoder — Phase 7 Tool 13 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'base64-decoder', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.b64d-field{margin-bottom:14px}
.b64d-field label{display:block;font-size:13px;color:#555;margin-bottom:4px;font-weight:500}
.b64d-field textarea{width:100%;font-family:monospace;font-size:13px;padding:8px;border:1px solid #ddd;border-radius:4px;resize:vertical;box-sizing:border-box}
.b64d-btn{padding:8px 20px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-right:8px}
.b64d-btn:hover{background:#005f8a}
.b64d-result{margin-top:16px;display:none}
.b64d-error{color:#d32f2f;padding:10px;background:#ffebee;border-radius:4px;display:none}
</style>
<div class="b64d-field">
  <label>Base64 Input</label>
  <textarea id="b64d-input" rows="5" placeholder="Paste Base64 encoded text here… or a data URL (data:image/png;base64,…)"></textarea>
</div>
<button class="b64d-btn" onclick="b64Decode()">Decode</button>
<button class="b64d-btn" style="background:#555" onclick="document.getElementById('b64d-input').value='';b64ClearResult()">Clear</button>
<div class="b64d-error" id="b64d-error"></div>
<div class="b64d-result" id="b64d-result">
  <div id="b64d-text-result" style="display:none">
    <div class="b64d-field" style="margin-top:12px">
      <label>Decoded Text</label>
      <textarea id="b64d-text-output" rows="6" readonly></textarea>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="b64d-btn" onclick="navigator.clipboard.writeText(document.getElementById('b64d-text-output').value)">Copy Text</button>
      <button class="b64d-btn" style="background:#555" onclick="b64DlText()">Download .txt</button>
    </div>
  </div>
  <div id="b64d-img-result" style="display:none;margin-top:12px">
    <p style="font-size:13px;color:#555;margin-bottom:8px">Image Preview:</p>
    <img id="b64d-img" style="max-width:100%;border:1px solid #ddd;border-radius:6px">
    <div style="margin-top:8px">
      <button class="b64d-btn" onclick="b64DlImg()">Download Image</button>
    </div>
  </div>
  <div id="b64d-binary-result" style="display:none;margin-top:12px">
    <p style="font-size:13px;color:#555">Binary file detected — cannot display as text.</p>
    <button class="b64d-btn" onclick="b64DlBinary()">Download File</button>
  </div>
  <div id="b64d-stats" style="font-size:12px;color:#888;margin-top:8px"></div>
</div>`;

    let decodedBlob = null, decodedMime = '';

    window.b64Decode = function() {
      const raw = document.getElementById('b64d-input').value.trim();
      const errEl = document.getElementById('b64d-error');
      const resultEl = document.getElementById('b64d-result');
      errEl.style.display = 'none';
      resultEl.style.display = 'none';
      ['b64d-text-result','b64d-img-result','b64d-binary-result'].forEach(id => document.getElementById(id).style.display = 'none');

      if (!raw) { errEl.textContent = 'Please enter Base64 text to decode.'; errEl.style.display = ''; return; }

      let b64Data = raw, mimeType = '';

      // Handle data URL
      const dataUrlMatch = raw.match(/^data:([^;]+);base64,(.+)$/s);
      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1];
        b64Data = dataUrlMatch[2].replace(/\s/g, '');
      } else {
        b64Data = raw.replace(/\s/g, '');
      }

      // Validate base64
      if (!/^[A-Za-z0-9+/\-_]*={0,2}$/.test(b64Data)) {
        errEl.textContent = 'Invalid Base64 input — contains unexpected characters.';
        errEl.style.display = ''; return;
      }

      // Normalize URL-safe base64
      const normalized = b64Data.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '==='.slice(0, (4 - normalized.length % 4) % 4);

      let binary;
      try { binary = atob(padded); }
      catch (e) { errEl.textContent = 'Decode failed: ' + e.message; errEl.style.display = ''; return; }

      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      resultEl.style.display = '';
      document.getElementById('b64d-stats').textContent = `Encoded: ${b64Data.length} chars → Decoded: ${bytes.length} bytes`;

      // Check if image
      if (mimeType.startsWith('image/') || dataUrlMatch) {
        const imgEl = document.getElementById('b64d-img');
        imgEl.src = dataUrlMatch ? raw : 'data:image/png;base64,' + b64Data;
        document.getElementById('b64d-img-result').style.display = '';
        decodedBlob = new Blob([bytes], { type: mimeType || 'application/octet-stream' });
        decodedMime = mimeType;
        return;
      }

      // Try UTF-8 text
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        document.getElementById('b64d-text-output').value = text;
        document.getElementById('b64d-text-result').style.display = '';
        decodedBlob = new Blob([bytes], { type: 'text/plain' });
      } catch {
        // Binary
        decodedBlob = new Blob([bytes], { type: 'application/octet-stream' });
        document.getElementById('b64d-binary-result').style.display = '';
      }
    };

    window.b64ClearResult = function() {
      document.getElementById('b64d-result').style.display = 'none';
      document.getElementById('b64d-error').style.display = 'none';
    };
    window.b64DlText = function() {
      if (decodedBlob) download(decodedBlob, 'decoded.txt', 'text/plain');
    };
    window.b64DlImg = function() {
      if (decodedBlob) {
        const ext = decodedMime.split('/')[1] || 'png';
        download(decodedBlob, 'decoded.' + ext, decodedMime || 'image/png');
      }
    };
    window.b64DlBinary = function() {
      if (decodedBlob) download(decodedBlob, 'decoded.bin', 'application/octet-stream');
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
