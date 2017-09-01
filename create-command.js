const log = require('./logger');

/**
 * Basic way of setting up a command
 */
module.exports = function({ usage, exec }) {
	usage = usage.trim();
	return (flags, ...args) => {
		if (flags.h || flags.help) {
			return log(usage);
		}

		return exec(flags, ...args);
	};
};