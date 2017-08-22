const COMMANDS = require('./commands').COMMANDS;

module.exports = function(str) {
	let results = COMMANDS.filter(cmd => cmd.startsWith(str));
	return [results, str];
};