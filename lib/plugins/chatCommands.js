var assert = require("assert");

module.exports = {
    inject: inject,
    registerCommand: registerCommand,
};

// Contains a tree of all registered commands, by splitting
var commands = {
    handlers: [],
    commands: {},
};

function inject(bot) {
    bot.on('chat', function runCommands(username, command) {
        // Run all registered commands

        var subCommands = command.toLowerCase().split(' ');

        var commandRoot = commands;
        for (var i = 0; i < subCommands.length; i++) {
            var subCommandArgs = command.split(' ').slice(i+1);
            if (typeof(commandRoot) === 'undefined') return;

            if (typeof(commandRoot.commands[subCommands[i]]) !== 'undefined') {
                var registeredCommands = commandRoot.commands[subCommands[i]];

                // Run all handlers
                for (var j = 0; j < registeredCommands.handlers.length; j++) {
                    var handler = registeredCommands.handlers[j];

                    if (handler.minArgs > subCommandArgs.length) continue;
                    if (handler.maxArgs < subCommandArgs.length) continue;

                    handler.handler(username, subCommandArgs);
                }
            }
            commandRoot = commandRoot.commands[subCommands[i]];
        }
    });
}


function registerCommand(command, handler, minArgs, maxArgs) {
    assert(typeof(command) === 'string', 'Chat Commands: Cannot register ' + command + ' as a command.');
    assert(typeof(handler) === 'function', 'Chat Commands: Cannot register ' + handler + ' as a command handler.');
    if (minArgs === undefined) {
        minArgs = 0;
    }
    assert(typeof(minArgs) === 'number', 'Chat Commands: Invalid value for minArgs: ' + minArgs + '.');
    if (maxArgs === undefined) {
        maxArgs = Infinity;
    }
    assert(typeof(maxArgs) === 'number', 'Chat Commands: Invalid value for maxArgs: ' + maxArgs + '.');

    var subCommands = command.toLowerCase().split(' ');

    // Find/Generate command root, the tree node for commands registered to subCommands.join(' ')
    var commandRoot = commands;
    for (var i = 0; i < subCommands.length; i++) {
        if (typeof(commandRoot.commands[subCommands[i]]) === 'undefined') {
            // No subCommands created for subCommands[0 : i-1];  Create one now.

            commandRoot.commands[subCommands[i]] = {
                handlers: [],
                commands: {},
            }
        }
        commandRoot = commandRoot.commands[subCommands[i]];
    }

    commandRoot.handlers.push({
        handler: handler,
        minArgs: minArgs,
        maxArgs: maxArgs,
    });
}