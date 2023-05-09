#!/bin/sh
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
echo "building preware..."

# Bundle everything into a palm package
palm-package source/. -o ./bin
echo

# Inject extra files
echo "adding install files..."
ar qv ./bin/${APPID}*.ipk source/pmPostInstall.script
ar qv ./bin/${APPID}*.ipk source/pmPreRemove.script
ar qv ./bin/${APPID}*.ipk keys/cert.pem
ar qv ./bin/${APPID}*.ipk keys/pubkey.pem
ar qv ./bin/${APPID}*.ipk keys/signature.sha1

echo
echo "output ready at ./bin"

