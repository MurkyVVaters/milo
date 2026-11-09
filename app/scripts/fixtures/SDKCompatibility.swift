// Compile an unchanged OttoPlus consumer against the renamed SDK.
import SwiftUI
import OttoPlus

@MainActor
func legacyConsumer() -> some View {
    Otto.start()
    return Text("Legacy app").otto().ottoTag("Legacy", fileID: "App/View.swift", line: 42)
}

@MainActor
func miloConsumer() -> some View {
    Milo.start()
    return Text("Milo app").milo().miloTag("Milo", fileID: "App/View.swift", line: 42)
}

#if os(iOS) || os(tvOS) || os(visionOS)
@MainActor
func taggedUIKitView(_ view: UIView) -> UIView {
    view.ottoTag("Legacy", fileID: "App/View.swift", line: 42)
        .miloTag("Milo", fileID: "App/View.swift", line: 43)
}
#endif
