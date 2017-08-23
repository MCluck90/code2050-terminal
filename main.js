'use strict';

const chalk = require('chalk');
const readline = require('readline');
const autocomplete = require('./autocomplete')
const commands = require('./commands');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: '> ',
	completer: autocomplete
});

function asyncDots(initialMessage, countdown, next, delay) {
	if (initialMessage) {
		process.stdout.write(initialMessage);
	}
	if (countdown <= 0) {
		console.log(` ${chalk.bgGreen.black('OK')}`);
		return next();
	}

	process.stdout.write('.');
	setTimeout(() => asyncDots(false, countdown - 1, next, delay), delay);
}

const launchTerminal = () => asyncDots('Launching terminal', 8, start, 200);
const connectToNetwork = () => asyncDots('Connecting to network', 5, launchTerminal, 300);
const activateDaemon = () => asyncDots('Activating daemon', 9, connectToNetwork, 100);
const initializeOS = () => asyncDots('Initializing OS', 11, activateDaemon, 200);
initializeOS();

function start() {
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
}