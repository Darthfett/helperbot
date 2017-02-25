var chatCommands = require('./chatCommands'),
    players = require('./players'),
    mf = require('mineflayer'),
    vec3 = require('vec3');

exports.inject = inject;

function inject(bot) {
  var items = require('../items')(bot);
  
  chatCommands.registerCommand('toss', toss, 0, Infinity);
  chatCommands.addCommandHelp('toss', "'toss [player] [count] [item name]' - Toss 'player' 'count' items that match 'item name'.");

  function toss(username, args, responderFunc) {
    var targetPlayer;
    if (args.length && args[0].toLowerCase() == 'me') {
        args.shift();
        targetPlayer = bot.players[username];
    } else {
        if (args.length) {
            targetPlayer = players.lookupPlayerName(args[0]);
        }
        if (targetPlayer == null) {
            // Try to default to commanding player
            if (bot.players[username].entity != null) {
                targetPlayer = bot.players[username];
            }
        } else {
            args.shift();
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

    var itemName = args.join(' ').toLowerCase();
    var predicate;
    if (!itemName.length) {
      predicate = function(item) { return item != null; };
    } else if (itemName === '*' || itemName === 'everything' || itemName === 'all') {
      predicate = function(item) { return item != null; };
      itemName = '';
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

    responderFunc('Going to toss ' + (targetPlayer != null ? targetPlayer.entity.username + ' ' : '') + (isFinite(count) ? (count + ' ') : 'all ') + (itemName.length ? matching.map(function(item) { return item.displayName; }).join(', ') : 'items'));

    if (targetPlayer != null) {
        bot.lookAt(targetPlayer.entity.position.plus(vec3(0, 1.62 + .5, 0)), true);
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
}

function itemStr(item) {
  if (item) {
    return (item.displayName ? item.displayName : item.name) + " x " + item.count;
  } else {
    return "(nothing)";
  }
}
