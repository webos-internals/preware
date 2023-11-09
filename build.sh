#!/bin/bash
APPID=org.webosinternals.preware
READY=1
mkdir -p ./bin
[ ! -f keys/cert.pem ] && echo "cert.pem does not exist!" && READY=0
[ ! -f keys/pubkey.pem ] && echo "pubkey.pem does not exist!" && READY=0
[ ! -f keys/signature.sha1 ] && echo "signature.sha1 does not exist!" && READY=0
if [ "$READY" -lt "1" ]; then
    echo
    echo "Signing keys were not found, this build will NOT run properly on a webOS device"
    echo "To make a working build, extract the signing keys from a previous official build"
    echo
fi

useBin=arm
for arg in "$@"; do
    if [ "$arg" = 'i686' ]; then
        useBin=i686
    fi
done

echo "building preware for $useBin..."
rm ./source/bin/org.webosinternals.ipkgservice >/dev/null 2>&1
cp ./source/bin/org.webosinternals.ipkgservice.$useBin ./source/bin/org.webosinternals.ipkgservice

# Bundle everything into a palm package
palm-package source/. -o ./bin --exclude=*.arm --exclude=*.i686
# Find what was just made
unset -v ipk
for file in "./bin"/*.ipk; do
    [[ $file -nt $ipk ]] && ipk=$file
done
if [ -z "${ipk:-}" ]; then 
    echo "build failed, palm-package did not produce a deployable ipk"
    exit
fi

# Inject extra files
echo "adding install files..."
ar qv $ipk source/pmPostInstall.script
ar qv $ipk source/pmPreRemove.script
ar qv $ipk keys/cert.pem
ar qv $ipk keys/pubkey.pem
ar qv $ipk keys/signature.sha1
mv $ipk ${ipk%_all.ipk}_$useBin.ipk
for file in "./bin"/*.ipk; do
    [[ $file -nt $ipk ]] && ipk=$file
done
echo
echo "output ready at $ipk"

