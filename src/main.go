package main

import (
	"fmt"
	"strings"
	"syscall/js"

	"libdb.so/scouts-server/scouts"
)

var game *scouts.Game

func main() {
	js.Global().Set("__Scouts", map[string]any{
		"resetGame":     fn2ReturnTuple(resetGame),
		"boardPieces":   fn2ReturnTuple(boardPieces),
		"pastTurns":     fn2ReturnTuple(pastTurns),
		"currentTurn":   fn2ReturnTuple(currentTurn),
		"makeMove":      fn2ReturnTuple(makeMove),
		"possibleMoves": fn2ReturnTuple(possibleMoves),
	})
	// Block forever
	select {}
}

func resetGame(this js.Value, args []js.Value) (js.Value, error) {
	if len(args) != 0 {
		return js.Undefined(), fmt.Errorf("resetGame: expected 0 arguments, got %d", len(args))
	}

	game = scouts.NewGame()
	return js.Undefined(), nil
}

func boardPieces(this js.Value, args []js.Value) (js.Value, error) {
	if len(args) != 0 {
		return js.Undefined(), fmt.Errorf("boardPieces: expected 0 arguments, got %d", len(args))
	}

	if game == nil {
		return js.Undefined(), fmt.Errorf("game is not initialized")
	}

	return encodeObject(game.Board().Pieces())
}

func pastTurns(this js.Value, args []js.Value) (js.Value, error) {
	if len(args) != 0 {
		return js.Undefined(), fmt.Errorf("pastMoves: expected 0 arguments, got %d", len(args))
	}

	if game == nil {
		return js.Undefined(), fmt.Errorf("game is not initialized")
	}

	type pastTurn struct {
		Moves  []scouts.Move `json:"moves"`
		Player scouts.Player `json:"player"`
	}
	pastTurns_ := game.PastTurns()
	pastTurns := make([]pastTurn, len(pastTurns_))
	for i, turn := range pastTurns_ {
		pastTurns[i] = pastTurn(turn)
	}

	return encodeObject(pastTurns)
}

func currentTurn(this js.Value, args []js.Value) (js.Value, error) {
	if len(args) != 0 {
		return js.Undefined(), fmt.Errorf("currentTurn: expected 0 arguments, got %d", len(args))
	}

	if game == nil {
		return js.Undefined(), fmt.Errorf("game is not initialized")
	}

	type currentTurn struct {
		Moves  []scouts.Move `json:"moves"`
		Plays  int           `json:"plays"`
		Player scouts.Player `json:"player"`
	}
	return encodeObject(currentTurn(game.CurrentTurn()))
}

func makeMove(this js.Value, args []js.Value) (js.Value, error) {
	if len(args) != 2 {
		return js.Undefined(), fmt.Errorf("makeMove: expected 2 arguments, got %d", len(args))
	}

	if game == nil {
		return js.Undefined(), fmt.Errorf("game is not initialized")
	}

	player := scouts.Player(args[0].Int())
	if err := player.Validate(); err != nil {
		return js.Undefined(), fmt.Errorf("invalid player: %w", err)
	}

	move, err := unmarshalMove(args[1].String())
	if err != nil {
		return js.Undefined(), fmt.Errorf("cannot unmarshal move JSON: %w", err)
	}

	if err := game.Apply(player, move); err != nil {
		return js.Undefined(), fmt.Errorf("cannot apply move: %w", err)
	}

	return js.Undefined(), nil
}

func possibleMoves(this js.Value, args []js.Value) (js.Value, error) {
	if len(args) != 1 {
		return js.Undefined(), fmt.Errorf("possibleMoves: expected 1 argument, got %d", len(args))
	}

	if game == nil {
		return js.Undefined(), fmt.Errorf("game is not initialized")
	}

	player := scouts.Player(args[0].Int())
	if err := player.Validate(); err != nil {
		return js.Undefined(), fmt.Errorf("invalid player: %w", err)
	}

	moves := game.PossibleMoves(player)
	return encodeObject(moves)
}

func unmarshalMove(moveString string) (scouts.Move, error) {
	var move scouts.Move
	switch {
	case strings.HasPrefix(moveString, string(scouts.BoulderMoveType)):
		move = &scouts.BoulderMove{}
	case strings.HasPrefix(moveString, string(scouts.DashMoveType)):
		move = &scouts.DashMove{}
	case strings.HasPrefix(moveString, string(scouts.JumpMoveType)):
		move = &scouts.JumpMove{}
	case strings.HasPrefix(moveString, string(scouts.PlaceScoutMoveType)):
		move = &scouts.PlaceScoutMove{}
	case strings.HasPrefix(moveString, string(scouts.SkipMoveType)):
		return &scouts.SkipMove{}, nil
	default:
		return nil, fmt.Errorf("unknown move %q", moveString)
	}

	if err := move.UnmarshalText([]byte(moveString)); err != nil {
		return nil, fmt.Errorf("cannot unmarshal move %s: %w", moveString, err)
	}
	return move, nil
}
