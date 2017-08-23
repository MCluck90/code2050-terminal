let character = module.exports = require('./character.json');

character._schema = require(`./level-up/${character.class}-${character.archetype}.json`);