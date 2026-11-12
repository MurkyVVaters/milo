<!-- Modified for Milo. -->
# Milo

Run your iOS app in the browser. Point to what needs work. Send it to your coding agent.

Milo puts your simulator, visual feedback, screenshots, and recordings in one workspace. Select an element or draw a box, leave a note, and your agent gets the screen context it needs to find the code.

## What you can do

- Interact with a live iOS simulator using your mouse and keyboard.
- Freeze the screen and annotate individual elements or any area.
- Send feedback to a coding agent through MCP, or copy notes as Markdown.
- Capture screenshots and record the simulator as an MP4.
- Create, start, rotate, and manage simulators from the browser.
- Inspect the iPhone Duo in 3D with Xcode 27.1 or later.
- Add the optional MiloKit SDK for exact Swift source locations.

## Get started

You need an Apple Silicon Mac, Xcode 26 or later, Node.js, and [pnpm](https://pnpm.io). The native host targets macOS 15 or later.

```sh
git clone https://github.com/MurkyVVaters/milo.git
cd milo
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Open [localhost:38470](http://localhost:38470), choose a simulator, and press **Start** if it is stopped.

For UI development, keep the host running and use `pnpm dev` in another terminal to enable hot reload.

## Give visual feedback

1. Navigate to the screen you want to review.
2. Press **⇧⌘D** to enter Design Mode.
3. Click an element or drag a box. Hold Shift to select multiple areas.
4. Write your note and press Return.
5. Press Esc to clear the selection, then Esc again to return to the live app.

Each annotation includes element details, search hints, a screenshot of the full screen, and a close-up. An SDK is optional; Milo reads the simulator's accessibility tree by default.

The controls below the device include screenshots, MP4 recording, Home, and rotation. Use **⌘S** for a screenshot and **⌘R** to toggle recording.

## Inspect spacing with X-Ray

Choose **X-Ray** beside Design Mode, then drag a frame over the frozen screen.
You can start the drag outside the phone, or choose **Inspect entire screen**
to select all reported elements at once.
Use **Components** for reported outer containers, or **Inside elements** for their
individual controls. Missing outer bounds require MiloKit; X-Ray does not guess borders.
Milo outlines fully enclosed elements and shows their sizes and nearest horizontal
and vertical gaps in iOS points. Hover a measurement to see its bounds source;
**Annotate** attaches the measurements and marked screenshots to your agent feedback.
Escape clears the frame, then returns to live interaction.

X-Ray uses reported accessibility and optional MiloKit bounds, which can include
invisible touch areas. It does not infer pixel boundaries or source-code padding.
V1 supports the flat live simulator view, not animation review or 3D.

## Review animation captures

Choose **Animation Review** (the film icon beside Record Screen), then **Start Capture**.
Use the simulator and choose **Stop and Review**. The panel plays or pauses the capture,
steps through its actual captured frames, scrubs by timestamp, changes playback speed,
and loops. Captures stay in this browser tab, up to 30 seconds or 64 MiB; capture stops
when either limit is reached. Frame rate and resolution follow the simulator stream.

Choose **Annotate this frame** to mark up a captured image. Notes include its timestamp
and frame number; selection uses pixels, since the live accessibility tree and SDK
source locations may no longer match that moment. **Return to Live** resumes interaction;
**Review Capture** reopens the last capture, and **Capture Again** replaces it.
Closing the panel or changing devices releases the capture. This first version uses
the flat device view. Playback reviews recorded images while the simulator keeps running.

## Connect your coding agent

Register the built executable as a stdio MCP server. Replace the example path with the absolute path to your checkout.

```sh
codex mcp add milo -- /absolute/path/to/milo/app/host/.build/debug/milo mcp
```

```sh
claude mcp add milo -- /absolute/path/to/milo/app/host/.build/debug/milo mcp
```

Other MCP clients can use the same executable with `mcp` as its argument. The server starts the browser host if it is not already running.

| Tool | Purpose |
|---|---|
| `milo_get_pending` | Read pending annotations and screenshot paths |
| `milo_get_all` | Read every annotation, including completed ones |
| `milo_watch` | Wait for new annotations |
| `milo_acknowledge` | Take an annotation into progress |
| `milo_resolve` | Mark an annotation as fixed |
| `milo_dismiss` | Decline an annotation with a reason |
| `milo_reply` | Reply to an annotation |

The agent skills in [skills/](skills) explain how to work through annotations and add the optional SDK. See [SETUP.md](SETUP.md) for setup instructions.

## Optional SDK

Add this repository as a local Swift package dependency and link **MiloKit** to your app target. The SDK adds view names and source locations to annotations. Its hooks become no-ops in Release builds.

```swift
import MiloKit

RootView()
    .milo()

ShowRow(show: show)
    .miloTag()
```

UIKit apps can start the inspector with `Milo.start()` and tag individual views with `.miloTag()`. The [demo app](assets/examples/DemoApp) includes SwiftUI and UIKit examples.

## Configuration

| Environment variable | Default |
|---|---|
| `MILO_PORT` | `38470` |
| `MILO_HOME` | `milo` inside the macOS temporary directory |
| `MILO_WEB` | Automatically located `app/web/` directory |
| `MILO_SDK_URL` | `http://127.0.0.1:38471` |

Device artwork is cached in `~/Library/Caches/milo`. Use a different `MILO_PORT` if another simulator workspace is already listening on the default port.

## Development

The Svelte UI lives in `app/web/`. The Swift host in `app/host/` serves it, streams the simulator, handles input, and provides the MCP server. `Sources/MiloKit/` contains the optional SDK.

```sh
pnpm build                           # Build the UI and native host
swift build                          # Build the SDK for macOS
python3 app/scripts/plugins.py --check
app/scripts/package.sh               # Package a release for Apple Silicon
```

The host uses private Xcode frameworks, so Xcode updates may require compatibility work. Views without accessibility information, including custom Canvas or Metal content, can be annotated with a box. Source file locations require the SDK.

## License

[Apache 2.0](LICENSE). Third-party copyright and attribution notices are included in [NOTICE](NOTICE).
