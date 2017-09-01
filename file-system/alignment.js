const character = require('../character');
const createCommand = require('../create-command');
const log = require('../logger');
const userInput = require('../user-input');

function lookupAlignment(input) {
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

	if (alignments.indexOf(input) > -1) {
		return input;
	} else if (shortcuts.indexOf(input) > -1) {
		return alignments[shortcuts.indexOf(input)];
	}
	return null;
}

module.exports = createCommand({
	usage: `
Display or modify the characters alignment

alignment               Display the characters alignment
alignment --help        Display this information
alignment [-m|--modify] Set the alignment. No arg will bring up a selector
	`,
	exec(flags) {
		flags.modify = flags.modify || flags.m;
		// If no modifier flag was given, just display it
		if (!flags.modify) {
			return log(character.alignment);
		}

		if (typeof flags.modify === 'string') {
			let newAlignment = lookupAlignment(flags.modify);
			if (newAlignment) {
				character.alignment = newAlignment;
				return log.success(`Changed alignment to ${newAlignment}`);
			}

			log.error('Invalid alignment type');
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
		log.table(alignments.map((a, i) => `${a} (${shortcuts[i]})`));
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
	}
});