# wp-config.php Constants

Add these to your **local** `wp-config.php` (after the DB settings block, before `/* That's all, stop editing! */`).  
**Do NOT commit wp-config.php to the repo.**

```php
// OpenRouter AI proxy (get key at https://openrouter.ai)
define('OPENROUTER_API_KEY', 'your-openrouter-key-here');

// Google AdSense (leave empty string until approved)
define('ADSENSE_PUBLISHER_ID', '');

// Remove.bg API key (for Background Remover tool)
define('REMOVEBG_API_KEY', '');

// Screenshot API key (reserved for future use)
define('SCREENSHOT_API_KEY', '');
```

## Notes
- While `ADSENSE_PUBLISHER_ID` is empty/undefined, the theme shows orange dashed placeholder ad boxes so you can see where ads will appear.
- While `OPENROUTER_API_KEY` is undefined, the AI proxy endpoint returns a 500 with `"API not configured"` — no silent failures.
- Rate limiting on the AI proxy is 10 requests per IP per hour (stored in WP transients).
