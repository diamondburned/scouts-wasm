# scouts-wasm

Go WebAssembly implementation of [Aaron's Scouts
game](https://github.com/AaronLieb/Scouts).

This package provides a WebAssembly library for the game logic. Frontends can
use this package to more easily implement the game logic.

### Usage

```sh
npm i diamondburned/scouts-wasm#dist
```

```ts
import { load } from "scouts-wasm";
import wasmURL from "scouts-wasm/dist/scouts.wasm?url";

await load(wasmURL);

await Scouts.resetGame();
await Scouts.makeMove(1, { type: "skip" });

const moves = await Scouts.possibleMoves(2);
console.log("Possible moves for player 2:", moves);
```
