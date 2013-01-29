var items = require('../items')
;

module.exports.inject = inject;

function inject(bot) {

    bot.on('chat', function gimme(username, message) {
        if (username === bot.username) {
            return;
        }
        if (message.slice(0, 'gimme'.length) === 'gimme') {
            var args = message.split(' ').slice(1);
            var count = parseInt(args[0]);
            if (!isNaN(count)) {
                args = args.slice(1);
            }

            var item_matches = items.lookupItemName(args.join(' '));
            if (item_matches.length) {
                var item = item_matches[0];
                if (isNaN(count)) {
                    bot.chat('/give ' + username + ' ' + item.id);
                } else {
                    bot.chat('/give ' + username + ' ' + count + ' ' + item.id);
                }
            } else {
                item_matches = items.lookupItemName(args.join(' '), true);
                if (!item_matches.length) {
                    bot.chat('No items match name "' + args.join(' ') + '"');
                } else {
                    if (item_matches.length > 6) {
                        var matches = item_matches.slice(0, 6);
                        bot.chat("Ambiguous: " + matches.mapped(function(match) { return match.displayName; }).join(', ') + ', ...');
                    } else {
                        bot.chat("Ambiguous: " + matches.mapped(function(match) { return match.displayName; }).join(', '));
                    }
                }
            }
        }
    });
}