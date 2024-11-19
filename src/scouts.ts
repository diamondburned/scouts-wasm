import "../dist/wasm_exec.js";

type wasmReturn<T> = [T, undefined | Error];

declare global {
  interface Window {
    Go: any;
    __Scouts: {
      resetGame(): wasmReturn<void>;
      boardPieces(): wasmReturn<Piece[]>;
      pastTurns(): wasmReturn<PastTurn[]>;
      currentTurn(): wasmReturn<CurrentTurn>;
      makeMove(player: Player, move: Move): wasmReturn<void>;
      possibleMoves(player: Player): wasmReturn<PossibleMoves>;
    };
  }
}

function unwrapCall<T extends (...args: any[]) => wasmReturn<any>>(
  fn: T,
  ...args: Parameters<T>
): ReturnType<T>[0] {
  const [result, err] = fn(...args);
  if (err) {
    throw err;
  }
  return result;
}

// resetGame resets the game to the initial state.
export const resetGame = () => unwrapCall(window.__Scouts.resetGame);

// boardPieces returns the pieces on the board.
export const boardPieces = () => unwrapCall(window.__Scouts.boardPieces);

// pastTurns returns the past turns.
export const pastTurns = () => unwrapCall(window.__Scouts.pastTurns);

// currentTurn returns the current turn.
export const currentTurn = () => unwrapCall(window.__Scouts.currentTurn);

// makeMove makes a move for the player. If the move is invalid, an error is
// thrown.
export const makeMove = (player: Player, move: Move) =>
  unwrapCall(window.__Scouts.makeMove, player, move);

// possibleMoves returns the possible moves for the player.
export const possibleMoves = (player: Player) => unwrapCall(window.__Scouts.possibleMoves, player);

// Player is the type for the player. There can only be two players.
export type Player = 1 | 2;

// Point is a point on the board. The origin is the top left corner.
export type Point = [number, number];

// Move is a move that a player can make.
export type Move =
  | `boulder ${number},${number}`
  | `dash ${number},${number} ${number},${number}`
  | `jump ${number},${number} ${number},${number}`
  | `place_scout ${number},${number}`
  | "skip";

// PossibleMoves is the possible moves for a player.
export type PossibleMoves = {
  // moves is a list of possible moves. It never contains BoulderMove, since
  // that's a special case that's determined through the CanPlaceBoulder
  // field.
  moves: Move[];
  // can_place_boulder is true if the player can place a boulder.
  // It provides no indication of where the boulder can be placed.
  can_place_boulder: boolean;
};

// PastTurn is a past turn.
export type PastTurn = {
  // player is the player that made the move.
  player: Player;
  // moves is the moves that the player made.
  moves: Move[];
};

// CurrentTurn is the current turn.
export type CurrentTurn = PastTurn & { plays: number };

// Piece is a piece on the board.
export type Piece =
  | {
      kind: "scout";
      player: Player;
      position: Point;
      returning: boolean;
    }
  | {
      kind: "boulder";
      player: Player;
      position: [Point, Point, Point, Point];
    };

function waitForScouts(): Promise<void> {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (window["__Scouts"]) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

// load loads the scouts wasm module. For more information on the module, see
// the README.
export async function load(wasmPath: string): Promise<void> {
  if (!window.Go) {
    throw new Error("wasm_exec.js could not be loaded.");
  }

  const go = new window.Go();
  let wasm: WebAssembly.Instance;
  let runPromise: Promise<void>;

  if ("instantiateStreaming" in WebAssembly) {
    const obj = await WebAssembly.instantiateStreaming(fetch(wasmPath), go.importObject);
    wasm = obj.instance;
    runPromise = go.run(wasm);
  } else {
    const wasmBytes = await fetch(wasmPath).then((resp) => resp.arrayBuffer());
    const obj = await WebAssembly.instantiate(wasmBytes, go.importObject);
    wasm = obj.instance;
    runPromise = go.run(wasm);
  }

  runPromise = runPromise.catch((err) => {
    console.error(err);
    throw err;
  });

  await Promise.race([runPromise, waitForScouts()]);
}
