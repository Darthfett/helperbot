var chatCommands = require('./chatCommands.js');

module.exports.inject = inject;

function inject(bot) {

    chatCommands.registerCommand('add master', function(username, args) {
        if (addMaster(args[0])) {
            bot.chat('Adding ' + args[0] + ' as a master.');
        } else {
            bot.chat('lol, ' + args[0] + ' is already my master.');
        }
    }, 1, 1);
    chatCommands.registerCommand('rm master', function(username, args) {
        if (removeMaster(args[0])) {
            bot.chat('Removing ' + args[0] + ' as a master.');
        } else {
            bot.chat('lol, ' + args[0] + ' isn\'t my master.');
        }
    }, 1, 1);

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