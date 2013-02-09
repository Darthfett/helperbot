var chatCommands = require('./chatCommands')

exports.inject = inject;

function inject(bot) {
  chatCommands.registerCommand('toss', dump, 0, 0);
  chatCommands.addCommandHelp('toss', "'toss' - toss all your inventory.");

  chatCommands.registerCommand('list', list, 0, 0);
  chatCommands.addCommandHelp('list', "'list' - list all your inventory.");

  function dump(user, args, respond) {
    dumpOne();

    function dumpOne() {
      var firstItem = bot.inventory.items()[0];
      if (!firstItem) return;
      bot.tossStack(firstItem, function(err) {
        if (err) {
          respond("Problem tossing " + itemStr(firstItem));
        } else {
          dumpOne();
        }
      });
    }
  }

  function list(user, args, respond) {
    respond(bot.inventory.items().map(itemStr).join(', '));
  }
}

function itemStr(item) {
  if (item) {
    return item.name + " x " + item.count;
  } else {
    return "(nothing)";
  }
}
