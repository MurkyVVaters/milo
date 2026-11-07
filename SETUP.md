<!-- Modified for Otto. -->
# Set up Otto

Otto runs an iOS simulator in the browser and sends visual annotations to a coding agent over MCP.

## Requirements

- An Apple Silicon Mac running macOS 15 or later.
- Xcode 26 or later, with an iOS simulator runtime installed.
- Node.js and pnpm.

## Build and launch

```sh
git clone https://github.com/MurkyVVaters/otto.git
cd otto
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The browser workspace is at [localhost:38470](http://localhost:38470). Choose a simulator and start it if needed. If that port is occupied, run `OTTO_PORT=38480 pnpm start` and use that same environment variable for the MCP server.

## Connect an agent

Use the absolute path to the built executable:

```sh
codex mcp add otto -- /absolute/path/to/otto/app/host/.build/debug/otto mcp
```

```sh
claude mcp add otto -- /absolute/path/to/otto/app/host/.build/debug/otto mcp
```

For another MCP client, configure a stdio server named `otto`, set its command to that executable, and pass `["mcp"]` as its arguments.

Read [the annotation skill](skills/otto/SKILL.md) before working through notes. For exact view names and Swift source locations, follow [the SDK skill](skills/otto-sdk/SKILL.md).

## Verify the connection

1. Run `app/host/.build/debug/otto version` from the checkout.
2. Open the browser workspace and choose a simulator.
3. Press **⇧⌘D**, select an element, write a note, and press Return.
4. Ask the agent to call `otto_get_pending` and confirm that the annotation and screenshot paths are present.

The source build is ready to use without a packaged release. Plugin launchers can use the same local build through `OTTO_BIN`; their automatic downloads require a matching release in this repository.

See [README.md](README.md) for controls and configuration, or [the troubleshooting reference](skills/otto/references/setup.md) for connection issues.
