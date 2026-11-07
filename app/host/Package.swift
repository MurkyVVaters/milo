// swift-tools-version: 6.0
// Modified for Otto.

import PackageDescription

// No third-party dependencies: CoreSimulator and SimulatorKit are private
// frameworks loaded at runtime with dlopen, and HTTP/WebSocket is built on
// BSD sockets.
let package = Package(
    name: "OttoHost",
    platforms: [.macOS(.v15)],
    products: [
        .executable(name: "otto", targets: ["otto"]),
        .library(name: "SimBridge", targets: ["SimBridge"]),
    ],
    targets: [
        .target(
            name: "SimBridge",
            exclude: ["LICENSE-baguette", "LICENSE-sim-use"],
            linkerSettings: [
                .linkedFramework("IOSurface"),
                .linkedFramework("CoreVideo"),
                .linkedFramework("ImageIO"),
                .linkedFramework("VideoToolbox"),
                .linkedFramework("CoreMedia"),
                .linkedFramework("CoreImage"),
            ]
        ),
        .executableTarget(
            name: "otto",
            dependencies: ["SimBridge"]
        ),
    ]
)
