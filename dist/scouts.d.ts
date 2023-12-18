interface Game {
    resetGame(): Promise<void>;
    boardPieces(): Promise<Piece[]>;
    pastTurns(): Promise<PastTurn[]>;
    currentTurn(): Promise<CurrentTurn>;
    makeMove(player: Player, move: Move): Promise<void>;
    possibleMoves(player: Player): Promise<PossibleMoves>;
}
declare global {
    interface Window {
        Go: any;
        Scouts: Game;
    }
    const Scouts: Game;
}
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

export { type CurrentTurn, type Move, type PastTurn, type Piece, type Player, type Point, type PossibleMoves, load };
