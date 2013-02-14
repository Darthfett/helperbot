var chatCommands = require('./chatCommands'),
    extend = require('../extend');

exports.inject = inject;

function itemStr(item) {
  if (item) {
    return (item.displayName ? item.displayName : item.name) + " x " + item.count;
  } else {
    return "(nothing)";
  }
}

function inject(bot) {
    chatCommands.registerCommand('list', list, 0, 0);
    chatCommands.addCommandHelp('list', "'list' - List the bot's inventory.");

    function list(user, args, responderFunc) {
        var inventory = bot.inventory.items();
        var freeSlots = 36 - inventory.length;

        var counter = {};
        for (var i = 0; i < inventory.length; i++) {
            if (counter[inventory[i].type] != null) {
                counter[inventory[i].type].count += inventory[i].count;
            } else {
                counter[inventory[i].type] = extend({}, inventory[i]);
            }
        }
        inventory = [];
        for (var id in counter) {
            inventory.push(counter[id]);
        }
        responderFunc(inventory.map(itemStr).join(', ') + (inventory.length ? ', ' : '') + freeSlots + ' free slots.');
    }
}