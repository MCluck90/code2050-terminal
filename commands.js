const chalk = require('chalk');
const character = require('./character');
const log = require('./logger');
const Skills = require('./skills');

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
		average,
		dropLowest: sum - Math.min(...results)
	}
};

const displayRoll = (result, modifier, proficiency = 0, baseDmg = 0, canCrit = true) => {
	if (canCrit && result === 20) {
		return log.criticalSuccess();
	} else if (canCrit && result === 1) {
		return log.criticalFail();
	}
	let output = `R:${result} + M:${modifier}`;
	if (proficiency) {
		output += ` + P:${proficiency}`;
	}
	if (baseDmg) {
		output += ` + B:${baseDmg}`;
	}
	return log(`${output} = ${result + modifier + proficiency + baseDmg}`);
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

const lookupStat = (stat) => {
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

	if (!character.hasOwnProperty(stat) || typeof character[stat] !== 'number') {
		return null;
	}

	return stat;
};

const calculateModifier = (stat) => Math.floor((stat - 10) / 2);

const outputArray = (array) => array.length ? log(array.join('\n')) : log('--empty--');

const outputTable = (items) => {
	const width = items.reduce((a, b) => a.length > b.length ? a : b).length + 2;
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
	items.forEach(item => {
		if (item === '') {
			handleGroup(group, width, maxColumns);
			group = [];
		} else {
			group.push(item);
		}
	})
	handleGroup(group, width, maxColumns);
	return log();
};

let lastUsedWeapon = null;
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

	alignment(flags) {
		if (!flags.m && !flags.modify) {
			return log(character.alignment);
		}

		log('Choose an alignment:');
		const alignments = [
			'lawful good',    'neutral good', 'chaotic good',
			'lawful neutral', 'true neutral', 'chaotic neutral',
			'lawful evil',    'neutral evil', 'chaotic evil'
		];
		const shortcuts = [
			'lg', 'ng', 'cg',
			'ln', 'tr', 'cn',
			'le', 'ne', 'ce'
		];
		outputTable(alignments.map((a, i) => `${a} (${shortcuts[i]})`));
		userInput.enterBlock('alignment = ', (line) => {
			line = line.trim().toLowerCase().replace(/\s\s+/g, ' ');
			let newAlignment;
			if (alignments.indexOf(line) > -1) {
				newAlignment = line;
			} else if (shortcuts.indexOf(line) > -1) {
				newAlignment = alignments[shortcuts.indexOf(line)];
			}
			if (newAlignment) {
				character.alignment = newAlignment;
				log.success(`Changed alignment to ${newAlignment}`);
				userInput.exitBlock();
			} else {
				log.error('Please enter one of the available alignments');
			}
		});
	},

	armor_class() {
		return log(character.armor_class + Skills.modifier('dex'));
	},

	attack(flags, weapon) {
		if (!weapon && !lastUsedWeapon) {
			return log('Please specify a weapon to attack with');
		}

		if (!weapon) {
			weapon = lastUsedWeapon;
			// Inform player which weapon they're using on auto attacks
			log(`Attacking with: ${weapon.name}`);
		} else {
			let weaponLookup = Object.keys(character.weapons)
				.reduce((lookup, key) => {
					lookup[key.toLowerCase()] = character.weapons[key];
					return lookup;
				}, {});

			if (!weaponLookup.hasOwnProperty(weapon.toLowerCase())) {
				return log(`Unknown weapon: ${weapon}`);
			}

			lastUsedWeapon = weapon = weaponLookup[weapon.toLowerCase()];
		}

		let stat = lookupStat(weapon.stat);
		if (!stat) {
			return log(`Unknown stat '${weapon.stat}' associated with weapon '${weapon.name}`);
		}
		stat = character[stat];
		let dice = weapon.dice.slice().reverse();
		let result = roll(...dice);
		let proficiency = proficiencyBonus(weapon.weapon_type);
		log(`Rolls: ${result.rolls.join(', ')}`);
		return displayRoll(result[weapon.dmg_type], calculateModifier(stat), proficiency, weapon.base_damage, false);
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
			return log.criticalFail();
		} else if (result >= 20) {
			return log.criticalSuccess();
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
			return log.fail();
		}
		return log.success();
	},
	
	defeat(flags, corpType) {
		let result = rolld20();
		let modifier = Math.floor((character.intelligence - 10) / 2);
		let bonus = proficiencyBonus('Computers');
		let total = result + modifier + bonus;

		if (result <= 1) {
			return log.criticalFail();
		} else if (result >= 20) {
			return log.criticalSuccess();
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
			return log.fail();
		}
		return log.success();
	},
	
	exfiltrate(flags, corpType) {
		let result = rolld20();
		let modifier = Math.floor((character.intelligence - 10) / 2);
		let bonus = proficiencyBonus('Computers');
		let total = result + modifier + bonus;

		if (result <= 1) {
			return log.criticalFail();
		} else if (result >= 20) {
			return log.criticalSuccess();
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
			return log.fail();
		}
		return log.success();
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

	initiative() {
		return log(Skills.modifier('dex'));
	},

	/**
	 * Load character data from a file
	 * @param {object} flags 
	 * @param {string} filePath Which file to load
	 */
	load(flags, filePath) {
		if (!filePath) {
			return log.error('Specify a file to load from');
		}

		character.load(filePath);
		return log.ok(`Loaded ${filePath}`);
	},

	ls() {
		const cmds = commands.COMMANDS;
		return outputTable(cmds);
	},

	passive_perception() {
		log(`${10 + Skills.modifier('wisdom')}`);
	},

	proficiencies() {
		return log(character.proficiencies.join('\n'));
	},

	roll(flags, stat, dieType) {
		if (!stat) {
			return log(`Luck: ${rolld20()}`);
		}

		if (typeof stat === 'number') {
			let numOfDice = stat;
			let rollType = (flags['drop-lowest'] || flags.d) ? 'dropLowest' : 'sum';
			if (rollType === 'dropLowest') {
				log('Drop the lowest');
			}
			let result = roll(dieType, numOfDice);
			log(`Rolls: ${result.rolls.join(', ')}`);
			return log(`${numOfDice}d${dieType}: ${result[rollType]}`);
		}

		flags.inspiration = flags.i;
		flags.advantage = flags.a;
		flags.disadvantage = flags.d;

		// Using inspiration
		if (flags.inspiration) {
			if (!character.inspiration) {
				return log(`You do not have inspiration`);
			}

			character.inspiration = false;
		}
		if (flags.advantage && flags.disadvantage) {
			return log('Cannot roll with disadvantage and advantage at the same time');
		}
		let statName = stat;
		stat = lookupStat(stat);

		if (stat === null) {
			return log(`Unknown stat: ${statName}`);
		}
		let proficiency = proficiencyBonus(stat);
		stat = character[stat];
		let modifier = calculateModifier(stat);

		// Does the player have advantage/disadvantage?
		if (flags.advantage || flags.disadvantage) {
			let results = [rolld20(), rolld20()];
			let selected;
			if (flags.advantage) {
				selected = Math.max(...results);
			} else {
				selected = Math.min(...results);
			}

			log(`Rolls: ${results.join(', ')}`);
			return displayRoll(selected, modifier, proficiency);
		}
		let result = rolld20();
		return displayRoll(result, modifier, proficiency);
	},
	
	seek(flags, corpType) {
		let result = rolld20();
		let modifier = Math.floor((character.intelligence - 10) / 2);
		let bonus = proficiencyBonus('Computers');
		let total = result + modifier + bonus;

		if (result <= 1) {
			return log.criticalFail();
		} else if (result >= 20) {
			return log.criticalSuccess();
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
			return log.fail('FAIL');
		}
		return log.success();
	},

	/**
	 * Save current character data to file
	 * @param {object} flags 
	 * @param {string} filePath Where to save character data
	 */
	save(flags, filePath) {
		character.save(filePath);
		return log(`Saved: ${filePath || character._filePath}`);
	},

	/**
	 * Print out the players basic stats and modifiers
	 */
	stats() {
		let strength = Skills.get('strength');
		let dexterity = Skills.get('dexterity');
		let constitution = Skills.get('constitution');
		let intelligence = Skills.get('intelligence');
		let wisdom = Skills.get('wisdom');
		let charisma = Skills.get('charisma');

		const f = formatNumber;
		const modifier = (stat) => {
			let result = Math.floor((stat - 10) / 2);
			if (result >= 0) {
				return ` ${result}`;
			}
			return result;
		};
		log(`Strength:     ${f(strength.score)} -   ${strength.modifier}`);
		log(`Dexterity:    ${f(dexterity.score)} -   ${dexterity.modifier}`);
		log(`Constitution: ${f(constitution.score)} -   ${constitution.modifier}`);
		log(`Intelligence: ${f(intelligence.score)} -   ${intelligence.modifier}`);
		log(`Wisdom:       ${f(wisdom.score)} -   ${wisdom.modifier}`);
		log(`Charisma:     ${f(charisma.score)} -   ${charisma.modifier}`);
		return log();
	},

	weapons() {
		let weapons = character.weapons;
		Object.keys(weapons)
			.map(name => Object.assign({}, weapons[name], { name }))
			.forEach(weapon => {
				log.fast(`${weapon.name}: ${weapon.stat} - ${weapon.dice[0]}d${weapon.dice[1]}`);
				log(`- ${weapon.description[0]}`);
				if (weapon.properties && weapon.properties.length) {
					log(`- ${weapon.properties.join(', ')}`);
				}
				log(`- Base damage: ${weapon.base_damage}`);
				log(`- Type: ${weapon.weapon_type}/${weapon.damage_type}`);
				log(`- Stat: ${weapon.stat}`);
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

// This has to be declared later to ensure all of the commands load in to the
// autocomplete correctly. Just go with it
const userInput = require('./user-input');