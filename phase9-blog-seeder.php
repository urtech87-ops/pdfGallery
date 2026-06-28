<?php
/**
 * Phase 9 Blog Seeder
 * Run with: wp eval-file phase9-blog-seeder.php
 * Creates 5 SEO blog posts + sets focus keywords
 * for all 150+ tools
 */

echo "=== Phase 9 Blog Seeder Starting ===\n\n";

// =============================================
// BLOG CATEGORIES
// =============================================
echo "Creating blog categories...\n";

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
    echo "  Category exists: {$cat['name']}\n";
  } else {
    $result = wp_insert_term($cat['name'], 'category',
      ['slug' => $cat['slug']]);
    if (!is_wp_error($result)) {
      $cat_ids[$cat['slug']] = $result['term_id'];
      echo "  Created: {$cat['name']}\n";
    }
  }
}

// =============================================
// BLOG POSTS
// =============================================
$posts = [

  // POST 1
  [
    'title'    => 'How to Merge PDF Files Online Free (Step-by-Step Guide 2025)',
    'slug'     => 'how-to-merge-pdf-files-online-free',
    'keyword'  => 'merge pdf files online free',
    'category' => 'pdf-guides',
    'content'  => '
<p>Merging PDF files is one of the most common document tasks people need to do every day. Whether you are combining a report with its appendix, merging scanned pages into one document, or assembling a portfolio, knowing how to merge PDF files online free can save you a lot of time and money.</p>

<p>In this complete guide, we will show you exactly how to merge PDF files using Tool Acadmy\'s free online PDF merger — no software download, no signup, and no cost.</p>

<h2>Why Merge PDF Files?</h2>
<p>There are many reasons why you might need to combine multiple PDF files into one:</p>
<ul>
<li>Combining multiple chapters of a report into one document</li>
<li>Merging scanned pages from a multi-page document</li>
<li>Assembling a portfolio from separate PDF files</li>
<li>Combining invoices or receipts for accounting</li>
<li>Joining presentation slides from multiple sources</li>
<li>Merging contracts and their addendums</li>
</ul>

<h2>Why Use an Online PDF Merger?</h2>
<p>Traditional PDF software like Adobe Acrobat costs hundreds of dollars per year. Online PDF mergers solve this problem by letting you merge PDF files directly in your browser for free. Here are the key advantages:</p>
<ul>
<li><strong>Free:</strong> No subscription or one-time payment required</li>
<li><strong>No download:</strong> Works directly in your browser</li>
<li><strong>Fast:</strong> Merge files in seconds</li>
<li><strong>Private:</strong> Files processed locally on your device</li>
<li><strong>Cross-platform:</strong> Works on Windows, Mac, Linux, and mobile</li>
</ul>

<h2>How to Merge PDF Files on Tool Acadmy</h2>
<p>Follow these simple steps to merge your PDF files for free:</p>

<h3>Step 1: Open the PDF Merger Tool</h3>
<p>Visit the <a href="/tool/merge-pdf/">free PDF merger tool</a> on Tool Acadmy. No signup or account is required.</p>

<h3>Step 2: Upload Your PDF Files</h3>
<p>Click the upload zone or drag and drop your PDF files into it. You can upload multiple files at once. The tool supports files up to several hundred MB in size.</p>

<h3>Step 3: Arrange the Order</h3>
<p>After uploading, your PDF files will appear in a list. Drag and drop them to reorder them in the sequence you want in the final merged document.</p>

<h3>Step 4: Merge and Download</h3>
<p>Click the Merge PDF button. The tool processes your files entirely in your browser using PDF-lib — a powerful JavaScript PDF library. Once complete, your merged PDF downloads automatically.</p>

<h2>How to Merge PDF Files on Mobile</h2>
<p>Tool Acadmy works on all modern mobile browsers including Chrome for Android and Safari for iOS. Simply open the tool on your phone, tap the upload zone, select your PDF files from your device storage, and follow the same steps above.</p>

<h2>Tips for Better PDF Merging</h2>
<ul>
<li>Make sure all files are actual PDFs, not images named with a .pdf extension</li>
<li>Check file sizes — very large files may take longer to process</li>
<li>Arrange files in the correct order before merging</li>
<li>If a PDF is password-protected, unlock it first using the PDF Unlock tool</li>
</ul>

<h2>Common Questions About Merging PDFs</h2>

<h3>Is it safe to merge PDFs online?</h3>
<p>Yes — Tool Acadmy processes all files locally in your browser using JavaScript. Your files are never uploaded to any server. They never leave your device, so your documents remain completely private.</p>

<h3>How many PDF files can I merge at once?</h3>
<p>Tool Acadmy supports merging multiple PDF files in a single operation. For very large batches, merge in groups of 10 for best performance.</p>

<h3>Will merging PDFs reduce quality?</h3>
<p>No. The merger combines PDF files without re-encoding or compressing the content. The output quality is identical to the input files.</p>

<h3>Can I merge password-protected PDFs?</h3>
<p>Password-protected PDFs need to be unlocked before merging. Use the <a href="/tool/unlock-pdf/">free PDF Unlock tool</a> first, then merge.</p>

<h2>Related PDF Tools You Might Need</h2>
<ul>
<li><a href="/tool/split-pdf/">Split PDF</a> — Split one PDF into multiple files</li>
<li><a href="/tool/compress-pdf/">Compress PDF</a> — Reduce PDF file size</li>
<li><a href="/tool/pdf-to-jpg/">PDF to JPG</a> — Convert PDF pages to images</li>
<li><a href="/tool/rotate-pdf/">Rotate PDF</a> — Fix page orientation</li>
</ul>

<h2>Conclusion</h2>
<p>Merging PDF files online has never been easier. With Tool Acadmy\'s free PDF merger, you can combine any number of PDF documents in seconds without any software installation or account creation. Try it now and see how simple it is.</p>
',
  ],

  // POST 2
  [
    'title'    => 'How to Compress a PDF Without Losing Quality (Free Methods 2025)',
    'slug'     => 'how-to-compress-pdf-without-losing-quality',
    'keyword'  => 'compress pdf without losing quality',
    'category' => 'pdf-guides',
    'content'  => '
<p>Large PDF files are a common problem. Email attachments get rejected, uploads time out, and storage fills up quickly. Learning how to compress a PDF without losing quality is an essential skill for anyone who works with documents regularly.</p>

<p>In this guide we will explain exactly how PDF compression works, what quality settings to use, and how to compress your PDF files for free using Tool Acadmy.</p>

<h2>Why Are PDF Files So Large?</h2>
<p>PDF file size is determined by several factors:</p>
<ul>
<li><strong>Embedded images:</strong> High-resolution photos inside PDFs are the biggest contributor to file size</li>
<li><strong>Fonts:</strong> Embedded font files add size</li>
<li><strong>Metadata:</strong> Hidden document information</li>
<li><strong>Layers and objects:</strong> Complex graphics and vector elements</li>
<li><strong>Uncompressed content streams:</strong> Raw unoptimized content</li>
</ul>

<h2>What Does PDF Compression Actually Do?</h2>
<p>PDF compression reduces file size by optimizing the internal content of the PDF. Specifically it can:</p>
<ul>
<li>Downsample high-resolution images to screen resolution</li>
<li>Apply JPEG compression to embedded images</li>
<li>Remove duplicate objects and metadata</li>
<li>Subset embed only the characters of fonts actually used</li>
<li>Compress content streams using lossless algorithms</li>
</ul>

<h2>How to Compress a PDF for Free on Tool Acadmy</h2>

<h3>Step 1: Open the PDF Compressor</h3>
<p>Go to the <a href="/tool/compress-pdf/">free PDF compressor tool</a> on Tool Acadmy.</p>

<h3>Step 2: Upload Your PDF</h3>
<p>Drag and drop your PDF file or click to browse. The tool shows you the original file size immediately.</p>

<h3>Step 3: Choose Compression Level</h3>
<p>Select your compression preference:</p>
<ul>
<li><strong>Light:</strong> Minimal compression, maximum quality preservation</li>
<li><strong>Balanced:</strong> Good compression with acceptable quality (recommended)</li>
<li><strong>Maximum:</strong> Smallest file size, some quality reduction</li>
</ul>

<h3>Step 4: Download Compressed PDF</h3>
<p>Click Compress PDF and download the optimized file. The tool shows you the before and after file sizes.</p>

<h2>How Much Can You Compress a PDF?</h2>
<p>Compression results vary depending on the content:</p>
<ul>
<li>PDFs with many high-res images: 50-90% size reduction</li>
<li>Text-heavy PDFs: 10-30% reduction</li>
<li>Already optimized PDFs: minimal reduction possible</li>
<li>Scanned document PDFs: 40-70% reduction</li>
</ul>

<h2>Tips to Get the Best Compression Results</h2>
<ul>
<li>Use Balanced mode for most documents — it provides the best quality-to-size ratio</li>
<li>For documents that will only be viewed on screen, Maximum compression is fine</li>
<li>For documents that will be printed, use Light compression to preserve print quality</li>
<li>If your PDF contains mostly text with few images, compression gains will be modest</li>
</ul>

<h2>Other Ways to Reduce PDF Size</h2>
<ul>
<li><a href="/tool/pdf-to-jpg/">Convert PDF to images</a> then back to PDF at lower resolution</li>
<li>Remove unnecessary pages using the <a href="/tool/split-pdf/">PDF splitter</a></li>
<li>Remove embedded attachments if any</li>
</ul>

<h2>Frequently Asked Questions</h2>

<h3>Will compressing a PDF damage the text?</h3>
<p>No. Text in PDFs is stored as vector data and is not affected by image compression. Only embedded images are compressed.</p>

<h3>Can I compress a PDF on my phone?</h3>
<p>Yes. Tool Acadmy works on all modern mobile browsers. Open the tool on your phone and follow the same steps.</p>

<h3>Is there a file size limit?</h3>
<p>Tool Acadmy processes files locally in your browser. Very large files over 100MB may be slow depending on your device performance.</p>

<h2>Related Tools</h2>
<ul>
<li><a href="/tool/merge-pdf/">Merge PDF</a></li>
<li><a href="/tool/split-pdf/">Split PDF</a></li>
<li><a href="/tool/pdf-to-jpg/">PDF to JPG</a></li>
</ul>
',
  ],

  // POST 3
  [
    'title'    => 'Best Free Image Background Remover Online (No Signup Needed 2025)',
    'slug'     => 'best-free-image-background-remover-online',
    'keyword'  => 'free image background remover online',
    'category' => 'image-guides',
    'content'  => '
<p>Removing the background from an image used to require expensive software like Photoshop and hours of manual work. Today, free online background removers can do it in seconds. In this guide we will show you how to remove image backgrounds for free using Tool Acadmy.</p>

<h2>Why Remove an Image Background?</h2>
<p>Background removal is useful in many situations:</p>
<ul>
<li>Product photos for e-commerce stores (Amazon, Shopify)</li>
<li>Profile pictures for LinkedIn, social media</li>
<li>Creating stickers and transparent PNG files</li>
<li>Replacing backgrounds in portraits</li>
<li>Creating marketing materials and presentations</li>
<li>Removing unwanted clutter from photos</li>
</ul>

<h2>How Does AI Background Removal Work?</h2>
<p>Modern background removers use artificial intelligence and machine learning to detect the subject of an image and separate it from the background. The AI has been trained on millions of images and can accurately identify people, products, animals, and objects.</p>

<h2>How to Remove Image Background Free on Tool Acadmy</h2>

<h3>Step 1: Open the Background Remover</h3>
<p>Visit the <a href="/tool/img-remove-bg/">free background remover tool</a> on Tool Acadmy.</p>

<h3>Step 2: Upload Your Image</h3>
<p>Upload a JPG, PNG, or WebP image. For best results use images with a clear subject and a contrasting background.</p>

<h3>Step 3: Process and Download</h3>
<p>The tool processes your image and removes the background automatically. Download your result as a transparent PNG file.</p>

<h2>Tips for Best Background Removal Results</h2>
<ul>
<li>Use high-resolution images for cleaner edges</li>
<li>Simple backgrounds (solid colors) give the cleanest results</li>
<li>Ensure good lighting and clear separation between subject and background</li>
<li>For hair and fur, use higher resolution source images</li>
<li>Complex backgrounds with similar colors to the subject may need manual touch-up</li>
</ul>

<h2>What to Do After Removing the Background</h2>
<p>Once you have a transparent PNG you can:</p>
<ul>
<li>Add a new background using the <a href="/tool/img-change-bg/">Change Background tool</a></li>
<li>Add a blur background effect using the <a href="/tool/img-blur-bg/">Blur Background tool</a></li>
<li>Resize the image using the <a href="/tool/img-resize/">Image Resizer</a></li>
<li>Convert to JPG if transparency is not needed</li>
</ul>

<h2>Common Questions</h2>

<h3>Is background removal completely automatic?</h3>
<p>Yes. Tool Acadmy uses AI to automatically detect and remove the background. No manual selection or tracing is required.</p>

<h3>What image formats are supported?</h3>
<p>JPG, PNG, and WebP formats are supported. The output is always a transparent PNG file.</p>

<h3>Are my images kept private?</h3>
<p>Tool Acadmy processes images locally in your browser. Your images are never uploaded to any server.</p>

<h2>Related Image Tools</h2>
<ul>
<li><a href="/tool/img-change-bg/">Change Image Background</a></li>
<li><a href="/tool/img-blur-bg/">Blur Image Background</a></li>
<li><a href="/tool/img-resize/">Image Resizer</a></li>
<li><a href="/tool/img-compress/">Image Compressor</a></li>
</ul>
',
  ],

  // POST 4
  [
    'title'    => 'How to Convert JPG to PDF Free Online (Any Device 2025)',
    'slug'     => 'how-to-convert-jpg-to-pdf-free-online',
    'keyword'  => 'convert jpg to pdf free online',
    'category' => 'pdf-guides',
    'content'  => '
<p>Converting JPG images to PDF is one of the most searched tasks online. Whether you are scanning documents, submitting forms, or creating a photo portfolio, knowing how to convert JPG to PDF free online is incredibly useful.</p>

<p>Tool Acadmy makes this process completely free, instant, and private — no signup required.</p>

<h2>When Do You Need to Convert JPG to PDF?</h2>
<ul>
<li>Submitting scanned ID documents or forms</li>
<li>Creating a photo portfolio or lookbook</li>
<li>Sending multiple images as a single attachment</li>
<li>Archiving photos in a document format</li>
<li>Creating a report with embedded images</li>
<li>Converting screenshots into a shareable document</li>
</ul>

<h2>How to Convert JPG to PDF Free on Tool Acadmy</h2>

<h3>Step 1: Open the JPG to PDF Converter</h3>
<p>Go to the <a href="/tool/jpg-to-pdf/">free JPG to PDF converter</a> on Tool Acadmy.</p>

<h3>Step 2: Upload Your Images</h3>
<p>Upload one or multiple JPG images. You can also upload PNG and WebP files. Drag to reorder the images in the sequence you want them to appear in the PDF.</p>

<h3>Step 3: Configure PDF Settings</h3>
<p>Choose your page size (A4 or Letter), orientation (portrait or landscape), and image fit mode (fit to page or original size).</p>

<h3>Step 4: Convert and Download</h3>
<p>Click Convert to PDF and download your PDF file instantly.</p>

<h2>How to Convert JPG to PDF on Mobile</h2>
<p>The process is identical on mobile. Open the tool in your phone browser, tap the upload zone, select your photos from your gallery, configure settings, and download your PDF.</p>

<h2>Converting Multiple JPGs to One PDF</h2>
<p>Tool Acadmy supports converting multiple images into a single PDF document. Each image becomes a separate page. Simply upload all your images at once and they will all be included in the output PDF.</p>

<h2>Tips for Best Results</h2>
<ul>
<li>Use high resolution source images for crisp PDF output</li>
<li>Choose A4 for standard documents, Letter for US-format documents</li>
<li>Portrait orientation works best for most documents</li>
<li>Landscape works well for wide photos and presentations</li>
</ul>

<h2>Frequently Asked Questions</h2>

<h3>Can I convert PNG to PDF as well?</h3>
<p>Yes. The tool also accepts PNG and WebP images in addition to JPG files.</p>

<h3>Will my images lose quality when converted to PDF?</h3>
<p>No. The tool embeds your images in the PDF at their original resolution without re-compression.</p>

<h3>Is there a limit on how many images I can convert?</h3>
<p>You can convert multiple images in one go. For very large batches, convert in groups for best browser performance.</p>

<h2>Related Tools</h2>
<ul>
<li><a href="/tool/pdf-to-jpg/">PDF to JPG</a> — Convert PDF pages back to images</li>
<li><a href="/tool/img-compress/">Image Compressor</a> — Reduce image size before converting</li>
<li><a href="/tool/merge-pdf/">Merge PDF</a> — Combine multiple PDFs</li>
<li><a href="/tool/img-convert/">Image Converter</a> — Convert between image formats</li>
</ul>
',
  ],

  // POST 5
  [
    'title'    => 'Free Grammar Checker Online — Fix Errors Instantly (2025)',
    'slug'     => 'free-grammar-checker-online',
    'keyword'  => 'free grammar checker online',
    'category' => 'ai-writing-guides',
    'content'  => '
<p>Good grammar is essential for professional communication, academic writing, and content creation. Whether you are writing an email, a blog post, or an academic essay, a free grammar checker online can catch mistakes you might miss and help you communicate more clearly and professionally.</p>

<p>Tool Acadmy offers a free AI-powered grammar checker that fixes errors instantly — no signup, no word limits, completely free.</p>

<h2>Why Use a Grammar Checker?</h2>
<p>Even experienced writers make grammar mistakes. Here is why using a grammar checker is important:</p>
<ul>
<li>Catch spelling errors that spell-check misses (their vs there)</li>
<li>Fix punctuation mistakes (comma splices, missing apostrophes)</li>
<li>Improve sentence structure and clarity</li>
<li>Maintain consistent tense throughout writing</li>
<li>Ensure subject-verb agreement</li>
<li>Identify and fix run-on sentences</li>
<li>Polish professional emails and documents</li>
</ul>

<h2>How to Use the Free Grammar Checker on Tool Acadmy</h2>

<h3>Step 1: Open the Grammar Checker</h3>
<p>Visit the <a href="/tool/grammar-fixer/">free grammar checker tool</a> on Tool Acadmy.</p>

<h3>Step 2: Paste Your Text</h3>
<p>Copy and paste your text into the input box. The tool accepts any length of text.</p>

<h3>Step 3: Choose Correction Level</h3>
<p>Select your correction preference:</p>
<ul>
<li><strong>Light:</strong> Fix only clear errors while preserving your original style</li>
<li><strong>Standard:</strong> Fix grammar, spelling, and punctuation</li>
<li><strong>Thorough:</strong> Fix all errors and improve sentence structure</li>
</ul>

<h3>Step 4: Review and Copy</h3>
<p>The AI returns your corrected text. Review the changes and copy the corrected version to use in your document.</p>

<h2>What Types of Errors Does It Fix?</h2>
<ul>
<li>Spelling mistakes and typos</li>
<li>Grammar errors (tense, agreement, articles)</li>
<li>Punctuation errors (commas, semicolons, apostrophes)</li>
<li>Capitalization errors</li>
<li>Word usage errors (affect vs effect, its vs it\'s)</li>
<li>Sentence fragments and run-on sentences</li>
<li>Passive voice (when flagged)</li>
</ul>

<h2>Grammar Checker vs Spell Checker — What is the Difference?</h2>
<p>A spell checker only identifies words that do not exist in the dictionary. A grammar checker goes much further — it understands the context of your writing and identifies errors that are correctly spelled but grammatically wrong. For example "Their going to the store" passes a spell check but fails grammar check because "Their" should be "They\'re".</p>

<h2>Tips for Getting the Best Grammar Check Results</h2>
<ul>
<li>Check one section at a time for long documents</li>
<li>Always review AI suggestions before accepting them</li>
<li>Use Standard level for most writing tasks</li>
<li>Use Thorough level for important documents like cover letters</li>
<li>Read corrected text aloud to confirm it sounds natural</li>
</ul>

<h2>Common Grammar Mistakes the Tool Catches</h2>

<h3>There, Their, They\'re</h3>
<p>One of the most common errors. "There" refers to a place, "Their" shows possession, "They\'re" is short for "they are".</p>

<h3>Your vs You\'re</h3>
<p>"Your" shows possession while "You\'re" means "you are". The grammar checker catches these context-sensitive errors automatically.</p>

<h3>Its vs It\'s</h3>
<p>"Its" shows possession while "It\'s" is a contraction of "it is". These are commonly confused even by native English speakers.</p>

<h2>Related AI Writing Tools</h2>
<ul>
<li><a href="/tool/paraphraser/">Paraphraser</a> — Rewrite text in different styles</li>
<li><a href="/tool/ai-humanizer/">AI Humanizer</a> — Make AI text sound human</li>
<li><a href="/tool/summarizer/">Text Summarizer</a> — Summarize long documents</li>
<li><a href="/tool/sentence-rewriter/">Sentence Rewriter</a> — Improve individual sentences</li>
</ul>

<h2>Conclusion</h2>
<p>A free grammar checker is one of the most valuable writing tools you can use. Tool Acadmy\'s AI-powered grammar checker goes beyond basic spell checking to fix complex grammatical errors and improve the overall quality of your writing. Try it now — completely free, no signup required.</p>
',
  ],

]; // end $posts array

// =============================================
// CREATE BLOG POSTS
// =============================================
echo "\nCreating blog posts...\n";

$created_posts = [];
foreach ($posts as $post_data) {
  // Check if post already exists
  $existing = get_page_by_path(
    $post_data['slug'], OBJECT, 'post');
  if ($existing) {
    echo "  Already exists: {$post_data['title']}\n";
    $created_posts[] = $existing->ID;
    continue;
  }

  $cat_id = $cat_ids[$post_data['category']] ?? 1;

  $post_id = wp_insert_post([
    'post_title'   => $post_data['title'],
    'post_name'    => $post_data['slug'],
    'post_content' => trim($post_data['content']),
    'post_status'  => 'publish',
    'post_type'    => 'post',
    'post_author'  => 1,
    'post_category'=> [$cat_id],
  ]);

  if (is_wp_error($post_id)) {
    echo "  FAILED: {$post_data['title']}\n";
    echo "  Error: " . $post_id->get_error_message()
      . "\n";
    continue;
  }

  // Set RankMath focus keyword
  update_post_meta($post_id,
    'rank_math_focus_keyword',
    $post_data['keyword']);

  // Set RankMath robots
  update_post_meta($post_id,
    'rank_math_robots', ['index', 'follow']);

  // Set meta description
  $desc = substr(strip_tags($post_data['content']),
    0, 155);
  update_post_meta($post_id,
    'rank_math_description', $desc);

  $created_posts[] = $post_id;
  echo "  Created (ID: $post_id):"
    . " {$post_data['title']}\n";
}

// =============================================
// SET FOCUS KEYWORDS FOR ALL TOOLS
// =============================================
echo "\nSetting RankMath focus keywords"
  . " for all tools...\n";

$tools = get_posts([
  'post_type'      => 'tg_tool',
  'posts_per_page' => -1,
  'post_status'    => 'publish',
]);

$count = 0;
foreach ($tools as $tool) {
  $name    = strtolower($tool->post_title);
  $keyword = 'free online ' . $name;

  // Set focus keyword
  update_post_meta($tool->ID,
    'rank_math_focus_keyword', $keyword);

  // Set robots to index
  update_post_meta($tool->ID,
    'rank_math_robots', ['index', 'follow']);

  // Set meta title
  $meta_title = $tool->post_title
    . ' - Free Online Tool | Tool Acadmy';
  update_post_meta($tool->ID,
    'rank_math_title', $meta_title);

  // Set meta description
  $excerpt = $tool->post_excerpt;
  if (empty($excerpt)) {
    $excerpt = 'Use free '
      . strtolower($tool->post_title)
      . ' online. No signup required.'
      . ' 100% free. Works in any browser.';
  }
  $meta_desc = substr($excerpt, 0, 155);
  update_post_meta($tool->ID,
    'rank_math_description', $meta_desc);

  $count++;
}

echo "  Done: $count tools updated"
  . " with focus keywords\n";

// =============================================
// SET META FOR STATIC PAGES
// =============================================
echo "\nSetting meta for static pages...\n";

$pages_meta = [
  'about'              => [
    'title' => 'About Tool Acadmy'
      . ' — Free Online Tools Platform',
    'desc'  => 'Learn about Tool Acadmy,'
      . ' your free platform for 150+ online'
      . ' tools. No signup, no download,'
      . ' 100% browser-based.',
    'kw'    => 'tool acadmy free online tools',
  ],
  'contact'            => [
    'title' => 'Contact Tool Acadmy'
      . ' — Get in Touch',
    'desc'  => 'Contact the Tool Acadmy team'
      . ' for bug reports, feature requests,'
      . ' or business inquiries.'
      . ' We respond within 24-48 hours.',
    'kw'    => 'contact tool acadmy',
  ],
  'privacy-policy'     => [
    'title' => 'Privacy Policy | Tool Acadmy',
    'desc'  => 'Read Tool Acadmy\'s privacy'
      . ' policy. We never upload your files.'
      . ' Learn how we handle cookies'
      . ' and analytics data.',
    'kw'    => 'tool acadmy privacy policy',
  ],
  'terms-and-conditions' => [
    'title' => 'Terms and Conditions'
      . ' | Tool Acadmy',
    'desc'  => 'Read Tool Acadmy\'s terms'
      . ' and conditions of service.'
      . ' Free tools provided as-is'
      . ' with no warranties.',
    'kw'    => 'tool acadmy terms conditions',
  ],
  'sitemap-page'       => [
    'title' => 'Sitemap — All 150+ Free'
      . ' Online Tools | Tool Acadmy',
    'desc'  => 'Complete sitemap of all'
      . ' Tool Acadmy free tools.'
      . ' Browse PDF, Image, AI, Video,'
      . ' File and Utility tools.',
    'kw'    => 'tool acadmy sitemap all tools',
  ],
];

foreach ($pages_meta as $slug => $meta) {
  $page = get_page_by_path($slug);
  if (!$page) {
    echo "  Page not found: $slug\n";
    continue;
  }
  update_post_meta($page->ID,
    'rank_math_title', $meta['title']);
  update_post_meta($page->ID,
    'rank_math_description', $meta['desc']);
  update_post_meta($page->ID,
    'rank_math_focus_keyword', $meta['kw']);
  update_post_meta($page->ID,
    'rank_math_robots', ['index', 'follow']);
  echo "  Set meta: $slug\n";
}

// =============================================
// SET CATEGORY META
// =============================================
echo "\nSetting meta for tool categories...\n";

$tool_cats = get_terms([
  'taxonomy'   => 'tool_category',
  'hide_empty' => false,
]);

foreach ($tool_cats as $cat) {
  $count_tools = count(get_posts([
    'post_type'      => 'tg_tool',
    'posts_per_page' => -1,
    'tax_query'      => [[
      'taxonomy' => 'tool_category',
      'field'    => 'slug',
      'terms'    => $cat->slug,
    ]],
  ]));

  $title = 'Free Online ' . $cat->name
    . ' (' . $count_tools . '+ Tools)'
    . ' | Tool Acadmy';
  $desc  = 'Browse ' . $count_tools
    . '+ free online '
    . strtolower($cat->name)
    . '. No download, no signup required.'
    . ' Works in any browser instantly.';
  $kw    = 'free online '
    . strtolower($cat->name);

  update_term_meta($cat->term_id,
    'rank_math_title', $title);
  update_term_meta($cat->term_id,
    'rank_math_description', $desc);
  update_term_meta($cat->term_id,
    'rank_math_focus_keyword', $kw);

  echo "  Set meta: {$cat->name}"
    . " ($count_tools tools)\n";
}

// =============================================
// FLUSH REWRITE RULES
// =============================================
echo "\nFlushing rewrite rules...\n";
flush_rewrite_rules(true);
echo "  Done.\n";

// =============================================
// SUMMARY
// =============================================
echo "\n=== SEEDER COMPLETE ===\n";
echo "Blog posts created/found: "
  . count($created_posts) . "\n";
echo "Tools with focus keywords: $count\n";
echo "Categories with meta: "
  . count($tool_cats) . "\n";
echo "Static pages with meta: "
  . count($pages_meta) . "\n";
echo "\nNext steps:\n";
echo "1. Visit localhost/toolsgallery/blog/"
  . " to see blog posts\n";
echo "2. Visit any tool page and check"
  . " View Source for schema\n";
echo "3. Check sitemap_index.xml\n";
echo "4. Run static pages creation commands\n";
echo "========================\n";