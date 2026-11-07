#!/usr/bin/env python3
# Modified for Otto.
"""Writes the plugin manifests for Claude Code, Codex and Cursor.

Each plugin carries the skills in skills/, the MCP server, and through the
server's launcher (app/scripts/mcp-launch.sh, written inline: no agent
gives a plugin a path to itself) otto itself. The version comes
from Config.version, so a release only bumps that.

    app/scripts/plugins.py           write them
    app/scripts/plugins.py --check   fail if any is out of date (CI)
"""
import json
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parents[2]
config = (root / "app/host/Sources/otto/Config.swift").read_text()
version = re.search(r'static let version = "([^"]+)"', config).group(1)

launcher = "\n".join(
    line for line in (root / "app/scripts/mcp-launch.sh").read_text().splitlines()
    if line.strip() and not line.lstrip().startswith("#")
).replace("v=VERSION", f"v={version}")
servers = {"otto": {"command": "/bin/sh", "args": ["-c", launcher]}}

description = ("Annotate a running iOS simulator in the browser and hand each note to your agent: "
               "otto itself, its MCP server, and skills for working through annotations "
               "and adding the OttoPlus SDK.")
author = {"name": "MurkyVVaters", "url": "https://github.com/MurkyVVaters"}
repository = "https://github.com/MurkyVVaters/otto"
keywords = ["ios", "simulator", "annotation", "design-review", "swiftui", "uikit", "mcp"]
common = {"name": "otto", "version": version, "description": description, "author": author,
          "homepage": repository, "repository": repository, "license": "Apache-2.0", "keywords": keywords}
icon = "./app/web/public/icon.svg"

files = {
    ".claude-plugin/plugin.json": dict(common, mcpServers=servers),
    ".claude-plugin/marketplace.json": {
        "name": "otto", "owner": author,
        "metadata": {"description": "Otto: annotate iOS simulators for coding agents.", "version": version},
        "plugins": [{"name": "otto", "source": "./", "description": description, "category": "development"}],
    },
    ".codex-plugin/plugin.json": dict(common, skills="./skills/", mcpServers="./.codex-plugin/mcp.json", interface={
        "displayName": "Otto",
        "shortDescription": "Turn notes drawn on an iOS simulator into code changes.",
        "longDescription": ("Freeze the simulator's screen in your browser, click an element or drag a box around "
                            "anything, and write what should change. Codex gets the element, the screen, strings "
                            "to search the source for, and screenshots, then fixes the SwiftUI or UIKit code and "
                            "reports back on each note."),
        "developerName": "MurkyVVaters", "category": "Developer Tools", "capabilities": ["Interactive", "Read", "Write"],
        "websiteURL": repository, "brandColor": "#6E56CF", "composerIcon": icon, "logo": icon,
        "defaultPrompt": ["Go through my pending simulator annotations",
                          "Watch for my simulator annotations and fix them as they come in",
                          "Add the OttoPlus SDK to this app"],
    }),
    ".codex-plugin/mcp.json": {"mcpServers": servers},
    ".agents/plugins/marketplace.json": {
        "name": "otto", "interface": {"displayName": "Otto"},
        "plugins": [{"name": "otto", "source": {"source": "local", "path": "./"},
                     "policy": {"installation": "AVAILABLE", "authentication": "ON_INSTALL"},
                     "category": "Developer Tools"}],
    },
    ".cursor-plugin/plugin.json": dict(common, displayName="Otto", logo=icon, skills="./skills/",
                                       mcpServers="./.cursor-plugin/mcp.json"),
    ".cursor-plugin/mcp.json": {"mcpServers": servers},
    ".cursor-plugin/marketplace.json": {
        "name": "otto", "owner": author,
        "metadata": {"description": "Otto: annotate iOS simulators for coding agents.", "version": version},
        "plugins": [{"name": "otto", "source": "./", "description": description}],
    },
}

package = json.loads((root / "package.json").read_text())
package["version"] = version
files["package.json"] = package

stale = []
for path, data in files.items():
    text = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    target = root / path
    if not target.exists() or target.read_text() != text:
        stale.append(path)
        if "--check" not in sys.argv:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text)

if "--check" in sys.argv and stale:
    sys.exit("Out of date (run app/scripts/plugins.py): " + ", ".join(stale))
print(("Up to date" if not stale else "Wrote " + ", ".join(stale)) + f" (version {version}).")
