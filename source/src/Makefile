VERSION=unknown

# STAGING_DIR and CC can both be set from the environment, for building
# outside of the original /srv/preware build tree.  See tools/build-service.sh,
# which stages the dependencies and sets both.
ifdef DEVICE
# Device build
STAGING_DIR ?= /srv/preware/build/staging/armv7
ifeq ($(origin CC),default)
ifeq ($(shell uname -s),Darwin)
CC=/opt/PalmPDK/arm-gcc/bin/arm-none-linux-gnueabi-gcc
else
CC=/srv/preware/build/toolchain/cs07q3armel/build/arm-2007q3/bin/arm-none-linux-gnueabi-gcc
endif
endif
else
# Emulator build
STAGING_DIR ?= /srv/preware/build/staging/i686
ifeq ($(origin CC),default)
ifeq ($(shell uname -s),Darwin)
CC=/opt/PalmPDK/i686-gcc/bin/i686-nptl-linux-gnu-gcc --sysroot=/opt/PalmPDK/i686-gcc/sys-root
else
CC=/srv/preware/build/toolchain/i686-unknown-linux-gnu/build/i686-unknown-linux-gnu/bin/i686-unknown-linux-gnu-gcc
endif
endif
endif

CPPFLAGS := -g -DVERSION=\"${VERSION}\" -I${STAGING_DIR}/usr/include/glib-2.0 -I${STAGING_DIR}/usr/lib/glib-2.0/include -I${STAGING_DIR}/usr/include
LDFLAGS  := -g -L${STAGING_DIR}/usr/lib -llunaservice -lmjson -lglib-2.0 -lpthread

ipkgservice: ipkgservice.o luna_service.o luna_methods.o

HOST = cdma-pre

install: ipkgservice
#	- ssh root@${HOST} killall org.webosinternals.ipkgservice
#	scp ipkgservice root@${HOST}:/var/usr/sbin/org.webosinternals.ipkgservice.new
#	ssh root@${HOST} mv /var/usr/sbin/org.webosinternals.ipkgservice.new /var/usr/sbin/org.webosinternals.ipkgservice
	novacom put file://home/root/ipkgservice < ipkgservice
	novacom put file://home/root/luna_methods.c < luna_methods.c

clobber:
	rm -rf *.o ipkgservice
