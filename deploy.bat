@echo off
echo ==================================================
echo VS Code S2MJ Local Deploy Script
echo ==================================================

echo [0/3] Compiling TypeScript...
call npm run compile
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Compilation failed.
    pause
    exit /b %ERRORLEVEL%
)

set TARGET_DIR=%USERPROFILE%\.antigravity-ide\extensions\supurjsgml.s2mj-0.1.0

echo [1/3] Creating target directory...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [2/3] Copying files...
xcopy /Y /S /E "out" "%TARGET_DIR%\out\"
copy /Y "package.json" "%TARGET_DIR%\"
copy /Y "package.nls*.json" "%TARGET_DIR%\"
if exist "logo.png" copy /Y "logo.png" "%TARGET_DIR%\"
if exist "README.md" copy /Y "README.md" "%TARGET_DIR%\"
if exist "CHANGELOG.md" copy /Y "CHANGELOG.md" "%TARGET_DIR%\"

echo [3/3] Deploy completed!
echo Please restart VS Code or your IDE to apply changes.
echo ==================================================
