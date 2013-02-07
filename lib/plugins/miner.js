var chatCommands = require('./chatCommands')
  , items = require('../items')
  , blockFinder = require('./blockFinder')
  , mineflayer = require('mineflayer')
  , vec3 = mineflayer.vec3

exports.inject = inject;

// block types allowed to be used as scaffolding
var scaffoldBlockTypes = [
  mineflayer.items[3], // dirt
  mineflayer.items[4], // cobblestone
  mineflayer.items[87], // netherrack
];

function inject(bot) {
  var targetBlockTypes = [];
  var state = "off";
  var targetPoint;
  var cleanups = [];

  chatCommands.registerCommand('mine', mine, 1, Infinity);
  chatCommands.registerCommand('stop', stop, 0, 0);
  chatCommands.registerCommand('status', tellStatus, 0, 0);
  chatCommands.registerCommand('resume', resume, 0, 0);

  function stop() {
    targetBlockTypes = [];
    changeState('off');
  }

  function mine(username, args) {
    var blockName = args.join(' ');
    var blockTypes = items.lookupBlockName(blockName);

    if (!blockTypes.length) {
      bot.chat("Unknown block: " + blockName);
      return;
    }

    var blockType = blockTypes[0];
    targetBlockTypes.push(blockType);

    tellStatus();
    resume();
  }

  function resume() {
    if (state === 'off' || state === 'walking') changeState('start');
  }

  function changeState(newState) {
    var oldState = state;
    state = newState;
    cleanups.forEach(function(fn) { fn(); });
    cleanups = [];
    console.info("changeState", oldState, "->", state);
    if (state === 'start') {
      findBlockAndWalk();
    } else if (state === 'off') {
      // we wait for another user instruction before resuming
      return;
    } else if (state === 'walking') {
      // nothing to do but keep walking.
      return;
    } else if (state === 'doneWalking') {
      // in this state, we need to break blocks that are in the way,
      // or build bridge blocks to get to our destination.
      improvePosition();
    } else if (state === 'increaseY') {
      increaseY();
    } else if (state === 'decreaseY') {
      decreaseY();
    } else if (state === 'increaseX') {
      increaseX();
    } else if (state === 'decreaseX') {
      decreaseX();
    } else if (state === 'increaseZ') {
      increaseZ();
    } else if (state === 'decreaseZ') {
      decreaseZ();
    }
  }

  function equipBuildingBlock() {
    var equippedItem = bot.inventory.slots[bot.inventory.selectedItem];
    // return true if we're already good to go
    if (scaffoldBlockTypes.indexOf(equippedItem.type) >= 0) return true;
    var theItem = null;
    bot.inventory.items().forEach(function(item) {
      if (scaffoldBlockTypes.indexOf(item.type) >= 0) theItem = item;
    });
    if (!theItem) {
      bot.chat("I lack scaffolding materials.");
      changeState('off');
      return false;
    }
    changeState('equipBuildingBlock');
    bot.equip(theItem, 'hand', function(err) {
      if (state !== 'equipBuildingBlock') return;
      if (err) {
        console.error("Error equipping: " + err.stack);
        bot.chat("Problem equipping " + itemStr(theItem));
        changeState('off');
      } else {
        changeState('doneWalking');
      }
    });
  }

  var picks = {
    257: true, // iron
    270: true, // wood
    274: true, // stone
    278: true, // diamond
    285: true, // gold
  };

  var shovels = {
    256: true, // iron
    269: true, // wood
    273: true, // stone
    277: true, // diamond
    284: true, // gold
  };

  var axes = {
    258: true, // iron
    271: true, // wood
    275: true, // stone
    279: true, // diamond
    286: true, // gold
  };

  var toolsForBlock = {
    1: picks, // stone
    2: shovels, // grass
    3: shovels, // dirt
    4: picks, // cobblestone
    5: axes, // wooden planks
  };

  function equipToolToBreakFloor() {
    var equippedItem = bot.inventory.slots[bot.inventory.selectedItem];
    // return true if we're already good to go
    var blockToBreak = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    var okTools = toolsForBlock[blockToBreak.type];
    if (!okTools) return true; // anything goes
    if (okTools[equippedItem.type]) return true;
    // see if we have the tool necessary in inventory
    var tools = bot.inventory.items().filter(function(item) {
      return okTools[item.type];
    });
    var tool = tools[0];
    if (!tool) {
      bot.chat("I lack a tool to break " + blockToBreak.displayName);
      changeState('off');
      return false;
    }
    changeState('equipTool');
    bot.equip(tool, 'hand', function(err) {
      if (state !== 'equipTool') return;
      if (err) {
        console.error("Error equipping: " + err.stack);
        bot.chat("Problem equipping " + itemStr(tool));
        changeState('off');
      } else {
        changeState('doneWalking');
      }
    });
  }

  function increaseZ() {
    if (Math.floor(bot.entity.position.y) === targetPoint.y) return changeState('start');
    if (! equipBuildingBlock()) return;
    // jump and build a block down below
    bot.setControlState('jump', true);
    var targetBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    var jumpY = bot.entity.position.y + 1;
    bot.on('move', placeIfHighEnough);
    changeState('jumping');
    cleanups.push(function() {
      bot.removeListener('move', placeIfHighEnough);
      bot.setControlState('jump', false);
    });
    function placeIfHighEnough() {
      if (bot.entity.position.y > jumpY) {
        bot.placeBlock(targetBlock, vec3(0, 1, 0));
        changeState('increaseZ');
      }
    }
  }

  function decreaseZ() {
    if (Math.floor(bot.entity.position.y) === targetPoint.y) return changeState('start');
    if (! equipToolToBreakFloor()) return;
    // dig the block below
    var targetBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    changeState('digging');
    bot.dig(targetBlock, Infinity, function(err) {
      if (state !== 'digging') return;
      if (err) {
        console.error("Error digging: " + err.stack);
        bot.chat("Problem digging down.");
        changeState('off');
      } else {
        changeState('decreaseZ');
      }
    });
  }

  function tellStatus() {
    var strBlocks = targetBlockTypes.map(function(block) {
      return block.displayName;
    }).join(', ') || "(none)";
    bot.chat("State: " + state + ", blocks: " + strBlocks);
  }

  function improvePosition() {
    // start with Y
    var flooredY = Math.floor(bot.entity.position.y);
    if (flooredY < targetPoint.y) return changeState('increaseY');
    if (flooredY > targetPoint.y) return changeState('decreaseY');
    // we're at the correct Y. Now X.
    var flooredX = Math.floor(bot.entity.position.x);
    if (flooredX < targetPoint.x) return changeState('increaseX');
    if (flooredX > targetPoint.x) return changeState('decreaseX');
    // we're at the correct Y and X. Now Z.
    var flooredZ = Math.floor(bot.entity.position.z);
    if (flooredZ < targetPoint.z) return changeState('increaseZ');
    if (flooredZ > targetPoint.z) return changeState('decreaseZ');
    // we are at the target point. mission accomplished.
    changeState('start');
  }

  function findBlockAndWalk() {
    var blockPoints = bot.findBlock(bot.entity.position, targetBlockTypes, 32);

    if (!blockPoints.length) {
      bot.chat("No blocks to mine found.");
      changeState('off');
      return;
    }

    targetPoint = blockPoints[0];

    // try to get within 5 blocks of the destination block
    var results = bot.navigate.findPathSync(targetPoint, {
      endRadius: 5,
      timeout: 3000,
    });

    // we don't even care if it worked. just get close and then re-evaluate.
    bot.navigate.walk(results.path, function() {
      if (state === 'walking') changeState('doneWalking');
    });
    changeState('walking');
    cleanups.push(function() {
      bot.navigate.stop();
    });
  }
}

function itemStr(item) {
  if (item) {
    return item.name + " x " + item.count;
  } else {
    return "(nothing)";
  }
}
