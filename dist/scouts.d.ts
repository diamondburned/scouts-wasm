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
declare const resetGame: () => void;
declare const boardPieces: () => Piece[];
declare const pastTurns: () => PastTurn[];
declare const currentTurn: () => CurrentTurn;
declare const makeMove: (player: Player, move: Move) => void;
declare const possibleMoves: (player: Player) => PossibleMoves;
type Player = 1 | 2;
type Point = [number, number];
type Move = `boulder ${number},${number}` | `dash ${number},${number} ${number},${number}` | `jump ${number},${number} ${number},${number}` | `place_scout ${number},${number}` | "skip";
type PossibleMoves = {
    moves: Move[];
    can_place_boulder: boolean;
};
type PastTurn = {
    player: Player;
    moves: Move[];
};
type CurrentTurn = PastTurn & {
    plays: number;
};
type Piece = {
    kind: "scout";
    player: Player;
    position: Point;
    returning: boolean;
} | {
    kind: "boulder";
    player: Player;
    position: [Point, Point, Point, Point];
};
declare function load(wasmPath: string): Promise<void>;

export { type CurrentTurn, type Move, type PastTurn, type Piece, type Player, type Point, type PossibleMoves, boardPieces, currentTurn, load, makeMove, pastTurns, possibleMoves, resetGame };
