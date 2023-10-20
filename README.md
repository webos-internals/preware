Preware is a webOS on-device homebrew installer.

# webOS Archive Fork

This fork refactors the project to allow us to update and build Preware 1.x without the legacy build infrastructure. For LuneOS, see [Preware 2](https://github.com/webOS-ports/preware).

## Building

The `build.sh` script should do (or at least, suggest) everything you need -- except for signing keys...

## About Keys

The original build server is lost to time, so its impossible to officially sign builds. However, the key files can be found in an original release package. Extract them from that package, and add to the `keys` folder to produce a working build.