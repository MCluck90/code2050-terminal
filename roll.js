// Will be used to log out values
let log = null;

/**
 * Roll any kind of die any number of times
 * @param {number} dieType Type of die to roll (ex: 20 = d20)
 * @param {number} numberOfTimes How many times to roll it
 */
function roll(dieType, numberOfTimes) {
	let rolls = [];
	for (let i = 0; i < numberOfTimes; i++) {
		rolls.push(1 + Math.floor(Math.random() * dieType));
	}
	rolls.sort((a, b) => a - b);
	let sum = rolls.reduce((a, b) => a + b);
	let average = sum / numberOfTimes;
	let median = rolls[Math.floor(rolls.length / 2)];
	let max = Math.max(...rolls);
	let min = Math.min(...rolls);
	let modeInfo = {
		key: -1,
		count: -1
	};
	let numOfRollsPerNumber = rolls.reduce((obj, roll) => {
		obj[roll] = obj[roll] || 0;
		obj[roll]++;
		if (obj[roll] > modeInfo.count) {
			modeInfo.key = roll;
			modeInfo.count = obj[roll];
		}
		return obj;
	}, {});
	let mode = modeInfo.key;


	// Return all sorts of information about the rolls
	return {
		rolls,   // All of the individual rolls
		sum,	   // The sum of all rolls
		average, // The average of all of the rolls
		median,  // Median of all rolls
		mode,    // Most repeated roll
		max,     // Highest roll
		min      // Lowest roll
	};
}

/**
 * Roll a D20
 */
roll.d20 = () => roll(20, 1).sum;

module.exports = roll;