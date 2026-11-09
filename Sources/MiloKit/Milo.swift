// Modified for Milo.
import SwiftUI

/// Debug-only bridge between a running app and milo.
///
/// Call `.milo()` on your root view and `.miloTag()` on the views
/// you want to be selectable by name. In Release builds both are no-ops.
public enum Milo {
    public static let defaultPort: UInt16 = 38471

    /// Starts the local inspector server. Safe to call more than once.
    ///
    /// `port` defaults to `defaultPort`, resolved here rather than in a default
    /// argument: Swift evaluates default arguments in the caller, so an app
    /// that isn't recompiled would keep an old SDK's port.
    @MainActor
    public static func start(port: UInt16? = nil) {
        #if DEBUG
        InspectorServer.shared.start(port: port ?? defaultPort)
        #endif
    }
}

/// Compatibility for apps migrating from OttoPlus.
@available(*, deprecated, renamed: "Milo")
public typealias Otto = Milo

public extension View {
    /// Starts the milo inspector when this view appears (Debug only).
    func milo(port: UInt16? = nil) -> some View {
        #if DEBUG
        onAppear { Milo.start(port: port) }
        #else
        self
        #endif
    }

    /// Makes this view selectable in milo under its type name,
    /// with the file and line it was created on (Debug only).
    func miloTag(_ name: String? = nil, fileID: String = #fileID, line: Int = #line) -> some View {
        #if DEBUG
        modifier(MiloTagModifier(name: name ?? typeName(Self.self), file: fileID, line: line))
        #else
        self
        #endif
    }

    @available(*, deprecated, renamed: "milo(port:)")
    func otto(port: UInt16? = nil) -> some View {
        milo(port: port)
    }

    @available(*, deprecated, renamed: "miloTag(_:fileID:line:)")
    func ottoTag(_ name: String? = nil, fileID: String = #fileID, line: Int = #line) -> some View {
        miloTag(name, fileID: fileID, line: line)
    }
}

/// `ShowRow` for `ShowRow`, `"View"` for wrappers like `ModifiedContent<…>`.
func typeName(_ type: Any.Type) -> String {
    let full = String(describing: type)
    let base = full.split(separator: "<").first.map(String.init) ?? full
    return base == "ModifiedContent" || base.hasPrefix("_") ? "View" : base
}

// UIKit's views: iOS and iPadOS (Mac Catalyst too), tvOS and visionOS.
#if os(iOS) || os(tvOS) || os(visionOS)
public extension UIView {
    /// Makes this view selectable in milo under its class name,
    /// with the file and line where it was tagged (Debug only).
    @MainActor
    @discardableResult
    func miloTag(_ name: String? = nil, fileID: String = #fileID, line: Int = #line) -> Self {
        #if DEBUG
        TagRegistry.shared.tag(self, name: name ?? typeName(type(of: self)), file: fileID, line: line)
        #endif
        return self
    }

    @available(*, deprecated, renamed: "miloTag(_:fileID:line:)")
    @MainActor
    @discardableResult
    func ottoTag(_ name: String? = nil, fileID: String = #fileID, line: Int = #line) -> Self {
        miloTag(name, fileID: fileID, line: line)
    }
}
#endif
