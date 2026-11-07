#!/usr/bin/env python3
"""Exercise Otto's MCP tools against a temporary host and annotation store."""

import base64
import json
import os
from pathlib import Path
import queue
import socket
import subprocess
import tempfile
import threading
import time
import urllib.request


ROOT = Path(__file__).resolve().parents[2]
BINARY = ROOT / "app/host/.build/debug/otto"
TOOLS = {"otto_" + action for action in (
    "get_pending", "get_all", "watch", "acknowledge", "resolve", "dismiss", "reply"
)}


class Client:
    def __init__(self, env):
        self.process = subprocess.Popen(
            [str(BINARY), "mcp"], env=env, stdin=subprocess.PIPE,
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True,
        )
        self.messages = queue.Queue()
        self.notifications = queue.Queue()
        self.sequence = 0
        self.reader = threading.Thread(target=self.read, daemon=True)
        self.reader.start()

    def read(self):
        for line in self.process.stdout:
            message = json.loads(line)
            (self.messages if "id" in message else self.notifications).put(message)

    def send(self, method, params):
        self.sequence += 1
        self.process.stdin.write(json.dumps({
            "jsonrpc": "2.0", "id": self.sequence, "method": method, "params": params,
        }) + "\n")
        self.process.stdin.flush()
        return self.sequence

    def receive(self, identifier):
        message = self.messages.get(timeout=20)
        assert message.get("id") == identifier, message
        assert "error" not in message, message
        return message["result"]

    def rpc(self, method, params):
        return self.receive(self.send(method, params))

    def tool(self, name, arguments=None):
        result = self.rpc("tools/call", {"name": name, "arguments": arguments or {}})
        assert not result.get("isError"), result
        return result["content"][0]["text"]

    def close(self):
        self.process.terminate()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()


def main():
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        port = reservation.getsockname()[1]
    with tempfile.TemporaryDirectory(prefix="otto-mcp-check-") as home:
        env = dict(os.environ, OTTO_PORT=str(port), OTTO_HOME=home)
        host = subprocess.Popen(
            [str(BINARY), "serve"], env=env,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        clients = []
        base = f"http://127.0.0.1:{port}"

        def http(path, body=None):
            request = urllib.request.Request(base + path)
            if body is not None:
                request.data = json.dumps(body).encode()
                request.add_header("Content-Type", "application/json")
            with urllib.request.urlopen(request, timeout=15) as response:
                return json.load(response)

        def annotation(comment):
            # Known PNG bytes are persisted unchanged; no real app is modified.
            picture = base64.b64encode((ROOT / "app/web/public/icon.png").read_bytes()).decode()
            created = http("/api/annotations", {
                "udid": "00000000-0000-0000-0000-000000000000",
                "rect": {"x": 0, "y": 0, "width": 24, "height": 24},
                "comment": comment, "kind": "area", "full": picture, "crop": picture,
            })
            for path in created["images"].values():
                assert Path(path).is_file()
            return created["id"]

        try:
            for _ in range(100):
                assert host.poll() is None, "Otto host exited"
                try:
                    http("/api/annotations")
                    break
                except OSError:
                    time.sleep(0.1)
            else:
                raise AssertionError("Otto host did not start")
            for _ in range(2):
                client = Client(env)
                clients.append(client)
                initialized = client.rpc("initialize", {
                    "protocolVersion": "2025-11-25", "capabilities": {},
                    "clientInfo": {"name": "otto-integration-check", "version": "1"},
                })
                assert initialized["serverInfo"]["name"] == "otto"
                assert "otto_get_pending" in initialized["instructions"]
                assert {tool["name"] for tool in client.rpc("tools/list", {})["tools"]} == TOOLS
            first, second = clients
            assert "No pending" in first.tool("otto_get_pending")
            assert "No annotations" in first.tool("otto_get_all")
            assert "Nothing new" in first.tool("otto_watch", {"timeout_seconds": 0.05})

            waiting = first.send("tools/call", {
                "name": "otto_watch", "arguments": {"timeout_seconds": 5},
            })
            resolved = annotation("Otto integration check")
            assert resolved in first.receive(waiting)["content"][0]["text"]
            assert resolved in first.tool("otto_get_pending")
            first.tool("otto_acknowledge", {"id": resolved[:4]})
            rejected = second.rpc("tools/call", {
                "name": "otto_acknowledge", "arguments": {"id": resolved},
            })
            assert rejected.get("isError"), "A second client claimed an occupied annotation"
            first.tool("otto_reply", {"id": resolved, "message": "Otto reply check"})
            first.tool("otto_resolve", {"id": resolved, "summary": "Otto resolved check"})
            record = http("/api/annotations/" + resolved)
            assert record["status"] == "resolved"
            assert record["resolution"] == "Otto resolved check"
            assert record["replies"][-1]["message"] == "Otto reply check"

            dismissed = annotation("Otto dismissal check")
            first.tool("otto_dismiss", {"id": dismissed, "reason": "Otto dismissed check"})
            assert http("/api/annotations/" + dismissed)["status"] == "dismissed"
            assert resolved in first.tool("otto_get_all")
            assert dismissed in first.tool("otto_get_all")
            assert "No pending" in first.tool("otto_get_pending")
            claude = Client(env)
            clients.append(claude)
            initialized = claude.rpc("initialize", {
                "protocolVersion": "2025-11-25", "capabilities": {},
                "clientInfo": {"name": "claude-otto-check", "version": "1"},
            })
            assert "claude/channel" in initialized["capabilities"]["experimental"]
            assert "otto_acknowledge" in initialized["instructions"]
            pushed = annotation("Otto channel delivery check")
            event = claude.notifications.get(timeout=20)
            assert event["method"] == "notifications/claude/channel"
            assert event["params"]["meta"]["annotation_id"] == pushed
            assert all(name in event["params"]["content"] for name in (
                "otto_acknowledge", "otto_resolve", "otto_reply",
            ))
            claude.tool("otto_acknowledge", {"id": pushed})
            claude.tool("otto_resolve", {"id": pushed, "summary": "Otto channel verified"})
            assert "No pending" in first.tool("otto_get_pending")
            print("PASS: Otto MCP identity, seven tools, wait delivery/timeout, screenshots, claims, replies, resolution, and dismissal.")
            print("PASS: Claude channel capability, Otto instructions, pushed event context, and tool responses alongside notifications.")
        finally:
            for client in clients:
                client.close()
            host.terminate()
            try:
                host.wait(timeout=5)
            except subprocess.TimeoutExpired:
                host.kill()
                host.wait()


if __name__ == "__main__":
    main()
