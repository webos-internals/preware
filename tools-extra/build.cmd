rmdir /S /Q ..\phonegap-phonegap-2.2.0\lib\webos\framework
mkdir ..\phonegap-phonegap-2.2.0\lib\webos\framework

call ..\tools\deploy.bat
copy ..\appinfo.json ..\deploy\preware-enyo2\
xcopy /E /Y ..\deploy\preware-enyo2\* ..\phonegap-phonegap-2.2.0\lib\webos\framework
copy ..\phonegap-phonegap-2.2.0\lib\webos\lib\cordova.webos.js ..\phonegap-phonegap-2.2.0\lib\webos\framework\cordova-2.2.0.js
call palm-package ..\phonegap-phonegap-2.2.0\lib\webos\framework
call palm-install ..\*.ipk