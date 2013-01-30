var chatCommands = require('./chatCommands');
var items = require('../items');
var blockFinder = require('./blockFinder');

module.exports.inject = inject;

function inject(bot) {

    function find(username, args) {
        var blockName = args.join(' ');
        var blockTypes = items.lookupBlockName(blockName);
        var blockIdList = blockTypes.map(function(block) { return block.id; });

        if (!blockIdList.length) {
            bot.chat('I don\'t know any blocks named ' + blockName);
            return;
        }

        var blockPoints = bot.findBlock(bot.entity.position, blockIdList, 63, 1);

        if (blockPoints.length) {
            bot.chat(blockPoints.map(function(x) { return x.floored(); }).join(', '));
        } else {
            bot.chat('I couldn\'t find any ' + blockTypes.map(function(block) { return block.displayName ? block.displayName : block.name; }).join(', '));
        }
    }

    chatCommands.registerCommand('find', find, 1, Infinity);
}