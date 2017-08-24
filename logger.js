const chalk = require('chalk');

/**
 * Logs out information in an aesthetically pleasing manner
 */

let message = '';     // What needs to be displayed
let messageIndex = 0; // Where in the message we have currently displayed
let promise = null;   // How to let people know when we're done

/**
 * Reset the state of the logger
 */
function reset() {
	message = '';
	messageIndex = 0;
	promise = null;
}

/**
 * Print out a single character
 * @param {function} resolve Resolve function of the promise
 * @param {number} delay How long before printing the next one
 */
function printCharacter(resolve, delay) {
	if (messageIndex >= message.length) {
		// Hit the end of the line, stop the train
		reset();
		return resolve();
	}

	// Print the next character in the stream
	process.stdout.write(message[messageIndex++]);
	setTimeout(() => printCharacter(resolve, delay), delay);
}

function log(msg, newline = true, delay = 20) {
	// Convenience method to quickly access underlying promise
	if (msg === undefined) {
		return promise;
	}

	// Add to the existing message
	message += msg + (newline ? '\n' : '');
	
	// If this is the first time since the message completed
	// start it all up again
	if (promise === null) {
		promise = new Promise((resolve) => {
			// Start printing out each character
			setTimeout(() => printCharacter(resolve, delay), 0);
		});
	}

	return promise;
}

log.fast = (msg, newline = true) => log(msg, newline, 10);
log.slow = (msg, newline = true) => log(msg, newline, 100);
log.success = (msg = 'SUCCESS', newline = true) => log.fast(chalk.bgGreen.black(msg), newline);
log.criticalSuccess = () => log.success('CRITICAL SUCCESS');
log.fail = (msg = 'FAIL', newline = true) => log.fast(chalk.bgRed.black(msg), newline);
log.criticalFail = () => log.fail('CRITICAL FAIL');
log.ok = (msg, newline, delay) => log(`${chalk.bgGreen.black('OK')} ${msg}`, newline, delay);
log.error = (msg, newline, delay) => log(`${chalk.bgRed.black('ERR')} ${msg}`, newline, delay);

module.exports = log;