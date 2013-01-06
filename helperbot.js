
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}



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

    if (message.startsWith("gimme")) {
        bot.chat("Go get it yourself.");
    }
});