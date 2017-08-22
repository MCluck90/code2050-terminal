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

rl
.on('line', (line) => {
	line = line.trim();
	let [command, ...args] = line.split(' ');
	
	if (commands[command]) {
		commands[command](...args);
	} else {
		commands._displayData(command);
	}

	rl.prompt();
})
.on('close', () => {
	process.exit(0);
});