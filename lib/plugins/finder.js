var chatCommands = require('./chatCommands');

module.exports.inject = inject;

function inject(bot) {
    var items = require('../items')(bot);

    function find(username, args, responderFunc) {
        var playerEntity = bot.players[username].entity;
        if (playerEntity == null) {
            responderFunc("I can't see you, " + username + '.');
            return;
        }
        var blockName = args.join(' ');
        var blockTypes = items.lookupBlockName(blockName);

        if (!blockTypes.length) {
            responderFunc("I don't know any blocks named " + blockName);
            return;
        }

        responderFunc('Looking for ' + blockTypes[0].displayName + '...');

        var blockPoints = bot.findBlock({
            point: playerEntity.position,
            matching: blockTypes[0].id,
            maxDistance: 96,
        }, function(err, blockPoints) {
            if (err) {
                console.err(err);
                responderFunc("I couldn't find any " + blockTypes[0].displayName + ' near you, ' + username + '.');
                return;
            }

            if (blockPoints.length) {
                var foundBlock = blockPoints[0];
                var startPos = playerEntity.position.floored();
                var endPos = foundBlock.position.floored()
                var distanceVec = endPos.minus(startPos).floored().abs();
                var distance = distanceVec.x + distanceVec.y + distanceVec.z;
                bot.lookAt(foundBlock.position);
                responderFunc('The closest ' + foundBlock.displayName + ' is at ' + endPos + ', ' + distance + ' blocks away.');
            } else {
                responderFunc("I couldn't find any " + blockTypes[0].displayName + ' near you, ' + username + '.');
            }
        });
    }

    chatCommands.registerCommand('find', find, 1, Infinity);
    chatCommands.addCommandHelp('find', "'find block name' - Make the bot find the coordinates of the nearest 'block name' block.");
}
