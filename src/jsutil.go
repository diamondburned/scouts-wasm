package main

import (
	"encoding/json"
	"fmt"
	"runtime/debug"
	"syscall/js"
)

func fn2ReturnTuple(fn func(js.Value, []js.Value) (js.Value, error)) js.Func {
	fnx := func(this js.Value, args []js.Value) (result, errorValue js.Value) {
		defer func() {
			if err := recover(); err != nil {
				errorValue = js.Global().Get("Error").New(fmt.Sprintf(
					"panic occured: %v\nstack: %s", err, string(debug.Stack()),
				))
			}
		}()

		result, err := fn(this, args)
		if err != nil {
			errorValue = js.Global().Get("Error").New(err.Error())
		} else {
			errorValue = js.Undefined()
		}

		return
	}

	return js.FuncOf(func(this js.Value, args []js.Value) any {
		result, errorValue := fnx(this, args)
		return js.ValueOf([]any{result, errorValue})
	})
}

var jsJSONStringify = js.Global().Get("JSON").Get("stringify")
var jsJSONParse = js.Global().Get("JSON").Get("parse")

func decodeObject[T any](value js.Value) (T, error) {
	var obj T
	if err := json.Unmarshal(objectToJSON(value), &obj); err != nil {
		var z T
		return z, err
	}
	return obj, nil
}

func objectToJSON(value js.Value) []byte {
	jsonData := jsJSONStringify.Invoke(value)
	jsonDataString := jsonData.String()
	return []byte(jsonDataString)
}

func encodeObject[T any](obj T) (js.Value, error) {
	jsonData, err := json.Marshal(obj)
	if err != nil {
		return js.Undefined(), err
	}
	return jsJSONParse.Invoke(string(jsonData)), nil
}
