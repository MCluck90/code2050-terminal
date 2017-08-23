'use strict';

const chalk = require('chalk');
const readline = require('readline');
const parseSentence = require('minimist-string');
const autocomplete = require('./autocomplete')
const character = require('./character');
const commands = require('./commands');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: '> ',
	completer: autocomplete
});

function asyncMessage(message, delay, next, index = 0) {
	if (index >= message.length) {
		console.log('');
		return next();
	}

	process.stdout.write(message[index]);
	setTimeout(() => asyncMessage(message, delay, next, index + 1), delay);
}

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

const greetUser = () => asyncMessage(`Welcome back, ${character.name}`, 75, start);
const launchTerminal = () => asyncDots('Launching terminal', 8, greetUser, 200);
const connectToNetwork = () => asyncDots('Connecting to network', 5, launchTerminal, 300);
const activateDaemon = () => asyncDots('Activating daemon', 9, connectToNetwork, 100);
const initializeOS = () => asyncDots('Initializing OS', 11, activateDaemon, 200);

if (process.argv.indexOf('--fast-boot') > -1 || process.argv.indexOf('-f') > -1) {
	start();
} else {
	initializeOS();
}

function start() {
	rl.prompt();

	let outputPromise = null;

	rl
	.on('line', (line) => {
		if (outputPromise) {
			return;
		}

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
		if (commands[command]) {
			outputPromise = commands[command](flags, ...positionalArgs);
		} else {
			outputPromise = commands._field(command, flags, ...positionalArgs);
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