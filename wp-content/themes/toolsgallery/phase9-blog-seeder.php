<?php
/**
 * Phase 9 Blog Post Seeder
 * Run once via: wp eval-file wp-content/themes/toolsgallery/phase9-blog-seeder.php
 * Delete this file after running.
 */

if (!defined('ABSPATH')) exit;

// Create blog categories
$categories = [
    ['name' => 'PDF Guides',       'slug' => 'pdf-guides'],
    ['name' => 'Image Guides',     'slug' => 'image-guides'],
    ['name' => 'AI Writing Guides','slug' => 'ai-writing-guides'],
    ['name' => 'Tool Tips',        'slug' => 'tool-tips'],
];

$cat_ids = [];
foreach ($categories as $cat) {
    $existing = get_term_by('slug', $cat['slug'], 'category');
    if ($existing) {
        $cat_ids[$cat['slug']] = $existing->term_id;
    } else {
        $result = wp_insert_term($cat['name'], 'category', ['slug' => $cat['slug']]);
        if (!is_wp_error($result)) {
            $cat_ids[$cat['slug']] = $result['term_id'];
            echo "Created category: {$cat['name']}\n";
        }
    }
}

// Blog Posts
$posts = [
    [
        'title'   => 'How to Merge PDF Files Online Free (Step-by-Step Guide 2025)',
        'slug'    => 'how-to-merge-pdf-files-online-free',
        'keyword' => 'merge pdf files online free',
        'cat'     => 'pdf-guides',
        'content' => <<<EOC
<h2>What Does Merging PDFs Mean?</h2>
<p>Merging PDF files means combining two or more separate PDF documents into a single, unified PDF file. Whether you're consolidating reports, combining scanned pages, or assembling a multi-chapter document, a PDF merger makes the process instant and effortless.</p>
<p>People merge PDFs for dozens of reasons: combining invoices, joining resume pages, assembling a portfolio, or creating a single document from multiple contracts. Traditionally, this required expensive desktop software. Today, you can merge PDFs online for free — no software required.</p>

<h2>Why Use an Online PDF Merger?</h2>
<p>Online PDF mergers have several advantages over desktop software:</p>
<ul>
<li><strong>No installation required</strong> — works entirely in your browser</li>
<li><strong>Free to use</strong> — no subscription or payment needed</li>
<li><strong>Works on any device</strong> — desktop, tablet, or phone</li>
<li><strong>Fast</strong> — merge files in seconds, not minutes</li>
<li><strong>Private</strong> — with browser-based tools like Tool Acadmy, your files never leave your device</li>
</ul>

<h2>How to Merge PDF Files on Tool Acadmy (Step-by-Step)</h2>
<p>Tool Acadmy's free Merge PDF tool lets you combine unlimited PDFs directly in your browser. Here's how:</p>
<ol>
<li><strong>Go to the Merge PDF tool</strong> at Tool Acadmy.</li>
<li><strong>Upload your PDF files</strong> — click "Drop your files here" or drag and drop multiple PDFs.</li>
<li><strong>Arrange the order</strong> — drag files up or down to set the page order you want.</li>
<li><strong>Click "Merge PDF"</strong> — the tool combines all files instantly.</li>
<li><strong>Download your merged PDF</strong> — it's saved directly to your device.</li>
</ol>
<p>The entire process takes under 30 seconds for most documents. No signup, no email required, no file size limits.</p>

<div class="tg-cta-box" style="background:#fff7ed;border:2px solid #F97316;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
<p><strong>Ready to merge your PDFs?</strong></p>
<a href="/tool/merge-pdf/" class="tg-btn tg-btn--primary">Merge PDF Free — No Signup</a>
</div>

<h2>How to Merge PDF Files on Mobile</h2>
<p>Tool Acadmy works perfectly on mobile browsers — Chrome, Safari, Firefox. Simply:</p>
<ol>
<li>Open your mobile browser and visit the Merge PDF tool page.</li>
<li>Tap "Browse" to select files from your phone's storage or cloud.</li>
<li>Arrange the order by tapping and dragging.</li>
<li>Tap "Merge PDF" and download the result.</li>
</ol>
<p>On iOS, you can find downloaded files in the Files app. On Android, check your Downloads folder.</p>

<h2>How to Merge PDF Files on a Mac or Windows PC</h2>
<p>The browser-based approach works identically on Mac and Windows. Just open Chrome, Firefox, Safari, or Edge, go to the Merge PDF tool, and follow the same steps above. No Adobe Acrobat or other paid software needed.</p>

<h2>Common Questions About Merging PDFs</h2>

<h3>Is it safe to merge PDFs online?</h3>
<p>Yes — especially with Tool Acadmy, which processes all files locally in your browser. Your PDFs are never uploaded to any server, so there is zero privacy risk.</p>

<h3>Is there a file size limit?</h3>
<p>Tool Acadmy's browser-based merger has no hard file size limit. Very large files (500MB+) may take longer to process depending on your device's RAM.</p>

<h3>Can I merge password-protected PDFs?</h3>
<p>You'll need to unlock the PDF first (use our free Unlock PDF tool), then merge the unlocked copies.</p>

<h3>Will merging reduce PDF quality?</h3>
<p>No. Tool Acadmy's merger preserves all original content, fonts, images, and formatting at full quality.</p>

<h3>How many PDFs can I merge at once?</h3>
<p>You can merge as many PDFs as your browser memory allows — typically 20–50 files with ease.</p>

<h2>Related PDF Tools You Might Need</h2>
<ul>
<li><a href="/tool/split-pdf/">Split PDF</a> — Separate a large PDF into individual pages or ranges</li>
<li><a href="/tool/compress-pdf/">Compress PDF</a> — Reduce file size after merging</li>
<li><a href="/tool/rotate-pdf/">Rotate PDF</a> — Fix page orientation before merging</li>
</ul>

<h2>Conclusion</h2>
<p>Merging PDFs online has never been easier or more private. Tool Acadmy's free Merge PDF tool runs entirely in your browser, combines files in seconds, and never touches your data. Next time you need to combine PDF documents, skip the expensive software — use Tool Acadmy for free.</p>
EOC,
    ],
    [
        'title'   => 'How to Compress a PDF Without Losing Quality (Free Methods)',
        'slug'    => 'how-to-compress-pdf-without-losing-quality',
        'keyword' => 'compress pdf without losing quality',
        'cat'     => 'pdf-guides',
        'content' => <<<EOC
<h2>Why Compress a PDF?</h2>
<p>PDF files can become very large, especially when they contain high-resolution images, embedded fonts, or multiple scanned pages. Large PDFs are hard to email (most email providers limit attachments to 25MB), slow to upload, and eat up storage space. Compressing a PDF reduces its file size while keeping the content readable and the visuals crisp.</p>

<h2>What Causes Large PDF File Sizes?</h2>
<ul>
<li><strong>High-resolution embedded images</strong> — the main culprit in most large PDFs</li>
<li><strong>Embedded fonts</strong> — especially large CJK (Chinese/Japanese/Korean) font sets</li>
<li><strong>Scanned pages</strong> — raw scans without OCR optimization</li>
<li><strong>Unnecessary metadata</strong> — revision history, thumbnails, comments</li>
<li><strong>Uncompressed streams</strong> — older PDF creation tools sometimes skip compression</li>
</ul>

<h2>How to Compress a PDF Without Losing Quality — Free Methods</h2>

<h3>Method 1: Use Tool Acadmy's Free PDF Compressor (Recommended)</h3>
<ol>
<li>Go to the <a href="/tool/compress-pdf/">Compress PDF tool</a> on Tool Acadmy.</li>
<li>Upload your PDF file.</li>
<li>Select your compression level: Low (best quality), Medium (balanced), or High (smallest size).</li>
<li>Click "Compress PDF" and download the result.</li>
</ol>
<p>For most documents, the "Medium" setting reduces file size by 60–80% with no visible quality loss. The tool runs in your browser — nothing is uploaded.</p>

<div class="tg-cta-box" style="background:#fff7ed;border:2px solid #F97316;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
<a href="/tool/compress-pdf/" class="tg-btn tg-btn--primary">Compress PDF Free — No Signup</a>
</div>

<h3>Method 2: Use Google Chrome's Built-in Print to PDF</h3>
<ol>
<li>Open the PDF in Chrome.</li>
<li>Press Ctrl+P (Cmd+P on Mac).</li>
<li>Set destination to "Save as PDF".</li>
<li>Click Save — Chrome re-renders the PDF at a smaller size.</li>
</ol>
<p>This method works well for text-heavy PDFs but may reduce image quality.</p>

<h3>Method 3: Use Preview on Mac</h3>
<ol>
<li>Open the PDF in Preview.</li>
<li>Go to File → Export as PDF.</li>
<li>Click the Quartz Filter dropdown and select "Reduce File Size".</li>
<li>Save the file.</li>
</ol>
<p>Note: Mac's built-in filter can be aggressive and may visibly reduce image quality.</p>

<h2>How Much Can You Compress a PDF?</h2>
<p>Typical results with Tool Acadmy's compressor:</p>
<ul>
<li>Image-heavy PDFs: 60–85% size reduction</li>
<li>Scanned documents: 50–70% reduction</li>
<li>Text-only PDFs: 10–30% reduction (already efficient)</li>
<li>Presentation PDFs: 40–65% reduction</li>
</ul>

<h2>Quality Levels Explained</h2>
<ul>
<li><strong>Low compression / High quality</strong>: Minimal size reduction, maximum quality. Use for PDFs that will be printed professionally.</li>
<li><strong>Medium compression / Balanced</strong>: Best balance for most use cases — sharing via email or uploading online.</li>
<li><strong>High compression / Smaller file</strong>: Maximum size reduction. Some image quality loss may be visible. Good for archiving or sharing over slow connections.</li>
</ul>

<h2>Frequently Asked Questions</h2>

<h3>Does compressing a PDF damage the text?</h3>
<p>No. PDF compression primarily targets images and embedded objects. Text data is already stored efficiently in PDF and is not affected by compression.</p>

<h3>Can I compress a PDF multiple times?</h3>
<p>You can, but each pass yields diminishing returns. Compress once at your desired quality level for the best result.</p>

<h3>What's the difference between online and desktop PDF compressors?</h3>
<p>Desktop tools like Adobe Acrobat Pro offer more control over individual settings (DPI, color spaces, etc.) but cost money. Online tools like Tool Acadmy's compressor handle 95% of everyday compression needs for free, instantly.</p>

<h2>Related Tools</h2>
<ul>
<li><a href="/tool/merge-pdf/">Merge PDF</a> — Combine multiple PDFs into one</li>
<li><a href="/tool/compress-image/">Compress Image</a> — Reduce image file size before converting to PDF</li>
<li><a href="/tool/pdf-to-jpg/">PDF to JPG</a> — Extract pages as images</li>
</ul>

<h2>Conclusion</h2>
<p>Compressing a PDF without losing quality is easy with the right tool. Tool Acadmy's free PDF compressor delivers professional-grade compression directly in your browser, with no file uploads and no signup. Try it now and reduce your PDF file size by up to 85%.</p>
EOC,
    ],
    [
        'title'   => 'Best Free Image Background Remover Online (No Signup Needed)',
        'slug'    => 'best-free-image-background-remover-online',
        'keyword' => 'free image background remover online',
        'cat'     => 'image-guides',
        'content' => <<<EOC
<h2>What Is an Image Background Remover?</h2>
<p>An image background remover is a tool that automatically detects the subject of a photo and removes the background, leaving you with a transparent PNG or a custom-colored background. This is essential for product photography, profile pictures, design work, and creating professional visuals for websites and social media.</p>

<h2>Why Remove Image Backgrounds Online?</h2>
<ul>
<li><strong>E-commerce product photos</strong> — white or transparent backgrounds look professional and are required by most marketplaces</li>
<li><strong>Profile pictures</strong> — remove messy backgrounds from headshots</li>
<li><strong>Presentations and designs</strong> — place subjects on custom backgrounds</li>
<li><strong>Logos and stickers</strong> — create transparent-background versions of images</li>
<li><strong>Social media content</strong> — create eye-catching graphics quickly</li>
</ul>

<h2>How to Remove an Image Background for Free on Tool Acadmy</h2>
<ol>
<li>Go to the <a href="/tool/background-remover/">Background Remover tool</a>.</li>
<li>Upload your image (supports JPG, PNG, WebP).</li>
<li>The tool automatically detects and removes the background.</li>
<li>Preview the result — adjust if needed.</li>
<li>Download as a transparent PNG or add a custom color background.</li>
</ol>
<p>The entire process takes 2–5 seconds. No signup, no watermarks, completely free.</p>

<div class="tg-cta-box" style="background:#fff7ed;border:2px solid #F97316;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
<a href="/tool/background-remover/" class="tg-btn tg-btn--primary">Remove Background Free — No Signup</a>
</div>

<h2>Tips for Best Background Removal Results</h2>
<ul>
<li><strong>Use good contrast</strong> — images where the subject clearly differs from the background give the best results</li>
<li><strong>Avoid busy backgrounds</strong> — plain or simple backgrounds are easier to remove cleanly</li>
<li><strong>Use high-resolution images</strong> — more detail means more accurate edge detection around hair, fur, and fine details</li>
<li><strong>PNG format</strong> — always save the output as PNG to preserve transparency</li>
</ul>

<h2>Which Types of Images Work Best?</h2>
<ul>
<li>Product photos on plain backgrounds — excellent results</li>
<li>Portrait photos (headshots) — very good</li>
<li>Animals with fur — good, especially with high contrast</li>
<li>Complex scenes with multiple overlapping subjects — more challenging</li>
</ul>

<h2>Frequently Asked Questions</h2>

<h3>Is the background remover completely free?</h3>
<p>Yes. Tool Acadmy's background remover is 100% free, with no usage limits, no watermarks, and no signup required.</p>

<h3>What image formats are supported?</h3>
<p>JPG, PNG, WebP, and most common image formats are supported.</p>

<h3>Will my image be uploaded to a server?</h3>
<p>No. Tool Acadmy processes images locally in your browser. Your photos never leave your device.</p>

<h3>What resolution should my image be?</h3>
<p>Any resolution works, but higher resolution (1MP+) gives cleaner edges around detailed subjects like hair.</p>

<h2>Related Image Tools</h2>
<ul>
<li><a href="/tool/resize-image/">Resize Image</a> — Resize to any dimension</li>
<li><a href="/tool/compress-image/">Compress Image</a> — Reduce file size</li>
<li><a href="/tool/crop-image/">Crop Image</a> — Crop to the perfect size</li>
</ul>

<h2>Conclusion</h2>
<p>Removing image backgrounds no longer requires Photoshop or expensive subscriptions. Tool Acadmy's free background remover delivers accurate, clean results for product photos, portraits, and more — entirely in your browser, with no signup required. Try it now and see the difference in seconds.</p>
EOC,
    ],
    [
        'title'   => 'How to Convert JPG to PDF Free Online (Any Device, Any Browser)',
        'slug'    => 'how-to-convert-jpg-to-pdf-free-online',
        'keyword' => 'convert jpg to pdf free online',
        'cat'     => 'pdf-guides',
        'content' => <<<EOC
<h2>Why Convert JPG to PDF?</h2>
<p>Converting JPG (and other image formats) to PDF is one of the most common document tasks people perform online. The reasons are numerous:</p>
<ul>
<li><strong>Professional appearance</strong> — PDFs look the same on any device and in any printer</li>
<li><strong>Combining multiple images</strong> — turn a stack of scanned pages into a single document</li>
<li><strong>Email and sharing</strong> — PDFs are universally accepted where images may not be</li>
<li><strong>Form submission</strong> — many official forms require PDF format</li>
<li><strong>Archiving</strong> — PDFs are a more durable long-term format for documents</li>
</ul>

<h2>How to Convert JPG to PDF Free Online — Step by Step</h2>
<ol>
<li>Go to the <a href="/tool/jpg-to-pdf/">JPG to PDF converter</a> on Tool Acadmy.</li>
<li>Click "Drop your file here" or drag and drop one or more JPG images.</li>
<li>Arrange the image order if you're converting multiple images.</li>
<li>Select your page size (A4, Letter, or match image size) and orientation.</li>
<li>Click "Convert to PDF" — the conversion happens instantly in your browser.</li>
<li>Download your PDF file.</li>
</ol>

<div class="tg-cta-box" style="background:#fff7ed;border:2px solid #F97316;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
<a href="/tool/jpg-to-pdf/" class="tg-btn tg-btn--primary">Convert JPG to PDF Free — No Signup</a>
</div>

<h2>How to Convert JPG to PDF on iPhone and Android</h2>
<h3>On iPhone (iOS Safari):</h3>
<ol>
<li>Open Safari and go to Tool Acadmy's JPG to PDF tool.</li>
<li>Tap "Browse" and select your photos from Camera Roll.</li>
<li>Tap "Convert to PDF" and then "Download".</li>
<li>The PDF is saved to your Files app.</li>
</ol>

<h3>On Android (Chrome):</h3>
<ol>
<li>Open Chrome and go to the JPG to PDF tool.</li>
<li>Tap "Browse" and select images from your Gallery.</li>
<li>Tap "Convert to PDF" and download the file.</li>
<li>Find it in your Downloads folder.</li>
</ol>

<h2>How to Convert Multiple JPG Images to One PDF</h2>
<p>Tool Acadmy's converter supports multi-file upload. Simply:</p>
<ol>
<li>Enable "multi" mode by uploading more than one image.</li>
<li>All images are combined into a single PDF in the order you arrange them.</li>
<li>Each image becomes one page in the output PDF.</li>
</ol>

<h2>What Image Formats Can Be Converted to PDF?</h2>
<p>In addition to JPG (JPEG), Tool Acadmy also supports:</p>
<ul>
<li>PNG to PDF</li>
<li>WebP to PDF</li>
<li>BMP to PDF</li>
<li>GIF to PDF (first frame)</li>
</ul>

<h2>Common Questions</h2>

<h3>Is the JPG to PDF converter free?</h3>
<p>Yes, completely free. No subscription, no watermarks, no signup.</p>

<h3>Will the image quality be preserved?</h3>
<p>Yes. Tool Acadmy embeds your images at their original resolution. The PDF output is as sharp as the source image.</p>

<h3>Is there a file size limit?</h3>
<p>There's no hard limit. Very large images (20MB+) may take a few seconds to process, but there's no cap.</p>

<h3>Can I convert scanned images to a searchable PDF?</h3>
<p>Currently, this tool creates image-based PDFs. For OCR (optical character recognition) to make text searchable, a different tool is needed.</p>

<h2>Related Tools</h2>
<ul>
<li><a href="/tool/pdf-to-jpg/">PDF to JPG</a> — Extract PDF pages as images</li>
<li><a href="/tool/merge-pdf/">Merge PDF</a> — Combine multiple PDFs</li>
<li><a href="/tool/compress-pdf/">Compress PDF</a> — Reduce PDF file size</li>
</ul>

<h2>Conclusion</h2>
<p>Converting JPG to PDF is simple and free with Tool Acadmy. The tool works in any browser on any device — no app, no software, no signup. Whether you have one image or fifty, you'll have a professional PDF ready to share in seconds.</p>
EOC,
    ],
    [
        'title'   => 'Free Grammar Checker Online — Fix Errors Instantly (2025)',
        'slug'    => 'free-grammar-checker-online',
        'keyword' => 'free grammar checker online',
        'cat'     => 'ai-writing-guides',
        'content' => <<<EOC
<h2>Why Does Grammar Matter Online?</h2>
<p>Poor grammar damages credibility. Studies show that readers trust content less when it contains grammar and spelling errors — whether on a website, in a business email, or in an academic paper. A free online grammar checker catches errors you'd otherwise miss, improving the quality and professionalism of everything you write.</p>

<h2>What Is a Grammar Checker?</h2>
<p>A grammar checker is a tool that analyzes text for grammatical errors, spelling mistakes, punctuation issues, and style problems. Modern AI-powered grammar checkers go further, identifying awkward phrasing, passive voice overuse, run-on sentences, and readability issues.</p>

<h2>How to Use Tool Acadmy's Free Grammar Checker</h2>
<ol>
<li>Go to the <a href="/tool/grammar-checker/">Grammar Checker tool</a>.</li>
<li>Paste or type your text into the input box.</li>
<li>Click "Check Grammar".</li>
<li>Review highlighted errors and suggestions.</li>
<li>Accept or reject each suggestion.</li>
<li>Copy the corrected text.</li>
</ol>
<p>The tool handles texts of any length — from a single sentence to a full article. No signup, no word limits, completely free.</p>

<div class="tg-cta-box" style="background:#fff7ed;border:2px solid #F97316;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
<a href="/tool/grammar-checker/" class="tg-btn tg-btn--primary">Check Grammar Free — No Signup</a>
</div>

<h2>Types of Errors a Grammar Checker Catches</h2>
<ul>
<li><strong>Spelling mistakes</strong> — typos, misspellings, auto-correct errors</li>
<li><strong>Grammar errors</strong> — subject-verb agreement, wrong tense, misplaced modifiers</li>
<li><strong>Punctuation errors</strong> — missing commas, incorrect apostrophes, run-on sentences</li>
<li><strong>Style issues</strong> — passive voice, wordiness, repetitive phrases</li>
<li><strong>Clarity problems</strong> — confusing sentence structure</li>
</ul>

<h2>Grammar Checker for Different Use Cases</h2>

<h3>Business Emails and Professional Communication</h3>
<p>Always grammar-check important emails before sending. A single error in a client proposal or business email can undermine your professional image. Use the grammar checker to review critical communications.</p>

<h3>Academic Writing</h3>
<p>Grammar checkers help students and researchers catch errors in essays, reports, and papers. Run your draft through the checker before submission to avoid losing marks on avoidable mistakes.</p>

<h3>Blog and Website Content</h3>
<p>Search engines favor well-written content. Grammar errors can also increase bounce rate as readers lose confidence in the content. Always grammar-check web content before publishing.</p>

<h3>Social Media Captions</h3>
<p>Short texts matter too. A grammar error in a tweet or Instagram caption can go viral for the wrong reasons. Quick-check social content with the grammar tool.</p>

<h2>Common English Grammar Mistakes to Avoid</h2>
<ul>
<li><strong>Their / There / They're</strong> — three different words, same sound</li>
<li><strong>Your / You're</strong> — possessive vs. contraction</li>
<li><strong>Its / It's</strong> — possessive vs. "it is"</li>
<li><strong>Effect / Affect</strong> — noun vs. verb (usually)</li>
<li><strong>Then / Than</strong> — time vs. comparison</li>
<li><strong>Fewer / Less</strong> — countable vs. uncountable nouns</li>
<li><strong>Lie / Lay</strong> — one of the most confused verb pairs in English</li>
</ul>

<h2>Frequently Asked Questions</h2>

<h3>Is the grammar checker completely free?</h3>
<p>Yes. Tool Acadmy's grammar checker is 100% free with no word limits, no signup, and no watermarks on output.</p>

<h3>Does the grammar checker work for non-native English speakers?</h3>
<p>Absolutely. The tool is designed to help both native and non-native speakers improve their English writing.</p>

<h3>Is the grammar checker available in other languages?</h3>
<p>Currently, the tool focuses on English. Support for additional languages may be added in future updates.</p>

<h3>How accurate is the AI grammar checker?</h3>
<p>Our grammar checker uses advanced AI to achieve high accuracy, but like all AI tools, it may occasionally suggest changes that aren't strictly necessary. Always review suggestions in context.</p>

<h2>Related AI Writing Tools</h2>
<ul>
<li><a href="/tool/paraphraser/">Paraphraser</a> — Rewrite text in a fresh style</li>
<li><a href="/tool/ai-humanizer/">AI Humanizer</a> — Make AI-written text sound natural</li>
<li><a href="/tool/content-summarizer/">Content Summarizer</a> — Condense long text to key points</li>
</ul>

<h2>Conclusion</h2>
<p>Good grammar is the foundation of clear, professional communication. Tool Acadmy's free online grammar checker catches the errors that spell-check misses — grammatical issues, style problems, and clarity improvements — helping you write better in minutes. Best of all, it's completely free, works in any browser, and requires no signup. Check your writing today.</p>
EOC,
    ],
];

// Insert posts
foreach ($posts as $p) {
    // Check if post already exists
    $existing = get_page_by_path($p['slug'], OBJECT, 'post');
    if ($existing) {
        echo "Skipping (exists): {$p['title']}\n";
        continue;
    }

    $post_id = wp_insert_post([
        'post_title'   => $p['title'],
        'post_name'    => $p['slug'],
        'post_content' => $p['content'],
        'post_status'  => 'publish',
        'post_type'    => 'post',
        'post_category' => [$cat_ids[$p['cat']] ?? 0],
    ]);

    if (is_wp_error($post_id)) {
        echo "Error creating: {$p['title']} — " . $post_id->get_error_message() . "\n";
        continue;
    }

    // Set focus keyword for RankMath
    update_post_meta($post_id, 'rank_math_focus_keyword', $p['keyword']);

    echo "Created post ID {$post_id}: {$p['title']}\n";
}

// Set focus keywords for all tg_tool posts
$tools = get_posts(['post_type' => 'tg_tool', 'posts_per_page' => -1, 'fields' => 'ids']);
foreach ($tools as $tool_id) {
    $name    = strtolower(get_the_title($tool_id));
    $keyword = 'free online ' . $name;
    update_post_meta($tool_id, 'rank_math_focus_keyword', $keyword);
    update_post_meta($tool_id, 'rank_math_robots', ['index', 'follow']);
}
echo 'Set focus keywords and robots for ' . count($tools) . " tools.\n";

echo "Phase 9 blog seeder complete.\n";
