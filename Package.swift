// swift-tools-version: 6.0
// Modified for Otto.

import PackageDescription

// OttoPlus, the optional in-app SDK: add this repository's URL in
// Xcode (File > Add Package Dependencies) and link OttoPlus. The
// host and the web UI build separately (see host/Package.swift and
// package.json); this manifest is the SDK alone.
//
// It builds for every Apple platform. Where UIKit draws the interface
// (iOS, iPadOS, Mac Catalyst, tvOS, visionOS) a snapshot walks the views
// and layers; on macOS and watchOS it carries the `.ottoTag()` views only.
let package = Package(
    name: "OttoPlus",
    platforms: [.iOS(.v17), .macCatalyst(.v17), .macOS(.v14), .tvOS(.v17), .watchOS(.v10), .visionOS(.v1)],
    products: [
        .library(name: "OttoPlus", targets: ["OttoPlus"]),
    ],
    targets: [
        .target(name: "OttoPlus"),
    ]
)
