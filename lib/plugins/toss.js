var chatCommands = require('./chatCommands'),
    items = require('../items'),
    mf = require('mineflayer');

exports.inject = inject;

function inject(bot) {
  chatCommands.registerCommand('toss', toss, 0, Infinity);
  chatCommands.addCommandHelp('toss', "'toss [player] [count] [item name]' - Toss 'player' 'count' items that match 'item name'.");

  chatCommands.registerCommand('list', list, 0, 0);
  chatCommands.addCommandHelp('list', "'list' - List the bot's inventory.");

  function toss(username, args, responderFunc) {
    if (args.length && args[0].toLowerCase() == 'me') {
        args.shift();
        var targetPlayer = bot.players[username];
    } else if (args.length) {
        for (var playerName in bot.players) {
            if (playerName.toLowerCase() == args[0]) {
                args.shift();
                targetPlayer = bot.players[playerName];
                break;
            }
        }
    }

    if (targetPlayer != null && targetPlayer.entity == null) return responderFunc("I can't see you, " + username + ".");

    if (args.length) {
        var count = parseInt(args[0]);
        if (!isNaN(count)) {
          args.shift();
        } else {
          count = Infinity;
        }
    }

    var itemName = args.join(' ');
    var predicate;
    if (!itemName.length) {
      predicate = function(item) { return item != null; };
    } else {
        var matching = items.lookupItemName(itemName);
        var matching_set = {};
        for (var i = 0; i < matching.length; i++) {
            matching_set[matching[i].id] = true;
        }
        predicate = function(item) {
          return item == null ? false : matching_set[item.type];
        }
    }

    responderFunc('Going to toss ' + (targetPlayer != null ? targetPlayer.entity.username : '') + (isFinite(count) ? (' ' + count + ' ') : ' all ') + (itemName.length ? matching.map(function(item) { return item.displayName; }).join(', ') : 'items'));

    if (targetPlayer != null) {
        bot.lookAt(targetPlayer.entity.position.plus(mf.vec3(0, 1, 0)));
    }
    var item = null;
    (function tossItems(err) {
        var inventory = bot.inventory.items();
        if (err) return responderFunc("Problem tossing " + itemStr(item));
        if (count <= 0) return;

        for (var i = 0; i < inventory.length; i++) {
            item = inventory[i];
            if (predicate(item)) {
                responderFunc('Tossing ' + itemStr(item));
                count -= item.count;
                bot.tossStack(item, tossItems);
                return;
            }
        }
    })(null);

  }

  function list(user, args, responderFunc) {
    var inventory = bot.inventory.items();

    var counter = {};
    for (var i = 0; i < inventory.length; i++) {
        if (counter[inventory[i].type] != null) {
            counter[inventory[i].type].count += inventory[i].count;
        } else {
            counter[inventory[i].type] = inventory[i];
        }
    }
    inventory = [];
    for (var id in counter) {
        inventory.push(counter[id]);
    }
    if (inventory.length) {
        responderFunc(inventory.map(itemStr).join(', '));
    } else {
        responderFunc('My inventory is empty.');
    }
  }
}

function itemStr(item) {
  if (item) {
    return (item.displayName ? item.displayName : item.name) + " x " + item.count;
  } else {
    return "(nothing)";
  }
}
