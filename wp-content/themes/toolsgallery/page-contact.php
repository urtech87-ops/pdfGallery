<?php
/**
 * Template Name: Contact Page
 * Template for the Contact page (slug: contact)
 */
get_header();
?>

<div class="tg-container">
    <div class="tg-contact-page">

        <section class="tg-contact-hero">
            <h1>Contact Tool Acadmy</h1>
            <p>Have a question, found a bug, or want to suggest a new tool? Get in touch with us. We respond to all
                messages within 24-48 hours.</p>
        </section>

                <?php if (isset($_GET['sent']) && $_GET['sent'] === '1'): ?>
            <div class="tg-alert tg-alert-success"
                style="background:#d1fae5;border:1px solid #6ee7b7;color:#065f46;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
                <strong>Message sent!</strong> Thank you for contacting us. We will get back to you within 24-48 hours.
            </div>
                <?php endif; ?>

        <div class="tg-contact-grid">

            <div class="tg-contact-form-section">
                <h2>Send Us a Message</h2>
                                <?php echo do_shortcode('[fluentform id="3"]'); ?>
            </div>

            <div class="tg-contact-info-section">
                <h2>Contact Information</h2>

                <div class="tg-contact-info-card">
                    <div class="tg-contact-info-item">
                        <span class="tg-contact-icon">&#x2709;&#xFE0F;</span>
                        <div>
                            <strong>Email</strong>
                            <p>contact@toolacadmy.com</p>
                        </div>
                    </div>

                    <div class="tg-contact-info-item">
                        <span class="tg-contact-icon">&#x23F1;&#xFE0F;</span>
                        <div>
                            <strong>Response Time</strong>
                            <p>Within 24-48 hours</p>
                        </div>
                    </div>

                    <div class="tg-contact-info-item">
                        <span class="tg-contact-icon">&#x1F310;</span>
                        <div>
                            <strong>Website</strong>
                            <p>toolacadmy.com</p>
                        </div>
                    </div>

                    <div class="tg-contact-info-item">
                        <span class="tg-contact-icon">&#x1F552;</span>
                        <div>
                            <strong>Support Hours</strong>
                            <p>Monday &ndash; Friday, 9am &ndash; 6pm PKT</p>
                        </div>
                    </div>
                </div>

                <h3 style="margin-top:24px;">What Can We Help With?</h3>
                <ul class="tg-contact-topics">
                    <li>&#x1F41B; <strong>Bug Reports</strong> — Report a tool that is not working correctly</li>
                    <li>&#x1F4A1; <strong>Feature Requests</strong> — Suggest a new tool or improvement</li>
                    <li>&#x1F4BC; <strong>Business Inquiries</strong> — Partnerships, advertising, or collaborations
                    </li>
                    <li>&#x2753; <strong>General Questions</strong> — Any other questions about Tool Acadmy</li>
                </ul>
            </div>
        </div>

        <section class="tg-contact-faq">
            <h2>Frequently Asked Questions</h2>
            <div class="tg-faq-accordion">

                <div class="tg-faq-item">
                    <button class="tg-faq-question">How quickly will I get a response? <span
                            class="tg-faq-icon">+</span></button>
                    <div class="tg-faq-answer">
                        <p>We aim to respond to all messages within 24-48 business hours. For urgent bug reports that
                            affect multiple tools, we prioritize faster responses.</p>
                    </div>
                </div>

                <div class="tg-faq-item">
                    <button class="tg-faq-question">How do I report a broken tool? <span
                            class="tg-faq-icon">+</span></button>
                    <div class="tg-faq-answer">
                        <p>Select "Bug Report" from the Subject dropdown, then describe which tool is affected, what you
                            were trying to do, and what error message or behavior you saw. Include your browser name and
                            version if possible.</p>
                    </div>
                </div>

                <div class="tg-faq-item">
                    <button class="tg-faq-question">Can I request a new tool? <span
                            class="tg-faq-icon">+</span></button>
                    <div class="tg-faq-answer">
                        <p>Absolutely. Select "Feature Request" from the Subject dropdown and describe the tool you
                            would like to see. We review all requests and prioritize the most popular ones.</p>
                    </div>
                </div>

                <div class="tg-faq-item">
                    <button class="tg-faq-question">Do you offer API access? <span class="tg-faq-icon">+</span></button>
                    <div class="tg-faq-answer">
                        <p>We do not currently offer public API access. For business or enterprise inquiries please
                            select "Business Inquiry" in the contact form.</p>
                    </div>
                </div>

            </div>
        </section>

    </div>
</div>

<?php get_footer(); ?>