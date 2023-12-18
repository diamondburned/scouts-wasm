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
import wasmURL from "scouts-wasm/dist/main.wasm?url";

await load(wasmURL);

await Scouts.resetGame();
await Scouts.makeMove(1, "place_scout 0,9");
await Scouts.makeMove(2, "place_scout 0,0");

const moves = await Scouts.possibleMoves(1);
console.log("Possible moves for player 2:", moves);
```
