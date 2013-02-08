/*
 * Adds the 'help' in-game command to display help information
 */

var chatCommands = require('./chatCommands.js');

module.exports.inject = inject;

function inject(bot) {

    function help(username, args, responderFunc) {

        if (!args.length) {
            var availableCommands = [];
            chatCommands.walkCommandTree(function(command, commandRoot) {
                if (!commandRoot.handlers.length) return;
                if (commandRoot.helpText == null) return;
                availableCommands.push(command);
            });
            responderFunc('More information on helperbot is available at github.com/Darthfett/helperbot');
            responderFunc("Type 'help command' for help on a command.  Available commands: " + availableCommands.join(', '));
        } else {
            var command = args.join(' ');
            var commandNode = chatCommands.getCommandNode(command);
            if (commandNode.handlers == null) {
                if (commandNode.commands == null) {
                    responderFunc('Invalid command "' + command + '".');
                    return;
                }

                if (commandNode.helpText != null) {
                    responderFunc(commandNode.helpText);
                    return;
                }

                var availableSubCommands = [];
                chatCommands.walkCommandTree(function(subCommand, commandRoot) {
                    if (!commandRoot.handlers.length) return;
                    if (commandRoot.helpText == null) return;
                    availableSubCommands.push(subCommand);
                }, commandNode);
                responderFunc('No exact command "' + command + '". Sub-commands: ' + availableSubCommands.map(function(rightCmd) { return command + ' ' + rightCmd; }).join(', '));
            } else {
                if (commandNode.helpText == null) {
                    responderFunc('That command has no help text available.');
                    return;
                }
                responderFunc(commandNode.helpText);
            }
        }
    }

    chatCommands.registerCommand('help', help, 0, Infinity);
    chatCommands.addCommandHelp('help', 'Gives help on a given command.');
}