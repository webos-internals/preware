rmdir /S /Q phonegap-phonegap-2.2.0\lib\webos\framework
mkdir phonegap-phonegap-2.2.0\lib\webos\framework

xcopy /E /Y /I api   phonegap-phonegap-2.2.0\lib\webos\framework\api
xcopy /E /Y /I assets phonegap-phonegap-2.2.0\lib\webos\framework\assets
xcopy /E /Y /I enyo   phonegap-phonegap-2.2.0\lib\webos\framework\enyo
xcopy /E /Y /I lib    phonegap-phonegap-2.2.0\lib\webos\framework\lib
xcopy /E /Y /I source phonegap-phonegap-2.2.0\lib\webos\framework\source
copy appinfo.json  phonegap-phonegap-2.2.0\lib\webos\framework
copy icon.png      phonegap-phonegap-2.2.0\lib\webos\framework
copy debug.html    phonegap-phonegap-2.2.0\lib\webos\framework\index.html
copy phonegap-phonegap-2.2.0\lib\webos\lib\cordova.webos.js phonegap-phonegap-2.2.0\lib\webos\framework\cordova-2.2.0.js
call palm-package phonegap-phonegap-2.2.0\lib\webos\framework
REM call palm-install *.ipk
