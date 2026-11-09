<!-- Modified for Milo. -->
# Set up Milo

Milo runs an iOS simulator in the browser and sends visual annotations to a coding agent over MCP.

## Requirements

- An Apple Silicon Mac running macOS 15 or later.
- Xcode 26 or later, with an iOS simulator runtime installed.
- Node.js and pnpm.

## Build and launch

```sh
git clone https://github.com/MurkyVVaters/milo.git
cd milo
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The browser workspace is at [localhost:38470](http://localhost:38470). Choose a simulator and start it if needed. If that port is occupied, run `MILO_PORT=38480 pnpm start` and use that same environment variable for the MCP server.

## Connect an agent

Use the absolute path to the built executable:

```sh
codex mcp add milo -- /absolute/path/to/milo/app/host/.build/debug/milo mcp
```

```sh
claude mcp add milo -- /absolute/path/to/milo/app/host/.build/debug/milo mcp
```

For another MCP client, configure a stdio server named `milo`, set its command to that executable, and pass `["mcp"]` as its arguments.

Read [the annotation skill](skills/milo/SKILL.md) before working through notes. For exact view names and Swift source locations, follow [the SDK skill](skills/milo-sdk/SKILL.md).

## Verify the connection

1. Run `app/host/.build/debug/milo version` from the checkout.
2. Open the browser workspace and choose a simulator.
3. Press **⇧⌘D**, select an element, write a note, and press Return.
4. Ask the agent to call `milo_get_pending` and confirm that the annotation and screenshot paths are present.

The source build is ready to use without a packaged release. Plugin launchers can use the same local build through `MILO_BIN`; their automatic downloads require a matching release in this repository.

See [README.md](README.md) for controls and configuration, or [the troubleshooting reference](skills/milo/references/setup.md) for connection issues.
