<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'toolsgallery');

/** Database username */
define('DB_USER', 'root');

/** Database password */
define('DB_PASSWORD', '');

/** Database hostname */
define('DB_HOST', 'localhost');

/** Database charset to use in creating database tables. */
define('DB_CHARSET', 'utf8');

/** The database collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY', ')q_= .[{><LuJ6GR.aaMn4@g93=P*%c|)6$fGo-W`:0Gj1^s2!EWv&@?g<lQGv>.');
define('SECURE_AUTH_KEY', '#(bC5`&pQ{;;:vC%zf+2Qa7d<i:=k<_j5&T1Nm/DD-eUX*=4m&Kp{3e+v+mnzilN');
define('LOGGED_IN_KEY', 'rN)Hi?Oh7EC;d3?y/1;EGVK9^{Vr%)_?-YNM+J*I_N-DYQ/FS3KRd[!;W?8X:ylM');
define('NONCE_KEY', '}PB.Gz1-WG4TTv|#&r6M%/kNO3;~8H1#&lI|N( 7W46)@hFhG)u#}og.E:{@j`DA');
define('AUTH_SALT', 'i5uiIqJ]ovxB3qk!q!^:Q:E2Ikaro #/.[m{H,t{4(p|3zZB>cQfvcwiNg{)U9uw');
define('SECURE_AUTH_SALT', 'sNXmRzFV>yM]G/19,DVS-$x$^g[mGV=L$8k}uH#)/(3nPW^OAvh?}}4?lr$#y/SL');
define('LOGGED_IN_SALT', '1P##8{&XGjvWcgOy!=Xc=3sd%YOOG)-p(frd}$[vE82*s`C](Hh1O*1s)rgv>F28');
define('NONCE_SALT', 'gYx#,P <3Y7!jGU-Ndnh_TIBRSnoKz5!:%u:CGmsPnq9YFfKuL1),GLHhu,Qd~Yq');
define('WP_CACHE_KEY_SALT', ']RR1WFv*@pO/jGRZjxo`egpqwK0,v1~G.KIwg<Ie.I@{WC tn>JK(1&BH<fPyH60');


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'tg_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if (!defined('WP_DEBUG')) {
	define('WP_DEBUG', false);
}
define('OPENROUTER_API_KEY', 'your-openrouter-key-here');
define('ADSENSE_PUBLISHER_ID', '');
define('REMOVEBG_API_KEY', '');
define('SCREENSHOT_API_KEY', '');
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if (!defined('ABSPATH')) {
	define('ABSPATH', __DIR__ . '/');
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
