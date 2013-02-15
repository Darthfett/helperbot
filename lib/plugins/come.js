var chatCommands = require('./chatCommands');

module.exports.inject = function(bot) {

    chatCommands.registerCommand('come', function(username, args, responderFunc) {
        var speakerEntity = bot.players[username].entity;
        if (speakerEntity == null) return responderFunc("you're too far away");
        var destination = speakerEntity.position.floored();
        responderFunc("Navigating to " + destination.toString());
        bot.navigate.to(destination);
    }, 0, 0);
    chatCommands.addCommandHelp('come', "'come' - Make the bot come to your current location.");
};
