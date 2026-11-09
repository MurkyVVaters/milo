<!-- Modified for Milo. -->
# Setup and troubleshooting

## Connecting the tools

The MCP server is the `milo` binary, run with `mcp`. It speaks stdio and starts the web server on port 38470 if it isn't running. Build it from this repository with `pnpm install --frozen-lockfile` and `pnpm build`. Configure its absolute path directly, or set `MILO_BIN` to that path when using a plugin. Automatic plugin downloads require a matching release in this repository.

```sh
claude mcp add milo -- /absolute/path/to/milo/app/host/.build/debug/milo mcp
codex mcp add milo -- /absolute/path/to/milo/app/host/.build/debug/milo mcp
```

A source build's binary is `app/host/.build/debug/milo` in the Milo repository.

To have each annotation arrive in a Claude Code session as the user sends it, the session is started or resumed with the server as a channel:

```sh
claude --dangerously-load-development-channels server:milo
claude --resume <session> --dangerously-load-development-channels server:milo
```

Without the flag, nothing is pushed and the tools work as before: use `milo_watch` to wait for annotations.

Adding an MCP server changes the user's configuration, so suggest the command and let the user run it.

## When something fails

| Symptom | What it means |
|---|---|
| No `milo_*` tools | The MCP server isn't configured for this client, or failed to start. The plugin needs its matching Milo version; it reports that the version isn't installed and couldn't be downloaded if the release is unavailable or the download fails. Build the repository and set `MILO_BIN` to the executable. |
| "Unable to connect" | The web server isn't up and couldn't be started. The user can run `pnpm start` in the Milo repository and open http://localhost:38470. |
| "another agent session is already working on this annotation" | Another session acknowledged it first. Leave it. |
| `milo_watch` returns "Nothing new yet" | It timed out (about 100 seconds). Call it again to keep waiting. |
| An annotation has no **Source** line | The app doesn't run the MiloKit SDK. Search by labels; if the user wants exact source lines, the `milo-sdk` skill adds the SDK. |

## Without MCP

The web server has the same data over HTTP, on `http://localhost:38470` unless `MILO_PORT` says otherwise:

```sh
curl -s 'http://localhost:38470/api/annotations?status=pending'      # JSON list
curl -s  http://localhost:38470/api/annotations/<id>                 # one, with a "markdown" field
curl -s -X PATCH http://localhost:38470/api/annotations/<id> \
  -H 'Content-Type: application/json' \
  -d '{"status":"acknowledged","by":"<a name for this session>"}'
curl -s -X PATCH http://localhost:38470/api/annotations/<id> \
  -H 'Content-Type: application/json' \
  -d '{"status":"resolved","resolution":"<one-line summary>"}'      # or "dismissed", with the reason
curl -s -X PATCH http://localhost:38470/api/annotations/<id> \
  -H 'Content-Type: application/json' \
  -d '{"reply":{"from":"agent","message":"<question>"}}'
```
