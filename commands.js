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

const proficiencyBonus = () => {
	let { level } = character;
	if (level < 5) {
		return 2;
	} else if (level < 9) {
		return 3;
	} else if (level < 13) {
		return 4;
	} else if (level < 17) {
		return 5;
	}
	return 6;
};

const rolld20 = () => roll(20, 1).sum;

const success = (msg) => chalk.bgGreen.black(msg);

const fail = (msg) => chalk.bgRed.black(msg);

let commands = {
	/**
	 * Display a field from the character's data
	 * @param {string} field Name of the field to show
	 */
	_displayData(field) {
		if (character.hasOwnProperty(field)) {
			field = character[field];
			if (Array.isArray(field)) {
				console.log(field.join('\n'));
			} else {
				console.log(field);
			}
		} else {
			console.log('Unknown command: ' + field);
		}
	},

	connect(corpType) {
		let result = rolld20();
		let total = result + proficiencyBonus();

		if (result <= 1) {
			return console.log(fail('CRITICAL FAIL'));
		} else if (result >= 20) {
			return console.log(success('CRITICAL SUCCESS'));
		}

		if (!corpType) {
			return console.log(`${result} + ${proficiencyBonus()} = ${total}`);
		}
		
		corpType = corpType.toLowerCase();
		let minRequired = 0;
		if (corpType === 'small' || corpType === 'medium') {
			minRequired = 15;
		} else if (corpType === 'large' || corpType === 'huge') {
			minRequired = 10;
		} else {
			return console.log(`Unknown corp type: ${corpType}. Try small, medium, large, or huge`);
		}

		if (total < minRequired) {
			console.log(fail('FAIL'));
		} else {
			console.log(success('SUCCESS'));
		}
	},

	exit() {
		process.exit(0);
	},

	gold() {
		console.log(`GP: ${chalk.yellow(character.gold)}`);
	},

	implants() {
		for (let implant of character.implants) {
			console.log(`${implant.name} - ${implant.charges} charges`);
		}
	},

	proficiencies() {
		console.log(character.proficiencies.join('\n'));
	},

	proficiency_bonus() {
		console.log(proficiencyBonus());
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
		stat = character[stat];
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
		} = character;

		const modifier = (stat) => Math.floor((stat - 10) / 2);
		console.log(`Strength:     ${strength} - ${modifier(strength)}`);
		console.log(`Dexterity:    ${dexterity} - ${modifier(dexterity)}`);
		console.log(`Constitution: ${constitution} - ${modifier(constitution)}`);
		console.log(`Intelligence: ${intelligence} - ${modifier(intelligence)}`);
		console.log(`Wisdom:       ${wisdom} - ${modifier(wisdom)}`);
		console.log(`Charisma:     ${charisma} - ${modifier(charisma)}`);
	}
};

commands.COMMANDS = Object.keys(commands)
	.concat(Object.keys(character));

commands.COMMANDS = commands.COMMANDS
	.filter((key, i) => commands.COMMANDS.indexOf(key) === i) // Remove duplicates
	.filter(key => !key.startsWith('_')) // Ignore private data
	.sort(); // Sort alphabetically

module.exports = commands;