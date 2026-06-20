/* Hash Generator — Phase 7 Tool 15 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'hash-generator', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.hash-tabs{display:flex;gap:4px;margin-bottom:16px}
.hash-tab{padding:8px 20px;border:none;background:#f0f0f0;color:#333;cursor:pointer;border-radius:4px 4px 0 0;font-size:14px}
.hash-tab.active{background:#0073aa;color:#fff}
.hash-panel{display:none}.hash-panel.active{display:block}
.hash-field{margin-bottom:12px}
.hash-field label{display:block;font-size:13px;color:#555;margin-bottom:4px;font-weight:500}
.hash-field textarea,.hash-field input{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:14px;box-sizing:border-box}
.hash-field textarea{font-family:monospace;resize:vertical}
.hash-algos{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px}
.hash-algos label{font-size:13px;color:#333;display:flex;align-items:center;gap:4px;cursor:pointer}
.hash-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:12px}
.hash-table th{background:#f5f5f5;padding:8px 12px;text-align:left;border:1px solid #e0e0e0;font-weight:600}
.hash-table td{padding:8px 12px;border:1px solid #e0e0e0;font-family:monospace;word-break:break-all}
.hash-copy-btn{padding:4px 10px;background:#0073aa;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;white-space:nowrap}
.hash-copy-btn:hover{background:#005f8a}
.hash-btn{padding:8px 20px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px}
.hash-case-toggle{margin-bottom:12px;font-size:13px;color:#555}
.hash-case-toggle label{margin-right:12px;cursor:pointer}
</style>
<div class="hash-tabs">
  <button class="hash-tab active" onclick="hashSwitchTab('text')">Hash Text</button>
  <button class="hash-tab" onclick="hashSwitchTab('file')">Hash File</button>
</div>

<div id="hash-text-panel" class="hash-panel active">
  <div class="hash-field">
    <label>Input Text</label>
    <textarea id="hash-text-input" rows="4" placeholder="Type or paste text to hash…"></textarea>
  </div>
  <div class="hash-algos" id="hash-text-algos">
    <label><input type="checkbox" value="MD5" checked> MD5</label>
    <label><input type="checkbox" value="SHA-1" checked> SHA-1</label>
    <label><input type="checkbox" value="SHA-256" checked> SHA-256</label>
    <label><input type="checkbox" value="SHA-384" checked> SHA-384</label>
    <label><input type="checkbox" value="SHA-512" checked> SHA-512</label>
  </div>
  <div class="hash-case-toggle">
    Case:
    <label><input type="radio" name="hash-case" value="lower" checked> Lowercase</label>
    <label><input type="radio" name="hash-case" value="upper"> Uppercase</label>
  </div>
  <table class="hash-table" id="hash-text-table">
    <thead><tr><th>Algorithm</th><th>Hash Value</th><th></th></tr></thead>
    <tbody id="hash-text-tbody"></tbody>
  </table>
</div>

<div id="hash-file-panel" class="hash-panel">
  <div class="hash-field">
    <label>Select File</label>
    <input type="file" id="hash-file-input">
    <div id="hash-file-info" style="font-size:12px;color:#888;margin-top:4px"></div>
  </div>
  <div class="hash-algos" id="hash-file-algos">
    <label><input type="checkbox" value="MD5" checked> MD5</label>
    <label><input type="checkbox" value="SHA-1" checked> SHA-1</label>
    <label><input type="checkbox" value="SHA-256" checked> SHA-256</label>
    <label><input type="checkbox" value="SHA-384" checked> SHA-384</label>
    <label><input type="checkbox" value="SHA-512" checked> SHA-512</label>
  </div>
  <button class="hash-btn" onclick="hashFile()">Generate Hashes</button>
  <table class="hash-table" id="hash-file-table" style="margin-top:12px;display:none">
    <thead><tr><th>Algorithm</th><th>Hash Value</th><th></th></tr></thead>
    <tbody id="hash-file-tbody"></tbody>
  </table>
  <p style="font-size:12px;color:#888;margin-top:10px">Tip: Hash two files and compare — identical hashes mean identical files.</p>
</div>`;

    // MD5 implementation (pure JS)
    function md5(inputStr) {
      function safeAdd(x, y) { const lsw=(x&0xFFFF)+(y&0xFFFF); return (((x>>16)+(y>>16)+(lsw>>16))<<16)|(lsw&0xFFFF); }
      function bitRotateLeft(num, cnt) { return (num<<cnt)|(num>>>(32-cnt)); }
      function md5cmn(q,a,b,x,s,t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b); }
      function md5ff(a,b,c,d,x,s,t) { return md5cmn((b&c)|((~b)&d),a,b,x,s,t); }
      function md5gg(a,b,c,d,x,s,t) { return md5cmn((b&d)|(c&(~d)),a,b,x,s,t); }
      function md5hh(a,b,c,d,x,s,t) { return md5cmn(b^c^d,a,b,x,s,t); }
      function md5ii(a,b,c,d,x,s,t) { return md5cmn(c^(b|(~d)),a,b,x,s,t); }
      const utf8 = unescape(encodeURIComponent(inputStr));
      const n = utf8.length;
      const state = [1732584193, -271733879, -1732584194, 271733878];
      const words = [];
      for (let i = 0; i < n; i++) { words[i >> 2] |= utf8.charCodeAt(i) << ((i % 4) * 8); }
      words[n >> 2] |= 0x80 << ((n % 4) * 8);
      words[(((n + 8) >> 6) << 4) + 14] = n * 8;
      for (let i = 0; i < words.length; i += 16) {
        let [a,b,c,d] = state;
        a=md5ff(a,b,c,d,words[i],7,-680876936);d=md5ff(d,a,b,c,words[i+1],12,-389564586);c=md5ff(c,d,a,b,words[i+2],17,606105819);b=md5ff(b,c,d,a,words[i+3],22,-1044525330);
        a=md5ff(a,b,c,d,words[i+4],7,-176418897);d=md5ff(d,a,b,c,words[i+5],12,1200080426);c=md5ff(c,d,a,b,words[i+6],17,-1473231341);b=md5ff(b,c,d,a,words[i+7],22,-45705983);
        a=md5ff(a,b,c,d,words[i+8],7,1770035416);d=md5ff(d,a,b,c,words[i+9],12,-1958414417);c=md5ff(c,d,a,b,words[i+10],17,-42063);b=md5ff(b,c,d,a,words[i+11],22,-1990404162);
        a=md5ff(a,b,c,d,words[i+12],7,1804603682);d=md5ff(d,a,b,c,words[i+13],12,-40341101);c=md5ff(c,d,a,b,words[i+14],17,-1502002290);b=md5ff(b,c,d,a,words[i+15],22,1236535329);
        a=md5gg(a,b,c,d,words[i+1],5,-165796510);d=md5gg(d,a,b,c,words[i+6],9,-1069501632);c=md5gg(c,d,a,b,words[i+11],14,643717713);b=md5gg(b,c,d,a,words[i],20,-373897302);
        a=md5gg(a,b,c,d,words[i+5],5,-701558691);d=md5gg(d,a,b,c,words[i+10],9,38016083);c=md5gg(c,d,a,b,words[i+15],14,-660478335);b=md5gg(b,c,d,a,words[i+4],20,-405537848);
        a=md5gg(a,b,c,d,words[i+9],5,568446438);d=md5gg(d,a,b,c,words[i+14],9,-1019803690);c=md5gg(c,d,a,b,words[i+3],14,-187363961);b=md5gg(b,c,d,a,words[i+8],20,1163531501);
        a=md5gg(a,b,c,d,words[i+13],5,-1444681467);d=md5gg(d,a,b,c,words[i+2],9,-51403784);c=md5gg(c,d,a,b,words[i+7],14,1735328473);b=md5gg(b,c,d,a,words[i+12],20,-1926607734);
        a=md5hh(a,b,c,d,words[i+5],4,-378558);d=md5hh(d,a,b,c,words[i+8],11,-2022574463);c=md5hh(c,d,a,b,words[i+11],16,1839030562);b=md5hh(b,c,d,a,words[i+14],23,-35309556);
        a=md5hh(a,b,c,d,words[i+1],4,-1530992060);d=md5hh(d,a,b,c,words[i+4],11,1272893353);c=md5hh(c,d,a,b,words[i+7],16,-155497632);b=md5hh(b,c,d,a,words[i+10],23,-1094730640);
        a=md5hh(a,b,c,d,words[i+13],4,681279174);d=md5hh(d,a,b,c,words[i],11,-358537222);c=md5hh(c,d,a,b,words[i+3],16,-722521979);b=md5hh(b,c,d,a,words[i+6],23,76029189);
        a=md5hh(a,b,c,d,words[i+9],4,-640364487);d=md5hh(d,a,b,c,words[i+12],11,-421815835);c=md5hh(c,d,a,b,words[i+15],16,530742520);b=md5hh(b,c,d,a,words[i+2],23,-995338651);
        a=md5ii(a,b,c,d,words[i],6,-198630844);d=md5ii(d,a,b,c,words[i+7],10,1126891415);c=md5ii(c,d,a,b,words[i+14],15,-1416354905);b=md5ii(b,c,d,a,words[i+5],21,-57434055);
        a=md5ii(a,b,c,d,words[i+12],6,1700485571);d=md5ii(d,a,b,c,words[i+3],10,-1894986606);c=md5ii(c,d,a,b,words[i+10],15,-1051523);b=md5ii(b,c,d,a,words[i+1],21,-2054922799);
        a=md5ii(a,b,c,d,words[i+8],6,1873313359);d=md5ii(d,a,b,c,words[i+15],10,-30611744);c=md5ii(c,d,a,b,words[i+6],15,-1560198380);b=md5ii(b,c,d,a,words[i+13],21,1309151649);
        a=md5ii(a,b,c,d,words[i+4],6,-145523070);d=md5ii(d,a,b,c,words[i+11],10,-1120210379);c=md5ii(c,d,a,b,words[i+2],15,718787259);b=md5ii(b,c,d,a,words[i+9],21,-343485551);
        state[0]=safeAdd(a,state[0]);state[1]=safeAdd(b,state[1]);state[2]=safeAdd(c,state[2]);state[3]=safeAdd(d,state[3]);
      }
      return state.map(v => Array.from({length:4},(_,i) => ((v>>>(i*8))&0xFF).toString(16).padStart(2,'0')).join('')).join('');
    }

    async function hashText(text, algo) {
      if (algo === 'MD5') return md5(text);
      const enc = new TextEncoder().encode(text);
      const buf = await crypto.subtle.digest(algo, enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    }

    async function hashBuffer(buf, algo) {
      if (algo === 'MD5') {
        const dec = new TextDecoder('latin1');
        return md5(dec.decode(buf));
      }
      const hashBuf = await crypto.subtle.digest(algo, buf);
      return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('');
    }

    function getCase() { return document.querySelector('input[name="hash-case"]:checked')?.value || 'lower'; }
    function applyCase(h) { return getCase() === 'upper' ? h.toUpperCase() : h; }

    function renderTable(tbody, results) {
      tbody.innerHTML = results.map(r => `<tr>
        <td><strong>${r.algo}</strong></td>
        <td>${applyCase(r.hash) || '<span style="color:#aaa">—</span>'}</td>
        <td><button class="hash-copy-btn" onclick="navigator.clipboard.writeText('${applyCase(r.hash)}')">Copy</button></td>
      </tr>`).join('');
    }

    async function updateTextHashes() {
      const text = document.getElementById('hash-text-input').value;
      const algos = [...document.querySelectorAll('#hash-text-algos input:checked')].map(c => c.value);
      const tbody = document.getElementById('hash-text-tbody');
      if (!text) { tbody.innerHTML = ''; return; }
      const results = await Promise.all(algos.map(async a => ({ algo: a, hash: await hashText(text, a) })));
      renderTable(tbody, results);
    }

    document.getElementById('hash-text-input').addEventListener('input', updateTextHashes);
    document.querySelectorAll('#hash-text-algos input, input[name="hash-case"]').forEach(el => el.addEventListener('change', updateTextHashes));

    window.hashSwitchTab = function(tab) {
      document.querySelectorAll('.hash-tab').forEach((t, i) => t.classList.toggle('active', (i === 0) === (tab === 'text')));
      document.getElementById('hash-text-panel').classList.toggle('active', tab === 'text');
      document.getElementById('hash-file-panel').classList.toggle('active', tab === 'file');
    };

    document.getElementById('hash-file-input').addEventListener('change', function() {
      const file = this.files[0];
      document.getElementById('hash-file-info').textContent = file ? `${file.name} (${(file.size/1024).toFixed(1)} KB)` : '';
      document.getElementById('hash-file-table').style.display = 'none';
    });

    window.hashFile = async function() {
      const file = document.getElementById('hash-file-input').files[0];
      if (!file) { alert('Please select a file.'); return; }
      const algos = [...document.querySelectorAll('#hash-file-algos input:checked')].map(c => c.value);
      const buf = await file.arrayBuffer();
      const results = await Promise.all(algos.map(async a => ({ algo: a, hash: await hashBuffer(buf, a) })));
      const table = document.getElementById('hash-file-table');
      renderTable(document.getElementById('hash-file-tbody'), results);
      table.style.display = '';
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
