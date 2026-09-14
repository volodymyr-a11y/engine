import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

// Runs after a build. Next.js may load .env.local even when this process has no
// Supabase variables, so login can be either configured or unconfigured.
const port = 3147;
const origin = `http://localhost:${port}`;
const env = { ...process.env };
delete env.NEXT_PUBLIC_SUPABASE_URL;
delete env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { env, stdio: "pipe" });
let output = "";
server.stdout.on("data", (data) => { output += data; });
server.stderr.on("data", (data) => { output += data; });
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error(output);
    try {
      const response = await fetch(`${origin}/login`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await delay(500);
  }
  assert.ok(ready, "Server must start");
  const login = await fetch(`${origin}/login`);
  assert.match(await login.text(), /(?:Вхід ще не налаштовано|Увійти через Google)/);
  for (const path of ["/", "/users", "/organisations", "/people"]) {
    const response = await fetch(origin + path, { redirect: "manual" });
    assert.equal(response.status, 307, `${path} must be protected`);
    assert.equal(new URL(response.headers.get("location"), origin).pathname, "/login");
  }
  for (const query of ["", "?error=access_denied", "?code=invalid&next=https://example.com"]) {
    const response = await fetch(`${origin}/auth/callback${query}`, { redirect: "manual" });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), `${origin}/login?error=callback`);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  const error = await fetch(`${origin}/login?error=callback`);
  assert.match(await error.text(), /Вхід не завершено/);
  console.log("PASS: login state, 4 protected routes, callback errors and redirect safety.");
} finally {
  server.kill();
}

