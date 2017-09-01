const path = require('path');
const glob = require('glob');

// Get all of the commands listed in the "file system"
let commands = glob.sync('**/*.js', {
	cwd: path.join(__dirname, './file-system')
})
	// Strip off the extensions
	.map(filename => filename.replace('.js', ''));

module.exports = function(str) {
	let results = commands.filter(cmd => cmd.startsWith(str));
	return [results, str];
};