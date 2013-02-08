var assert = require("assert");

module.exports = {
    inject: inject,

    // Public, typical usage
    registerCommand: registerCommand,
    addCommandHelp: addCommandHelp,

    // Public, not-typical usage
    getCommandNode: getCommandNode,
    walkCommandTree: walkCommandTree,
};

// Contains a tree of all registered commands, by splitting
var commands = {
    handlers: [],
    commands: {},
};

function inject(bot) {

    function runCommands(username, command, responderFunc) {
        if (bot.masters.indexOf(username.toLowerCase()) === -1 && bot.masters.length) return;
        // Run all registered commands

        var subCommands = command.toLowerCase().split(' ');

        var commandRoot = commands;
        for (var i = 0; i < subCommands.length; i++) {
            var subCommandArgs = command.split(' ').slice(i+1);
            if (commandRoot == null) return;

            if (commandRoot.commands[subCommands[i]] != null) {
                var registeredCommands = commandRoot.commands[subCommands[i]];

                // Run all handlers
                for (var j = 0; j < registeredCommands.handlers.length; j++) {
                    var handler = registeredCommands.handlers[j];

                    if (handler.minArgs > subCommandArgs.length) continue;
                    if (handler.maxArgs < subCommandArgs.length) continue;

                    handler.handler(username, subCommandArgs, responderFunc);
                }
            }
            commandRoot = commandRoot.commands[subCommands[i]];
        }
    }

    function getResponderFunc(chatType, username) {
        var whisperFunc = (function whisper(message) {
            bot.whisper(username, message);
        });
        var chatFunc = (function chat(message) {
            if (bot.quietMode) {
                bot.whisper(username, message);
                return;
            }
            bot.chat(message);
        });
        var typeMap = {
            'chat': chatFunc,
            'whisper': whisperFunc,
        };
        return typeMap[chatType];
    }

    bot.on('chat', function(username, message) {
        var responderFunc = getResponderFunc('chat', username);
        runCommands(username, message, responderFunc);
    });
    bot.on('whisper', function(username, message) {
        console.log(username, message);
        var responderFunc = getResponderFunc('whisper', username);
        runCommands(username, message, responderFunc);
    });
}

function getSubCommands(commandRoot) {
    var subCommandsList = [];
    for (var command in commandRoot.commands) {
        var subCommands = getSubCommands(commandRoot.commands[command]);
        for (var i = 0; i < subCommands.length; i++) {
            subCommandList.push(command + subCommands[i]);
        }
    }
}

function getSubCommand(commandRoot, command) {
    if (commandRoot.commands[command] == null) {
        // commandRoot has no command subCommand, create it now.

        commandRoot.commands[command] = {
            handlers: [],
            commands: {},
        }
    }
    return commandRoot.commands[command];
}

function getCommandNode(command, commandNode) {
    if (commandNode == null) {
        commandNode = commands;
    }
    var subCommands = command.toLowerCase().split(' ');

    // Find/Generate the tree for commands registered to subCommands.join(' ').
    for (var i = 0; i < subCommands.length; i++) {
        commandNode = getSubCommand(commandNode, subCommands[i]);
    }

    return commandNode;
}

function registerCommand(command, handler, minArgs, maxArgs) {
    assert(typeof(command) === 'string', 'Chat Commands: Cannot register ' + command + ' as a command.');
    assert(typeof(handler) === 'function', 'Chat Commands: Cannot register ' + handler + ' as a command handler.');
    if (minArgs == null) {
        minArgs = 0;
    }
    assert(typeof(minArgs) === 'number', 'Chat Commands: Invalid value for minArgs: ' + minArgs + '.');
    if (maxArgs == null) {
        maxArgs = Infinity;
    }
    assert(typeof(maxArgs) === 'number', 'Chat Commands: Invalid value for maxArgs: ' + maxArgs + '.');

    var commandNode = getCommandNode(command);

    commandNode.handlers.push({
        handler: handler,
        minArgs: minArgs,
        maxArgs: maxArgs,
    });
}

function addCommandHelp(command, helpText) {
    assert(typeof(command) === 'string', 'Chat Commands: Cannot register helpText for command ' + command + '.');
    assert(typeof(helpText) === 'string', 'Chat Commands: Cannot register helpText ' + helpText + ' for command.');

    var commandNode = getCommandNode(command);

    if (commandNode.helpText != null) {
        console.log('Overwriting helpText for command ' + command + ' with ' + helpText + '(original: ' + commandNode.helpText + ').');
    }
    commandNode.helpText = helpText;
}

function noop() {}

function walkCommandTree(callback, commandRoot, leftCommand) {
    if (callback == null) {
        callback = noop;
    }
    if (commandRoot == null) {
        commandRoot = commands;
    }
    if (leftCommand == null) {
        leftCommand = '';
    }
    callback(leftCommand, commandRoot);
    for (var key in commandRoot.commands) {
        walkCommandTree(callback, commandRoot.commands[key], leftCommand + ' ' + key);
    }
}