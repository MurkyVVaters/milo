# Moving from Otto to Milo

Milo 0.4.0 renames the app, repository, command, MCP tools, and optional SDK. Simulator behavior and the default ports (38470 for the host, 38471 for the SDK) are unchanged.

## Existing app integrations

There is no immediate source-code requirement: `OttoPlus` remains a package product and module, re-exporting MiloKit. `Otto.start()`, `.otto()`, and SwiftUI/UIKit `.ottoTag()` remain available as deprecated aliases. Existing compiled apps still communicate with the host over the same SDK protocol.

When you next update your app's developer tooling:

1. Change the package URL to `https://github.com/MurkyVVaters/milo`. Keep a local dependency pointed at your Milo checkout if that is how you develop.
2. Change the linked product and imports from `OttoPlus` to `MiloKit`.
3. Replace `Otto.start()` with `Milo.start()`, `.otto()` with `.milo()`, and `.ottoTag()` with `.miloTag()`.
4. In Swift package manifests, change `.product(name: "OttoPlus", package: "otto")` to `.product(name: "MiloKit", package: "milo")` after changing the dependency URL. Resolve packages and rebuild your Debug app.

GitHub redirects the previous repository URL. Update it explicitly when migrating, because Swift package identity is derived from the dependency URL or local directory name. Do not add both URLs as separate dependencies.

## MCP and command-line setup

Configure one server named `milo`, running `milo mcp`. Its seven tools use the `milo_` prefix. Update installed skills to `milo` and `milo-sdk`, then restart the coding client to discover the new names. Existing open clients can still call the old `otto_*` tool names; Milo accepts them as aliases without advertising duplicate tools.

The host reads `MILO_PORT`, `MILO_HOME`, `MILO_WEB`, and `MILO_SDK_URL`. Each also accepts its old `OTTO_` spelling when the new variable is absent. Plugin launchers also accept `OTTO_BIN` and `OTTO_RELEASES` as fallbacks for `MILO_BIN` and `MILO_RELEASES`.

## Preserve annotations and settings

Back up your annotation directory before moving it. Annotations contain absolute screenshot paths: either keep the existing directory through `MILO_HOME`, or leave a symlink from its old location after moving it. Do not rename the directory without preserving those paths.

Without an explicit home, Milo reuses the old temporary `otto` directory if it contains annotations; otherwise it uses `milo` in the temporary directory. Set `MILO_HOME` to a persistent directory to keep annotations across Mac restarts.

Browser preferences are copied from `otto:` keys to `milo:` keys when read, on the same browser origin. Keep the same host and port during migration. Device artwork caches can be recreated.

## Git checkout

Rename the existing GitHub repository in place, preserving its history, issues and pull requests. Point your checkout at the new URL:

```sh
git remote set-url origin git@github.com:MurkyVVaters/milo.git
```

If you rename your local checkout directory, update any absolute package or launcher paths, or retain a symlink from the previous directory until those consumers migrate.
