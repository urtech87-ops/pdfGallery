@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION
TITLE ToolsGallery WordPress Setup

ECHO ============================================================
ECHO  ToolsGallery WordPress Setup Script
ECHO  Target: D:\xampp\htdocs\toolsgallery
ECHO ============================================================
ECHO.

SET XAMPP=D:\xampp
SET HTDOCS=%XAMPP%\htdocs
SET WP_PATH=%HTDOCS%\toolsgallery
SET MYSQL=%XAMPP%\mysql\bin\mysql.exe
SET PHP=%XAMPP%\php\php.exe
SET WP_CLI=%HTDOCS%\wp-cli.phar
SET WP_BAT=%HTDOCS%\wp.bat

REM ============================================================
ECHO [STEP 1] Verifying XAMPP Apache is running...
REM ============================================================
curl -s --max-time 5 http://localhost >NUL 2>&1
IF ERRORLEVEL 1 (
    ECHO.
    ECHO  ERROR: Apache is not responding at http://localhost
    ECHO  Please open XAMPP Control Panel and START Apache and MySQL first.
    ECHO  Then re-run this script.
    ECHO.
    PAUSE
    EXIT /B 1
) ELSE (
    ECHO  OK - Apache is running.
)

REM Verify MySQL
"%MYSQL%" -u root -e "SELECT 1;" >NUL 2>&1
IF ERRORLEVEL 1 (
    ECHO.
    ECHO  ERROR: MySQL is not responding.
    ECHO  Please open XAMPP Control Panel and START MySQL first.
    ECHO  Then re-run this script.
    ECHO.
    PAUSE
    EXIT /B 1
) ELSE (
    ECHO  OK - MySQL is running.
)
ECHO.

REM ============================================================
ECHO [STEP 2] Downloading WP-CLI...
REM ============================================================
IF EXIST "%WP_CLI%" (
    ECHO  WP-CLI already exists at %WP_CLI%, skipping download.
) ELSE (
    ECHO  Downloading wp-cli.phar...
    curl -o "%WP_CLI%" https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
    IF ERRORLEVEL 1 (
        ECHO  ERROR: Failed to download WP-CLI. Check your internet connection.
        PAUSE
        EXIT /B 1
    )
    ECHO  Downloaded successfully.
)

IF NOT EXIST "%WP_BAT%" (
    ECHO  Creating global wp.bat command...
    ECHO @ECHO OFF > "%WP_BAT%"
    ECHO php "%WP_CLI%" %%* >> "%WP_BAT%"
    ECHO  Created: %WP_BAT%
) ELSE (
    ECHO  wp.bat already exists, skipping.
)

ECHO  Testing WP-CLI...
"%PHP%" "%WP_CLI%" --info >NUL 2>&1
IF ERRORLEVEL 1 (
    ECHO  ERROR: WP-CLI failed to run with PHP at %PHP%
    PAUSE
    EXIT /B 1
) ELSE (
    ECHO  OK - WP-CLI is working.
)
ECHO.

REM ============================================================
ECHO [STEP 3] Creating database 'toolsgallery'...
REM ============================================================
"%MYSQL%" -u root -e "CREATE DATABASE IF NOT EXISTS toolsgallery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
IF ERRORLEVEL 1 (
    ECHO  ERROR: Failed to create database.
    PAUSE
    EXIT /B 1
)
ECHO  Database created (or already exists).

ECHO  Verifying database exists...
"%MYSQL%" -u root -e "SHOW DATABASES LIKE 'toolsgallery';"
ECHO.

REM ============================================================
ECHO [STEP 4] Downloading WordPress core...
REM ============================================================
IF EXIST "%WP_PATH%\wp-includes\version.php" (
    ECHO  WordPress files already present, skipping download.
) ELSE (
    ECHO  Downloading WordPress (en_US)...
    "%PHP%" "%WP_CLI%" core download --path="%WP_PATH%" --locale=en_US
    IF ERRORLEVEL 1 (
        ECHO  ERROR: Failed to download WordPress core.
        PAUSE
        EXIT /B 1
    )
    ECHO  WordPress downloaded.
)
ECHO.

REM ============================================================
ECHO [STEP 5] Creating wp-config.php...
REM ============================================================
IF EXIST "%WP_PATH%\wp-config.php" (
    ECHO  wp-config.php already exists, skipping.
) ELSE (
    ECHO  Creating wp-config.php...
    "%PHP%" "%WP_CLI%" config create ^
        --path="%WP_PATH%" ^
        --dbname=toolsgallery ^
        --dbuser=root ^
        --dbpass="" ^
        --dbhost=localhost ^
        --dbprefix=tg_
    IF ERRORLEVEL 1 (
        ECHO  ERROR: Failed to create wp-config.php.
        PAUSE
        EXIT /B 1
    )
    ECHO  wp-config.php created.
)
ECHO.

REM ============================================================
ECHO [STEP 6] Installing WordPress...
REM ============================================================
"%PHP%" "%WP_CLI%" core is-installed --path="%WP_PATH%" >NUL 2>&1
IF NOT ERRORLEVEL 1 (
    ECHO  WordPress already installed, skipping.
) ELSE (
    ECHO  Running WordPress installation...
    "%PHP%" "%WP_CLI%" core install ^
        --path="%WP_PATH%" ^
        --url=http://localhost/toolsgallery ^
        --title="ToolsGallery" ^
        --admin_user=admin ^
        --admin_password=Admin@12345 ^
        --admin_email=admin@toolsgallery.com ^
        --skip-email
    IF ERRORLEVEL 1 (
        ECHO  ERROR: WordPress installation failed.
        PAUSE
        EXIT /B 1
    )
    ECHO  WordPress installed successfully.
)
ECHO.

REM ============================================================
ECHO [STEP 7] Verifying installation...
REM ============================================================
ECHO  WordPress version:
"%PHP%" "%WP_CLI%" core version --path="%WP_PATH%"
ECHO  Site URL:
"%PHP%" "%WP_CLI%" option get siteurl --path="%WP_PATH%"
ECHO.

REM ============================================================
ECHO [STEP 8] Installing plugins (Rank Math SEO + Contact Form 7)...
REM ============================================================
ECHO  Installing and activating plugins...
"%PHP%" "%WP_CLI%" plugin install seo-by-rank-math contact-form-7 --activate --path="%WP_PATH%"
IF ERRORLEVEL 1 (
    ECHO  WARNING: One or more plugins failed to install. Continuing...
) ELSE (
    ECHO  Plugins installed and activated.
)
ECHO.

REM ============================================================
ECHO [STEP 9] Setting pretty permalinks...
REM ============================================================
ECHO  Setting permalink structure to /%postname%/...
"%PHP%" "%WP_CLI%" rewrite structure "/%%postname%%/" --path="%WP_PATH%"
"%PHP%" "%WP_CLI%" rewrite flush --path="%WP_PATH%"
ECHO  Permalinks configured.
ECHO.

REM ============================================================
ECHO [STEP 10] Adding API key constants to wp-config.php...
REM ============================================================
ECHO  Checking if constants already added...
findstr /C:"OPENROUTER_API_KEY" "%WP_PATH%\wp-config.php" >NUL 2>&1
IF NOT ERRORLEVEL 1 (
    ECHO  Constants already present in wp-config.php, skipping.
) ELSE (
    ECHO  Adding API key constants to wp-config.php...
    REM Use PowerShell to safely insert lines before the stop-editing marker
    powershell -Command ^
        "(Get-Content '%WP_PATH%\wp-config.php') -replace ^
        \"(/\* That's all, stop editing! \*/)\", ^
        \"define('OPENROUTER_API_KEY', 'YOUR_OPENROUTER_KEY_HERE');`r`ndefine('ADSENSE_PUBLISHER_ID', '');`r`ndefine('REMOVEBG_API_KEY', '');`r`ndefine('SCREENSHOT_API_KEY', '');`r`n`r`n`$1\" | ^
        Set-Content '%WP_PATH%\wp-config.php'"
    IF ERRORLEVEL 1 (
        ECHO  WARNING: Could not auto-insert constants. Add them manually to wp-config.php.
    ) ELSE (
        ECHO  Constants added to wp-config.php.
    )
)
ECHO.

REM ============================================================
ECHO [STEP 11] Git initialization and commit...
REM ============================================================
ECHO  NOTE: This step initializes git in the WordPress folder.
ECHO  If you want to commit WP files to your existing pdfGallery repo,
ECHO  skip this step and manage git from your repo root instead.
ECHO.
SET /P GIT_CONFIRM=Proceed with git init + commit in %WP_PATH%? (Y/N):
IF /I "!GIT_CONFIRM!"=="Y" (
    cd /D "%WP_PATH%"
    IF NOT EXIST ".git" (
        git init
    )
    REM Create .gitignore to exclude heavy/sensitive files
    IF NOT EXIST ".gitignore" (
        ECHO wp-config.php > .gitignore
        ECHO wp-content/uploads/ >> .gitignore
        ECHO wp-content/cache/ >> .gitignore
        ECHO wp-content/upgrade/ >> .gitignore
        ECHO *.log >> .gitignore
    )
    git add .
    git commit -m "Setup: WordPress installed — ToolsGallery foundation"
    ECHO  Committed. To push, run: git remote add origin YOUR_REPO_URL ^& git push -u origin main
) ELSE (
    ECHO  Skipped git step.
)
ECHO.

REM ============================================================
ECHO ============================================================
ECHO  SETUP COMPLETE!
ECHO ============================================================
ECHO.
ECHO  Site URL    : http://localhost/toolsgallery
ECHO  Admin URL   : http://localhost/toolsgallery/wp-admin
ECHO  Admin user  : admin
ECHO  Admin pass  : Admin@12345
ECHO  Database    : toolsgallery (prefix: tg_)
ECHO.
ECHO  IMPORTANT: Replace YOUR_OPENROUTER_KEY_HERE in wp-config.php
ECHO  with your actual OpenRouter API key.
ECHO.
PAUSE
