# Modified for Milo.
# The plugins' MCP server: milo's own `mcp`, from wherever it is.
# Not run from this file: app/scripts/plugins.py writes it inline into each
# plugin's MCP config (none of the agents give a plugin a path to itself),
# with VERSION replaced by Config.version. It must stay quiet on stdout,
# which carries the MCP protocol.
#
# A build of your own (MILO_BIN) wins. Then this version: already
# downloaded, or installed (Homebrew, PATH). Then it's downloaded from the
# GitHub release, checked against the release's .sha256, and unpacked into
# ~/Library/Caches/milo. Installed binaries must match this version.
v=VERSION
[ -n "$MILO_BIN" ] && exec "$MILO_BIN" mcp
[ -n "$OTTO_BIN" ] && exec "$OTTO_BIN" mcp
cache="$HOME/Library/Caches/milo/release/$v"
own="$cache/milo-$v/bin/milo"
[ -x "$own" ] && exec "$own" mcp
for b in "$(command -v milo 2>/dev/null)" /opt/homebrew/bin/milo /usr/local/bin/milo; do
  [ -n "$b" ] && [ -x "$b" ] || continue
  [ "$("$b" version 2>/dev/null)" = "$v" ] && exec "$b" mcp
done
base=${MILO_RELEASES:-$OTTO_RELEASES}
[ -n "$base" ] || base=https://github.com/MurkyVVaters/milo/releases/download
tarball="milo-$v-macos-arm64.tar.gz"
part=$(mktemp -d)
if mkdir -p "$cache" &&
  curl -fsSL "$base/$v/$tarball" -o "$part/$tarball" &&
  curl -fsSL "$base/$v/$tarball.sha256" -o "$part/$tarball.sha256" &&
  (cd "$part" && shasum -a 256 -c "$tarball.sha256" >/dev/null) &&
  tar -xzf "$part/$tarball" -C "$part" &&
  mv "$part/milo-$v" "$cache/" 2>/dev/null; [ -x "$own" ]; then
  exec "$own" mcp
fi
echo "milo $v isn't installed and couldn't be downloaded: build this repository and set MILO_BIN to its executable" >&2
exit 1
