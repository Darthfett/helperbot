exports.inject = function(bot) {
    bot.on('login', function() {
        console.log('connected');
    });
};
