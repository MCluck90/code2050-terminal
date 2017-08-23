'use strict';

const chalk = require('chalk');
const readline = require('readline');
const parseSentence = require('minimist-string');
const autocomplete = require('./autocomplete')
const character = require('./character');
const commands = require('./commands');
const log = require('./logger');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: '> ',
	completer: autocomplete
});

const createDots = (n) => new Array(n).fill('.').join('');
const bootstep = (title, dots, delay) => () => {
	process.stdout.write(title);
	return log(createDots(dots) + ' ', false, delay)
		.then(() => log.success('OK'));
};

const initializeOS = () => {
	bootstep('Initializing OS', 11, 200)()
		.then(bootstep('Activating daemon', 9, 100))
		.then(bootstep('Connecting to network', 5, 300))
		.then(bootstep('Launching terminal', 8, 200))
		.then(() => log(`Welcome back, ${character.name}`, true, 75))
		.then(start);
};

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