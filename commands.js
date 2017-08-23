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
	_displayField(field) {
		field = character[field];
		if (Array.isArray(field)) {
			return outputArray(field);
		}

		if (field === null || field === undefined || field.length === 0) {
			return log('--empty--');
		}

		return log(field);
	},

	/**
	 * Modifies a field
	 * @param {string} field 
	 * @param {object} flags 
	 * @param {string} modifier 
	 */
	_modifyField(field, flags, modifier) {
		let value = character[field];
		if (typeof value === 'number') {
			log(`Previous ${field}: ${value}`);
			value = calculateStatModifier(modifier);
			if (value === null) {
				value = parseInt(modifier);
			} else {
				value += character[field];
			}

			character[field] = value;

			return log(`${field}: ${value}`);
		}

		if (typeof value === 'string') {
			log(`Previous ${field}: ${value}`);
			modifier = modifier
				.replace(/\\r/g, '\r')
				.replace(/\\n/g, '\n');
			if (modifier[0] === '+') {
				value += modifier.slice(1);
			} else {
				value = modifier;
			}
			character[field] = value;

			return log(`${field}: ${value}`);
		}

		if (typeof value === 'boolean') {
			let newValue;
			if (modifier === 1 || modifier === 'true') {
				newValue = true;
			} else if (modifier === 0 || modifier === 'false') {
				newValue = false;
			} else {
				return log(`Unexpected argument '${modifier}'. Expected: 1, true, 0, or false`);
			}
			log(`Previous ${field}: ${value}`);
			character[field] = newValue;
			return log(`${field}: ${newValue}`);
		}

		return log(`Unable to modify ${field} through this interface`);
	},

	/**
	 * Display or modify a field from the character's data
	 * @param {string} field Name of the field to show or modify
	 */
	_field(field, flags, ...args) {
		if (character.hasOwnProperty(field)) {
			if (args.length === 0) {
				return commands._displayField(field);
			}

			return commands._modifyField(field, flags, args[0]);
		} else {
			return log('Unknown command: ' + field);
		}
	},

	clear() {
		process.stdout.write("\u001b[2J\u001b[0;0H");
	},

	connect(flags, corpType) {
		let result = rolld20();
		let modifier = Math.floor((character.intelligence - 10) / 2);
		let bonus = proficiencyBonus('Computers');
		let total = result + modifier + bonus;

		if (result <= 1) {
			return log(fail('CRITICAL FAIL'));
		} else if (result >= 20) {
			return log(success('CRITICAL SUCCESS'));
		}

		if (!corpType) {
			return log(`R:${result} + M:${modifier} + P:${bonus} = ${total}`);
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
	
	defeat(flags, corpType) {
		let result = rolld20();
		let modifier = Math.floor((character.intelligence - 10) / 2);
		let bonus = proficiencyBonus('Computers');
		let total = result + modifier + bonus;

		if (result <= 1) {
			return log(fail('CRITICAL FAIL'));
		} else if (result >= 20) {
			return log(success('CRITICAL SUCCESS'));
		}

		if (!corpType) {
			return log(`R:${result} + M:${modifier} + P:${bonus} = ${total}`);
		}
		
		corpType = corpType.toLowerCase();
		let minRequired = 0;
		if (corpType === 'small') {
			minRequired = 5;
		} else if (corpType === 'medium') {
			minRequired = 10;
		} else if (corpType === 'large') {
			minRequired = 15;
		} else if (corpType === 'huge') {
			minRequired = 20;
		} else {
			return log(`Unknown corp type: ${corpType}. Try small, medium, large, or huge`);
		}

		if (total < minRequired) {
			return log(fail('FAIL'));
		}
		return log(success('SUCCESS'));
	},
	
	exfiltrate(flags, corpType) {
		let result = rolld20();
		let modifier = Math.floor((character.intelligence - 10) / 2);
		let bonus = proficiencyBonus('Computers');
		let total = result + modifier + bonus;

		if (result <= 1) {
			return log(fail('CRITICAL FAIL'));
		} else if (result >= 20) {
			return log(success('CRITICAL SUCCESS'));
		}

		if (!corpType) {
			return log(`R:${result} + M:${modifier} + P:${bonus} = ${total}`);
		}
		
		corpType = corpType.toLowerCase();
		let minRequired = 0;
		if (corpType === 'small') {
			minRequired = 5;
		} else if (corpType === 'medium') {
			minRequired = 10;
		} else if (corpType === 'large') {
			minRequired = 15;
		} else if (corpType === 'huge') {
			minRequired = 20;
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

	ls() {
		const cmds = commands.COMMANDS;
		const width = cmds.reduce((a, b) => a.length > b.length ? a : b).length + 2;
		const columns = process.stdout.columns;
		const maxColumns = Math.floor(columns / width);
		if (!maxColumns || maxColumns === Infinity) {
			maxColumns = 1;
		}

		function handleGroup(group, width, maxColumns) {
			if (group.length === 0) {
				return;
			}

			const minRows = Math.ceil(group.length / maxColumns);
			for (let row = 0; row < minRows; row++) {
				for (let col = 0; col < maxColumns; col++) {
					let idx = row * maxColumns + col;
					if (idx >= group.length) {
						break;
					}

					let item = group[idx];
					log(item, false, 5);
					if (col < maxColumns - 1) {
						for (let s = 0; s < width - item.length; s++) {
							log(' ', false, 5);
						}
					}
				}
				log('', true, 5);
			}
			log('', true, 5);
		}

		let group = [];
		cmds.forEach(cmd => {
			if (cmd === '') {
				handleGroup(group, width, maxColumns);
				group = [];
			} else {
				group.push(cmd);
			}
		})
		handleGroup(group, width, maxColumns);
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
			computers: 'intelligence',
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
	
	seek(flags, corpType) {
		let result = rolld20();
		let modifier = Math.floor((character.intelligence - 10) / 2);
		let bonus = proficiencyBonus('Computers');
		let total = result + modifier + bonus;

		if (result <= 1) {
			return log(fail('CRITICAL FAIL'));
		} else if (result >= 20) {
			return log(success('CRITICAL SUCCESS'));
		}

		if (!corpType) {
			return log(`R:${result} + M:${modifier} + P:${bonus} = ${total}`);
		}
		
		corpType = corpType.toLowerCase();
		let minRequired = 0;
		if (corpType === 'small') {
			minRequired = 5;
		} else if (corpType === 'medium') {
			minRequired = 10;
		} else if (corpType === 'large') {
			minRequired = 15;
		} else if (corpType === 'huge') {
			minRequired = 20;
		} else {
			return log(`Unknown corp type: ${corpType}. Try small, medium, large, or huge`);
		}

		if (total < minRequired) {
			return log(fail('FAIL'));
		}
		return log(success('SUCCESS'));
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
	},

	weapons() {
		let weapons = character.weapons;
		Object.keys(weapons)
			.map(name => Object.assign({}, weapons[name], { name }))
			.forEach(weapon => {
				log(`${weapon.name}: ${weapon.stat} - ${weapon.dice[0]}d${weapon.dice[1]}`);
				log(`- ${weapon.description[0]}`);
				weapon.description.slice(1).forEach(line => log(`  ${line}`));
			});
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