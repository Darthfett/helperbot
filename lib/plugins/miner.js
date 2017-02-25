var chatCommands = require('./chatCommands')
  , mineflayer = require('mineflayer')
  , vec3 = require("vec3");

exports.inject = inject;

function inject(bot) {
  var items = require('../items')(bot);
  
  var targetBlockTypes = [];
  var respond = defaultRespond;

  chatCommands.registerCommand('mine', chatCmd(mine), 1, Infinity);
  chatCommands.registerCommand('mine.stop', chatCmd(stop), 0, 0);
  chatCommands.registerCommand('mine.status', chatCmd(tellStatus), 0, 0);
  chatCommands.registerCommand('mine.resume', chatCmd(resume), 0, 0);
  chatCommands.registerCommand('mine.pause', chatCmd(pause), 0, 0);

  chatCommands.addCommandHelp('mine', "'mine block name' - Start mining 'block name'. You can add multiple target blocks.");
  chatCommands.addCommandHelp('mine.stop', "'mine.stop' - Stop mining.");
  chatCommands.addCommandHelp('mine.status', "'mine.status' - Display information about the current mining job.");
  chatCommands.addCommandHelp('mine.resume', "'mine.resume' - Resume mining after an interruption.");

  function scaffoldListen() {
    bot.scaffold.on('changeState', onScaffoldChangeState);
  }

  function scaffoldStopListen() {
    bot.scaffold.removeListener('changeState', onScaffoldChangeState);
  }

  function onScaffoldChangeState(oldState, newState, reason, data) {
    if (newState === 'off') {
      if (reason === 'death') {
        respond("I died. Pausing mining operation.");
      } else if (reason === 'success') {
        findBlockAndWalk();
      } else if (reason === 'errorDigging') {
        respond("Error digging.");
      } else if (reason === 'errorEquipping') {
        respond("Error equipping.");
      } else if (reason === 'itemRequired') {
        if (data.type === 'tool') {
          respond("I lack the tool to break " + data.targetBlock.displayName);
        } else if (data.type === 'scaffolding') {
          respond("I lack scaffolding materials.");
        }
      }
    }
  }

  function chatCmd(fn) {
    return function(username, args, respondFn) {
      respond = respondFn;
      fn(username, args);
    };
  }

  function stop(username, args) {
    targetBlockTypes = [];
    pause();
  }

  function pause() {
    scaffoldStopListen();
    bot.scaffold.stop();
  }

  function mine(username, args) {
    var blockName = args.join(' ');
    var blockTypes = items.lookupBlockName(blockName);

    if (!blockTypes.length) {
      respond("Unknown block: " + blockName);
      return;
    }

    var blockType = blockTypes[0];
    if (targetBlockTypes.indexOf(blockType) === -1) {
      targetBlockTypes.push(blockType);
    }

    scaffoldListen();
    findBlockAndWalk();
    tellStatus();
  }

  function resume() {
    scaffoldListen();
    bot.scaffold.resume();
  }

  function tellStatus() {
    var strBlocks = targetBlockTypes.map(function(block) {
      return block.displayName;
    }).join(', ') || "(none)";
    respond("State: " + bot.scaffold.state + ", blocks: " + strBlocks);
  }

  function findBlockAndWalk() {
    var blockPoints = bot.findBlockSync({
        point: bot.entity.position,
        matching: targetBlockTypes.map(function(b) { return b.id; }),
        maxDistance: 64,
    });

    if (!blockPoints.length) {
      respond("No blocks to mine found.");
      return;
    }

    var targetPoint = blockPoints[0].position.floored();

    bot.scaffold.to(targetPoint);
  }
}

function itemStr(item) {
  if (item) {
    return item.name + " x " + item.count;
  } else {
    return "(nothing)";
  }
}

function defaultRespond(msg) {
  console.log("chat:", msg);
}
