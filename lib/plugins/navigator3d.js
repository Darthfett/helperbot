var chatCommands = require('./chatCommands');

module.exports.inject = function(bot) {

    require('mineflayer-navigate')(require('mineflayer'))(bot);

    chatCommands.registerCommand('come', function(username, args) {
        var speakerEntity = bot.players[username].entity;
        if (speakerEntity == null) return bot.chat("you're too far away");
        var destination = speakerEntity.position.floored();
        bot.chat("navigating to " + destination.toString());
        bot.navigate.to(destination);
    }, 0, 0);
};
