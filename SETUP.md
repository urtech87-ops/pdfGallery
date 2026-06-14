# ToolsGallery — Local Setup Guide

After pulling this repo to your XAMPP WordPress installation, run these WP-CLI commands from your WordPress root (`D:\xampp\htdocs\toolsgallery`).

## 1. Activate the Theme

```bash
wp theme activate toolsgallery
```

## 2. Create Required Pages

```bash
# Home page
wp post create --post_type=page --post_title="Home" --post_status=publish --post_name="home"

# Tools page — must use "Tools Page" template
wp post create --post_type=page --post_title="Tools" --post_status=publish --post_name="tools" --page_template="page-tools.php"

# Blog page
wp post create --post_type=page --post_title="Blog" --post_status=publish --post_name="blog"

# About
wp post create --post_type=page --post_title="About" --post_status=publish --post_name="about"

# Contact
wp post create --post_type=page --post_title="Contact" --post_status=publish --post_name="contact"

# Privacy Policy
wp post create --post_type=page --post_title="Privacy Policy" --post_status=publish --post_name="privacy-policy"

# Terms and Conditions
wp post create --post_type=page --post_title="Terms and Conditions" --post_status=publish --post_name="terms-and-conditions"
```

## 3. Set Front Page & Posts Page

Get the IDs from the output above, then:

```bash
# Replace 2 and 3 with actual IDs of Home and Blog pages
wp option update show_on_front page
wp option update page_on_front 2
wp option update page_for_posts 3
```

## 4. Create Primary Navigation Menu

```bash
# Create menu
wp menu create "Primary Menu"

# Add items (replace HOME_ID, TOOLS_ID etc. with actual page IDs)
wp menu item add-post primary-menu HOME_ID  --title="Home"    --position=1
wp menu item add-post primary-menu TOOLS_ID --title="Tools"   --position=2
wp menu item add-post primary-menu BLOG_ID  --title="Blog"    --position=3
wp menu item add-post primary-menu ABOUT_ID --title="About"   --position=4
wp menu item add-post primary-menu CONTACT_ID --title="Contact" --position=5

# Assign to theme location
wp menu location assign primary-menu primary-menu
```

## 5. Create Tool Categories

```bash
wp term create tool_category "PDF Tools"   --slug="pdf-tools"
wp term create tool_category "Image Tools" --slug="image-tools"
wp term create tool_category "AI Tools"    --slug="ai-tools"
```

## 6. Flush Rewrite Rules

```bash
wp rewrite flush --hard
```

## 7. Verify

- Visit `http://localhost/toolsgallery/` — should show the front page hero
- Visit `http://localhost/toolsgallery/tools/` — should show the Tools page
- Visit `http://localhost/toolsgallery/blog/` — should show the blog index
- Check nav menu appears with all 5 links

## Adding wp-config.php Constants

See `WP_CONFIG_NOTES.md` for the constants to add to your local `wp-config.php`.
