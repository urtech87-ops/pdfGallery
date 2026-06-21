# Phase 8 Setup — Utility Tools (10 Tools)

Run these WP-CLI commands on your WordPress install.
Replace `/path/to/wordpress` with your actual WP root.

## 0. Create the Utility Tools category

```bash
wp term create tool_category "Utility Tools" --slug=utility-tools
```

---

## Tool 1 — Color Picker

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Color Picker" \
  --post_name="color-picker" \
  --post_status=publish \
  --post_excerpt="Pick any color and instantly get HEX, RGB, HSL, CMYK and more. Full color picker with tints, shades, harmonies, and recently used colors." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "color-picker"
wp post meta update $ID _tg_action_label "Pick Color"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "🎨"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Choose a Color","desc":"Click the large color swatch to open your browser color picker, or type a HEX value directly."},{"step":"Adjust Opacity","desc":"Use the opacity slider to set the alpha channel from 0% to 100%."},{"step":"Copy Your Format","desc":"Click Copy next to any color format — HEX, RGB, RGBA, HSL, HSLA, HSV, or CMYK."}]'
wp post meta update $ID _tg_faqs '[{"q":"What color formats are supported?","a":"The tool shows HEX, RGB, RGBA, HSL, HSLA, HSV, and CMYK. All formats update simultaneously whenever you change the color or opacity."},{"q":"What are tints and shades?","a":"Tints are lighter versions of your color (mixed with white) and shades are darker versions (mixed with black). The tool shows 10 of each as clickable swatches."},{"q":"How does the harmony panel work?","a":"Color harmonies show related colors based on color theory: Complementary (opposite), Analogous (adjacent), Triadic (120° apart), and Tetradic (90° apart on the color wheel)."}]'
wp post meta update $ID _tg_features '[{"icon":"🔢","title":"7 Color Formats","desc":"Instantly see HEX, RGB, RGBA, HSL, HSLA, HSV, and CMYK with one-click copy buttons."},{"icon":"🎯","title":"Color Harmonies","desc":"Complementary, Analogous, Triadic, and Tetradic harmonies generated automatically."},{"icon":"🕐","title":"Recently Used","desc":"Last 10 colors saved to localStorage as clickable swatches for easy reuse."}]'
```

---

## Tool 2 — Color Palette Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Color Palette Generator" \
  --post_name="color-palette" \
  --post_status=publish \
  --post_excerpt="Generate beautiful color palettes from any base color. 10 palette types including Monochromatic, Complementary, Triadic, Pastel, and more. Export as CSS, JSON, or PNG." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "color-palette"
wp post meta update $ID _tg_action_label "Generate Palette"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "🖌️"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Choose Base Color","desc":"Pick a base color using the color picker. The palette updates live as you change it."},{"step":"Select Palette Type","desc":"Choose from 10 palette types: Monochromatic, Complementary, Analogous, Triadic, Tetradic, Split-Complementary, Random, Pastel, Dark, or Vibrant."},{"step":"Export Your Palette","desc":"Copy all HEX values, export as CSS variables, JSON, Tailwind config, or download as a PNG image."}]'
wp post meta update $ID _tg_faqs '[{"q":"What palette types are available?","a":"10 types: Monochromatic, Complementary, Analogous, Triadic, Tetradic, Split-Complementary, Random, Pastel, Dark, and Vibrant."},{"q":"How many colors can I generate?","a":"Choose 3, 5, 7, or 9 colors per palette. The Randomize button picks a random base color for inspiration."},{"q":"What export formats are available?","a":"Copy All HEX (comma-separated), Copy as CSS Custom Properties (--color-1 through --color-N), Copy as JSON array, Copy as Tailwind color config, or Download as PNG image."}]'
wp post meta update $ID _tg_features '[{"icon":"🎨","title":"10 Palette Types","desc":"Monochromatic, Complementary, Analogous, Triadic, Tetradic, Split-Complementary, Random, Pastel, Dark, and Vibrant."},{"icon":"📤","title":"Multiple Export Formats","desc":"Export as HEX list, CSS variables, JSON, Tailwind config, or PNG image."},{"icon":"🎲","title":"Randomize","desc":"Randomize base color with a single click to discover unexpected color combinations."}]'
```

---

## Tool 3 — Countdown Timer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Countdown Timer" \
  --post_name="countdown-timer" \
  --post_status=publish \
  --post_excerpt="Count down to any time or date with alerts. Features preset buttons, multiple simultaneous timers, progress bar, sound alert, and browser notifications." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "countdown-timer"
wp post meta update $ID _tg_action_label "Start Timer"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "⏳"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Set Duration or Target","desc":"Enter hours, minutes, and seconds for duration mode, or switch to Target Date mode and pick a future datetime."},{"step":"Start the Timer","desc":"Click Start or use a preset button (1 min, 5 min, 10 min, 25 min, etc.)."},{"step":"Get Alerted","desc":"When the timer ends you get a sound alert, screen flash, and browser notification if permitted."}]'
wp post meta update $ID _tg_faqs '[{"q":"Can I run multiple timers at once?","a":"Yes — click the + Add Timer button to stack up to 5 timers simultaneously, each with its own controls."},{"q":"What happens when the timer completes?","a":"The timer plays a triple beep sound, flashes the display red, and shows a browser notification if you granted permission."},{"q":"Does the timer show in the browser tab?","a":"Yes — the remaining time is shown in the browser tab title so you can see it even when the tab is in the background."}]'
wp post meta update $ID _tg_features '[{"icon":"⏰","title":"Dual Mode","desc":"Duration mode (H:M:S inputs) or Target Date mode (pick a specific future datetime)."},{"icon":"🔔","title":"Alerts","desc":"Sound alert using Web Audio API, screen flash, and browser notification on completion."},{"icon":"🔢","title":"Multiple Timers","desc":"Run up to 5 simultaneous countdown timers, each independently controlled."}]'
```

---

## Tool 4 — Stopwatch

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Stopwatch" \
  --post_name="stopwatch" \
  --post_status=publish \
  --post_excerpt="Precise stopwatch with lap times, split times, and statistics. Color-coded fastest and slowest laps. Export to CSV. Keyboard shortcuts included." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "stopwatch"
wp post meta update $ID _tg_action_label "Start Stopwatch"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "⏱️"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Start Timing","desc":"Click Start or press Space to begin. The display shows HH:MM:SS.ms using requestAnimationFrame for smooth millisecond updates."},{"step":"Record Laps","desc":"Click Lap or press L to record lap times. Each lap shows lap duration, cumulative split time, and difference from the previous lap."},{"step":"Export Results","desc":"Click Copy as Text to copy all lap times, or Download CSV to save a spreadsheet of your timing data."}]'
wp post meta update $ID _tg_faqs '[{"q":"What keyboard shortcuts are available?","a":"Space to Start/Pause, L to record a Lap, and R to Reset (only when paused). These work whenever the page is focused."},{"q":"How are fastest and slowest laps highlighted?","a":"The fastest lap row is highlighted green and the slowest lap row is highlighted red, making it easy to spot performance differences."},{"q":"What statistics are shown?","a":"Total elapsed time, number of laps, fastest lap, slowest lap, and average lap time — all shown below the lap table."}]'
wp post meta update $ID _tg_features '[{"icon":"🎯","title":"Smooth Display","desc":"Uses requestAnimationFrame for buttery-smooth millisecond display updates."},{"icon":"📊","title":"Lap Statistics","desc":"Automatic fastest (green) and slowest (red) lap highlighting with full statistics panel."},{"icon":"⌨️","title":"Keyboard Shortcuts","desc":"Space to start/pause, L for lap, R to reset — no mouse needed."}]'
```

---

## Tool 5 — Random Number Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Random Number Generator" \
  --post_name="random-number" \
  --post_status=publish \
  --post_excerpt="Generate random numbers, roll dice, flip coins, and pick random list items. Uses crypto.getRandomValues for cryptographic randomness." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "random-number"
wp post meta update $ID _tg_action_label "Generate"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "🎲"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Choose a Mode","desc":"Select Single Number, Multiple Numbers, Random from List, Dice Roller, or Coin Flip from the tabs."},{"step":"Configure Options","desc":"Set min/max range, count, allow duplicates, sort order, or paste a list of items to choose from."},{"step":"Generate and Copy","desc":"Click Generate to get your random result. Copy individual numbers or all results at once."}]'
wp post meta update $ID _tg_faqs '[{"q":"Is this truly random?","a":"Yes — all randomness uses the Web Crypto API (crypto.getRandomValues) which provides cryptographically secure random numbers, unlike Math.random()."},{"q":"Can I pick random items from a list?","a":"Yes — switch to the Random from List tab, paste your items (one per line), choose how many to pick and whether duplicates are allowed."},{"q":"What dice types are available?","a":"d4, d6, d8, d10, d12, d20, and d100 (percentile dice). Roll 1 to 10 dice at once with an animated result."}]'
wp post meta update $ID _tg_features '[{"icon":"🔐","title":"Cryptographic Randomness","desc":"Uses crypto.getRandomValues for true randomness, not Math.random()."},{"icon":"🎯","title":"5 Generator Modes","desc":"Single number, multiple numbers, random from list, dice roller, and coin flip."},{"icon":"📋","title":"History Tracking","desc":"Single number mode keeps a history of your last 10 results."}]'
```

---

## Tool 6 — Text Case Converter

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Text Case Converter" \
  --post_name="text-case" \
  --post_status=publish \
  --post_excerpt="Convert text between any case format instantly. UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case, and more." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "text-case"
wp post meta update $ID _tg_action_label "Convert Case"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "Aa"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Paste Your Text","desc":"Type or paste your text into the Input Text box. The character and word count update as you type."},{"step":"Click a Conversion","desc":"Click any of the 17 conversion buttons. The result appears instantly in the Output box."},{"step":"Copy or Swap","desc":"Click Copy Result to copy the output, or Swap to move the output back to the input for further conversions."}]'
wp post meta update $ID _tg_faqs '[{"q":"What case formats are supported?","a":"UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, SCREAMING_SNAKE_CASE, dot.case, path/case, Toggle Case, Alternating Case, plus Remove Extra Spaces, Remove Line Breaks, Remove Numbers, and Remove Special Characters."},{"q":"What is camelCase vs PascalCase?","a":"camelCase starts with a lowercase letter (myVariableName). PascalCase starts with uppercase (MyVariableName). Both are used in programming."},{"q":"Can I chain conversions?","a":"Yes — use the Swap button to move the output back to input, then apply another conversion on top."}]'
wp post meta update $ID _tg_features '[{"icon":"🔤","title":"17 Conversions","desc":"All common case formats plus cleanup options for spaces, line breaks, numbers, and special characters."},{"icon":"📊","title":"Live Character Count","desc":"Real-time character and word count for both input and output."},{"icon":"🔄","title":"Swap Input/Output","desc":"Instantly swap the input and output to chain multiple conversions."}]'
```

---

## Tool 7 — Line Break Remover

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Line Break Remover" \
  --post_name="line-break-remover" \
  --post_status=publish \
  --post_excerpt="Remove or replace line breaks from any text. Options for single, double, or all line breaks with live preview and replacement text support." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "line-break-remover"
wp post meta update $ID _tg_action_label "Remove Line Breaks"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "↵"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Paste Your Text","desc":"Paste text containing unwanted line breaks into the Input Text box."},{"step":"Choose Options","desc":"Select which line breaks to remove (single, double, all), enable extra cleanup options, and choose a replacement (nothing, space, or custom text)."},{"step":"Copy Output","desc":"The output updates live. Click Copy Output to copy the result or click Process to re-apply."}]'
wp post meta update $ID _tg_faqs '[{"q":"What is the difference between single and double line breaks?","a":"Single line breaks are individual newline characters (one empty line between paragraphs). Double line breaks are two consecutive newlines (creating visible blank lines). You can remove each type selectively."},{"q":"Can I replace line breaks with something instead of removing?","a":"Yes — choose to replace with nothing (removes), a space (joins lines), or any custom text you specify."},{"q":"What do the extra options do?","a":"Trim each line (remove leading/trailing spaces per line), collapse multiple spaces into one, remove completely empty lines, and trim the start and end of the entire text."}]'
wp post meta update $ID _tg_features '[{"icon":"⚡","title":"Live Preview","desc":"Output updates instantly as you type or change options — no button click needed."},{"icon":"🔧","title":"Flexible Options","desc":"Target single, double, or all line breaks independently with custom replacement text."},{"icon":"📊","title":"Stats Counter","desc":"Shows exactly how many line breaks and extra spaces were removed."}]'
```

---

## Tool 8 — Duplicate Line Remover

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Duplicate Line Remover" \
  --post_name="duplicate-remover" \
  --post_status=publish \
  --post_excerpt="Remove duplicate lines from text with smart options. Case sensitivity, fuzzy matching, keep first or last, sort output, and see unique vs duplicate lines." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "duplicate-remover"
wp post meta update $ID _tg_action_label "Remove Duplicates"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "🔁"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Paste Your Lines","desc":"Paste your text (one item per line) into the Input box. The tool processes automatically as you type."},{"step":"Set Options","desc":"Choose case sensitivity, whitespace trimming, keep first or last occurrence, sort order, and what to show (unique only, duplicates only, or both with count)."},{"step":"Copy or Swap","desc":"Copy the output or click Swap to bring the results back to the input for further processing."}]'
wp post meta update $ID _tg_faqs '[{"q":"What is fuzzy matching?","a":"Fuzzy matching uses Levenshtein distance to find lines that are at least 80% similar, even if not identical. This catches near-duplicates with minor typos or differences."},{"q":"Can I keep the last occurrence instead of the first?","a":"Yes — select Last occurrence in the Keep dropdown. When duplicates are found, the last one in the input is kept rather than the first."},{"q":"How do I see which lines were duplicates?","a":"Change the Show dropdown to Duplicates only to see only the lines that had duplicates, or Both with count to see all unique lines with a [x2] count for duplicated ones."}]'
wp post meta update $ID _tg_features '[{"icon":"🔍","title":"Fuzzy Matching","desc":"80% similarity threshold using Levenshtein distance to catch near-duplicates."},{"icon":"📊","title":"Detailed Stats","desc":"Input line count, output line count, and number of duplicates removed."},{"icon":"🔄","title":"Flexible Output","desc":"Show unique only, duplicates only, or all lines with occurrence counts."}]'
```

---

## Tool 9 — Text to Binary Converter

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Text to Binary Converter" \
  --post_name="text-binary" \
  --post_status=publish \
  --post_excerpt="Convert text to binary, decimal, hex, octal, and Morse code. Two-way conversion with Morse audio playback using Web Audio API." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "text-binary"
wp post meta update $ID _tg_action_label "Convert"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "01"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Choose Conversion Type","desc":"Select a tab: Text to Binary, Decimal, Hex, Octal, or Morse Code."},{"step":"Type or Paste Text","desc":"Enter text in the top box to convert to code, or enter code in the bottom box to convert back to text."},{"step":"Copy or Play","desc":"Copy the output to your clipboard. For Morse code, click Play to hear the code as audio tones."}]'
wp post meta update $ID _tg_faqs '[{"q":"What encoding does the binary converter use?","a":"The tool converts each character to its ASCII code point and represents it in binary. Choose between 8-bit (standard) or 7-bit representation and various separators (space, comma, newline, or none)."},{"q":"Can I convert binary back to text?","a":"Yes — type or paste binary in the output box and the tool automatically decodes it back to text."},{"q":"How does the Morse code audio work?","a":"It uses the Web Audio API to generate 600Hz sine wave tones. Dots play for 100ms, dashes for 300ms, with proper spacing between characters and words."}]'
wp post meta update $ID _tg_features '[{"icon":"🔄","title":"Two-Way Conversion","desc":"Convert text to code or code back to text in all 5 encoding modes."},{"icon":"🎵","title":"Morse Audio Playback","desc":"Hear your Morse code as proper audio tones using the Web Audio API."},{"icon":"🔢","title":"5 Encodings","desc":"Binary, Decimal, Hexadecimal, Octal, and Morse Code — all in one tool."}]'
```

---

## Tool 10 — Unit Converter

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Unit Converter" \
  --post_name="unit-converter" \
  --post_status=publish \
  --post_excerpt="Convert between all common units of measurement. 12 categories including Length, Weight, Temperature, Area, Volume, Speed, Time, Digital Storage, Energy, Pressure, Angle, and Fuel Economy." \
  --porcelain)

wp post term set $ID tool_category utility-tools
wp post meta update $ID _tg_tool_type "data-input"
wp post meta update $ID _tg_handler "unit-converter"
wp post meta update $ID _tg_action_label "Convert"
wp post meta update $ID _tg_accept_types ""
wp post meta update $ID _tg_icon "📐"
wp post meta update $ID _tg_multi_file "false"
wp post meta update $ID _tg_steps '[{"step":"Select a Category","desc":"Choose from 12 categories: Length, Weight, Temperature, Area, Volume, Speed, Time, Digital Storage, Energy, Pressure, Angle, or Fuel Economy."},{"step":"Enter Value and From Unit","desc":"Type your value and select the source unit. Results for all units in the category appear instantly."},{"step":"Copy Any Result","desc":"The results table shows conversions to all units simultaneously. Click Copy next to any row to copy that value."}]'
wp post meta update $ID _tg_faqs '[{"q":"What unit categories are included?","a":"12 categories: Length (10 units), Weight/Mass (9 units), Temperature (4 units), Area (10 units), Volume (11 units), Speed (6 units), Time (8 units), Digital Storage (7 units), Energy (7 units), Pressure (7 units), Angle (6 units), and Fuel Economy (4 units)."},{"q":"How does temperature conversion work?","a":"Temperature uses special formulas rather than simple ratios. Celsius, Fahrenheit, Kelvin, and Rankine are all supported with accurate conversion formulas."},{"q":"What is the highlighted row?","a":"The row matching your From Unit is highlighted in yellow so you can quickly identify your starting unit in the results table."}]'
wp post meta update $ID _tg_features '[{"icon":"📋","title":"All Results at Once","desc":"See conversions to all units simultaneously in a table — no need to convert one at a time."},{"icon":"🌡️","title":"Temperature Support","desc":"Celsius, Fahrenheit, Kelvin, and Rankine with accurate non-linear conversion formulas."},{"icon":"⚡","title":"Live Conversion","desc":"Results update instantly as you type — no button click required."}]'
```

---

## Verify all tools were created

```bash
wp post list --post_type=tg_tool --post_status=publish --fields=ID,post_title,post_name \
  --name__in=color-picker,color-palette,countdown-timer,stopwatch,random-number,text-case,line-break-remover,duplicate-remover,text-binary,unit-converter
```
