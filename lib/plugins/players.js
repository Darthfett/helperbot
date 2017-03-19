
module.exports.inject = function inject(bot) {

    module.exports.lookupPlayerName = lookupPlayerName;

    function lookupPlayerName(name) {
        for (var playerName in bot.players) {
            if (playerName.toLowerCase() == name.toLowerCase()) {
                return bot.players[playerName];
                break;
            }
        }
        return null;
    }
};