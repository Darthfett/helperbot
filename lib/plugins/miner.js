var chatCommands = require('./chatCommands')
  , items = require('../items')
  , blockFinder = require('./blockFinder')
  , mineflayer = require('mineflayer')
  , vec3 = mineflayer.vec3

exports.inject = inject;

// block types allowed to be used as scaffolding
var scaffoldBlockTypes = {
  3:  true, // dirt
  4:  true, // cobblestone
  87: true, // netherrack
};

var picks = {
  285: true, // gold
  270: true, // wood
  274: true, // stone
  257: true, // iron
  278: true, // diamond
};

var picksIronUp = {
  257: true, // iron
  278: true, // diamond
};

var picksStoneUp = {
  274: true, // stone
  257: true, // iron
  278: true, // diamond
};

var picksDiamond = {
  278: true, // diamond
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
  1: picks,     // stone
  2: shovels,   // grass
  3: shovels,   // dirt
  4: picks,     // cobblestone
  5: axes,      // wooden planks
  12: shovels,  // sand
  13: shovels,  // gravel
  14: picksIronUp, // gold ore
  15: picksStoneUp, // iron ore
  16: picksStoneUp, // coal ore
  17: axes,     // wood
  21: picksIronUp, // lapis lazuli ore
  22: picksIronUp, // lapis lazuli block
  23: picks,    // dispenser
  24: picks,    // sandstone
  25: axes,     // note block
  29: picks,    // sticky piston
  33: picks,    // piston
  41: picksStoneUp, // block of gold
  42: picksStoneUp, // block of iron
  43: picks,    // stone slab
  44: picks,    // stone slab
  45: picks,    // bricks
  48: picks,    // moss stone
  49: picksDiamond, // obsidian
  53: axes,     // oak wood stairs
  54: axes,     // chest
  56: picksIronUp, // diamond ore
  57: picksIronUp, // diamond block
  58: axes,     // crafting table
  60: shovels,  // farmland
  61: picks,    // furnace
  62: picks,    // furnace
  64: axes,     // wooden door
  67: picks,    // stone stairs
  70: axes,     // wooden pressure plate
  71: picksStoneUp, // iron door
  72: picks,    // stone pressure plate
  73: picksIronUp, // redstone ore
  78: shovels,  // snow
  80: shovels,  // snow block
  81: axes,     // cactus
  87: picks,    // netherrack
  88: shovels,  // soul sand
  89: picks,    // glowstone
  97: picks,    // monster stone egg
  98: picks,    // stone brick
  101: picks,   // iron bars
  108: picks,   // brick stairs
  110: shovels, // mycelium
  112: picks,   // nether brick
  113: picks,   // nether brick fence
  114: picks,   // nether brick stairs
  116: picksDiamond, // enchantment table
  125: axes,    // wood slab
  126: axes,    // wood slab
  128: picks,   // sandstone stairs
  129: picksIronUp, // emerald ore
  130: picksDiamond, // ender chest
  133: picksIronUp, // block of emerald
  134: axes, // spruce wood stairs
  135: axes, // birch wood stairs
  136: axes, // jungle wood stairs
  139: picks, // cobble wall
  145: picksIronUp, // anvil
};

var sideVecs = [
  vec3(-1,  0,  0),
  vec3( 1,  0,  0),
  vec3( 0, -1,  0),
  vec3( 0,  1,  0),
  vec3( 0,  0, -1),
  vec3( 0,  0,  1),
];

var dangerBlockTypes = {
  8: true,  // water
  9: true,  // water
  10: true, // lava
  11: true, // lava
};

var fallingBlockTypes = {
  12: true, // sand
  13: true, // gravel
};

function inject(bot) {
  var targetBlockTypes = [];
  var state = "off";
  var targetPoint;
  var cleanups = [];

  var respond = defaultRespond;

  chatCommands.registerCommand('mine', chatCmd(mine), 1, Infinity);
  chatCommands.registerCommand('mine.stop', chatCmd(stop), 0, 0);
  chatCommands.registerCommand('mine.status', chatCmd(tellStatus), 0, 0);
  chatCommands.registerCommand('mine.resume', chatCmd(resume), 0, 0);

  chatCommands.addCommandHelp('mine', "'mine block name' - Start mining 'block name'. You can add multiple target blocks.");
  chatCommands.addCommandHelp('mine.stop', "'mine.stop' - Stop mining.");
  chatCommands.addCommandHelp('mine.status', "'mine.status' - Display information about the current mining job.");
  chatCommands.addCommandHelp('mine.resume', "'mine.resume' - Resume mining after an interruption.");

  bot.on('death', function() {
    changeState('off');
  });

  function chatCmd(fn) {
    return function(username, args, respondFn) {
      respond = respondFn;
      fn(username, args);
    };
  }

  function stop(username, args) {
    targetBlockTypes = [];
    changeState('off');
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

    resume();
    tellStatus();
  }

  function resume() {
    if (state === 'off' || state === 'walking') changeState('start');
  }

  function changeState(newState) {
    var oldState = state;
    state = newState;
    cleanups.forEach(function(fn) { fn(); });
    cleanups = [];
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

  function decreaseZ() {
    if (Math.floor(bot.entity.position.z) <= targetPoint.z) return changeState('start');
    moveInDirection(vec3(0, 0, -1));
  }

  function increaseZ() {
    if (Math.floor(bot.entity.position.z) >= targetPoint.z) return changeState('start');
    moveInDirection(vec3(0, 0, 1));
  }

  function decreaseX() {
    if (Math.floor(bot.entity.position.x) <= targetPoint.x) return changeState('start');
    moveInDirection(vec3(-1, 0, 0));
  }

  function increaseX() {
    if (Math.floor(bot.entity.position.x) >= targetPoint.x) return changeState('start');
    moveInDirection(vec3(1, 0, 0));
  }

  function moveInDirection(dir) {
    // if the 3 blocks are in place such that we can move into the new
    // location, do it.
    var newPos = bot.entity.position.plus(dir);
    var floor = bot.blockAt(newPos.offset(0, -1, 0));
    var lower = bot.blockAt(newPos.offset(0, 0, 0));
    var upper = bot.blockAt(newPos.offset(0, 1, 0));
    if (lower.boundingBox !== 'empty') {
      breakBlock(lower, state);
    } else if (upper.boundingBox !== 'empty') {
      breakBlock(upper, state);
    } else if (floor.boundingBox === 'empty') {
      if (! equipBuildingBlock()) return;
      var myFloor = bot.blockAt(bot.entity.position.offset(0, -1, 0));
      if (! placeBlock(myFloor, dir)) return;
      changeState('doneWalking');
    } else {
      bot.navigate.walk([newPos], function(stopReason) {
        if (state === 'walking') changeState('doneWalking');
      });
      changeState('walking');
      cleanups.push(function() {
        bot.navigate.stop();
        moveToBlockCenter();
      });
    }
  }

  function equipBuildingBlock() {
    // return true if we're already good to go
    if (bot.heldItem && scaffoldBlockTypes[bot.heldItem.type]) return true;
    var scaffoldingItems = bot.inventory.items().filter(function(item) {
      return scaffoldBlockTypes[item.type];
    });
    var item = scaffoldingItems[0];
    if (!item) {
      respond("I lack scaffolding materials.");
      changeState('off');
      return false;
    }
    changeState('equipBuildingBlock');
    bot.equip(scaffoldingItems[0], 'hand', function(err) {
      if (state !== 'equipBuildingBlock') return;
      if (err) {
        console.error("Error equipping: " + err.stack);
        respond("Problem equipping " + itemStr(item));
        changeState('off');
      } else {
        changeState('doneWalking');
      }
    });
  }

  function equipToolToBreak(blockToBreak) {
    // return true if we're already good to go
    var okTools = toolsForBlock[blockToBreak.type];
    if (!okTools) return true; // anything goes
    if (bot.heldItem && okTools[bot.heldItem.type]) return true;
    // see if we have the tool necessary in inventory
    var tools = bot.inventory.items().filter(function(item) {
      return okTools[item.type];
    });
    var tool = tools[0];
    if (!tool) {
      respond("I lack a tool to break " + blockToBreak.displayName);
      changeState('off');
      return false;
    }
    bot.equip(tool, 'hand', function(err) {
      if (state !== 'equipTool') return;
      if (err) {
        console.error("Error equipping: " + err.stack);
        respond("Problem equipping " + itemStr(tool));
        changeState('off');
      } else {
        changeState('doneWalking');
      }
    });
    changeState('equipTool');
  }

  function increaseY() {
    var groundBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    if (!bot.entity.onGround) {
      // we're falling. nothing to do except wait.
      setTimeout(function() {
        if (state === 'increaseY') changeState('doneWalking');
      }, 500);
      return;
    }
    if (Math.floor(bot.entity.position.y) >= targetPoint.y) return changeState('start');
    // check if the ceiling is clear to jump
    for (var y = 2; y <= 4; ++y) {
      var ceiling = bot.blockAt(bot.entity.position.offset(0, y, 0));
      if (ceiling.type !== 0) {
        breakBlock(ceiling, state);
        return;
      }
    }
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
        changeState('increaseY');
      }
    }
  }

  function breakBlock(targetBlock, newState) {
    // before breaking, plug up any lava or water
    var dangerBlockAndVecs = sideVecs.map(function(sideVec) {
      return {
        block: bot.blockAt(targetBlock.position.plus(sideVec)),
        sideVec: sideVec,
      };
    }).filter(function(sideBlockAndVec) {
      return dangerBlockTypes[sideBlockAndVec.block.type];
    });
    for (var i = 0; i < dangerBlockAndVecs.length; ++i) {
      if (! placeBlock(targetBlock, dangerBlockAndVecs[i].sideVec)) return;
    }
    var aboveBlock = bot.blockAt(targetBlock.position.offset(0, 1, 0));
    var fallDanger = !!fallingBlockTypes[aboveBlock.type];
    
    if (! bot.canDigBlock(targetBlock) || fallDanger) {
      // set a new target point to try a different angle
      targetPoint.set(targetPoint.x + fuzz(), targetPoint.y + fuzz(5), targetPoint.z + fuzz() );
      if (targetPoint.y < 10) targetPoint.y = 10;
      changeState('doneWalking');
      return;
    }
    if (! equipToolToBreak(targetBlock)) return;
    bot.dig(targetBlock, function(err) {
      if (state !== 'digging') return;
      if (err) {
        console.error("Error digging: " + err.stack);
        respond("Problem digging down.");
        changeState('off');
      } else {
        changeState(newState);
      }
    });
    changeState('digging');
  }

  function decreaseY() {
    if (Math.floor(bot.entity.position.y) <= targetPoint.y) return changeState('start');
    var groundBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    if (!bot.entity.onGround || groundBlock.boundingBox === 'empty') {
      // we're falling. nothing to do except wait.
      setTimeout(function() {
        if (state === 'decreaseY') changeState('doneWalking');
      }, 500);
      return;
    }
    if (! groundBlock.diggable) {
      // let's try improving Z or X first.
      improveX();
      return;
    }
    // make sure when we dig the block below, we won't fall.
    var nextGroundBlock = bot.blockAt(bot.entity.position.offset(0, -2, 0));
    if (nextGroundBlock.boundingBox !== 'block') {
      if (nextGroundBlock.type === 0) {
        if (! placeBlock(groundBlock, vec3(0, -1, 0))) return;
      } else {
        breakBlock(nextGroundBlock, "decreaseY");
        return;
      }
    }
    // dig the block below
    breakBlock(groundBlock, 'decreaseY');
  }

  function placeBlock(referenceBlock, dir) {
    if (! equipBuildingBlock()) return false;
    bot.placeBlock(referenceBlock, dir);
    return true;
  }

  function tellStatus() {
    var strBlocks = targetBlockTypes.map(function(block) {
      return block.displayName;
    }).join(', ') || "(none)";
    respond("State: " + state + ", blocks: " + strBlocks);
  }

  function improveX() {
    moveToBlockCenter();
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

  function improvePosition() {
    moveToBlockCenter();
    // start with Y
    var flooredY = Math.floor(bot.entity.position.y);
    if (flooredY < targetPoint.y) return changeState('increaseY');
    if (flooredY > targetPoint.y) return changeState('decreaseY');
    // we're at the correct Y. Now X.
    improveX();
  }

  function findBlockAndWalk() {
    var blockPoints = bot.findBlock(bot.entity.position, targetBlockTypes, 32);

    if (!blockPoints.length) {
      respond("No blocks to mine found.");
      changeState('off');
      return;
    }

    targetPoint = blockPoints[0].floored();

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
      moveToBlockCenter();
    });
  }

  function moveToBlockCenter() {
    bot.entity.velocity.set(0, bot.entity.velocity.y, 0);
    var centerPos = bot.entity.position.floored().offset(0.5, 0.5, 0.5);
    bot.entity.position.set(centerPos.x, bot.entity.position.y, centerPos.z);
  }
}

function itemStr(item) {
  if (item) {
    return item.name + " x " + item.count;
  } else {
    return "(nothing)";
  }
}

function fuzz(offset) {
  offset = offset || 0;
  return Math.floor(Math.random() * 10) - 5 + offset;
}

function defaultRespond(msg) {
  console.log("chat:", msg);
}
