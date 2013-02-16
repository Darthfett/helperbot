var chatCommands = require('./chatCommands')
  , mineflayer = require('mineflayer')
  , vec3 = mineflayer.vec3
  , Location = mineflayer.Location
  , materials = mineflayer.materials
  , assert = require('assert');

exports.inject = inject;

var sideVecs = [
  vec3(-1,  0,  0),
  vec3( 1,  0,  0),
  vec3( 0, -1,  0),
  vec3( 0,  1,  0),
  vec3( 0,  0, -1),
  vec3( 0,  0,  1),
];

// block types allowed to be used as scaffolding
var scaffoldBlockTypes = {
  3:  true, // dirt
  4:  true, // cobblestone
  87: true, // netherrack
};

var liquidBlockTypes = {
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
  var it = null;
  var respond = noop;
  var expectedScaffoldEvents = 0;

  chatCommands.registerCommand('strip', strip, 0, 0);
  chatCommands.registerCommand('strip.stop', stop, 0, 0);

  chatCommands.addCommandHelp('strip', "'strip' - Start strip mining whatever chunk the bot is in");
  chatCommands.addCommandHelp('strip.stop', "'strip.stop' - Stop strip mining.");

  function strip(username, args, respondFn) {
    respond = respondFn;
    it = new Iterator(bot.entity.position);
    scaffoldListen();
    breakAllInRange();
  }

  function scaffoldListen() {
    bot.scaffold.on('changeState', onScaffoldChangeState);
  }

  function scaffoldStopListen() {
    bot.scaffold.removeListener('changeState', onScaffoldChangeState);
  }

  function onScaffoldChangeState(oldState, newState, reason, data) {
    if (newState === 'off') {
      scaffoldStopListen();
      assert.strictEqual(expectedScaffoldEvents, 1, "unexpected scaffold event");
      expectedScaffoldEvents -= 1;
      if (reason === 'death') {
        respond("I died. Pausing mining operation.");
      } else if (reason === 'success') {
        breakAllInRange();
      } else if (reason === 'errorDigging') {
        respond("Error digging.");
        console.error(data.stack);
      } else if (reason === 'errorEquipping') {
        respond("Error equipping.");
        console.error(data.stack);
      } else if (reason === 'itemRequired') {
        if (data.type === 'tool') {
          respond("I lack the tool to break " + data.targetBlock.displayName);
        } else if (data.type === 'scaffolding') {
          respond("I lack scaffolding materials.");
        }
      } else {
        console.error("unknown scaffold stop reason:", reason);
      }
    }
  }

  function stop(username, args, respondFn) {
    respond = respondFn;
    scaffoldStopListen();
    bot.scaffold.stop();
    respond("stopping");
  }

  function placeBlock(targetBlock, face, cb) {
    equipBuildingBlock(function(err) {
      if (err) {
        cb(err);
      } else {
        bot.placeBlock(targetBlock, face);
        cb();
      }
    });
  }

  function equipBuildingBlock(cb) {
    // return true if we're already good to go
    if (bot.heldItem && scaffoldBlockTypes[bot.heldItem.type]) return cb();
    var scaffoldingItems = bot.inventory.items().filter(function(item) {
      return scaffoldBlockTypes[item.type];
    });
    var item = scaffoldingItems[0];
    if (!item) {
      respond("I lack scaffolding materials.");
      return;
    }
    bot.equip(item, 'hand', cb);
  }

  function breakBlock(targetBlock, cb) {
    if (bot.game.gameMode === 'creative') {
      bot.dig(targetBlock, cb);
      return;
    }
    // before breaking, plug up any lava or water
    var liquidBlockAndVecs = sideVecs.map(function(sideVec) {
      return {
        block: bot.blockAt(targetBlock.position.plus(sideVec)),
        sideVec: sideVec,
      };
    }).filter(function(sideBlockAndVec) {
      return liquidBlockTypes[sideBlockAndVec.block.type];
    });
    placeOne();

    function placeOne(err) {
      if (err) return cb(err);
      var liquidBlockAndVec = liquidBlockAndVecs.shift();
      if (liquidBlockAndVec == null) {
        equipToolToBreak(targetBlock, function(err) {
          if (err) return cb(err);
          bot.dig(targetBlock, cb);
        });
      } else {
        placeBlock(targetBlock, liquidBlockAndVec.sideVec, placeOne);
      }
    }
  }

  function canHarvest(block) {
    var okTools = block.harvestTools;
    if (!okTools) return true;
    if (bot.heldItem && okTools[bot.heldItem.type]) return true;
    // see if we have the tool necessary in inventory
    var tools = bot.inventory.items().filter(function(item) {
      return okTools[item.type];
    });
    var tool = tools[0];
    return !!tool;
  }

  function equipToolToBreak(blockToBreak, cb) {
    if (! canHarvest(blockToBreak)) {
      respond("I lack a tool to break " + blockToBreak.displayName);
      return;
    }
    // equip the most efficient tool that we have
    var material = blockToBreak.material;
    if (! material) return cb();
    var toolMultipliers = materials[material];
    assert.ok(toolMultipliers);
    var tools = bot.inventory.items().filter(function(item) {
      return toolMultipliers[item.type] != null;
    });
    tools.sort(function(a, b) {
      return toolMultipliers[b.type] - toolMultipliers[a.type];
    });
    var tool = tools[0];
    if (!tool) return cb();
    if (bot.heldItem && bot.heldItem.type === tool.type) return cb();
    bot.equip(tool, 'hand', cb);
  }

  function breakAllInRange(err) {
    if (err) {
      if (err.code === 'EDIGINTERRUPT') {
        console.error("dig interruption");
        process.nextTick(breakAllInRange);
      } else {
        respond("Error breaking block.");
        console.error(err.stack);
      }
      return;
    }
    var cursor = vec3();
    var pos = bot.entity.position.floored();
    for(cursor.x = pos.x - 6; cursor.x < pos.x + 6; cursor.x += 1) {
      for(cursor.y = pos.y; cursor.y < pos.y + 6; cursor.y += 1) {
        for(cursor.z = pos.z - 6; cursor.z < pos.z + 6; cursor.z += 1) {
          // make sure it's in the strip mine
          if (cursor.x < it.start.x || cursor.x >= it.start.x + 16 ||
              cursor.z < it.start.z || cursor.z >= it.start.z + 16)
          {
            continue;
          }
          var block = bot.blockAt(cursor);
          if (bot.canDigBlock(block)) {
            breakBlock(block, breakAllInRange);
            return;
          }
        }
      }
    }
    scaffoldToNext();
  }

  function scaffoldToNext() {
    var targetBlock = null;
    while (it.value) {
      var block = bot.blockAt(it.value);
      if (block && block.diggable) {
        targetBlock = block;
        break;
      }
      it.next();
    }
    if (!targetBlock) {
      respond("done.");
      return;
    }
    // find the key point with the lowest Y that allows us to break the block
    var keyPtIt = new KeyPointIterator(targetBlock.position);
    while(keyPtIt.value.distanceTo(targetBlock.position) > 5) {
      keyPtIt.next();
    }
    // get to the key point
    expectedScaffoldEvents += 1;
    bot.scaffold.to(keyPtIt.value);
  }
}

function noop() {}

function Iterator(pos) {
  var loc = new Location(pos);
  this.start = vec3(loc.chunkCorner.x, 255, loc.chunkCorner.z);
  this.end = vec3(this.start.x + 16, 0, this.start.z + 16);
  this.value = this.start.clone();
}

Iterator.prototype.next = function() {
  this.value.x += 1;
  if (this.value.x < this.end.x) return;
  this.value.x = this.start.x;
  this.value.z += 1;
  if (this.value.z < this.end.z) return;
  this.value.z = this.start.z;
  this.value.y -= 1;
  if (this.value.y >= 0) return;
  this.value = null;
};

var kpd = 3; // key point delta

function KeyPointIterator(pos) {
  this.chunkCorner = (new Location(pos)).chunkCorner.offset(0, -16, 0);
  this.offset = vec3(kpd, kpd, kpd);
  this.computeValue();
}

KeyPointIterator.prototype.computeValue = function() {
  this.value = this.chunkCorner.plus(this.offset);
};

KeyPointIterator.prototype.next = function() {
  this.offset.x += kpd;
  if (this.offset.x >= 16) {
    this.offset.x = kpd;
    this.offset.z += kpd;
    if (this.offset.z >= 16) {
      this.offset.z = kpd;
      this.offset.y += kpd;
      assert.ok(this.offset.y < 32);
    }
  }
  this.computeValue();
};
