/* URL Encoder / Decoder — Phase 7 Tool 14 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'url-encoder', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.urle-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media(max-width:640px){.urle-grid{grid-template-columns:1fr}}
.urle-section h3{font-size:15px;margin:0 0 10px;color:#333}
.urle-field{margin-bottom:10px}
.urle-field label{display:block;font-size:12px;color:#666;margin-bottom:3px}
.urle-field textarea,.urle-field select{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;font-family:monospace}
.urle-field textarea{resize:vertical}
.urle-btn{padding:7px 16px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px}
.urle-btn.secondary{background:#555}
.urle-examples{font-size:12px;color:#888;margin-top:6px;line-height:1.6}
.urle-stats{font-size:12px;color:#888;margin-top:4px}
.urle-extra{margin-top:20px;padding:16px;background:#f9f9f9;border-radius:6px}
.urle-extra h3{font-size:14px;margin:0 0 10px}
</style>
<div class="urle-grid">
  <div class="urle-section">
    <h3>Encode →</h3>
    <div class="urle-field">
      <label>Input Text or URL</label>
      <textarea id="urle-encode-input" rows="4" placeholder="Enter text or URL to encode…"></textarea>
    </div>
    <div class="urle-field">
      <label>Encode Type</label>
      <select id="urle-encode-type">
        <option value="full">Full (encodeURIComponent)</option>
        <option value="partial">Partial (special chars only)</option>
        <option value="form">Form data (&amp; → %26)</option>
      </select>
    </div>
    <div class="urle-field">
      <label>Encoded Output</label>
      <textarea id="urle-encode-output" rows="4" readonly placeholder="Encoded output…"></textarea>
      <div class="urle-stats" id="urle-encode-stats"></div>
    </div>
    <button class="urle-btn" onclick="navigator.clipboard.writeText(document.getElementById('urle-encode-output').value)">Copy</button>
    <div class="urle-examples">Space → %20 · &amp; → %26 · = → %3D · + → %2B · / → %2F</div>
  </div>

  <div class="urle-section">
    <h3>← Decode</h3>
    <div class="urle-field">
      <label>URL-Encoded Input</label>
      <textarea id="urle-decode-input" rows="4" placeholder="Enter URL-encoded string to decode…"></textarea>
    </div>
    <div class="urle-field">
      <label>Decoded Output</label>
      <textarea id="urle-decode-output" rows="4" readonly placeholder="Decoded output…"></textarea>
      <div class="urle-stats" id="urle-decode-stats"></div>
    </div>
    <button class="urle-btn" onclick="navigator.clipboard.writeText(document.getElementById('urle-decode-output').value)">Copy</button>
  </div>
</div>

<div class="urle-extra">
  <h3>Full URL Encoder — encode a complete URL preserving structure</h3>
  <div class="urle-field">
    <label>Full URL</label>
    <textarea id="urle-full-url" rows="2" placeholder="https://example.com/search?q=hello world&amp;lang=en"></textarea>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="urle-btn" onclick="urleFullEncode()">Encode Query Params Only</button>
    <button class="urle-btn secondary" onclick="urleDecode()">Decode All (%xx sequences)</button>
  </div>
  <div class="urle-field" style="margin-top:10px">
    <textarea id="urle-full-output" rows="2" readonly placeholder="Result…"></textarea>
  </div>
</div>`;

    function doEncode(raw) {
      if (!raw) return '';
      const type = document.getElementById('urle-encode-type').value;
      if (type === 'full') return encodeURIComponent(raw);
      if (type === 'form') return raw.replace(/[^a-zA-Z0-9 \-_.~]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).replace(/ /g, '+');
      // partial — encode only unsafe chars
      return raw.replace(/[^a-zA-Z0-9\-_.~:/?#[\]@!$&'()*+,;=%]/g, c => encodeURIComponent(c));
    }

    function doDecode(raw) {
      if (!raw) return '';
      try { return decodeURIComponent(raw.replace(/\+/g, ' ')); }
      catch { try { return unescape(raw); } catch { return raw; } }
    }

    const encInput = document.getElementById('urle-encode-input');
    const encOutput = document.getElementById('urle-encode-output');
    const decInput = document.getElementById('urle-decode-input');
    const decOutput = document.getElementById('urle-decode-output');
    const encType = document.getElementById('urle-encode-type');

    function updateEncode() {
      const v = doEncode(encInput.value);
      encOutput.value = v;
      document.getElementById('urle-encode-stats').textContent = v ? `${encInput.value.length} → ${v.length} chars` : '';
    }
    function updateDecode() {
      const v = doDecode(decInput.value);
      decOutput.value = v;
      document.getElementById('urle-decode-stats').textContent = v ? `${decInput.value.length} → ${v.length} chars` : '';
    }

    encInput.addEventListener('input', updateEncode);
    encType.addEventListener('change', updateEncode);
    decInput.addEventListener('input', updateDecode);

    window.urleFullEncode = function() {
      const url = document.getElementById('urle-full-url').value;
      if (!url) return;
      try {
        const u = new URL(url);
        const params = new URLSearchParams(u.searchParams);
        u.search = params.toString();
        document.getElementById('urle-full-output').value = u.toString();
      } catch {
        document.getElementById('urle-full-output').value = encodeURI(url);
      }
    };
    window.urleDecode = function() {
      let url = document.getElementById('urle-full-url').value;
      if (!url) return;
      let prev;
      let iterations = 0;
      do { prev = url; try { url = decodeURIComponent(url); } catch { break; } iterations++; }
      while (url !== prev && iterations < 10);
      document.getElementById('urle-full-output').value = url;
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
