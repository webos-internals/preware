#!/bin/bash
#
# Builds org.webosinternals.ipkgservice for the device and drops the result
# into source/bin/, where build.sh picks it up.
#
#   ./tools/build-service.sh              # armv7 (Pre through TouchPad)
#   ./tools/build-service.sh i686         # emulator
#
# The service needs three libraries that are not in this repo: lunaservice,
# mjson and glib.  They are still available as prebuilt optware packages, so
# this script fetches them and assembles the staging tree the Makefile wants,
# rather than needing the original /srv/preware build tree.
#
# The compiler is the CodeSourcery 2007q3 cross-toolchain that the original
# builds used, which produces an ARMv5TE/EABI5 binary that runs on everything
# from the original Pre to the TouchPad.  Set CROSS_CC to point somewhere else.

set -eu

REPO=$(cd "$(dirname "$0")/.." && pwd)
WORK=${WORK:-$REPO/build-service}

ARCH=armv7
[ "${1:-}" = "i686" ] && ARCH=i686

# Version baked into the binary, reported by the service's version method.
VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$REPO/source/appinfo.json" | head -1)

# Where the optware packages still live.
FEED_ARM=http://ipkg.nslu2-linux.org/feeds/optware/pre/cross/unstable
FEED_ARM_ALT=http://ipkg.nslu2-linux.org/feeds/optware/cs08q1armel/cross/unstable
FEED_I686=http://ipkg.nslu2-linux.org/feeds/optware/pre-emulator/cross/unstable
FEED_I686_ALT=http://ipkg.nslu2-linux.org/feeds/optware/i686g25/cross/unstable

PKGS="mjson_1.0-1 lunaservice_0.0.1-1 glib_2.20.4-1"

if [ "$ARCH" = "armv7" ]; then
    PKGARCH=arm
    FEEDS="$FEED_ARM $FEED_ARM_ALT"
    DEVICE_FLAG="DEVICE=1"
    # Toolchains, in order of preference.  The first is the one the original
    # builds used; the second ships with the Palm PDK.
    CANDIDATES="
        $HOME/Documents/GitHub/build/toolchain/cs07q3armel/build/arm-2007q3/bin/arm-none-linux-gnueabi-gcc
        /srv/preware/build/toolchain/cs07q3armel/build/arm-2007q3/bin/arm-none-linux-gnueabi-gcc
        /opt/PalmPDK/arm-gcc/bin/arm-none-linux-gnueabi-gcc
    "
else
    PKGARCH=i686
    FEEDS="$FEED_I686 $FEED_I686_ALT"
    DEVICE_FLAG=""
    CANDIDATES="
        $HOME/Documents/GitHub/build/toolchain/i686-unknown-linux-gnu/build/i686-unknown-linux-gnu/bin/i686-unknown-linux-gnu-gcc
        /srv/preware/build/toolchain/i686-unknown-linux-gnu/build/i686-unknown-linux-gnu/bin/i686-unknown-linux-gnu-gcc
    "
fi

CC=${CROSS_CC:-}
if [ -z "$CC" ]; then
    for c in $CANDIDATES; do
        if [ -x "$c" ]; then CC=$c; break; fi
    done
fi
[ -n "$CC" ] || { echo "No cross compiler found. Set CROSS_CC." >&2; exit 1; }

DL=$WORK/downloads
STAGING=$WORK/staging/$ARCH
mkdir -p "$DL" "$STAGING/usr/include" "$STAGING/usr/lib"

echo "building ipkgservice $VERSION for $ARCH"
echo "  compiler: $CC"

for pkg in $PKGS; do
    ipk=$DL/${pkg}_${PKGARCH}.ipk
    if [ ! -s "$ipk" ]; then
        got=
        for feed in $FEEDS; do
            if curl -sS -f -R -L -o "$ipk.tmp" "$feed/${pkg}_${PKGARCH}.ipk"; then
                mv "$ipk.tmp" "$ipk"; got=1; break
            fi
        done
        rm -f "$ipk.tmp"
        [ -n "$got" ] || { echo "could not fetch ${pkg}_${PKGARCH}.ipk" >&2; exit 1; }
        echo "  fetched ${pkg}_${PKGARCH}.ipk"
    fi

    # These are gzipped tarballs holding a data.tar.gz, not ar archives.
    ex=$WORK/extract/$pkg
    rm -rf "$ex"; mkdir -p "$ex/d"
    tar xzf "$ipk" -C "$ex"
    tar xzf "$ex/data.tar.gz" -C "$ex/d"

    [ -d "$ex/d/opt/include" ] && cp -rp "$ex/d/opt/include/." "$STAGING/usr/include/"
    [ -d "$ex/d/opt/lib/glib-2.0/include" ] && cp -rp "$ex/d/opt/lib/glib-2.0/include/." "$STAGING/usr/include/"
    ls "$ex"/d/opt/lib/*.so* >/dev/null 2>&1 && cp -rp "$ex"/d/opt/lib/*.so* "$STAGING/usr/lib/"
done
echo "  staged $(echo $PKGS | wc -w) dependencies"

make -C "$REPO/source/src" clobber >/dev/null 2>&1 || true
make -C "$REPO/source/src" ipkgservice \
     $DEVICE_FLAG \
     VERSION="$VERSION" \
     STAGING_DIR="$STAGING" \
     CC="$CC"

if [ "$ARCH" = "armv7" ]; then
    out=$REPO/source/bin/org.webosinternals.ipkgservice.arm
else
    out=$REPO/source/bin/org.webosinternals.ipkgservice.i686
fi
cp "$REPO/source/src/ipkgservice" "$out"
make -C "$REPO/source/src" clobber >/dev/null 2>&1 || true

echo ""
echo "installed: $out"
file "$out"
readelf -d "$out" | grep NEEDED || true
