const chalk = require('chalk');
const character = require('./character');

const calculateStatModifier = (modifier) => {
	if (modifier[0] === '+') {
		return parseInt(modifier.substr(1));
	}
	
	if (modifier[0] === '-') {
		return -parseInt(modifier.substr(1));
	}

	if (!Number.isNaN(parseInt(modifier))) {
		return null;
	}

	return NaN;
}

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

const formatNumber = (x) => {
	let result;
	if (x < 0) {
		result = '-';
		x = Math.abs(x);
	} else {
		result = ' ';
	}

	result += (x < 10)  ? `00${x}` :
						(x < 100) ? `0${x}`  : x;
	return result;
};

let _logIndex = 0;
let _logMsg = '';
let _logPromise = null;
const log = (msg, newline = true, delay = 20) => {
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
				setTimeout(printCharacter, delay);
			}
			setTimeout(printCharacter, 0);
		});
	}

	return _logPromise;
};

const outputArray = (array) => array.length ? log(array.join('\n')) : log('--empty--');

let commands = {
	/**
	 * Display a field from the character's data
	 * @param {string} field Name of the field to show
	 */
	_displayData(field) {
		if (character.hasOwnProperty(field)) {
			field = character[field];
			if (Array.isArray(field)) {
				return outputArray(field);
			} else {
				if (field === null || field === undefined || field.length === 0) {
					return log('--empty--');
				}
				return log(field);
			}
		} else {
			return log('Unknown command: ' + field);
		}
	},

	connect(flags, corpType) {
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

	features(flags, featureName) {
		if (!featureName) {
			return outputArray(character.features);
		}

		let allFeatures = character._schema.features;
		let feature = allFeatures[featureName];
		if (!feature) {
			return log(`Unknown feature: ${featureName}`);
		}

		feature.description.forEach(line => log(line, true, 10));
		return log();
	},

	gold(flags, modifier) {
		let currentGold = chalk.yellow(character.gold);
		if (!modifier) {
			return log(`GP: ${currentGold}`);
		}

		let diff = calculateStatModifier(modifier);
		if (diff === null) {
			// No modifier, set it directly
			modifier = parseInt(modifier);
			log(`Previous GP: ${character.gold}`);
			character.gold = modifier;
			return log(`GP: ${chalk.yellow(modifier)}`);
		}

		if (Number.isNaN(diff)) {
			return log(`Unknown modifier: ${modifier}. Expected similar to: -10 or +23`);
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

	hp(flags, modifier) {
		const formatHP = (hp, max) => {
			if (hp >= 0.75 * max) {
				return `${chalk.green(hp)}/${max}`;
			} else if (hp >= 0.4 * max) {
				return `${chalk.yellow(hp)}/${max}`;
			}
			return `${chalk.red(hp)}/${max}`;
		}

		if (!modifier) {
			let activeHP = character.current_hp + character.temporary_hp;
			let temp = (character.temporary_hp) ? `(+${character.temporary_hp})` : '';
			return log(`${formatHP(activeHP, character.max_hp)} ${temp}`);
		}

		let diff = calculateStatModifier(modifier);
		if (diff === null) {
			// No modifier, set it directly
			modifier = parseInt(modifier);
			log(`Previous HP: ${formatHP(character.current_hp, character.max_hp)}`);
			character.current_hp = modifier;
			return log(`HP: ${formatHP(modifier, character.max_hp)}`);
		}

		if (Number.isNaN(diff)) {
			return log(`Unknown modifier: ${modifier}. Expected similar to: -10 or +23`);
		}

		let total = Math.min(character.current_hp + diff, character.max_hp);
		if (diff > 0) {
			log(`${character.current_hp} + ${diff}`);
		} else {
			log(`${character.current_hp} - ${diff * -1}`);
		}

		character.current_hp = total;
		return log(`HP: ${formatHP(total, character.max_hp)}`);
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

	roll(flags, stat) {
		if (!stat) {
			return log(`Luck: ${rolld20()}`);
		}
		stat = stat.toLowerCase();

		const shortFormToLong = {
			str: 'strength',
			dex: 'dexterity',
			con: 'constitution',
			int: 'intelligence',
			wis: 'wisdom',
			cha: 'charisma'
		};

		const subSkillLookup = {
			strength_save: 'strength',
			athletics: 'strength',
			dexterity_save: 'dexterity',
			acrobatics: 'dexterity',
			sleight_of_hand: 'dexterity',
			stealth: 'dexterity',
			constitution_save: 'constitution',
			intelligence_save: 'intelligence',
			arcana: 'intelligence',
			history: 'intelligence',
			investigation: 'intelligence',
			nature: 'intelligence',
			religion: 'intelligence',
			wisdom_save: 'wisdom',
			animal_handling: 'wisdom',
			insight: 'wisdom',
			medicine: 'wisdom',
			perception: 'wisdom',
			survival: 'wisdom',
			charisma_save: 'charisma',
			deception: 'charisma',
			intimidation: 'charisma',
			performance: 'charisma',
			persuasion: 'charisma'
		};

		let proficiency = 0;
		if (subSkillLookup[stat]) {
			proficiency = proficiencyBonus(stat.replace('_', ' '));
			stat = subSkillLookup[stat];
		}

		if (shortFormToLong[stat]) {
			stat = shortFormToLong[stat];
		}

		stat = character[stat];
		let modifier = Math.floor((stat - 10) / 2);
		let result = rolld20();
		if (proficiency) {
			return log(`R:${result} + M:${modifier} + P:${proficiency} = ${result + modifier + proficiency}`);
		}
		return log(`R:${result} + M:${modifier} = ${result + modifier}`);
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

		const f = formatNumber;
		const modifier = (stat) => {
			let result = Math.floor((stat - 10) / 2);
			if (result >= 0) {
				return ` ${result}`;
			}
			return result;
		};
		log(`Strength:     ${f(strength)} -   ${modifier(strength)}`);
		log(`Dexterity:    ${f(dexterity)} -   ${modifier(dexterity)}`);
		log(`Constitution: ${f(constitution)} -   ${modifier(constitution)}`);
		log(`Intelligence: ${f(intelligence)} -   ${modifier(intelligence)}`);
		log(`Wisdom:       ${f(wisdom)} -   ${modifier(wisdom)}`);
		log(`Charisma:     ${f(charisma)} -   ${modifier(charisma)}`);
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