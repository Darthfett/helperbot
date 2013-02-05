var chatCommands = require('./chatCommands');

module.exports.inject = function(bot) {
    chatCommands.registerCommand('echo', function echo(username, args) {
        bot.chat(args.join(' '));
    }, 1, Infinity);
}