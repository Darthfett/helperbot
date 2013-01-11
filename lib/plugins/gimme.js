module.exports.inject = inject;

function inject(bot) {

    bot.on('chat', function gimme(username, message) {
        if (username === bot.username) {
            return;
        }

        if (message.slice(0, 'gimme'.length) === 'gimme') {
            args = message.split(' ').slice(1);
            count = parseInt(args[0]);
            if (!isNaN(count)) {
                args = args.slice(1);
            }

            item_matches = items.lookupItemName(args.join(' '));

            if (item_matches) {
                item = item_matches[0];
                if (isNaN(count)) {
                    bot.chat('/give ' + player + ' ' + item.id);
                } else {
                    bot.chat('/give ' + player + ' ' + count + ' ' + item.id);
                }
            } else {
                bot.chat('wat.');
                bot.chat('Go get it yourself.');
            }
        }
    });
}