var chatCommands = require('./chatCommands')
  , mineflayer = require('mineflayer')
  , vec3 = require("vec3")
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
  var stopped = true;

  chatCommands.registerCommand('strip', strip, 0, 0);
  chatCommands.registerCommand('strip.stop', stop, 0, 0);
  chatCommands.registerCommand('stop', stop, 0, 0);

  chatCommands.addCommandHelp('strip', "'strip' - Start strip mining whatever chunk the bot is in");
  chatCommands.addCommandHelp('strip.stop', "'strip.stop' - stop strip mining. you can also just say 'stop'");

  function strip(username, args, respondFn) {
    respond = respondFn;
    if (stopped) {
      stopped = false;
      it = new Iterator(bot.entity.position);
      breakAllInRange();
    } else {
      respond("Already strip mining.");
    }
  }

  function stop(username, args, respondFn) {
    respond = respondFn;
    if (!stopped) {
      bot.scaffold.stop();
      stopped = true;
      respond("stopping strip mining operation");
    }
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
      stopped = true;
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
      stopped = true;
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
    if (stopped) return;
    if (err) {
      if (err.code === 'EDIGINTERRUPT') {
        process.nextTick(breakAllInRange);
      } else {
        respond("Error breaking block.");
        console.error(err.stack);
        stopped = true;
      }
      return;
    }
    var cursor = vec3();
    var pos = bot.entity.position.floored();
    for(cursor.x = pos.x - 6; cursor.x < pos.x + 6; cursor.x += 1) {
      for(cursor.y = pos.y + 5; cursor.y >= pos.y; cursor.y -= 1) {
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
      stopped = true;
      return;
    }
    // find the key point with the lowest Y that allows us to break the block
    var keyPtIt = new KeyPointIterator(targetBlock.position);
    while(keyPtIt.value.distanceTo(targetBlock.position) > 5) {
      keyPtIt.next();
    }
    // get to the key point
    bot.scaffold.to(keyPtIt.value, { navigateTimeout: 50 }, function(err) {
      if (err) {
        if (err.code === 'death') {
          respond("I died. Pausing stripmining operation.");
          stopped = true;
        } else if (err.code === 'danger') {
          breakAllInRange();
        } else if (err.code === 'errorDigging') {
          breakAllInRange();
        } else if (err.code === 'errorEquipping') {
          breakAllInRange();
        } else if (err.code === 'itemRequired') {
          if (err.data.type === 'tool') {
            respond("I lack the tool to break " + err.data.targetBlock.displayName);
          } else if (err.data.type === 'scaffolding') {
            respond("I lack scaffolding materials.");
          }
          stopped = true;
        }
      } else {
        breakAllInRange();
      }
    });
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
