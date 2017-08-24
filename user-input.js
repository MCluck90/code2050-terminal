const EventEmitter = require('events').EventEmitter;
const parseSentence = require('minimist-string');
const readline = require('readline');
const util = require('util');
const autocomplete = require('./autocomplete')
const log = require('./logger');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: '> ',
	completer: autocomplete
});

class UserInputEmitter extends EventEmitter {
	constructor() {
		super();
	}

	/**
	 * Parse out a command and it's arguments from the user
	 * @param {string} line Line of input from the terminal
	 */
	parseCommand(line) {
		line = line.trim();
		let sentence = parseSentence(line);
		let command = sentence._[0];
		let positionalArgs = sentence._.slice(1);
		let flags = Object.assign({}, sentence);
		delete flags._;
		let negativeModifier = line.match(/-\d+/);
		if (negativeModifier) {
			positionalArgs.unshift(negativeModifier[0]);
		}

		return {
			command,
			flags,
			positionalArgs
		};
	}

	/**
	 * Prompt the user for input
	 */
	prompt() { return rl.prompt(); }
}
let UserInput = new UserInputEmitter();

rl.on('line', line => {
	// If the logger is currently outputting something, don't process commands
	rl.pause();
	if (log()) {
		return;
	}

	// Alert everyone that a command has been processed
	UserInput.emit('command', UserInput.parseCommand(line));

	if (log()) {
		// If the command resulted in some logging, wait for it to complete
		log().then(() => {
			UserInput.prompt();
			rl.resume();
		});
	} else {
		// Otherwise, allow the user to immediately input another command
		UserInput.prompt();
		rl.resume();
	}
})
.on('close', (...args) => UserInput.emit('close', ...args));

module.exports = UserInput;