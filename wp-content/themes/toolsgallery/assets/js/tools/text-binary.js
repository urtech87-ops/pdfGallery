/* Text to Binary Converter — Phase 8 Tool 9 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'text-binary', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.tb-tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}
.tb-tab{padding:8px 14px;border:none;background:#f0f0f0;color:#333;cursor:pointer;border-radius:4px 4px 0 0;font-size:13px}
.tb-tab.active{background:#0073aa;color:#fff}
.tb-panel{display:none}.tb-panel.active{display:block}
.tb-field label{display:block;font-size:13px;color:#555;margin-bottom:4px;font-weight:500;margin-top:10px}
.tb-ta{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px;resize:vertical;min-height:100px;box-sizing:border-box;font-family:monospace}
.tb-options{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0}
.tb-options label{font-size:13px;color:#555;display:flex;align-items:center;gap:4px;cursor:pointer}
.tb-options select{padding:4px 8px;border:1px solid #ddd;border-radius:3px;font-size:13px}
.tb-btns{display:flex;gap:8px;margin:8px 0;flex-wrap:wrap}
.tb-btn{padding:7px 16px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600}
.tb-btn:hover{background:#005f8a}
.tb-btn-sec{background:#6c757d}
.tb-btn-sec:hover{background:#545b62}
.tb-morse-audio{padding:6px 14px;background:#27ae60;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px}
.tb-err{color:#c0392b;font-size:13px;margin-top:4px}
</style>
<div class="tb-tabs">
  <button class="tb-tab active" onclick="tbTab('binary')">Text ↔ Binary</button>
  <button class="tb-tab" onclick="tbTab('decimal')">Text ↔ Decimal</button>
  <button class="tb-tab" onclick="tbTab('hex')">Text ↔ Hex</button>
  <button class="tb-tab" onclick="tbTab('octal')">Text ↔ Octal</button>
  <button class="tb-tab" onclick="tbTab('morse')">Text ↔ Morse</button>
</div>

<div id="tb-panel-binary" class="tb-panel active">
  <div class="tb-field"><label>Text Input</label><textarea id="tb-bin-text" class="tb-ta" placeholder="Type text here…" oninput="tbTextToBin()"></textarea></div>
  <div class="tb-options">
    <label>Separator: <select id="tb-bin-sep" onchange="tbTextToBin()"><option value=" ">Space</option><option value="">None</option><option value=",">Comma</option><option value="\n">Newline</option></select></label>
    <label>Bits: <select id="tb-bin-bits" onchange="tbTextToBin()"><option value="8" selected>8</option><option value="7">7</option></select></label>
  </div>
  <div class="tb-field"><label>Binary Output</label><textarea id="tb-bin-out" class="tb-ta" placeholder="Binary will appear here…" oninput="tbBinToText()"></textarea></div>
  <div class="tb-btns">
    <button class="tb-btn tb-btn-sec" onclick="navigator.clipboard.writeText(document.getElementById('tb-bin-out').value)">Copy Binary</button>
    <button class="tb-btn tb-btn-sec" onclick="navigator.clipboard.writeText(document.getElementById('tb-bin-text').value)">Copy Text</button>
  </div>
  <div id="tb-bin-err" class="tb-err"></div>
</div>

<div id="tb-panel-decimal" class="tb-panel">
  <div class="tb-field"><label>Text</label><textarea id="tb-dec-text" class="tb-ta" oninput="tbConvertBase('decimal','text')"></textarea></div>
  <div class="tb-field"><label>Decimal (space-separated)</label><textarea id="tb-dec-out" class="tb-ta" oninput="tbConvertBase('decimal','code')"></textarea></div>
  <div class="tb-btns"><button class="tb-btn tb-btn-sec" onclick="navigator.clipboard.writeText(document.getElementById('tb-dec-out').value)">Copy</button></div>
</div>

<div id="tb-panel-hex" class="tb-panel">
  <div class="tb-field"><label>Text</label><textarea id="tb-hex-text" class="tb-ta" oninput="tbConvertBase('hex','text')"></textarea></div>
  <div class="tb-field"><label>Hex (space-separated)</label><textarea id="tb-hex-out" class="tb-ta" oninput="tbConvertBase('hex','code')"></textarea></div>
  <div class="tb-btns"><button class="tb-btn tb-btn-sec" onclick="navigator.clipboard.writeText(document.getElementById('tb-hex-out').value)">Copy</button></div>
</div>

<div id="tb-panel-octal" class="tb-panel">
  <div class="tb-field"><label>Text</label><textarea id="tb-oct-text" class="tb-ta" oninput="tbConvertBase('octal','text')"></textarea></div>
  <div class="tb-field"><label>Octal (space-separated)</label><textarea id="tb-oct-out" class="tb-ta" oninput="tbConvertBase('octal','code')"></textarea></div>
  <div class="tb-btns"><button class="tb-btn tb-btn-sec" onclick="navigator.clipboard.writeText(document.getElementById('tb-oct-out').value)">Copy</button></div>
</div>

<div id="tb-panel-morse" class="tb-panel">
  <div class="tb-field"><label>Text</label><textarea id="tb-morse-text" class="tb-ta" oninput="tbTextToMorse()" placeholder="Type text for Morse code…"></textarea></div>
  <div class="tb-field"><label>Morse Code</label><textarea id="tb-morse-out" class="tb-ta" oninput="tbMorseToText()" placeholder="Or paste Morse code here…"></textarea></div>
  <div class="tb-btns">
    <button class="tb-btn tb-btn-sec" onclick="navigator.clipboard.writeText(document.getElementById('tb-morse-out').value)">Copy Morse</button>
    <button class="tb-morse-audio" onclick="tbPlayMorse()">Play Morse Audio</button>
  </div>
</div>`;

    window.tbTab = function(tab) {
      document.querySelectorAll('.tb-tab').forEach((b,i)=>b.classList.remove('active'));
      document.querySelectorAll('.tb-panel').forEach(p=>p.classList.remove('active'));
      const tabs=['binary','decimal','hex','octal','morse'];
      document.querySelectorAll('.tb-tab')[tabs.indexOf(tab)].classList.add('active');
      document.getElementById(`tb-panel-${tab}`).classList.add('active');
    };

    window.tbTextToBin = function() {
      const text=document.getElementById('tb-bin-text').value;
      const sep=document.getElementById('tb-bin-sep').value==='\n'?'\n':document.getElementById('tb-bin-sep').value;
      const bits=parseInt(document.getElementById('tb-bin-bits').value);
      const bin=Array.from(text).map(c=>c.charCodeAt(0).toString(2).padStart(bits,'0')).join(sep);
      document.getElementById('tb-bin-out').value=bin;
      document.getElementById('tb-bin-err').textContent='';
    };

    let binUpdating=false;
    window.tbBinToText = function() {
      if(binUpdating)return;
      const raw=document.getElementById('tb-bin-out').value.trim();
      if(!raw){document.getElementById('tb-bin-text').value='';return;}
      const sep=document.getElementById('tb-bin-sep').value==='\n'?'\n':document.getElementById('tb-bin-sep').value;
      let parts;
      if(sep===''){parts=raw.match(/.{1,8}/g)||[];}
      else{parts=raw.split(sep);}
      try{
        const text=parts.map(p=>{
          if(!/^[01]+$/.test(p.trim()))throw new Error('Invalid binary');
          return String.fromCharCode(parseInt(p.trim(),2));
        }).join('');
        binUpdating=true;
        document.getElementById('tb-bin-text').value=text;
        document.getElementById('tb-bin-err').textContent='';
        binUpdating=false;
      }catch(e){document.getElementById('tb-bin-err').textContent='Invalid binary input: '+e.message;binUpdating=false;}
    };

    function textToBase(text,base){
      return Array.from(text).map(c=>{
        const n=c.charCodeAt(0);
        return base===10?n:base===16?n.toString(16).toUpperCase().padStart(2,'0'):n.toString(8);
      }).join(' ');
    }
    function baseToText(coded,base){
      return coded.trim().split(/\s+/).map(s=>{
        const n=base===10?parseInt(s):parseInt(s,base);
        if(isNaN(n))throw new Error('Invalid');
        return String.fromCharCode(n);
      }).join('');
    }

    window.tbConvertBase = function(mode,dir) {
      const map={decimal:{base:10,textId:'tb-dec-text',outId:'tb-dec-out'},hex:{base:16,textId:'tb-hex-text',outId:'tb-hex-out'},octal:{base:8,textId:'tb-oct-text',outId:'tb-oct-out'}};
      const {base,textId,outId}=map[mode];
      try{
        if(dir==='text'){document.getElementById(outId).value=textToBase(document.getElementById(textId).value,base);}
        else{document.getElementById(textId).value=baseToText(document.getElementById(outId).value,base);}
      }catch(e){}
    };

    const MORSE_CODE = {'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',' ':'/','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.', '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--'};
    const MORSE_REV=Object.fromEntries(Object.entries(MORSE_CODE).map(([k,v])=>[v,k]));

    window.tbTextToMorse = function() {
      const text=document.getElementById('tb-morse-text').value.toUpperCase();
      const morse=Array.from(text).map(c=>MORSE_CODE[c]||'?').join(' ');
      document.getElementById('tb-morse-out').value=morse;
    };

    window.tbMorseToText = function() {
      const morse=document.getElementById('tb-morse-out').value.trim();
      const words=morse.split(' / ');
      const text=words.map(w=>w.split(' ').map(s=>MORSE_REV[s]||'?').join('')).join(' ');
      document.getElementById('tb-morse-text').value=text;
    };

    window.tbPlayMorse = function() {
      const morse=document.getElementById('tb-morse-out').value;
      if(!morse) return;
      try{
        const ctx=new AudioContext();
        let time=ctx.currentTime;
        const dot=0.1, dash=0.3, space=0.1;
        morse.split('').forEach(symbol=>{
          if(symbol==='.'||symbol==='-'){
            const osc=ctx.createOscillator();
            const gain=ctx.createGain();
            osc.connect(gain);gain.connect(ctx.destination);
            osc.frequency.value=600;
            const duration=symbol==='.'?dot:dash;
            osc.start(time);osc.stop(time+duration);
            time+=duration+space;
          } else if(symbol===' '){time+=space*3;}
          else if(symbol==='/'){time+=space*7;}
        });
      }catch(e){alert('Audio playback not supported.');}
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
