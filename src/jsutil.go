package main

import (
	"encoding/json"
	"syscall/js"
)

func promisify(fn func(js.Value, []js.Value) (js.Value, error)) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) any {
		handler := js.FuncOf(func(this js.Value, args []js.Value) any {
			resolve := args[0]
			reject := args[1]
			go func() {
				result, err := fn(this, args)
				if err != nil {
					jsError := js.Global().Get("Error").New(err.Error())
					reject.Invoke(jsError)
				} else {
					resolve.Invoke(result)
				}
			}()
			return nil
		})

		jsPromise := js.Global().Get("Promise").New(handler)
		return jsPromise
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
