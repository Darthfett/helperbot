var chatCommands = require('./chatCommands');

module.exports.inject = function(bot) {
    chatCommands.registerCommand('echo', function echo(username, args, responderFunc) {
        bot.chat(args.join(' '));
    }, 1, Infinity);
}
chatCommands.addCommandHelp('echo', "'echo message' - Repeat the given 'message' into chat.");