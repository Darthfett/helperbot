module.exports.inject = (function(bot) {
    var chatCommands = require('./chatCommands');
    chatCommands.registerCommand('quiet mode', function(username, args, responderFunc) {
        if (!args.length) {
            if (bot.quietMode) {
                responderFunc('quiet mode is currently ON.');
            } else {
                responderFunc('quiet mode is currently OFF.');
            }
            return;
        }
        if (args[0].toLowerCase() === 'on') {
            if (bot.quietMode) {
                responderFunc("I'm already being quiet!");
                return;
            }
            responderFunc('quiet mode enabled');
            bot.quietMode = true;
            return;
        }
        if (args[0].toLowerCase() === 'off') {
            if (!bot.quietMode) {
                responderFunc("I'M ALREADY BEING NOISY!");
                return;
            }
            bot.quietMode = false;
            responderFunc('quiet mode disabled');
            return;
        }
    }, 0, 1);
    chatCommands.addCommandHelp('quiet mode', "'quiet mode [on/off]' - Enable/disable quiet mode.");
});