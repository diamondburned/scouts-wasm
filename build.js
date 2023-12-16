#!/usr/bin/env node

import * as fs from "fs/promises";
import * as child_process from "child_process";

const outDir = "dist";
const wasmExecURL =
  "https://raw.githubusercontent.com/tinygo-org/tinygo/release/targets/wasm_exec.js";

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  // Download wasm_exec.js
  const wasmExec = await fetch(wasmExecURL);
  await fs.writeFile(`${outDir}/wasm_exec.js`, await wasmExec.text());

  // Build main.wasm
  await exec("tinygo", ["build", "-o", `${outDir}/scouts.wasm`, "-target", "wasm", "./src"]);

  // Run pkgroll
  await exec("pkgroll", []);
}

async function exec(arg0, argv) {
  return new Promise((resolve, reject) => {
    const child = child_process.spawn(arg0, argv, { stdio: "inherit" });
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
