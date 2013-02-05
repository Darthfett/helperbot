exports.inject = function(bot) {
    bot.on('kicked', function(reason) {
        console.log('kicked:', reason);
    });
};
