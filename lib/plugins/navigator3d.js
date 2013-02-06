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
    bot.navigate.on('pathFound', function(path) {
      bot.chat("found path. I can get there in " + path.length + " moves.");
    });
    bot.navigate.on('cannotFind', function(path) {
      bot.chat("unable to find path. getting as close as possible.");
      bot.navigate.walk(path);
    });
    bot.navigate.on('arrived', function() {
      bot.chat("I have arrived");
    });
    bot.navigate.on('stop', function() {
      bot.chat("stopping");
    });

};
