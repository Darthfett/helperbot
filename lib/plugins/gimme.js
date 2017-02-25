var chatCommands = require('./chatCommands');

module.exports.inject = inject;

function inject(bot) {
    var items = require('../items')(bot);

    function giveItems(username, item, count) {
        if (count == null || isNaN(count)) {
            count = 1;
        }

        count = Math.min(count, item.stackSize * 32);
        
        while (true) {
            if (count == 0) break;
            if (count < item.stackSize) {
                bot.chat('/give ' + username + ' ' + item.name + ' ' + count);
                break;
            }
            bot.chat('/give ' + username + ' ' + item.name + ' ' + item.stackSize);
            count = count - item.stackSize;
        }
    }

    function gimme(username, args, responderFunc) {
        var count = parseInt(args[0]);
        if (!isNaN(count)) {
            args = args.slice(1);
        } else {
            if (args.join(' ').slice(-1) === '!') {
                args = args.join(' ').slice(0, -1).split(' ');
                count = Infinity;
            }
        }

        var item_matches = items.lookupItemName(args.join(' '));
        if (item_matches.length) {
            var item = item_matches[0];
            responderFunc('Giving you ' + item.name)
            giveItems(username, item, count);
        } else {
            item_matches = items.lookupItemName(args.join(' '), true);
            if (!item_matches.length) {
                responderFunc('No items match name "' + args.join(' ') + '"');
            } else {
                if (item_matches.length > 6) {
                    var matches = item_matches.slice(0, 6);
                    responderFunc("Ambiguous: " + matches.mapped(function(match) { return match.displayName; }).join(', ') + ', ...');
                } else {
                    responderFunc("Ambiguous: " + matches.mapped(function(match) { return match.displayName; }).join(', '));
                }
            }
        }
    }

    chatCommands.registerCommand('give', function give(username, args, responderFunc) {
        gimme(args.shift(), args, responderFunc);
    }, 2, Infinity);
    chatCommands.addCommandHelp('give', "'give username [count] block name' - Make the bot /give 'username' 'count' of a given block.");


    chatCommands.registerCommand('gimme', gimme, 1, Infinity);
    chatCommands.addCommandHelp('gimme', "'gimme [count] block name' - Make the bot /give you 'count' of a given block.");
}