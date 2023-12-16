package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"libdb.so/scouts-server/scouts"
)

var game *scouts.Game

func main() {
	namespace := js.ValueOf(map[string]any{
		"resetGame":     promisify(resetGame),
		"makeMove":      promisify(makeMove),
		"possibleMoves": promisify(possibleMoves),
	})
	js.Global().Set("Scouts", namespace)
}

// async makeMove(player: number, move: { type: string, move: any })
// async possibleMoves(player: number): Record<string, any>

func resetGame(this js.Value, args []js.Value) (js.Value, error) {
	game = scouts.NewGame()
	return js.Undefined(), nil
}

func makeMove(this js.Value, args []js.Value) (js.Value, error) {
	player := scouts.Player(args[0].Int())
	if err := player.Validate(); err != nil {
		return js.Undefined(), fmt.Errorf("invalid player: %w", err)
	}

	move, err := unmarshalMove(objectToJSON(args[1]))
	if err != nil {
		return js.Undefined(), fmt.Errorf("cannot unmarshal move JSON: %w", err)
	}

	if err := game.Apply(player, move); err != nil {
		return js.Undefined(), fmt.Errorf("cannot apply move: %w", err)
	}

	return js.Undefined(), nil
}

func possibleMoves(this js.Value, args []js.Value) (js.Value, error) {
	player := scouts.Player(args[0].Int())
	if err := player.Validate(); err != nil {
		return js.Undefined(), fmt.Errorf("invalid player: %w", err)
	}

	moves := game.PossibleMoves(player)
	return encodeObject(moves)
}

func unmarshalMove(jsonData []byte) (scouts.Move, error) {
	var moveHeader struct {
		Type scouts.MoveType `json:"type"`
		Move json.RawMessage `json:"move"`
	}
	if err := json.Unmarshal(jsonData, &moveHeader); err != nil {
		return nil, err
	}

	var move scouts.Move
	switch moveHeader.Type {
	case scouts.BoulderMoveType:
		move = &scouts.BoulderMove{}
	case scouts.DashMoveType:
		move = &scouts.DashMove{}
	case scouts.JumpMoveType:
		move = &scouts.JumpMove{}
	case scouts.PlaceScoutMoveType:
		move = &scouts.PlaceScoutMove{}
	case scouts.SkipMoveType:
		move = &scouts.SkipMove{}
	default:
		return nil, fmt.Errorf("unknown move type: %v", moveHeader.Type)
	}

	if err := json.Unmarshal(moveHeader.Move, move); err != nil {
		return nil, err
	}

	return move, nil
}
