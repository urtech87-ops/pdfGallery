/* Color Palette Generator — Phase 8 Tool 2 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'color-palette', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.cpal-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin-bottom:16px}
.cpal-field label{display:block;font-size:13px;color:#555;margin-bottom:4px;font-weight:500}
.cpal-field select,.cpal-field input[type=color]{padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:14px}
.cpal-field input[type=color]{width:60px;height:36px;padding:2px;cursor:pointer}
.cpal-btn{padding:8px 18px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px}
.cpal-btn:hover{background:#005f8a}
.cpal-btn-rand{background:#6c757d}
.cpal-btn-rand:hover{background:#545b62}
.cpal-swatches{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.cpal-swatch-wrap{text-align:center}
.cpal-swatch{width:100px;height:100px;border-radius:8px;border:1px solid rgba(0,0,0,.1);margin-bottom:6px}
.cpal-swatch-hex{font-family:monospace;font-size:13px;color:#333}
.cpal-swatch-copy{margin-top:4px;padding:3px 10px;background:#0073aa;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px}
.cpal-export{display:flex;flex-wrap:wrap;gap:8px}
.cpal-export-btn{padding:6px 14px;background:#f0f0f0;color:#333;border:1px solid #ddd;border-radius:4px;cursor:pointer;font-size:13px}
.cpal-export-btn:hover{background:#e0e0e0}
</style>
<div class="cpal-controls">
  <div class="cpal-field">
    <label>Base Color</label>
    <input type="color" id="cpal-base" value="#3d9bf0">
  </div>
  <div class="cpal-field">
    <label>Palette Type</label>
    <select id="cpal-type">
      <option value="monochromatic">Monochromatic</option>
      <option value="complementary">Complementary</option>
      <option value="analogous">Analogous</option>
      <option value="triadic">Triadic</option>
      <option value="tetradic">Tetradic</option>
      <option value="split">Split-Complementary</option>
      <option value="random">Random</option>
      <option value="pastel">Pastel</option>
      <option value="dark">Dark</option>
      <option value="vibrant">Vibrant</option>
    </select>
  </div>
  <div class="cpal-field">
    <label>Count</label>
    <select id="cpal-count">
      <option value="3">3</option>
      <option value="5" selected>5</option>
      <option value="7">7</option>
      <option value="9">9</option>
    </select>
  </div>
  <button class="cpal-btn" onclick="cpalGenerate()">Generate Palette</button>
  <button class="cpal-btn cpal-btn-rand" onclick="cpalRandomize()">Randomize</button>
</div>
<div class="cpal-swatches" id="cpal-swatches"></div>
<div class="cpal-export">
  <button class="cpal-export-btn" onclick="cpalExport('hex')">Copy All HEX</button>
  <button class="cpal-export-btn" onclick="cpalExport('css')">Copy as CSS Variables</button>
  <button class="cpal-export-btn" onclick="cpalExport('json')">Copy as JSON</button>
  <button class="cpal-export-btn" onclick="cpalExport('tailwind')">Copy as Tailwind</button>
  <button class="cpal-export-btn" onclick="cpalExportPng()">Download PNG</button>
</div>`;

    let currentPalette = [];

    function hexToRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return{r,g,b};}
    function rgbToHex(r,g,b){return'#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');}
    function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h/=6;}return{h:h*360,s:s*100,l:l*100};}
    function hslToRgb(h,s,l){h/=360;s/=100;l/=100;let r,g,b;if(s===0){r=g=b=l;}else{function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);}return{r:Math.round(r*255),g:Math.round(g*255),b:Math.round(b*255)};}
    function makeHex(h,s,l){const{r,g,b}=hslToRgb(((h%360)+360)%360,Math.max(0,Math.min(100,s)),Math.max(0,Math.min(100,l)));return rgbToHex(r,g,b);}
    function secureRand(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/0xFFFFFFFF;}

    function generatePalette(baseHex, type, count) {
      const{r,g,b}=hexToRgb(baseHex);
      const{h,s,l}=rgbToHsl(r,g,b);
      const pal=[];
      switch(type){
        case 'monochromatic':
          for(let i=0;i<count;i++) pal.push(makeHex(h,s,10+i*(80/count)));
          break;
        case 'complementary':
          for(let i=0;i<count;i++){const flip=i%2===0;pal.push(makeHex(flip?h:h+180,s,20+i*(60/count)));}
          break;
        case 'analogous':
          for(let i=0;i<count;i++) pal.push(makeHex(h-30+i*(60/(count-1||1)),s,l));
          break;
        case 'triadic':
          for(let i=0;i<count;i++) pal.push(makeHex(h+i*(360/3),s,l));
          if(count>3) for(let i=3;i<count;i++) pal.push(makeHex(h+i*(360/3),s,l+10));
          break;
        case 'tetradic':
          for(let i=0;i<count;i++) pal.push(makeHex(h+i*(360/4),s,l));
          if(count>4) for(let i=4;i<count;i++) pal.push(makeHex(h+i*(360/4),s,l+10));
          break;
        case 'split':
          pal.push(makeHex(h,s,l));
          pal.push(makeHex(h+150,s,l));
          pal.push(makeHex(h+210,s,l));
          for(let i=3;i<count;i++) pal.push(makeHex(h+i*30,s,l+10));
          break;
        case 'random':
          for(let i=0;i<count;i++) pal.push(makeHex(secureRand()*360,40+secureRand()*50,30+secureRand()*40));
          break;
        case 'pastel':
          for(let i=0;i<count;i++) pal.push(makeHex(h+i*(360/count),30+secureRand()*20,75+secureRand()*10));
          break;
        case 'dark':
          for(let i=0;i<count;i++) pal.push(makeHex(h+i*(360/count),50+secureRand()*30,10+secureRand()*20));
          break;
        case 'vibrant':
          for(let i=0;i<count;i++) pal.push(makeHex(h+i*(360/count),85+secureRand()*15,45+secureRand()*15));
          break;
        default:
          pal.push(baseHex);
      }
      return pal.slice(0,count);
    }

    function renderSwatches(palette) {
      currentPalette = palette;
      document.getElementById('cpal-swatches').innerHTML=palette.map((hex,i)=>`
        <div class="cpal-swatch-wrap">
          <div class="cpal-swatch" style="background:${hex}"></div>
          <div class="cpal-swatch-hex">${hex}</div>
          <button class="cpal-swatch-copy" onclick="navigator.clipboard.writeText('${hex}')">Copy</button>
        </div>`).join('');
    }

    window.cpalGenerate = function() {
      const base=document.getElementById('cpal-base').value;
      const type=document.getElementById('cpal-type').value;
      const count=parseInt(document.getElementById('cpal-count').value);
      renderSwatches(generatePalette(base,type,count));
    };

    window.cpalRandomize = function() {
      const bytes=new Uint8Array(3);
      crypto.getRandomValues(bytes);
      const hex='#'+Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
      document.getElementById('cpal-base').value=hex;
      cpalGenerate();
    };

    window.cpalExport = function(format) {
      let text='';
      if(format==='hex') text=currentPalette.join(', ');
      else if(format==='css') text=currentPalette.map((c,i)=>`--color-${i+1}: ${c};`).join('\n');
      else if(format==='json') text=JSON.stringify(currentPalette,null,2);
      else if(format==='tailwind') text=`colors: {\n${currentPalette.map((c,i)=>`  'palette-${i+1}': '${c}',`).join('\n')}\n}`;
      navigator.clipboard.writeText(text);
    };

    window.cpalExportPng = function() {
      const canvas=document.createElement('canvas');
      const sw=100, pad=10;
      canvas.width=currentPalette.length*(sw+pad)+pad;
      canvas.height=120;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      currentPalette.forEach((hex,i)=>{
        ctx.fillStyle=hex;
        ctx.fillRect(pad+i*(sw+pad),pad,sw,80);
        ctx.fillStyle='#333';
        ctx.font='12px monospace';
        ctx.textAlign='center';
        ctx.fillText(hex,pad+i*(sw+pad)+sw/2,110);
      });
      const a=document.createElement('a');
      a.href=canvas.toDataURL('image/png');
      a.download='palette.png';
      a.click();
    };

    document.getElementById('cpal-base').addEventListener('input', cpalGenerate);
    document.getElementById('cpal-type').addEventListener('change', cpalGenerate);
    document.getElementById('cpal-count').addEventListener('change', cpalGenerate);
    cpalGenerate();
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
