<?php
if (post_password_required()) {
    return;
}
?>

<?php if (have_comments()): ?>
<section class="tg-comments" id="comments">
    <h2 class="tg-comments__title">
        <?php
        $count = get_comments_number();
        echo ($count === '1') ? '1 Comment' : $count . ' Comments';
        ?>
    </h2>

    <ol class="tg-comments__list">
        <?php
        wp_list_comments([
            'style'       => 'ol',
            'short_ping'  => true,
            'avatar_size' => 48,
            'callback'    => 'tg_comment_callback',
        ]);
        ?>
    </ol>

    <?php if (get_comment_pages_count() > 1 && get_option('page_comments')): ?>
    <nav class="tg-comments__pagination">
        <?php paginate_comments_links(); ?>
    </nav>
    <?php endif; ?>

</section>
<?php endif; ?>

<?php if (comments_open()): ?>
<section class="tg-comment-form" id="respond">
    <?php
    comment_form([
        'title_reply'          => 'Leave a Comment',
        'title_reply_before'   => '<h2 class="tg-comment-form__title">',
        'title_reply_after'    => '</h2>',
        'comment_notes_before' => '<p class="tg-comment-form__note">Your email address will not be published. Required fields are marked <span>*</span></p>',
        'label_submit'         => 'Post Comment',
        'submit_button'        => '<button type="submit" class="tg-btn tg-btn--primary tg-comment-form__submit" id="%2$s">%4$s</button>',
        'fields' => [
            'author' =>
                '<div class="tg-comment-form__row">
                <label for="author">Name <span>*</span></label>
                <input id="author" name="author" type="text" required class="tg-comment-form__input"/>
                </div>',
            'email' =>
                '<div class="tg-comment-form__row">
                <label for="email">Email <span>*</span></label>
                <input id="email" name="email" type="email" required class="tg-comment-form__input"/>
                </div>',
            'url' =>
                '<div class="tg-comment-form__row">
                <label for="url">Website</label>
                <input id="url" name="url" type="url" class="tg-comment-form__input"/>
                </div>',
            'cookies' => '',
        ],
        'comment_field' =>
            '<div class="tg-comment-form__row">
            <label for="comment">Comment <span>*</span></label>
            <textarea id="comment" name="comment" required rows="6" class="tg-comment-form__textarea"></textarea>
            </div>',
    ]);
    ?>
</section>
<?php elseif (!is_single()): ?>
    <!-- comments closed -->
<?php else: ?>
<p class="tg-comments__closed">Comments are closed.</p>
<?php endif; ?>
