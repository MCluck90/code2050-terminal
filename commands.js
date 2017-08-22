const chalk = require('chalk');
const character = require('./character');

const roll = (dieType, numberOfTimes) => {
	let results = [];
	for (let i = 0; i < numberOfTimes; i++) {
		results.push(1 + Math.floor(Math.random() * dieType));
	}
	let sum = results.reduce((a, b) => a + b);
	let average = sum / numberOfTimes;
	return {
		rolls: results,
		sum,
		average
	}
};

const rolld20 = () => roll(20, 1).sum;

let commands = {
	connect() {
		let result = rolld20();
		if (result <= 1) {
			console.log(chalk.bgRed.black('CRITICAL FAIL'));
		} else if (result < 10) {
			console.log(chalk.bgRed.black('FAIL'));
		} else if (result >= 15 && result < 20) {
			console.log(chalk.bgGreen.black('SUCCESS'));
		} else if (result >= 20) {
			console.log(chalk.bgGreen.black('CRITICAL SUCCESS'));
		} else {
			console.log(result);
		}
	},

	exit() {
		process.exit(0);
	},

	roll(stat) {
		stat = stat.toLowerCase();
		stat = {
			str: 'strength',
			dex: 'dexterity',
			con: 'constitution',
			int: 'intelligence',
			wis: 'wisdom',
			cha: 'charisma'
		}[stat] || stat;
		stat = character.stats[stat];
		let modifier = Math.floor((stat - 10) / 2);
		let result = rolld20();
		console.log(`${result} + ${modifier} = ${result + modifier}`);
	},

	/**
	 * Print out the players basic stats and modifiers
	 */
	stats() {
		let {
			strength,
			dexterity,
			constitution,
			intelligence,
			wisdom,
			charisma
		} = character.stats;

		const modifier = (stat) => Math.floor((stat - 10) / 2);
		console.log(`Strength:     ${strength} - ${modifier(strength)}`);
		console.log(`Dexterity:    ${dexterity} - ${modifier(dexterity)}`);
		console.log(`Constitution: ${constitution} - ${modifier(constitution)}`);
		console.log(`Intelligence: ${intelligence} - ${modifier(intelligence)}`);
		console.log(`Wisdom:       ${wisdom} - ${modifier(wisdom)}`);
		console.log(`Charisma:     ${charisma} - ${modifier(charisma)}`);
	}
};

commands.COMMANDS = Object.keys(commands);

module.exports = commands;