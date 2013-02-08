var items = require('../items'),
    chatCommands = require('./chatCommands');
;

module.exports.inject = inject;

function inject(bot) {

    function giveItems(username, item, count) {
        if (count == null || isNaN(count)) {
            count = 1;
        }

        count = Math.min(count, item.stackSize * 4);

        while (true) {
            if (count < item.stackSize) {
                bot.chat('/give ' + username + ' ' + item.id + ' ' + count);
                break;
            }
            bot.chat('/give ' + username + ' ' + item.id + ' ' + item.stackSize);
            count = count - item.stackSize;
        }
    }


    chatCommands.registerCommand('gimme', function gimme(username, args, responderFunc) {
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
    }, 1, Infinity);
}