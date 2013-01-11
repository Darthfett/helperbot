module.exports.inject = inject;

function inject(bot) {

  bot.on('chat', function(username, message) {
    if (message.toLowerCase() === 'quit') {
      bot.quit();
    }
  });

}