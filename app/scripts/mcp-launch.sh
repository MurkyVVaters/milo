# Modified for Otto.
# The plugins' MCP server: otto's own `mcp`, from wherever it is.
# Not run from this file: app/scripts/plugins.py writes it inline into each
# plugin's MCP config (none of the agents give a plugin a path to itself),
# with VERSION replaced by Config.version. It must stay quiet on stdout,
# which carries the MCP protocol.
#
# A build of your own (OTTO_BIN) wins. Then this version: already
# downloaded, or installed (Homebrew, PATH). Then it's downloaded from the
# GitHub release, checked against the release's .sha256, and unpacked into
# ~/Library/Caches/otto. Installed binaries must match this version.
v=VERSION
[ -n "$OTTO_BIN" ] && exec "$OTTO_BIN" mcp
cache="$HOME/Library/Caches/otto/release/$v"
own="$cache/otto-$v/bin/otto"
[ -x "$own" ] && exec "$own" mcp
for b in "$(command -v otto 2>/dev/null)" /opt/homebrew/bin/otto /usr/local/bin/otto; do
  [ -n "$b" ] && [ -x "$b" ] || continue
  [ "$("$b" version 2>/dev/null)" = "$v" ] && exec "$b" mcp
done
base=$OTTO_RELEASES
[ -n "$base" ] || base=https://github.com/MurkyVVaters/otto/releases/download
tarball="otto-$v-macos-arm64.tar.gz"
part=$(mktemp -d)
if mkdir -p "$cache" &&
  curl -fsSL "$base/$v/$tarball" -o "$part/$tarball" &&
  curl -fsSL "$base/$v/$tarball.sha256" -o "$part/$tarball.sha256" &&
  (cd "$part" && shasum -a 256 -c "$tarball.sha256" >/dev/null) &&
  tar -xzf "$part/$tarball" -C "$part" &&
  mv "$part/otto-$v" "$cache/" 2>/dev/null; [ -x "$own" ]; then
  exec "$own" mcp
fi
echo "otto $v isn't installed and couldn't be downloaded: build this repository and set OTTO_BIN to its executable" >&2
exit 1
