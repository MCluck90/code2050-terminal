'use strict';

const readline = require('readline');
const autocomplete = require('./autocomplete')
const commands = require('./commands');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: '> ',
	completer: autocomplete
});

rl.prompt();

let outputPromise = null;

rl
.on('line', (line) => {
	if (outputPromise) {
		return;
	}
	line = line.trim();
	let [command, ...args] = line.split(' ');
	
	if (commands[command]) {
		outputPromise = commands[command](...args);
	} else {
		outputPromise = commands._displayData(command);
	}

	if (outputPromise) {
		outputPromise.then(() => {
			outputPromise = null;
			rl.prompt();
		});
	} else {
		rl.prompt();
	}
})
.on('close', () => {
	process.exit(0);
});