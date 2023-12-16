{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
	buildInputs = with pkgs; [
		tinygo
		nodejs
	];
	shellHook = ''
		export PATH="$PATH:${builtins.toPath ./.}/node_modules/.bin"
	'';
	GOOS = "js";
	GOARCH = "wasm";
}
