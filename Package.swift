// swift-tools-version: 6.0
// Modified for Milo.

import PackageDescription

// MiloKit, the optional in-app SDK: add this repository's URL in
// Xcode (File > Add Package Dependencies) and link MiloKit. The
// host and the web UI build separately (see host/Package.swift and
// package.json); this manifest contains the SDK and its compatibility module.
//
// It builds for every Apple platform. Where UIKit draws the interface
// (iOS, iPadOS, Mac Catalyst, tvOS, visionOS) a snapshot walks the views
// and layers; on macOS and watchOS it carries the `.miloTag()` views only.
let package = Package(
    name: "MiloKit",
    platforms: [.iOS(.v17), .macCatalyst(.v17), .macOS(.v14), .tvOS(.v17), .watchOS(.v10), .visionOS(.v1)],
    products: [
        .library(name: "MiloKit", targets: ["MiloKit"]),
        // Compatibility for apps that have not migrated their package product yet.
        .library(name: "OttoPlus", targets: ["OttoPlus"]),
    ],
    targets: [
        .target(name: "MiloKit"),
        .target(name: "OttoPlus", dependencies: ["MiloKit"]),
    ]
)
