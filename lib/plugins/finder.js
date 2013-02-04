var chatCommands = require('./chatCommands');
var items = require('../items');
var blockFinder = require('./blockFinder');

module.exports.inject = inject;

function inject(bot) {

    function find(username, args) {
        var playerEntity = bot.players[username].entity;
        if (playerEntity == null) {
            bot.chat('I can\'t see you, ' + username + '.');
            return;
        }
        var blockName = args.join(' ');
        var blockTypes = items.lookupBlockName(blockName);

        if (!blockTypes.length) {
            bot.chat('I don\'t know any blocks named ' + blockName);
            return;
        }

        var blockPoints = bot.findBlock(playerEntity.position, blockTypes[0].id, 64);

        if (blockPoints.length) {
            var foundBlock = bot.blockAt(blockPoints[0]);
            var startPos = playerEntity.position.floored();
            var endPos = foundBlock.position.floored()
            var distanceVec = endPos.minus(startPos).floored().abs();
            var distance = distanceVec.x + distanceVec.y + distanceVec.z;
            bot.lookAt(blockPoints[0]);
            bot.chat('The closest ' + foundBlock.displayName + ' is at ' + endPos + ', ' + distance + ' blocks away.');
        } else {
            bot.chat('I couldn\'t find any ' + blockTypes[0].displayName + ' near you, ' + username + '.');
        }
    }

    chatCommands.registerCommand('find', find, 1, Infinity);
}
