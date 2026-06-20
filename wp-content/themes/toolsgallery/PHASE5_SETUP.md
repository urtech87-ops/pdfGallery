# Phase 5 Setup — 30 AI Writing Tools

Run the following WP-CLI commands to create all 30 AI writing tool posts.
Each command creates a tool post and sets required meta fields.

## Prerequisites

```bash
# Ensure the ai-tools taxonomy term exists
wp term create tool_category "AI Writing Tools" --slug=ai-tools --description="AI-powered writing and text tools" --url=http://localhost
```

---

## Tool 1 — Grammar Fixer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Grammar Fixer" \
  --post_name="grammar-fixer" \
  --post_status=publish \
  --post_excerpt="Fix grammar, spelling and punctuation errors instantly with AI. Choose correction level from light touch to thorough style improvement." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "grammar-fixer"
wp post meta set $ID _tg_action_label "Fix Grammar"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"How does the Grammar Fixer work?","a":"It uses AI to detect and correct grammar, spelling, punctuation and syntax errors while preserving your original meaning and voice."},{"q":"What correction levels are available?","a":"Light (essential errors only), Standard (grammar and punctuation), and Thorough (grammar, clarity and flow improvements)."},{"q":"Will it change my writing style?","a":"The AI is instructed to preserve your original voice and meaning. Thorough mode may improve clarity but keeps your intent intact."}]'
wp post meta set $ID _tg_steps '[{"title":"Paste Your Text","desc":"Paste the text you want to fix into the input area."},{"title":"Choose Correction Level","desc":"Select Light, Standard, or Thorough depending on how much correction you need."},{"title":"Copy Your Fixed Text","desc":"Review the corrected text and copy or download it."}]'
wp post meta set $ID _tg_features '[{"title":"AI-Powered Correction","desc":"Uses advanced AI to catch errors humans often miss."},{"title":"Multiple Correction Levels","desc":"From light touch to thorough editing — you choose."},{"title":"Show Changes Mode","desc":"Optionally see exactly what was changed for learning."}]'
```

---

## Tool 2 — Paraphraser

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Paraphraser" \
  --post_name="paraphrase-text" \
  --post_status=publish \
  --post_excerpt="Paraphrase and rewrite text in multiple styles. Generate up to 3 variations with Standard, Fluent, Creative, Formal or Simple modes." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "paraphraser"
wp post meta set $ID _tg_action_label "Paraphrase"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What modes does the paraphraser offer?","a":"Standard (different words, same structure), Fluent (natural flowing prose), Creative (unique phrasing), Formal (academic tone), and Simple (easy to read)."},{"q":"Can I get multiple variations?","a":"Yes, you can generate 1, 2 or 3 different paraphrased versions at once."},{"q":"Does it change the meaning?","a":"No, the AI is instructed to preserve the original meaning while changing the wording and structure."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Your Text","desc":"Paste the text you want to paraphrase."},{"title":"Choose Mode and Options","desc":"Select your style mode, number of variations, and length preference."},{"title":"Get Paraphrased Text","desc":"Click Paraphrase and copy your results."}]'
wp post meta set $ID _tg_features '[{"title":"5 Writing Modes","desc":"Standard, Fluent, Creative, Formal and Simple paraphrasing styles."},{"title":"Multiple Variations","desc":"Generate up to 3 different versions simultaneously."},{"title":"Length Control","desc":"Keep the same length, make it shorter, or expand the text."}]'
```

---

## Tool 3 — AI Humanizer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="AI Humanizer" \
  --post_name="ai-humanizer" \
  --post_status=publish \
  --post_excerpt="Make AI-generated text sound naturally human. Remove robotic patterns and add authentic voice with conversational, professional, academic or casual styles." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "ai-humanizer"
wp post meta set $ID _tg_action_label "Humanize Text"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What does AI humanizing do?","a":"It rewrites AI-generated text to sound like it was written by a real person, adding natural variation, authentic voice and removing robotic patterns."},{"q":"Will it bypass AI detectors?","a":"The tool aims to make text more natural and human-like, though results vary by detector. It focuses on improving readability rather than bypassing detection specifically."},{"q":"What humanization levels are available?","a":"Subtle (light touch preserving most of original), Moderate (balanced rewriting), and Strong (complete transformation to sound fully human)."}]'
wp post meta set $ID _tg_steps '[{"title":"Paste AI Text","desc":"Paste the AI-generated content you want to humanize."},{"title":"Choose Settings","desc":"Select humanization level, writing style, and optional additions."},{"title":"Get Human Text","desc":"The AI rewrites your text to sound naturally human."}]'
wp post meta set $ID _tg_features '[{"title":"3 Humanization Levels","desc":"Subtle, Moderate and Strong — choose how much to transform."},{"title":"4 Writing Styles","desc":"Conversational, Professional, Academic and Casual voices."},{"title":"Natural Additions","desc":"Add personal anecdotes, rhetorical questions or natural imperfections."}]'
```

---

## Tool 4 — Text Summarizer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Text Summarizer" \
  --post_name="text-summarizer" \
  --post_status=publish \
  --post_excerpt="Summarize any text in seconds. Choose from brief 2-sentence summaries, bullet points, standard paragraphs or detailed executive summaries." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "summarizer"
wp post meta set $ID _tg_action_label "Summarize"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What summary types are available?","a":"Brief (2-3 sentences), Standard (1 paragraph), Detailed (multiple paragraphs), Bullet Points, and Executive Summary formats."},{"q":"Can I get a summary in a different language?","a":"Yes, you can output the summary in English, Arabic, Spanish, French, German, Chinese, Japanese and more."},{"q":"How long can the input text be?","a":"The tool works best with articles, documents and passages up to several thousand words."}]'
wp post meta set $ID _tg_steps '[{"title":"Paste Your Text","desc":"Paste the article, document or text you want summarized."},{"title":"Choose Summary Type","desc":"Select Brief, Standard, Bullet Points or Executive Summary format."},{"title":"Get Your Summary","desc":"The AI distills the key information and delivers your summary."}]'
wp post meta set $ID _tg_features '[{"title":"5 Summary Formats","desc":"Brief, Standard, Detailed, Bullet Points and Executive Summary."},{"title":"Focus Selection","desc":"Summarize focusing on key points, arguments, data or action items."},{"title":"Multi-Language Output","desc":"Get summaries in 10+ languages regardless of input language."}]'
```

---

## Tool 5 — Essay Writer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Essay Writer" \
  --post_name="essay-writer" \
  --post_status=publish \
  --post_excerpt="Generate complete essays with AI. Choose from argumentative, descriptive, narrative and more. Set word count from 250 to 2000 words with academic level control." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "essay-writer"
wp post meta set $ID _tg_action_label "Write Essay"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What essay types can it write?","a":"Argumentative, Descriptive, Expository, Narrative, Persuasive and Compare & Contrast essays."},{"q":"What word counts are available?","a":"250, 500, 750, 1000, 1500 and 2000 words."},{"q":"What academic levels are supported?","a":"High School, Undergraduate, Graduate and Professional levels, each with appropriate vocabulary and complexity."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Your Topic","desc":"Type the essay topic or question you need to address."},{"title":"Configure Options","desc":"Choose essay type, word count, academic level and tone."},{"title":"Generate and Use","desc":"Get your complete essay with introduction, body and conclusion."}]'
wp post meta set $ID _tg_features '[{"title":"6 Essay Types","desc":"Argumentative, Descriptive, Expository, Narrative, Persuasive, Compare & Contrast."},{"title":"Academic Levels","desc":"High School through Professional with appropriate writing complexity."},{"title":"Structured Output","desc":"Full essays with introduction, body paragraphs and conclusion."}]'
```

---

## Tool 6 — Article Writer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Article Writer" \
  --post_name="article-writer" \
  --post_status=publish \
  --post_excerpt="Write full articles with AI. Blog posts, news articles, how-to guides, listicles and more. Up to 2000 words with proper headings and SEO keywords." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "article-writer"
wp post meta set $ID _tg_action_label "Write Article"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What article types can it write?","a":"Blog Posts, News Articles, How-To Guides, Listicles, Opinion Pieces and Product Reviews."},{"q":"Can it include SEO keywords?","a":"Yes, enter comma-separated keywords and the AI will naturally incorporate them throughout the article."},{"q":"How long can the articles be?","a":"Choose from 300, 500, 800, 1200, 1500 or 2000 words."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Topic and Details","desc":"Add your article title, target audience and select the article type."},{"title":"Set Length and Tone","desc":"Choose word count, tone and what elements to include."},{"title":"Generate Article","desc":"Get a structured article with proper headings and subheadings."}]'
wp post meta set $ID _tg_features '[{"title":"6 Article Formats","desc":"Blog posts, news, how-to guides, listicles, opinion and reviews."},{"title":"SEO Keyword Integration","desc":"Naturally incorporate your target keywords throughout."},{"title":"Proper Structure","desc":"H2/H3 headings, introduction, body and conclusion."}]'
```

---

## Tool 7 — Blog Post Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Blog Post Generator" \
  --post_name="blog-post-generator" \
  --post_status=publish \
  --post_excerpt="Generate complete SEO-friendly blog posts with AI. Multiple writing styles, niche targeting, SEO keywords and optional call-to-action sections." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "blog-post-generator"
wp post meta set $ID _tg_action_label "Generate Blog Post"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"How is this different from the Article Writer?","a":"The Blog Post Generator is specifically optimized for blog content with niche targeting, CTA generation and meta description output — tailored for blogging platforms."},{"q":"Can it generate a meta description?","a":"Yes, toggle on meta description generation to get an SEO-optimized meta description with your blog post."},{"q":"What writing styles are available?","a":"Storytelling, Educational, Listicle, How-To, Opinion and Review styles."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Blog Topic","desc":"Describe your blog post topic and your blog niche."},{"title":"Choose Style and Options","desc":"Select writing style, word count and optional CTA."},{"title":"Publish-Ready Content","desc":"Get a complete blog post with headings, body and meta description."}]'
wp post meta set $ID _tg_features '[{"title":"Niche Targeting","desc":"Specify your blog niche for industry-appropriate content."},{"title":"SEO Optimization","desc":"Naturally incorporate keywords with proper heading structure."},{"title":"CTA Generation","desc":"Add a customized call-to-action at the end of your post."}]'
```

---

## Tool 8 — Text Translator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Text Translator" \
  --post_name="text-translator" \
  --post_status=publish \
  --post_excerpt="Translate text between 100+ languages with AI. Supports formal and informal tone, auto-detect source language and formatting preservation." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "ai-translator"
wp post meta set $ID _tg_action_label "Translate"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"How many languages are supported?","a":"100+ languages including Arabic, Urdu, Spanish, French, German, Chinese, Japanese, Portuguese, Russian, Hindi, Turkish, Korean and many more."},{"q":"Can it auto-detect the source language?","a":"Yes, select Auto-detect as the source language and the AI will identify and translate from any detected language."},{"q":"Does it preserve text formatting?","a":"Yes, you can toggle format preservation to keep paragraph breaks, line spacing and structure in the translation."}]'
wp post meta set $ID _tg_steps '[{"title":"Select Languages","desc":"Choose source language (or auto-detect) and your target language."},{"title":"Enter Text","desc":"Paste or type the text you want translated."},{"title":"Get Translation","desc":"Receive an accurate translation with optional formatting preservation."}]'
wp post meta set $ID _tg_features '[{"title":"100+ Languages","desc":"Comprehensive language support including rare and regional languages."},{"title":"Auto-Detection","desc":"Automatically detects the source language — no manual selection needed."},{"title":"Formality Control","desc":"Choose formal, informal or auto tone for culturally appropriate translations."}]'
```

---

## Tool 9 — Plagiarism Checker

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Plagiarism Checker" \
  --post_name="plagiarism-checker" \
  --post_status=publish \
  --post_excerpt="Check text for AI-generated content patterns, self-similarity and writing originality. Visual dashboard with originality score and AI likelihood analysis." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "plagiarism-checker"
wp post meta set $ID _tg_action_label "Check Plagiarism"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Does this check against web content?","a":"No — this tool uses AI analysis for writing patterns, originality scoring and AI detection. For database-based plagiarism checking, use Turnitin, Copyscape or iThenticate."},{"q":"What does the originality score mean?","a":"It reflects how unique and original the writing style appears based on AI analysis of vocabulary diversity, sentence structure and writing patterns."},{"q":"Can it detect AI-written content?","a":"Yes, it provides an AI likelihood score showing how much the text matches typical AI writing patterns like repetitive structures and unnatural phrasing."}]'
wp post meta set $ID _tg_steps '[{"title":"Paste Your Text","desc":"Enter the text you want to analyze for originality."},{"title":"Choose Check Type","desc":"Select AI Content Detection, Self-Similarity or Writing Analysis."},{"title":"View Dashboard","desc":"See originality score, AI likelihood and detailed analysis."}]'
wp post meta set $ID _tg_features '[{"title":"Visual Score Dashboard","desc":"Color-coded originality and AI likelihood scores with circular indicators."},{"title":"Repeated Phrase Detection","desc":"Identifies phrases used 3+ times that may indicate copied content."},{"title":"Writing Style Analysis","desc":"Assesses vocabulary diversity, sentence variety and writing authenticity."}]'
```

---

## Tool 10 — Sentence Rewriter

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Sentence Rewriter" \
  --post_name="sentence-rewriter" \
  --post_status=publish \
  --post_excerpt="Rewrite sentences and paragraphs to simplify, formalize, shorten, lengthen or improve clarity. Generate up to 5 alternative versions at once." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "sentence-rewriter"
wp post meta set $ID _tg_action_label "Rewrite"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What rewriting goals are available?","a":"Simplify, Make Formal, Make Casual, Make Shorter, Make Longer, Fix Passive Voice, Improve Clarity and Add Emphasis."},{"q":"Can I get multiple rewrites?","a":"Yes, generate 1, 3 or 5 alternative versions and pick the one that works best."},{"q":"Will it change the meaning?","a":"Choose Strictly to preserve meaning exactly, or Loosely to allow creative interpretation while keeping the general idea."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Your Text","desc":"Paste the sentence or paragraph you want rewritten."},{"title":"Choose Goal and Count","desc":"Select your rewriting goal and how many alternatives you want."},{"title":"Pick Your Favorite","desc":"Compare alternatives and copy the one you prefer."}]'
wp post meta set $ID _tg_features '[{"title":"8 Rewriting Goals","desc":"Simplify, formalize, shorten, lengthen, fix passive voice and more."},{"title":"Multiple Alternatives","desc":"Generate up to 5 different rewrites to compare and choose from."},{"title":"Meaning Control","desc":"Strictly or loosely preserve the original meaning."}]'
```

---

## Tool 11 — Word Counter

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Word Counter" \
  --post_name="word-counter" \
  --post_status=publish \
  --post_excerpt="Count words, characters, sentences and paragraphs instantly. Live stats with reading time, speaking time, unique words, readability score and top keywords." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "word-counter"
wp post meta set $ID _tg_action_label "Analyze Text"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Is this tool free to use?","a":"Yes, the Word Counter is completely free and works entirely in your browser with no limits."},{"q":"Does it update in real time?","a":"Yes, all stats update instantly as you type or paste text — no button click needed."},{"q":"What stats does it provide?","a":"Words, characters, sentences, paragraphs, reading time, speaking time, unique words, average word length, readability score and top 10 most used words."}]'
wp post meta set $ID _tg_steps '[{"title":"Paste or Type Text","desc":"Enter your text in the large text area — stats appear immediately."},{"title":"View Live Statistics","desc":"See words, characters, sentences, reading time and more update in real time."},{"title":"Analyze Keywords","desc":"See the top 10 most used words and readability assessment."}]'
wp post meta set $ID _tg_features '[{"title":"Live Stats Dashboard","desc":"9 different text statistics updating in real time as you type."},{"title":"Readability Score","desc":"Flesch Reading Ease approximation: Easy, Standard, Difficult or Very Difficult."},{"title":"Keyword Density","desc":"Top 10 most used content words with frequency counts."}]'
```

---

## Tool 12 — Email Writer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Email Writer" \
  --post_name="email-writer" \
  --post_status=publish \
  --post_excerpt="Write professional emails with AI. 12 email types including follow-up, apology, sales, cold outreach and more. Complete with subject line, greeting and signature." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "email-writer"
wp post meta set $ID _tg_action_label "Write Email"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What email types are supported?","a":"Professional, Follow-up, Apology, Thank You, Request, Introduction, Complaint, Newsletter, Sales, Cold Outreach, Rejection and Invitation."},{"q":"Does it generate a subject line?","a":"Yes, toggle Include Subject Line and the AI will generate an appropriate subject line with the email."},{"q":"Can I specify the tone?","a":"Yes, choose from Formal, Friendly, Assertive or Empathetic tones."}]'
wp post meta set $ID _tg_steps '[{"title":"Choose Email Type","desc":"Select from 12 professional email types."},{"title":"Describe Context","desc":"Explain the email situation — who you are, who you are writing to and why."},{"title":"Generate and Send","desc":"Get a complete email with subject line ready to copy."}]'
wp post meta set $ID _tg_features '[{"title":"12 Email Types","desc":"From cold outreach to apologies — every common professional scenario."},{"title":"Subject Line Generator","desc":"AI writes an optimized subject line along with the email body."},{"title":"Tone Control","desc":"Formal, Friendly, Assertive or Empathetic — match your relationship."}]'
```

---

## Tool 13 — Cover Letter Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Cover Letter Generator" \
  --post_name="cover-letter-generator" \
  --post_status=publish \
  --post_excerpt="Generate compelling, personalized cover letters with AI. Enter your skills, the job title and company for a tailored letter that stands out from the crowd." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "cover-letter-generator"
wp post meta set $ID _tg_action_label "Generate Cover Letter"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"How do I make it personalized?","a":"Fill in the company name, why you want to work there, and your specific skills. The more detail you provide, the more tailored the letter."},{"q":"What lengths are available?","a":"Short (1 paragraph), Standard (3 paragraphs) and Detailed (4-5 paragraphs) options."},{"q":"What tones are available?","a":"Professional, Enthusiastic and Confident tones to match your personality and the company culture."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Job Details","desc":"Add the job title, company name and your name."},{"title":"Describe Your Skills","desc":"List your relevant skills and why you want to work at this company."},{"title":"Generate Letter","desc":"Get a personalized, compelling cover letter ready to submit."}]'
wp post meta set $ID _tg_features '[{"title":"Company Research Section","desc":"Include why you specifically want to work at this company."},{"title":"Skills Showcase","desc":"Highlight your most relevant skills for the specific role."},{"title":"Strong Opening Hook","desc":"Start with an attention-grabbing opening that makes you memorable."}]'
```

---

## Tool 14 — Resume Writer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Resume Writer" \
  --post_name="resume-writer" \
  --post_status=publish \
  --post_excerpt="Generate professional, ATS-friendly resumes with AI. Enter your experience, education and skills for a polished resume in Modern, Classic, Minimal or ATS-Friendly style." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "resume-writer"
wp post meta set $ID _tg_action_label "Generate Resume"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Is the output ATS-friendly?","a":"Yes, the ATS-Friendly style is specifically optimized for Applicant Tracking Systems with clean formatting and keyword-rich content."},{"q":"How many work positions can I add?","a":"You can add up to 5 work experience positions and 3 education entries."},{"q":"What format is the output?","a":"The resume is generated in Markdown format which you can copy as plain text or download as a .txt file."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Personal Info","desc":"Add your name, contact details and professional title."},{"title":"Add Experience and Education","desc":"Fill in work history, education and skills using the dynamic form."},{"title":"Generate and Download","desc":"Get your complete resume in your chosen style."}]'
wp post meta set $ID _tg_features '[{"title":"4 Resume Styles","desc":"Modern, Classic, Minimal and ATS-Friendly formats."},{"title":"Dynamic Experience Form","desc":"Add up to 5 work positions with easy-to-use form fields."},{"title":"ATS Optimization","desc":"Structured format designed to pass Applicant Tracking Systems."}]'
```

---

## Tool 15 — Product Description Writer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Product Description Writer" \
  --post_name="product-description-writer" \
  --post_status=publish \
  --post_excerpt="Write compelling product descriptions for Amazon, Shopify, eBay, Etsy and more. Choose tone, length and platform for perfectly optimized e-commerce copy." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "product-desc-writer"
wp post meta set $ID _tg_action_label "Write Description"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Which e-commerce platforms are supported?","a":"General, Amazon, Shopify, eBay, Instagram, and Etsy — each with platform-specific optimization."},{"q":"Can it write bullet point descriptions?","a":"Yes, toggle Bullet Points in the Include section for a list-format description suitable for Amazon listings."},{"q":"What length options are available?","a":"Short (~50 words), Standard (~100 words), Long (~200 words) and Detailed (~300 words)."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Product Details","desc":"Add the product name, category, features and target customer."},{"title":"Choose Platform and Style","desc":"Select your e-commerce platform, tone and description length."},{"title":"Copy and List","desc":"Get optimized copy ready to paste into your store listing."}]'
wp post meta set $ID _tg_features '[{"title":"Platform Optimization","desc":"Tailored for Amazon, Shopify, eBay, Etsy, Instagram and more."},{"title":"6 Tone Options","desc":"Professional, Exciting, Luxury, Friendly, Technical and Minimalist."},{"title":"Benefit-Focused","desc":"AI emphasizes benefits over features for higher conversion rates."}]'
```

---

## Tool 16 — Ad Copy Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Ad Copy Generator" \
  --post_name="ad-copy-generator" \
  --post_status=publish \
  --post_excerpt="Generate high-converting ad copy for Google, Facebook, Instagram, LinkedIn, TikTok and more. Headlines, body copy and CTAs in any tone for any campaign goal." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "ad-copy-generator"
wp post meta set $ID _tg_action_label "Generate Ad Copy"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Which ad platforms are supported?","a":"Google Ads, Facebook/Instagram, Twitter/X, LinkedIn, TikTok, YouTube and General (works for any platform)."},{"q":"Does it follow platform character limits?","a":"Yes, the AI is trained on platform-specific best practices and character limits for each network."},{"q":"What gets generated?","a":"Headlines (3 options), body copy (2-3 options) and calls to action (3 options) — giving you multiple variations to test."}]'
wp post meta set $ID _tg_steps '[{"title":"Describe Your Offer","desc":"Enter your product/service and key benefit or USP."},{"title":"Set Platform and Goal","desc":"Choose your ad platform, campaign goal and target audience."},{"title":"Get Ad Variations","desc":"Receive multiple headline, body and CTA options to A/B test."}]'
wp post meta set $ID _tg_features '[{"title":"7 Ad Platforms","desc":"Optimized copy for Google, Facebook, LinkedIn, TikTok and more."},{"title":"Multiple Variations","desc":"Headlines, body copy and CTAs in multiple options for split testing."},{"title":"Goal-Oriented","desc":"Copy optimized for awareness, leads, sales, downloads or traffic."}]'
```

---

## Tool 17 — Social Media Caption Writer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Social Media Caption Writer" \
  --post_name="social-media-caption-writer" \
  --post_status=publish \
  --post_excerpt="Write engaging social media captions for Instagram, Facebook, Twitter, LinkedIn, TikTok and more. Includes emojis, hashtags and platform-optimized length." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "social-caption-writer"
wp post meta set $ID _tg_action_label "Write Caption"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Which platforms are supported?","a":"Instagram, Facebook, Twitter/X, LinkedIn, TikTok, Pinterest and YouTube Community posts."},{"q":"Can it add emojis and hashtags?","a":"Yes, toggle Emojis and Hashtags to include them in your captions automatically."},{"q":"Can I get multiple caption options?","a":"Yes, generate 1, 3 or 5 different caption variations to choose from."}]'
wp post meta set $ID _tg_steps '[{"title":"Describe Your Post","desc":"Explain what your photo, video or post is about."},{"title":"Choose Platform and Tone","desc":"Select your social network and the tone that fits your brand."},{"title":"Get Captions","desc":"Receive platform-optimized captions with emojis and hashtags."}]'
wp post meta set $ID _tg_features '[{"title":"7 Social Platforms","desc":"Platform-specific captions for Instagram, LinkedIn, TikTok and more."},{"title":"7 Caption Tones","desc":"Inspiring, Funny, Professional, Casual, Educational and more."},{"title":"5 Captions at Once","desc":"Generate up to 5 variations and pick your favorite."}]'
```

---

## Tool 18 — Hashtag Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Hashtag Generator" \
  --post_name="hashtag-generator" \
  --post_status=publish \
  --post_excerpt="Generate relevant hashtags for Instagram, TikTok, Twitter and more. Mix of popular and niche hashtags with reach estimates. Copy all or for specific platforms." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "hashtag-generator"
wp post meta set $ID _tg_action_label "Generate Hashtags"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"How many hashtags can it generate?","a":"10, 20 or 30 hashtags per generation. We recommend 20-30 for Instagram and fewer for Twitter/X."},{"q":"What do the reach badges mean?","a":"HUGE (>1M posts), LARGE (100K-1M), MEDIUM (10K-100K) and NICHE (<10K). A good mix of all sizes performs best."},{"q":"Which platforms are supported?","a":"Instagram, Twitter/X, TikTok, LinkedIn, YouTube, Facebook and Pinterest."}]'
wp post meta set $ID _tg_steps '[{"title":"Describe Your Content","desc":"Explain what your post is about and optionally add your niche."},{"title":"Choose Platform and Mix","desc":"Select your platform and whether to focus on popular, niche or mixed hashtags."},{"title":"Copy and Post","desc":"Copy all hashtags or use the Instagram-formatted copy for that platform."}]'
wp post meta set $ID _tg_features '[{"title":"Reach Size Badges","desc":"Color-coded badges show if each hashtag is Huge, Large, Medium or Niche."},{"title":"Smart Mix Options","desc":"Choose all-popular, all-niche or an optimal mix for better discovery."},{"title":"Platform Copy Buttons","desc":"Copy formatted for Instagram (with line breaks) or space-separated for Twitter."}]'
```

---

## Tool 19 — YouTube Title Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="YouTube Title Generator" \
  --post_name="youtube-title-generator" \
  --post_status=publish \
  --post_excerpt="Generate click-worthy YouTube video titles optimized for CTR and search. Get 5-15 title options with character count indicators and YouTube SEO best practices." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "youtube-title-generator"
wp post meta set $ID _tg_action_label "Generate Titles"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What title styles are available?","a":"Clickbait (high CTR), Informative, Question, How-To, Listicle, Story and Mixed styles."},{"q":"Why does it show a character count?","a":"YouTube shows 60-70 characters in search results. Titles longer than 70 chars may be truncated. We show green for optimal 60-70 char titles."},{"q":"How many titles can it generate?","a":"5, 10 or 15 titles per generation — giving you plenty of options to choose from."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Your Topic","desc":"Type your video topic and optional target keywords."},{"title":"Set Video Type and Style","desc":"Choose the content type and your preferred title style."},{"title":"Pick the Best Title","desc":"Compare options with character count indicators and copy your favorite."}]'
wp post meta set $ID _tg_features '[{"title":"CTR Optimization","desc":"Titles crafted for high click-through rates in YouTube search."},{"title":"Character Count Badges","desc":"Visual indicators showing if titles are optimal (60-70 chars) for YouTube."},{"title":"15 Titles at Once","desc":"Generate up to 15 options with a single click."}]'
```

---

## Tool 20 — YouTube Description Writer

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="YouTube Description Writer" \
  --post_name="youtube-description-writer" \
  --post_status=publish \
  --post_excerpt="Write SEO-optimized YouTube video descriptions. Includes keyword-rich hook, main description, links section, subscribe CTA, timestamps and hashtags." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "youtube-desc-writer"
wp post meta set $ID _tg_action_label "Write Description"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Why is the first 150 characters important?","a":"YouTube shows only the first 150 characters before the Show More button. Including keywords in the hook improves search ranking."},{"q":"Can it include chapter timestamps?","a":"Yes, enter your chapter times and titles and the AI will format them properly in the description."},{"q":"Does it include hashtags?","a":"Yes, the description ends with relevant hashtags to increase discoverability."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Video Details","desc":"Add your video title, topic summary and channel niche."},{"title":"Add Keywords and Chapters","desc":"Enter SEO keywords and optionally add chapter timestamps."},{"title":"Get Full Description","desc":"Copy the complete, optimized YouTube description ready to paste."}]'
wp post meta set $ID _tg_features '[{"title":"SEO-First Hook","desc":"Keywords appear in the first 150 chars visible before Show More."},{"title":"Chapter Integration","desc":"Properly formatted timestamp chapters included automatically."},{"title":"Complete Structure","desc":"Hook, description, links, CTA, chapters and hashtags."}]'
```

---

## Tool 21 — Meta Description Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Meta Description Generator" \
  --post_name="meta-description-generator" \
  --post_status=publish \
  --post_excerpt="Generate SEO-optimized meta descriptions 120-158 characters long. Google SERP preview shows exactly how your page will appear in search results." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "meta-desc-generator"
wp post meta set $ID _tg_action_label "Generate Meta Description"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What is the ideal meta description length?","a":"120-158 characters. Google truncates descriptions longer than ~160 characters. We show green for ideal length, yellow for too short and red for too long."},{"q":"Does it include the target keyword?","a":"Yes, the AI naturally incorporates your target keyword into the meta description for SEO benefit."},{"q":"What is the SERP preview?","a":"A visual mockup showing how your page title, URL and meta description will appear in Google search results."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Page Details","desc":"Add your page title, content summary and target keyword."},{"title":"Choose CTA and Count","desc":"Select a call-to-action phrase and how many options to generate."},{"title":"Pick and Preview","desc":"See Google SERP previews and copy the best description."}]'
wp post meta set $ID _tg_features '[{"title":"Character Count Indicators","desc":"Color-coded badges show if length is ideal, too short or too long."},{"title":"Google SERP Preview","desc":"Visual mockup showing exactly how your result appears in Google."},{"title":"Multiple Options","desc":"Generate 3 or 5 variations to find the most compelling description."}]'
```

---

## Tool 22 — FAQ Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="FAQ Generator" \
  --post_name="faq-generator" \
  --post_status=publish \
  --post_excerpt="Generate relevant FAQs for any topic, product or service. Up to 20 Q&A pairs with interactive accordion preview and JSON-LD schema markup export." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "faq-generator"
wp post meta set $ID _tg_action_label "Generate FAQs"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Can I export the FAQs as schema markup?","a":"Yes, toggle Include JSON-LD Schema to export FAQPage schema markup that you can add to your website head for Google rich snippets."},{"q":"How many FAQs can it generate?","a":"5, 10, 15 or 20 Q&A pairs in a single generation."},{"q":"What FAQ types are available?","a":"General, Technical, Sales/Pricing, Support/Troubleshooting and Mixed types."}]'
wp post meta set $ID _tg_steps '[{"title":"Describe Your Topic","desc":"Explain your product, service or topic in the text area."},{"title":"Choose Type and Count","desc":"Select FAQ type, audience level and how many questions you need."},{"title":"Export FAQs","desc":"Copy as plain text, JSON-LD schema or HTML accordion."}]'
wp post meta set $ID _tg_features '[{"title":"Interactive Accordion Preview","desc":"Click to expand each Q&A for a visual preview of how it will look."},{"title":"JSON-LD Schema Export","desc":"One-click export of FAQPage schema for Google rich snippet eligibility."},{"title":"HTML Accordion Export","desc":"Copy ready-to-use HTML accordion markup for your website."}]'
```

---

## Tool 23 — Story Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Story Generator" \
  --post_name="story-generator" \
  --post_status=publish \
  --post_excerpt="Generate original short stories and flash fiction with AI. 12 genres, multiple POV options and length control from 200-word flash fiction to 2000-word stories." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "story-generator"
wp post meta set $ID _tg_action_label "Generate Story"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What genres are available?","a":"Fantasy, Sci-Fi, Mystery, Romance, Horror, Adventure, Thriller, Historical, Comedy, Drama, Children and Literary Fiction."},{"q":"Can I specify the characters and setting?","a":"Yes, add optional character descriptions and setting details and the AI will incorporate them into the story."},{"q":"How long can the story be?","a":"Flash (~200 words), Short (~500 words), Medium (~1000 words) or Long (~2000 words)."}]'
wp post meta set $ID _tg_steps '[{"title":"Describe Your Idea","desc":"Enter your story premise, idea or the situation you want explored."},{"title":"Set Genre and Style","desc":"Choose genre, POV, tone, setting and character details."},{"title":"Read Your Story","desc":"Get a complete story with vivid descriptions and a satisfying arc."}]'
wp post meta set $ID _tg_features '[{"title":"12 Genres","desc":"From Fantasy to Literary Fiction — every major genre covered."},{"title":"POV Control","desc":"First Person, Third Person Limited or Third Person Omniscient."},{"title":"Full Stories","desc":"Complete narratives with characters, conflict and resolution — not summaries."}]'
```

---

## Tool 24 — Poem Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Poem Generator" \
  --post_name="poem-generator" \
  --post_status=publish \
  --post_excerpt="Generate beautiful poems in 11 styles including sonnets, haiku, limericks and free verse. Perfect for birthdays, anniversaries, weddings and special occasions." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "poem-generator"
wp post meta set $ID _tg_action_label "Generate Poem"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What poetry styles are available?","a":"Free Verse, Sonnet, Haiku, Limerick, Acrostic, Rhyming, Ode, Ballad, Elegy, Cinquain and Villanelle."},{"q":"Can I generate a poem for a special occasion?","a":"Yes, choose from Birthday, Anniversary, Funeral/Memorial, Wedding, Friendship, Nature and Love occasions."},{"q":"What moods are available?","a":"Romantic, Melancholic, Joyful, Contemplative, Humorous, Inspiring and Dramatic."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Your Theme","desc":"Type the topic or theme for your poem."},{"title":"Choose Style and Mood","desc":"Select the poetry style, mood, length and occasion."},{"title":"Get Your Poem","desc":"Receive a beautifully crafted poem following the style conventions."}]'
wp post meta set $ID _tg_features '[{"title":"11 Poetry Styles","desc":"From Haiku to Villanelle — all major poetic forms supported."},{"title":"Occasion-Specific","desc":"Poems tailored for birthdays, weddings, memorials and more."},{"title":"Emotional Depth","desc":"7 mood options from Romantic to Dramatic for the right feeling."}]'
```

---

## Tool 25 — Lyrics Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Lyrics Generator" \
  --post_name="lyrics-generator" \
  --post_status=publish \
  --post_excerpt="Generate original song lyrics in any genre. Pop, Rock, Hip-Hop, R&B, Country, EDM and 7 more genres with custom structure, rhyme scheme and artist inspiration." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "lyrics-generator"
wp post meta set $ID _tg_action_label "Generate Lyrics"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What genres are supported?","a":"Pop, Rock, Hip-Hop/Rap, R&B, Country, EDM, Jazz, Folk, Metal, Indie, Gospel, K-Pop and Latin."},{"q":"Can I set the song structure?","a":"Yes, choose from standard Verse-Chorus-Verse-Chorus-Bridge-Chorus, shorter structures, or a custom arrangement."},{"q":"Can I get lyrics in a specific artists style?","a":"Add an artist inspiration like Taylor Swift or Eminem and the AI will write in a style inspired by their work."}]'
wp post meta set $ID _tg_steps '[{"title":"Describe Your Theme","desc":"Explain what the song is about — story, emotion or message."},{"title":"Set Genre and Style","desc":"Choose genre, mood, structure, rhyme scheme and artist inspiration."},{"title":"Get Your Lyrics","desc":"Receive complete lyrics with labeled verses, chorus and bridge."}]'
wp post meta set $ID _tg_features '[{"title":"13 Genres","desc":"From Pop to K-Pop, every major music genre covered."},{"title":"Rhyme Scheme Options","desc":"AABB, ABAB, ABCB, Free or Mixed rhyme patterns."},{"title":"Artist Inspiration","desc":"Style your lyrics like your favorite artist for genre-authentic results."}]'
```

---

## Tool 26 — Business Name Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Business Name Generator" \
  --post_name="business-name-generator" \
  --post_status=publish \
  --post_excerpt="Generate unique business names with taglines. Multiple styles from Modern & Catchy to Professional. Up to 30 names with domain check links and copy tools." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "business-name-generator"
wp post meta set $ID _tg_action_label "Generate Names"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Does it check domain availability?","a":"The tool provides direct Check Domain links to Namecheap for each business name. We recommend also checking GoDaddy for availability."},{"q":"Can I get a tagline with each name?","a":"Yes, every business name comes with a short, punchy tagline describing the brand value."},{"q":"How many names can it generate?","a":"10, 20 or 30 unique business names per generation."}]'
wp post meta set $ID _tg_steps '[{"title":"Describe Your Business","desc":"Enter your business type, industry and optional keywords to include."},{"title":"Set Style and Target Market","desc":"Choose naming style, length preference and target customer."},{"title":"Browse and Check Domains","desc":"Explore name cards with taglines and check domain availability."}]'
wp post meta set $ID _tg_features '[{"title":"30 Names at Once","desc":"Generate up to 30 unique names with taglines in one click."},{"title":"Domain Check Links","desc":"Direct links to check .com availability for each name."},{"title":"6 Naming Styles","desc":"Modern, Professional, Creative, Descriptive, Abstract and Location-based."}]'
```

---

## Tool 27 — Slogan Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Slogan Generator" \
  --post_name="slogan-generator" \
  --post_status=publish \
  --post_excerpt="Generate memorable brand slogans and taglines. 8 tone options from Inspiring to Luxury, length control from 2 to 12 words and up to 15 slogans at once." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "ai"
wp post meta set $ID _tg_handler "slogan-generator"
wp post meta set $ID _tg_action_label "Generate Slogans"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What tone options are available?","a":"Inspiring, Witty, Bold, Professional, Friendly, Luxury, Minimal and Action-oriented."},{"q":"How short can slogans be?","a":"Very short slogans are 2-4 words — great for brand marks and logos. Short is 5-7 words and Medium is 8-12 words."},{"q":"How many slogans can it generate?","a":"5, 10 or 15 slogans per generation for plenty of options."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Brand Details","desc":"Add your brand name, product/service and key value proposition."},{"title":"Choose Tone and Length","desc":"Select tone style and slogan word count range."},{"title":"Pick Your Slogan","desc":"Browse slogan cards and copy your favorite."}]'
wp post meta set $ID _tg_features '[{"title":"15 Slogans at Once","desc":"Generate up to 15 options with a single click."},{"title":"8 Tone Options","desc":"From Inspiring to Luxury — match your brand personality."},{"title":"Length Control","desc":"2-4 word taglines up to 8-12 word brand slogans."}]'
```

---

## Tool 28 — Password Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Password Generator" \
  --post_name="password-generator" \
  --post_status=publish \
  --post_excerpt="Generate strong, secure passwords with entropy measurement. Up to 64 characters with custom character sets, memorable passphrases and strength meter." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "password-generator"
wp post meta set $ID _tg_action_label "Generate Password"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"How long should my password be?","a":"We recommend at least 16 characters. Passwords with 60+ bits of entropy are considered strong. Our generator shows the exact entropy in bits."},{"q":"What is memorable mode?","a":"Memorable mode generates passphrases like correct-horse-battery-staple — long but easy to remember and very secure."},{"q":"Are the passwords stored anywhere?","a":"No — everything runs in your browser. No passwords are sent to any server."}]'
wp post meta set $ID _tg_steps '[{"title":"Set Length","desc":"Use the slider to choose 8-64 characters. 16+ is recommended."},{"title":"Choose Character Types","desc":"Select uppercase, lowercase, numbers, symbols or exclude ambiguous characters."},{"title":"Copy Your Password","desc":"Password generates automatically. Click Copy to use it."}]'
wp post meta set $ID _tg_features '[{"title":"Entropy Measurement","desc":"Shows exact entropy in bits — 60+ bits means a strong password."},{"title":"Memorable Passphrases","desc":"Word-based passphrases that are secure and easy to remember."},{"title":"Ambiguous Character Filter","desc":"Optionally exclude I, l, 1, O, 0 to avoid confusion when reading."}]'
```

---

## Tool 29 — Lorem Ipsum Generator

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Lorem Ipsum Generator" \
  --post_name="lorem-ipsum-generator" \
  --post_status=publish \
  --post_excerpt="Generate Lorem Ipsum placeholder text instantly. Classic Latin, Business Lorem and Tech Lorem modes. Paragraphs, words, sentences or bytes with HTML tag options." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "lorem-ipsum-generator"
wp post meta set $ID _tg_action_label "Generate Lorem Ipsum"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"What types of Lorem Ipsum are available?","a":"Classic Lorem Ipsum, Random Latin Words, Business Lorem (corporate jargon) and Tech Lorem (technology buzzwords)."},{"q":"Can it output HTML?","a":"Yes, wrap paragraphs in <p> or <div> tags for use directly in HTML templates."},{"q":"Can I generate a specific number of words or characters?","a":"Yes, choose between Paragraphs, Words, Sentences or Bytes and set the exact amount you need."}]'
wp post meta set $ID _tg_steps '[{"title":"Choose Amount and Type","desc":"Select paragraphs, words, sentences or bytes and set the count."},{"title":"Pick Lorem Style","desc":"Choose Classic, Business Lorem or Tech Lorem based on your project."},{"title":"Copy and Use","desc":"Copy the generated text or the HTML-formatted version."}]'
wp post meta set $ID _tg_features '[{"title":"4 Lorem Types","desc":"Classic, Random Latin, Business and Tech Lorem Ipsum styles."},{"title":"HTML Output Option","desc":"Wrap text in paragraph or div tags for direct use in HTML."},{"title":"Instant Generation","desc":"Updates in real time as you change options — no button click needed."}]'
```

---

## Tool 30 — Text to Speech

```bash
ID=$(wp post create \
  --post_type=tg_tool \
  --post_title="Text to Speech" \
  --post_name="text-to-speech-prep" \
  --post_status=publish \
  --post_excerpt="Convert text to speech using your browser's built-in voices. Control speed, pitch and volume. Filter voices by language. Play, pause and stop controls." \
  --porcelain)

wp post term set $ID tool_category ai-tools
wp post meta set $ID _tg_tool_type "browser"
wp post meta set $ID _tg_handler "tts-prep"
wp post meta set $ID _tg_action_label "Prepare for Speech"
wp post meta set $ID _tg_accept_types ""
wp post meta set $ID _tg_faqs '[{"q":"Does it require an internet connection?","a":"No — the Text to Speech tool uses your browser's built-in Web Speech API. It works offline once the page is loaded."},{"q":"How many voices are available?","a":"Voice availability depends on your browser and operating system. Chrome on Windows/Mac typically offers 20+ voices across multiple languages."},{"q":"Can I download the audio?","a":"Direct audio download has limited browser support. We recommend using your system audio recorder to capture the speech output."}]'
wp post meta set $ID _tg_steps '[{"title":"Enter Your Text","desc":"Type or paste up to 5000 characters of text to convert."},{"title":"Choose Voice and Settings","desc":"Select a voice, language, and adjust speed, pitch and volume."},{"title":"Play Your Text","desc":"Click Play and listen. Use Pause and Stop controls as needed."}]'
wp post meta set $ID _tg_features '[{"title":"Browser-Native TTS","desc":"Uses Web Speech API — no API key or internet required."},{"title":"Multi-Language Voices","desc":"Filter and browse voices by language for accurate pronunciation."},{"title":"Full Playback Controls","desc":"Play, Pause and Stop with real-time status indicator."}]'
```

---

## Static Test Commands

Run these after creating tools to verify pages load correctly:

```bash
# Test all 30 tool pages return 200
for slug in grammar-fixer paraphrase-text ai-humanizer text-summarizer essay-writer article-writer blog-post-generator text-translator plagiarism-checker sentence-rewriter word-counter email-writer cover-letter-generator resume-writer product-description-writer ad-copy-generator social-media-caption-writer hashtag-generator youtube-title-generator youtube-description-writer meta-description-generator faq-generator story-generator poem-generator lyrics-generator business-name-generator slogan-generator password-generator lorem-ipsum-generator text-to-speech-prep; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$(wp option get siteurl)/tool/$slug/")
  echo "$slug: $STATUS"
done
```

## PHP Syntax Check

```bash
php -l wp-content/themes/toolsgallery/functions.php
```

## Verify All 30 JS Files Exist

```bash
ls wp-content/themes/toolsgallery/assets/js/tools/ | grep -E "(grammar-fixer|paraphraser|ai-humanizer|summarizer|essay-writer|article-writer|blog-post-generator|ai-translator|plagiarism-checker|sentence-rewriter|word-counter|email-writer|cover-letter-generator|resume-writer|product-desc-writer|ad-copy-generator|social-caption-writer|hashtag-generator|youtube-title-generator|youtube-desc-writer|meta-desc-generator|faq-generator|story-generator|poem-generator|lyrics-generator|business-name-generator|slogan-generator|password-generator|lorem-ipsum-generator|tts-prep)\.js"
```
