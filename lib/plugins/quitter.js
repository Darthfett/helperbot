var chatCommands = require('./chatCommands');

module.exports.inject = inject;

function inject(bot) {
  chatCommands.registerCommand('quit', bot.quit, 0, 0);
  chatCommands.addCommandHelp('quit', "'quit' - Make the bot leave the server.");
}