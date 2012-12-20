REM call tools\deploy.bat
REM copy appinfo.json deploy\preware-enyo2\
call palm-package .
call palm-install *.ipk