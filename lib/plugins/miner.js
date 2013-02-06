var chatCommands = require('./chatCommands')
  , items = require('../items')
  , blockFinder = require('./blockFinder')

exports.inject = inject;

function inject(bot) {
  var targetBlocks = [];
  var state = "off";
  var targetBlockIndex;
  var targetPoint;

  chatCommands.registerCommand('mine', mine, 1, Infinity);
  chatCommands.registerCommand('stop', stop, 0, 0);

  function stop() {
    state = 'stopping';
  }

  function mine(username, args) {
    var blockName = args.join(' ');
    var blockTypes = items.lookupBlockName(blockName);

    if (!blockTypes.length) {
      bot.chat("Unknown block: " + blockName);
      return;
    }

    var blockType = blockTypes[0];
    targetBlocks.push(blockType);

    tellStatus();

    if (state === 'off') state = 'start';
    checkState();
  }

  function tellStatus() {
    var strBlocks = targetBlocks.map(function(block) {
      return block.displayName;
    }).join(', ');
    bot.chat("Mining for " + strBlocks);
  }

  function checkState() {
    if (state === 'start') {
      targetBlockIndex = 0;
      findBlockAndWalk();
    } else if (state === 'stopping') {
      state = 'off';
      targetBlocks = [];
    } else if (state === 'off') {
      return;
    } else if (state === 'blockNotFound') {
      targetBlockIndex = (targetBlockIndex + 1) % targetBlocks.length;
      if (targetBlockIndex === 0) {
        // we wait for another user instruction before resuming
        return;
      } else {
        findBlockAndWalk();
      }
    } else if (state === 'walking') {
      // nothing to do but keep walking.
      return;
    } else if (state === 'doneWalking') {
      // in this state, we need to break blocks that are in the way,
      // or build bridge blocks to get to our destination.
      // start with Y
      improveYPosition();
    }
  }

  function findBlockAndWalk() {
    var blockType = targetBlocks[targetBlockIndex];
    var blockPoints = bot.findBlock(bot.entity.position, blockType, 32);

    if (!blockPoints.length) {
      bot.chat("No " + blockType.displayName + " found.");
      state = 'blockNotFound';
      setTimeout(checkState, 2000);
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
      if (state === 'walking') {
        state = 'doneWalking';
        checkState();
      }
    });
    state = 'walking';
  }

  function blah() {

    var foundBlock = bot.blockAt(blockPoints[0]);
    var startPos = playerEntity.position.floored();
    var endPos = foundBlock.position.floored()
    var distanceVec = endPos.minus(startPos).floored().abs();
    var distance = distanceVec.x + distanceVec.y + distanceVec.z;
    bot.lookAt(blockPoints[0]);
    bot.chat('The closest ' + foundBlock.displayName + ' is at ' + endPos + ', ' + distance + ' blocks away.');
  }
}

