/* Line Break Remover — Phase 8 Tool 7 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'line-break-remover', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.lbr-wrap{display:flex;flex-direction:column;gap:12px}
.lbr-textareas{display:flex;gap:12px;flex-wrap:wrap}
.lbr-ta-wrap{flex:1;min-width:240px}
.lbr-ta-wrap label{display:block;font-size:13px;color:#555;margin-bottom:4px;font-weight:500}
.lbr-ta{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:14px;resize:vertical;min-height:160px;box-sizing:border-box;font-family:inherit}
.lbr-options{display:flex;flex-wrap:wrap;gap:16px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #eee}
.lbr-option-group{display:flex;flex-direction:column;gap:6px}
.lbr-option-group strong{font-size:12px;color:#333;text-transform:uppercase;letter-spacing:.5px}
.lbr-check label{display:flex;align-items:center;gap:6px;font-size:13px;color:#555;cursor:pointer}
.lbr-replace-wrap{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.lbr-replace-wrap label{font-size:13px;color:#555}
.lbr-replace-select{padding:5px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px}
.lbr-custom-input{padding:5px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;width:120px}
.lbr-stats{font-size:12px;color:#888;padding:6px 10px;background:#f5f5f5;border-radius:4px}
.lbr-actions{display:flex;gap:8px}
.lbr-btn{padding:7px 16px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600}
.lbr-btn:hover{background:#005f8a}
.lbr-btn-sec{background:#6c757d}
.lbr-btn-sec:hover{background:#545b62}
</style>
<div class="lbr-wrap">
  <div class="lbr-textareas">
    <div class="lbr-ta-wrap">
      <label>Input Text</label>
      <textarea id="lbr-input" class="lbr-ta" placeholder="Paste text with line breaks here…"></textarea>
    </div>
    <div class="lbr-ta-wrap">
      <label>Output Text</label>
      <textarea id="lbr-output" class="lbr-ta" readonly></textarea>
    </div>
  </div>

  <div class="lbr-options">
    <div class="lbr-option-group">
      <strong>Remove</strong>
      <div class="lbr-check"><label><input type="checkbox" id="lbr-single" checked> Single line breaks</label></div>
      <div class="lbr-check"><label><input type="checkbox" id="lbr-double" checked> Double line breaks</label></div>
      <div class="lbr-check"><label><input type="checkbox" id="lbr-all" checked> All line breaks</label></div>
    </div>
    <div class="lbr-option-group">
      <strong>Extra</strong>
      <div class="lbr-check"><label><input type="checkbox" id="lbr-extra-spaces"> Remove extra spaces</label></div>
      <div class="lbr-check"><label><input type="checkbox" id="lbr-tabs"> Remove tabs</label></div>
      <div class="lbr-check"><label><input type="checkbox" id="lbr-trim-lines"> Trim each line</label></div>
      <div class="lbr-check"><label><input type="checkbox" id="lbr-empty-lines"> Remove empty lines</label></div>
      <div class="lbr-check"><label><input type="checkbox" id="lbr-trim-ends"> Trim start/end</label></div>
    </div>
    <div class="lbr-option-group">
      <strong>Replace With</strong>
      <div class="lbr-replace-wrap">
        <select id="lbr-replace" class="lbr-replace-select" onchange="lbrToggleCustom()">
          <option value="none">Nothing</option>
          <option value="space">Space</option>
          <option value="custom">Custom text</option>
        </select>
        <input type="text" id="lbr-custom" class="lbr-custom-input" placeholder="Replacement…" style="display:none">
      </div>
    </div>
  </div>

  <div class="lbr-stats" id="lbr-stats">Ready.</div>
  <div class="lbr-actions">
    <button class="lbr-btn" onclick="lbrProcess()">Process</button>
    <button class="lbr-btn lbr-btn-sec" onclick="navigator.clipboard.writeText(document.getElementById('lbr-output').value)">Copy Output</button>
    <button class="lbr-btn lbr-btn-sec" onclick="document.getElementById('lbr-input').value='';document.getElementById('lbr-output').value='';document.getElementById('lbr-stats').textContent='Ready.'">Clear</button>
  </div>
</div>`;

    window.lbrToggleCustom = function() {
      const sel=document.getElementById('lbr-replace').value;
      document.getElementById('lbr-custom').style.display=sel==='custom'?'':'none';
    };

    function getReplacement() {
      const sel=document.getElementById('lbr-replace').value;
      if(sel==='none') return '';
      if(sel==='space') return ' ';
      return document.getElementById('lbr-custom').value;
    }

    window.lbrProcess = function() {
      let text=document.getElementById('lbr-input').value;
      const original=text;
      const repl=getReplacement();

      if(document.getElementById('lbr-trim-lines').checked){
        text=text.split('\n').map(l=>l.trim()).join('\n');
      }
      if(document.getElementById('lbr-empty-lines').checked){
        text=text.split('\n').filter(l=>l.trim()!=='').join('\n');
      }

      let lbCount=0;
      if(document.getElementById('lbr-all').checked){
        const matches=text.match(/\r?\n|\r/g);
        lbCount=(matches||[]).length;
        text=text.replace(/\r?\n|\r/g,repl);
      } else {
        if(document.getElementById('lbr-double').checked){
          const m=text.match(/(\r?\n){2,}/g);lbCount+=(m||[]).length;
          text=text.replace(/(\r?\n){2,}/g,repl);
        }
        if(document.getElementById('lbr-single').checked){
          const m=text.match(/\r?\n/g);lbCount+=(m||[]).length;
          text=text.replace(/\r?\n/g,repl);
        }
      }

      let spCount=0;
      if(document.getElementById('lbr-extra-spaces').checked){
        const m=text.match(/  +/g);spCount=(m||[]).reduce((a,s)=>a+s.length-1,0);
        text=text.replace(/  +/g,' ');
      }
      if(document.getElementById('lbr-tabs').checked){text=text.replace(/\t/g,' ');}
      if(document.getElementById('lbr-trim-ends').checked){text=text.trim();}

      document.getElementById('lbr-output').value=text;
      document.getElementById('lbr-stats').textContent=`Removed ${lbCount} line break${lbCount!==1?'s':''}, ${spCount} extra space${spCount!==1?'s':''}`;
    };

    document.getElementById('lbr-input').addEventListener('input', lbrProcess);
    document.querySelectorAll('#lbr-single,#lbr-double,#lbr-all,#lbr-extra-spaces,#lbr-tabs,#lbr-trim-lines,#lbr-empty-lines,#lbr-trim-ends').forEach(el=>el.addEventListener('change',lbrProcess));
    document.getElementById('lbr-replace').addEventListener('change',lbrProcess);
    document.getElementById('lbr-custom').addEventListener('input',lbrProcess);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
