APPID = org.webosinternals.preware

emulator:
	cd ../service/src && ${MAKE}

device:
	cd ../service/src && ${MAKE} DEVICE=1

package: clean emulator
	palm-package .
	ar q ${APPID}_*.ipk pmPostInstall.script
	ar q ${APPID}_*.ipk pmPreRemove.script

test: package
	- palm-install -r ${APPID}
	palm-install ${APPID}_*.ipk
	palm-launch ${APPID}

install: package
	palm-install ${APPID}_*.ipk
	palm-launch ${APPID}

clean:
	find . -name '*~' -delete
	rm -f ipkgtmp*.tar.gz ${APPID}_*.ipk

clobber: clean
	cd ../service/src && ${MAKE} clobber
