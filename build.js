#!/usr/bin/env node

import * as fs from "fs/promises";
import * as child_process from "child_process";

const outDir = "dist";
const outWasm = `${outDir}/main.wasm`;
const buildProfile = "tinygo";

const buildProfiles = {
  tinygo: {
    wasmExecURL: "https://raw.githubusercontent.com/tinygo-org/tinygo/release/targets/wasm_exec.js",
    buildCmd: ["tinygo", "build", "-o", outWasm, "-target", "wasm", "./src"],
    buildEnv: {},
  },
  go: {
    wasmExecURL:
      "https://raw.githubusercontent.com/golang/go/release-branch.go1.21/misc/wasm/wasm_exec.js",
    buildCmd: ["go", "build", "-o", outWasm, "./src"],
    buildEnv: { GOOS: "js", GOARCH: "wasm" },
  },
};

async function main() {
  const { wasmExecURL, buildCmd, buildEnv } = buildProfiles[buildProfile];

  await fs.mkdir(outDir, { recursive: true });

  // Download wasm_exec.js
  let ifModifiedSince = null;
  if (await fs.stat(`${outDir}/wasm_exec.js`).catch(() => null)) {
    ifModifiedSince = (await fs.stat(`${outDir}/wasm_exec.js`)).mtime.toUTCString();
  }
  const wasmExec = await fetch(wasmExecURL, {
    headers: ifModifiedSince ? { "If-Modified-Since": ifModifiedSince } : {},
  });
  if (wasmExec.status === 304) {
    console.log("wasm_exec.js is up to date");
  } else if (wasmExec.ok) {
    await fs.writeFile(`${outDir}/wasm_exec.js`, await wasmExec.text());
  } else {
    throw new Error(`failed to download wasm_exec.js: ${wasmExec.status} ${wasmExec.statusText}`);
  }

  // Build main.wasm
  await exec(buildCmd, buildEnv);

  // Run pkgroll
  await exec(["pkgroll"]);
}

async function exec(args, envs = {}) {
  return new Promise((resolve, reject) => {
    const child = child_process.spawn(args[0], args.slice(1), {
      stdio: "inherit",
      env: { ...process.env, ...envs },
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`exit code: ${code}`));
      }
    });
  });
}

await main();
