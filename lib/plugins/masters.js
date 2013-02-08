var chatCommands = require('./chatCommands.js');

module.exports.inject = inject;

function inject(bot) {

    chatCommands.registerCommand('masters add', function(username, args, responderFunc) {
        if (addMaster(args[0])) {
            responderFunc('Adding ' + args[0] + ' as a master.');
        } else {
            responderFunc('lol, ' + args[0] + ' is already my master.');
        }
    }, 1, 1);
    chatCommands.addCommandHelp('masters add', "'masters add [username]' - Add 'username' to the bot's list of masters.");

    chatCommands.registerCommand('masters rm', function(username, args, responderFunc) {
        if (removeMaster(args[0])) {
            responderFunc('Removing ' + args[0] + ' as a master.');
        } else {
            responderFunc('lol, ' + args[0] + ' isn\'t my master.');
        }
    }, 1, 1);
    chatCommands.addCommandHelp('masters rm', "'masters rm [username]' - Remove 'username' from the bot's list of masters.");

    chatCommands.registerCommand('masters', function(username, args, responderFunc) {
        responderFunc('My masters: ' + bot.masters.join(', '));
    }, 0, 0);
    chatCommands.addCommandHelp('masters', "'masters [add/rm username]' - Display the bot's list of masters, or add/remove a master.");

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