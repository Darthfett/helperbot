var mf = require('mineflayer')
  , assert = require('assert')
  , EventEmitter = require('events').EventEmitter
  , blockdb = mf.blocks

module.exports.inject = inject;

var unit = [
  new mf.vec3(-1,  0,  0),
  new mf.vec3( 1,  0,  0),
  new mf.vec3( 0,  1,  0),
  new mf.vec3( 0, -1,  0),
  new mf.vec3( 0,  0,  1),
  new mf.vec3( 0,  0, -1),
];

var zeroed = [
  new mf.vec3(0, 1, 1),
  new mf.vec3(0, 1, 1),
  new mf.vec3(1, 0, 1),
  new mf.vec3(1, 0, 1),
  new mf.vec3(1, 1, 0),
  new mf.vec3(1, 1, 0),
];

var MAX_CPU_SPIN = 100;

function inject(bot) {
  bot.findBlockSync = findBlockSync;
  bot.findBlock = findBlock;
  bot.findBlockAsync2 = findBlockAsync2;

  function findBlockSync(options) {
    options = optionsWithDefaults(options);

    var it = new Iterator(options.point);
    var result = [];
    var block;
    
    while (result.length < options.count && it.apothem < options.maxApothem) {
      block = bot.blockAt(it.value);
      if (options.predicate(block)) result.push(block);
      it.next();
    }

    return result;
  }

  function findBlock(options, callback) {
    options = optionsWithDefaults(options);

    var it = new Iterator(options.point);
    var result = [];
    var lastTick = new Date();

    next();

    function next() {
      if (result.length >= options.count || it.apothem >= options.maxApothem) {
        callback(null, result);
        return;
      }
      var block = bot.blockAt(it.value);
      if (options.predicate(block)) result.push(block);
      it.next();
      var cpuSpinTime = new Date() - lastTick;
      if (cpuSpinTime > MAX_CPU_SPIN) {
        lastTick = new Date();
        process.nextTick(next);
      } else {
        next();
      }
    }
  }

  function findBlockAsync2(options) {
    // no count and apothem, manually cancel the job when you're done
    options = optionsWithDefaults(options);

    var it = new Iterator(options.point);
    var result = [];

    var job = new EventEmitter();
    var stopping = false;
    job.stop = stop;
    next();
    return job;

    function stop() {
      stopping = true;
    }

    function next() {
      if (stopping) return;
      var block = bot.blockAt(it.value);
      if (options.predicate(block)) job.emit('blockFound', block);
      it.next();
      process.nextTick(next);
    }
  }
}

function optionsWithDefaults(options) {
  assert.notEqual(options.matching, null);
  assert.notEqual(options.point, null);
  return {
    point: options.point,
    matching: options.matching,
    count: options.count == null ? 1 : options.count,
    maxApothem: options.maxApothem == null ? 64 : options.maxApothem,
    predicate: predicateFromMatching(options.matching),
  };
}

function Iterator(center) {
  this.center = center;
  this.pt = mf.vec3(0, 0, 0);
  this.apothem = 1;
  this.side = 0;
  this.computeMax();
  this.computeValue();
}

Iterator.prototype.next = function() {
  this.pt.z += 1;
  if (this.pt.z > this.max.z) {
    this.pt.z = 0;
    this.pt.y += 1;
    if (this.pt.y > this.max.y) {
      this.pt.y = 0;
      this.pt.x += 1;
      if (this.pt.x > this.max.x) {
        this.pt.x = 0;
        this.side += 1;
        if (this.side >= 6) {
          this.side = 0;
          this.apothem += 1;
        }
        this.computeMax();
      }
    }
  }
  this.computeValue();
};

Iterator.prototype.computeMax = function() {
  this.max = zeroed[this.side].scaled(2 * this.apothem);
  if (this.max.y > 127) {
    this.max.y = 127;
  } else if (this.max.y < 0) {
    this.max.y = 0;
  }
};

Iterator.prototype.computeValue = function() {
  var offset = this.pt.minus(this.max.scaled(0.5).floored()).plus(unit[this.side].scaled(this.apothem));
  this.value = this.center.plus(offset);
};

function createBlockTypeMatcher(blockType) {
  return function(block) {
    return blockType === block.type;
  };
}

function createBlockMapMatcher(blockTypeMap) {
  return function(block) {
    return block == null ? false : blockTypeMap[block.type];
  };
}

function predicateFromMatching(matching) {
  if (typeof(matching) === 'number') {
    return createBlockTypeMatcher(matching)
  } else if (typeof(matching) === 'function') {
    return matching;
  } else if (Array.isArray(matching)) {
    // Assuming array results from item.lookupItem
    var blockTypeMap = {};
    for (var i = 0; i < matching.length; i++) {
      blockTypeMap[matching[i].id] = true;
    }
    return createBlockMapMatcher(blockTypeMap);
  } else if (typeof(matching) === 'object') {
    return createBlockMapMatcher(matching);
  } else {
    // programmer error. crash loudly and proudly
    throw new Error("Block Finder: Unknown value for matching: " + matching);
  }
}
