const fs = require('fs');
const loadJSON = (path) => JSON.parse(fs.readFileSync(path).toString());

const character = {
	_filePath: null,

	/**
	 * Loads up player data
	 * @param {string} filePath Path to the file to load
	 */
	load(filePath) {
		this._filePath = filePath;

		// Copy all of the data from the JSON file to the current character
		const characterData = loadJSON(filePath);
		for (let key in characterData) {
			character[key] = characterData[key];
		}

		// Load in character schema information
		if (character.archetype) {
			character._classInfo = loadJSON(`./level-up/${character.class}-${character.archetype}.json`);
		} else {
			character._classInfo = loadJSON(`./level-up/${character.class}.json`);
		}
	},

	/**
	 * Save the character data to a file
	 * @param {string} [filePath] Where to save the file. Defaults to last opened file
	 */
	save(filePath) {
		if (!filePath) {
			filePath = this._filePath;
		}
		this._filePath = filePath;

		fs.writeFileSync(filePath, JSON.stringify(this, (key, value) => {
			if (key[0] === '_') {
				return undefined;
			}
			return value;
		}, 2), 'utf-8');
	},
	
	/**
	 * Return the proficiency bonus for the characters current level
	 */
	get proficiency_bonus() {
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
	}
};

// Load the schema so that the keys are properly added to autocomplete
character.load('./character.schema.json');

module.exports = character;