'use strict';

const chalk = require('chalk');
const parseSentence = require('minimist-string');
const character = require('./character');
const commands = require('./commands');
const log = require('./logger');
const userInput = require('./user-input');
const argv = parseSentence(process.argv.join(' '));

// Load character data from a given file or the default
character.load(argv.o || argv.open || './character.json');

const createDots = (n) => new Array(n).fill('.').join('');
const bootstep = (title, dots, delay) => () => {
	process.stdout.write(title);
	return log(createDots(dots) + ' ', false, delay)
		.then(() => log.success('OK'));
};

// Show a fake boot sequence
const initializeOS = () => {
	bootstep('Initializing OS', 11, 200)()
		.then(bootstep('Activating daemon', 9, 100))
		.then(bootstep('Connecting to network', 5, 300))
		.then(bootstep('Launching terminal', 8, 200))
		.then(() => log(`Welcome back, ${character.name}`, true, 75))
		.then(start);
};

// Allow the user to skip the fake boot sequence
if (process.argv.indexOf('--fast-boot') > -1 || process.argv.indexOf('-f') > -1) {
	start();
} else {
	initializeOS();
}

// Start prompting for input
function start() {
	userInput.prompt();

	userInput
	.on('command', ({ command, flags, positionalArgs }) => {
		// Process commands from the user
		if (commands[command]) {
			commands[command](flags, ...positionalArgs);
		} else {
			commands._field(command, flags, ...positionalArgs);
		}
	})
	.on('close', () => {
		process.exit(0);
	});
}