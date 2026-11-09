#!/bin/sh
# Compile the SDK and an unchanged legacy consumer on every supported SDK.
set -eu
cd "$(dirname "$0")/../.."
scratch=$(mktemp -d)
trap 'rm -rf "$scratch"' EXIT
for pair in iphonesimulator:arm64-apple-ios17.0-simulator \
            macosx:arm64-apple-macos14.0 \
            appletvsimulator:arm64-apple-tvos17.0-simulator \
            watchsimulator:arm64-apple-watchos10.0-simulator \
            xrsimulator:arm64-apple-xros1.0-simulator; do
  for mode in debug release; do
    modules="$scratch/${pair%%:*}-$mode"
    mkdir -p "$modules"
    define=""
    [ "$mode" != debug ] || define=-DDEBUG
    xcrun -sdk "${pair%%:*}" swiftc -swift-version 6 -module-name MiloKit \
      -parse-as-library -target "${pair#*:}" $define -emit-module \
      -emit-module-path "$modules/MiloKit.swiftmodule" Sources/MiloKit/*.swift
    xcrun -sdk "${pair%%:*}" swiftc -swift-version 6 -module-name OttoPlus \
      -parse-as-library -target "${pair#*:}" $define -I "$modules" -emit-module \
      -emit-module-path "$modules/OttoPlus.swiftmodule" Sources/OttoPlus/*.swift
    xcrun -sdk "${pair%%:*}" swiftc -swift-version 6 \
      -target "${pair#*:}" $define -I "$modules" -typecheck \
      app/scripts/fixtures/SDKCompatibility.swift
    echo "PASS: MiloKit and OttoPlus consumer on ${pair%%:*} ($mode)"
  done
done
