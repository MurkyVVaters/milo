<!-- Modified for Otto. -->
# Setup and troubleshooting

## Connecting the tools

The MCP server is the `otto` binary, run with `mcp`. It speaks stdio and starts the web server on port 38470 if it isn't running. Build it from this repository with `pnpm install --frozen-lockfile` and `pnpm build`. Configure its absolute path directly, or set `OTTO_BIN` to that path when using a plugin. Automatic plugin downloads require a matching release in this repository.

```sh
claude mcp add otto -- /absolute/path/to/otto/app/host/.build/debug/otto mcp
codex mcp add otto -- /absolute/path/to/otto/app/host/.build/debug/otto mcp
```

A source build's binary is `app/host/.build/debug/otto` in the Otto repository.

To have each annotation arrive in a Claude Code session as the user sends it, the session is started or resumed with the server as a channel:

```sh
claude --dangerously-load-development-channels server:otto
claude --resume <session> --dangerously-load-development-channels server:otto
```

Without the flag, nothing is pushed and the tools work as before: use `otto_watch` to wait for annotations.

Adding an MCP server changes the user's configuration, so suggest the command and let the user run it.

## When something fails

| Symptom | What it means |
|---|---|
| No `otto_*` tools | The MCP server isn't configured for this client, or failed to start. The plugin needs its matching Otto version; it reports that the version isn't installed and couldn't be downloaded if the release is unavailable or the download fails. Build the repository and set `OTTO_BIN` to the executable. |
| "Unable to connect" | The web server isn't up and couldn't be started. The user can run `pnpm start` in the Otto repository and open http://localhost:38470. |
| "another agent session is already working on this annotation" | Another session acknowledged it first. Leave it. |
| `otto_watch` returns "Nothing new yet" | It timed out (about 100 seconds). Call it again to keep waiting. |
| An annotation has no **Source** line | The app doesn't run the OttoPlus SDK. Search by labels; if the user wants exact source lines, the `otto-sdk` skill adds the SDK. |

## Without MCP

The web server has the same data over HTTP, on `http://localhost:38470` unless `OTTO_PORT` says otherwise:

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
