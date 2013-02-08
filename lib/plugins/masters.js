var chatCommands = require('./chatCommands.js');

module.exports.inject = inject;

function inject(bot) {

    chatCommands.registerCommand('add master', function(username, args, responderFunc) {
        if (addMaster(args[0])) {
            responderFunc('Adding ' + args[0] + ' as a master.');
        } else {
            responderFunc('lol, ' + args[0] + ' is already my master.');
        }
    }, 1, 1);
    chatCommands.addCommandHelp('add master', "'add master [username]' - Add 'username' to the bot's list of masters.");

    chatCommands.registerCommand('rm master', function(username, args, responderFunc) {
        if (removeMaster(args[0])) {
            responderFunc('Removing ' + args[0] + ' as a master.');
        } else {
            responderFunc('lol, ' + args[0] + ' isn\'t my master.');
        }
    }, 1, 1);
    chatCommands.addCommandHelp('rm master', "'rm master [username]' - Remove 'username' from the bot's list of masters.");

    chatCommands.registerCommand('masters', function(username, args, responderFunc) {
        responderFunc('My masters: ' + bot.masters.join(', '));
    }, 0, 0);
    chatCommands.addCommandHelp('masters', "'masters' - Display the bot's list of masters.");

    function addMaster(name) {
        name = name.toLowerCase();
        if (bot.masters.indexOf(name) === -1) {
            bot.masters.push(name);
            return true;
        } else {
            return false;
        }
    }

    function removeMaster(name) {
        name = name.toLowerCase();
        var index = bot.masters.indexOf(name)
        if (index !== -1) {
            bot.masters.splice(index, 1);
            return true;
        } else {
            return false;

        }
    }

}