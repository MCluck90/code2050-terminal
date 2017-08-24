const character = require('./character');

const toLookup = (x) => x.toLowerCase().replace(/ /g, '_');

const skillToStat = (skill) => ({
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
})[toLookup(skill)] || skill;

const shortFormToLong = (skillName) => ({
	str: 'strength',
	dex: 'dexterity',
	con: 'constitution',
	int: 'intelligence',
	wis: 'wisdom',
	cha: 'charisma',

	str_save: 'strength_save',
	dex_save: 'dexterity_save',
	con_save: 'constitution_save',
	int_save: 'intelligence_save',
	wis_save: 'wisdom_save',
	cha_save: 'charisma_save',

	acr:  'acrobatics',
	ani:  'animal_handling',
	arc:  'arcana',
	ath:  'athletics',
	com:  'compters',
	dec:  'deception',
	his:  'history',
	ins:  'insight',
	inti: 'intimidation',
	inv:  'investigation',
	med:  'medicine',
	nat:  'nature',
	perc: 'perception',
	perf: 'performance',
	pers: 'persuasion',
	rel:  'religion',
	soh:  'sleight_of_hand',
	ste:  'stealth',
	sur:  'survival'
})[skillName.toLowerCase()] || skillName;

/**
 * Parse and modify user skills
 * All methods take short and long form skill names
 */
const Skills = {
	/**
	 * Returns the underlying stat name (athletics -> strength, for example)
	 * @param {string} skillName Name of skill
	 */
	toBaseStat(skillName) {
		if (!skillName) {
			return new Error('skillName required');
		}
		
		skillName = shortFormToLong(skillName);
		skillName = skillToStat(skillName);
		if (!character.hasOwnProperty(skillName)) {
			return new Error(`Unknown stat: ${skillName}`);
		}

		return skillName;
	},

	/**
	 * Return all information about a given skill
	 * @param {string} name Name of the skill to lookup
	 */
	get(name) {
		let givenName = name;
		name = Skills.toBaseStat(name);
		if (name instanceof Error) {
			return name;
		}

		let score = Skills.score(name);
		let modifier = Skills.modifier(name);
		let proficient = Skills.isProficient(name);
		let proficiencyBonus = Skills.proficiencyBonus(name);
		return {
			givenName,
			name,
			score,
			modifier,
			proficient,
			proficiencyBonus
		};
	},

	/**
	 * Returns the ability score for the given skill
	 * @param {string} name Name of the skill to lookup
	 */
	score(name) {
		name = Skills.toBaseStat(name);
		if (name instanceof Error) {
			return name;
		}

		return character[name];
	},

	/**
	 * Returns the ability modifier for the given stat
	 * @param {string} name Name of the stat or skill to lookup
	 */
	modifier(name) {
		let score = Skills.score(name);
		if (score instanceof Error) {
			return score;
		}

		return Math.floor((score - 10) / 2);
	},

	/**
	 * Is the character proficient in a given skill?
	 * @param {string} name Name of the stat or skill to lookup
	 */
	isProficient(name) {
		return character
			.proficiencies
			.map(toLookup)
			.indexOf(toLookup(name)) > -1;
	},

	/**
	 * Returns the proficency bonus, if any, for a given skill
	 * @param {string} name Name of the stat or skill to lookup
	 */
	proficiencyBonus(name) {
		if (Skills.isProficient(name)) {
			return character.proficiencyBonus;
		}
		return 0;
	}
};

module.exports = Skills;