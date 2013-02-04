var assert = require('assert');
module.exports.inject = inject;

function inject(bot) {
    bot.on('chat', function(username, message) {
        if (username === bot.username) return;
        if (message.slice(0, 'in'.length) !== 'in') return;

        assert.ok(bot.players[username], "Player talks, but doesn't exist");

        var player = bot.players[username].entity;

        if (player == null) {
            bot.chat("You're too far away.");
            return;
        }

        var block = bot.blockAt(player.position);

        bot.chat("Block at your position: " + block.type + "(" + block.displayName + ")");
    });
}
