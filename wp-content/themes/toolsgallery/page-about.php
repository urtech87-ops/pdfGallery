<?php
/**
 * Template Name: About Page
 * Template for the About page (slug: about)
 */
get_header();
?>

<div class="tg-container">
<div class="tg-about-page">

<section class="tg-about-hero">
<h1>About Tool Acadmy</h1>
<p class="tg-about-lead">Tool Acadmy is a free online tools platform offering 150+ browser-based utilities for PDF editing, image processing, AI writing, video editing, file conversion, and everyday productivity tasks.</p>
</section>

<section class="tg-about-mission">
<h2>Our Mission</h2>
<p>Our mission is simple: provide professional-grade digital tools to everyone, completely free, with no signup required and no files uploaded to our servers. We believe productivity tools should be accessible to all — students, freelancers, small businesses, and professionals alike.</p>
</section>

<section class="tg-about-what">
<h2>What is Tool Acadmy?</h2>
<p>Tool Acadmy is your free online toolkit for everyday digital tasks. Whether you need to merge PDFs, compress images, fix grammar, convert files, or generate AI content — we have a free tool for that. All 150+ tools run directly in your browser using modern web technologies.</p>

<div class="tg-about-stats">
<div class="tg-about-stat">
<strong>150+</strong>
<span>Free Tools</span>
</div>
<div class="tg-about-stat">
<strong>6</strong>
<span>Categories</span>
</div>
<div class="tg-about-stat">
<strong>0</strong>
<span>Signups Needed</span>
</div>
<div class="tg-about-stat">
<strong>100%</strong>
<span>Browser-Based</span>
</div>
</div>
</section>

<section class="tg-about-privacy">
<h2>Privacy First — Your Files Stay on Your Device</h2>
<p>Every tool on Tool Acadmy runs directly in your web browser. This means your files are processed locally on your device using technologies like WebAssembly, PDF.js, and the Web Audio API. We never receive, store, or process your files on any server. Your documents, images, and data stay completely private.</p>
</section>

<section class="tg-about-tools">
<h2>Our Tool Categories</h2>
<ul>
<li><strong>PDF Tools (29 tools):</strong> Merge, split, compress, convert, edit, protect, and manipulate PDF files directly in your browser.</li>
<li><strong>Image Tools (40 tools):</strong> Compress, resize, crop, convert, remove backgrounds, add watermarks, apply filters, and more.</li>
<li><strong>AI Writing Tools (30 tools):</strong> Grammar checker, paraphraser, summarizer, essay writer, email writer, and 25+ more AI tools.</li>
<li><strong>Video Tools (25 tools):</strong> Compress, convert, trim, merge, add subtitles, extract audio, and more — powered by FFmpeg.wasm.</li>
<li><strong>File Converter Tools (15 tools):</strong> Convert between Excel, CSV, JSON, XML, Markdown, HTML, Base64, and more.</li>
<li><strong>Utility Tools (10 tools):</strong> Color picker, unit converter, countdown timer, random number generator, and more.</li>
</ul>
</section>

<section class="tg-about-tech">
<h2>Technology Behind Tool Acadmy</h2>
<p>Tool Acadmy uses cutting-edge browser technologies to deliver professional results without any server processing:</p>
<ul>
<li><strong>PDF-lib:</strong> PDF creation and manipulation</li>
<li><strong>PDF.js:</strong> PDF rendering and text extraction</li>
<li><strong>FFmpeg.wasm:</strong> Browser-based video processing</li>
<li><strong>SheetJS:</strong> Excel and CSV processing</li>
<li><strong>Web Crypto API:</strong> Secure hash generation</li>
<li><strong>Web Audio API:</strong> Audio processing and Morse code</li>
<li><strong>Canvas API:</strong> Image processing and manipulation</li>
<li><strong>OpenRouter AI:</strong> AI writing and content tools</li>
</ul>
</section>

<section class="tg-about-faq">
<h2>Frequently Asked Questions About Tool Acadmy</h2>

<div class="tg-faq-accordion">

<div class="tg-faq-item">
<button class="tg-faq-question">Is Tool Acadmy really free? <span class="tg-faq-icon">+</span></button>
<div class="tg-faq-answer">
<p>Yes — all 150+ tools on Tool Acadmy are completely free to use with no hidden costs, no subscription fees, and no premium tiers. We are supported by non-intrusive advertising.</p>
</div>
</div>

<div class="tg-faq-item">
<button class="tg-faq-question">Do I need to create an account? <span class="tg-faq-icon">+</span></button>
<div class="tg-faq-answer">
<p>No. Tool Acadmy requires no signup, no account creation, and no email address. Simply visit any tool and start using it immediately.</p>
</div>
</div>

<div class="tg-faq-item">
<button class="tg-faq-question">Are my files safe and private? <span class="tg-faq-icon">+</span></button>
<div class="tg-faq-answer">
<p>Yes. All file processing happens locally in your browser. Your files never leave your device and are never uploaded to any server. We have no access to your files at any time.</p>
</div>
</div>

<div class="tg-faq-item">
<button class="tg-faq-question">What browsers are supported? <span class="tg-faq-icon">+</span></button>
<div class="tg-faq-answer">
<p>Tool Acadmy works in all modern browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, and Opera. We recommend Chrome for the best experience with video tools.</p>
</div>
</div>

<div class="tg-faq-item">
<button class="tg-faq-question">How do I contact Tool Acadmy? <span class="tg-faq-icon">+</span></button>
<div class="tg-faq-answer">
<p>You can reach us via our <a href="/contact/">Contact page</a>. We respond to all inquiries within 24-48 hours. For bug reports, please include the tool name and a description of the issue.</p>
</div>
</div>

</div>
</section>

<section class="tg-about-contact">
<h2>Get in Touch</h2>
<p>Have a question, found a bug, or want to suggest a new tool? We would love to hear from you.</p>
<p>
<strong>Email:</strong> contact@toolacadmy.com<br>
<strong>Response time:</strong> Within 24-48 hours<br>
<strong>Location:</strong> Available worldwide
</p>
<a href="/contact/" class="tg-btn tg-btn-primary">Contact Us &rarr;</a>
</section>

</div>
</div>

<?php get_footer(); ?>
