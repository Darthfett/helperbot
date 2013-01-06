var mf = require('mineflayer');

var args = process.argv;

var username = "helperbot";

var bot = mf.createBot({
    username: username,
});

bot.on('chat', function gimme(player, message) {
    if (username == player) {
        return;
    }

    if (message.slice(0, "gimme".length) == "gimme") {
        bot.chat("Go get it yourself.");
    }
});