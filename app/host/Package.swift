// swift-tools-version: 6.0
// Modified for Milo.

import PackageDescription

// No third-party dependencies: CoreSimulator and SimulatorKit are private
// frameworks loaded at runtime with dlopen, and HTTP/WebSocket is built on
// BSD sockets.
let package = Package(
    name: "MiloHost",
    platforms: [.macOS(.v15)],
    products: [
        .executable(name: "milo", targets: ["milo"]),
        .library(name: "MiloBridge", targets: ["MiloBridge"]),
    ],
    targets: [
        .target(
            name: "MiloBridge",
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
            name: "milo",
            dependencies: ["MiloBridge"]
        ),
    ]
)
