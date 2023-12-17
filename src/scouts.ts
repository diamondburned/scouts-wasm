import "../dist/wasm_exec.js";

declare global {
  interface Window {
    Go: any;
    Scouts: Scouts;
  }

  interface Scouts {
    // resetGame resets the game to the initial state.
    resetGame(): Promise<void>;
    // makeMove makes a move for the player. If the move is invalid, an error is
    // thrown.
    makeMove(player: Player, move: Move): Promise<void>;
    // possibleMoves returns the possible moves for the player.
    possibleMoves(player: Player): Promise<PossibleMoves>;
  }
}

// Player is the type for the player. There can only be two players.
export type Player = 1 | 2;

// Point is a point on the board. The origin is the top left corner.
export type Point = {
  X: number;
  Y: number;
};

// Move is a move that a player can make.
export type Move =
  | {
      type: "boulder";
      move: {
        top_left: Point;
      };
    }
  | {
      type: "dash";
      move: {
        scout_position: Point;
        destination: Point;
      };
    }
  | {
      type: "jump";
      move: {
        scout_position: Point;
        destination: Point;
      };
    }
  | {
      type: "place_scout";
      move: {
        scout_position: Point;
      };
    }
  | {
      type: "skip";
    };

export type PossibleMoves = {
  // moves is a list of possible moves. It never contains BoulderMove, since
  // that's a special case that's determined through the CanPlaceBoulder
  // field.
  moves: Move[];
  // can_place_boulder is true if the player can place a boulder.
  // It provides no indication of where the boulder can be placed.
  can_place_boulder: boolean;
};

function waitForScouts(): Promise<void> {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (window["Scouts"]) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

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
