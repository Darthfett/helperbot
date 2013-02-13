var chatCommands = require('./chatCommands')
  , mineflayer = require('mineflayer')
  , vec3 = mineflayer.vec3
  , Location = mineflayer.Location
  , assert = require('assert');

exports.inject = inject;

function inject(bot) {
  var it = null;
  var respond = noop;

  chatCommands.registerCommand('strip', strip, 0, 0);
  chatCommands.registerCommand('strip.stop', stop, 0, 0);

  chatCommands.addCommandHelp('strip', "'strip' - Start strip mining whatever chunk the bot is in");
  chatCommands.addCommandHelp('strip.stop', "'strip.stop' - Stop strip mining.");

  function strip(username, args, respondFn) {
    respond = respondFn;
    it = new Iterator(bot.entity.position);
    scaffoldListen();
    scaffoldToNext();
  }

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
        breakAndMoveOn();
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
      } else {
        console.error("unknown scaffold stop reason:", reason);
      }
    }
  }

  function breakAndMoveOn() {
    // if the block we're in is breakable, break it
    var block = bot.blockAt(it.value);
    if (bot.canDigBlock(block)) {
      bot.dig(block, function(err) {
        if (err) {
          respond("Error digging.");
        } else {
          scaffoldToNext();
        }
      });
    } else {
      scaffoldToNext();
    }
  }

  function stop(username, args, respondFn) {
    respond = respondFn;
    scaffoldStopListen();
    bot.scaffold.stop();
    respond("stopping");
  }

  function scaffoldToNext() {
    while (it.value) {
      var block = bot.blockAt(it.value);
      if (block && block.diggable) {
        bot.scaffold.to(block.position, {navigateTimeout: 50});
        return;
      }
      it.next();
    }
    respond("done");
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
