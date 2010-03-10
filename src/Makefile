STAGING_DIR=/srv/preware/build/staging/i686
CC=/srv/preware/build/toolchain/i686-unknown-linux-gnu/build/i686-unknown-linux-gnu/bin/i686-unknown-linux-gnu-gcc

CPPFLAGS := -g -I${STAGING_DIR}/usr/include/glib-2.0 -I${STAGING_DIR}/usr/lib/glib-2.0/include -I${STAGING_DIR}/usr/include
LDFLAGS  := -g -L${STAGING_DIR}/usr/lib -llunaservice -lmjson -lglib-2.0

ipkgservice: ipkgservice.o luna_service.o luna_methods.o

install: ipkgservice
	- ssh root@webos killall ipkgservice
	scp ipkgservice root@webos:/var/usr/bin/ipkgservice
#	ssh root@webos /var/usr/bin/ipkgservice

clobber:
	rm -rf *.o ipkgservice
