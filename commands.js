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

const isProficient = (skill) => character
	.proficiencies
	.some(proficient => proficient.toLowerCase() === skill.toLowerCase());

const proficiencyBonus = (skill) => {
	if (skill && !isProficient(skill)) {
		return 0;
	}
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

let _logIndex = 0;
let _logMsg = '';
let _logPromise = null;
const log = (msg, newline = true) => {
	if (msg === undefined) {
		return _logPromise;
	}

	_logMsg += msg + ((newline) ? '\n' : '');
	if (!_logPromise) {
		_logPromise = new Promise((resolve) => {
			_logIndex = 0;

			function printCharacter() {
				if (_logIndex >= _logMsg.length) {
					_logIndex = 0;
					_logMsg = '';
					_logPromise = null;
					return resolve();
				}

				process.stdout.write(_logMsg[_logIndex++]);
				setTimeout(printCharacter, 20);
			}
			setTimeout(printCharacter, 0);
		});
	}

	return _logPromise;
};

let commands = {
	/**
	 * Display a field from the character's data
	 * @param {string} field Name of the field to show
	 */
	_displayData(field) {
		if (character.hasOwnProperty(field)) {
			field = character[field];
			if (Array.isArray(field)) {
				return log(field.join('\n'));
			} else {
				return log(field);
			}
		} else {
			return log('Unknown command: ' + field);
		}
	},

	connect(corpType) {
		let result = rolld20();
		let bonus = proficiencyBonus('Computers');
		let total = result + bonus;

		if (result <= 1) {
			return log(fail('CRITICAL FAIL'));
		} else if (result >= 20) {
			return log(success('CRITICAL SUCCESS'));
		}

		if (!corpType) {
			return log(`${result} + ${bonus} = ${total}`);
		}
		
		corpType = corpType.toLowerCase();
		let minRequired = 0;
		if (corpType === 'small' || corpType === 'medium') {
			minRequired = 15;
		} else if (corpType === 'large' || corpType === 'huge') {
			minRequired = 10;
		} else {
			return log(`Unknown corp type: ${corpType}. Try small, medium, large, or huge`);
		}

		if (total < minRequired) {
			return log(fail('FAIL'));
		}
		return log(success('SUCCESS'));
	},

	exit() {
		process.exit(0);
	},

	gold(modifier) {
		let currentGold = chalk.yellow(character.gold);
		if (!modifier) {
			return log(`GP: ${currentGold}`);
		}

		let diff = 0;
		if (modifier[0] === '+') {
			diff = parseInt(modifier.substr(1));
		} else if (modifier[0] === '-') {
			diff = -parseInt(modifier.substr(1));
		} else {
			modifier = parseInt(modifier);
			log(`Previous GP: ${character.gold}`);
			character.gold = modifier;
			return log(`GP: ${chalk.yellow(modifier)}`);
		}

		let total = character.gold + diff;
		if (diff > 0) {
			log(`${character.gold} + ${diff}`);
		} else {
			log(`${character.gold} - ${diff * -1}`);
		}

		character.gold = total;
		return log(`GP: ${chalk.yellow(total)}`);
	},

	hp() {
		let temp = (character.temporary_hp) ? `(+${character.temporary_hp})` : '';
		return log(`${character.current_hp + character.temporary_hp}/${character.max_hp} ${temp}`);
	},

	implants() {
		for (let implant of character.implants) {
			log(`${implant.name} - ${implant.charges} charges`);
		}
		return log();
	},

	proficiencies() {
		return log(character.proficiencies.join('\n'));
	},

	proficiency_bonus() {
		return log(proficiencyBonus());
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
		return log(`${result} + ${modifier} = ${result + modifier}`);
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
		log(`Strength:     ${strength} - ${modifier(strength)}`);
		log(`Dexterity:    ${dexterity} - ${modifier(dexterity)}`);
		log(`Constitution: ${constitution} - ${modifier(constitution)}`);
		log(`Intelligence: ${intelligence} - ${modifier(intelligence)}`);
		log(`Wisdom:       ${wisdom} - ${modifier(wisdom)}`);
		log(`Charisma:     ${charisma} - ${modifier(charisma)}`);
		return log();
	}
};

commands.COMMANDS = Object.keys(commands)
	.concat(Object.keys(character));

commands.COMMANDS = commands.COMMANDS
	.filter((key, i) => commands.COMMANDS.indexOf(key) === i) // Remove duplicates
	.filter(key => !key.startsWith('_')) // Ignore private data
	.sort(); // Sort alphabetically

module.exports = commands;