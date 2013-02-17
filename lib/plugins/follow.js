module.exports = {
    inject: inject,
};

function inject(bot) {
    var chatCommands = require('./chatCommands');
    var players = require('./players');
    var vec3 = require('mineflayer').vec3;
    var commanderRespondFunc; // RespondFunc for user who issued the command
    var targetEntity; // Target entity to follow
    var timeoutId;

    module.exports.followEntity = followEntity;

    function moveToTarget() {
        if (targetEntity == null) return;

        var path = bot.navigate.findPathSync(targetEntity.position, {
            timeout: 1 * 1000,
            endRadius: 4,
        });
        bot.navigate.walk(path.path, function() {
            if (targetEntity != null) {
                bot.lookAt(targetEntity.position.plus(vec3(0, 1.62, 0)));
            }
        });

        timeoutId = setTimeout(moveToTarget, 2 * 1000);
    }

    function stopFollow() {
        if (targetEntity == null) return;
        commanderRespondFunc = null;
        targetEntity = null;
        clearTimeout(timeoutId);
        bot.navigate.stop('interrupted');
    }

    function followEntity(entity, responderFunc) {
        if (entity == null) return false;

        if (targetEntity != null) {
            if (commanderRespondFunc.username === targetEntity.username) {
                commanderRespondFunc("I'm no longer following you.");
            } else {
                commanderRespondFunc("I'm no longer following " + targetEntity.username + '.');
                if (commanderRespondFunc.chatType !== 'chat' || bot.quietMode) {
                    bot.whisper(targetEntity.username, "I'm no longer following you.");
                }
            }
            stopFollow();
        }

        commanderRespondFunc = responderFunc;
        targetEntity = entity;
        timeoutId = setTimeout(moveToTarget, 0);
        return true;
    }

    bot.on('entityGone', function onGone(entity) {
        if (targetEntity == null) return;
        if (entity != targetEntity) return;

        if (commanderRespondFunc.username === entity.username) {
            commanderRespondFunc('You moved out of range, no longer following you.');
        } else {
            commanderRespondFunc(entity.username + ' moved out of range, no longer following them.');
            if (commanderRespondFunc.chatType !== 'chat' || bot.quietMode) {
                bot.whisper(entity.username, 'You moved out of range, no longer following you.');
            }
        }

        stopFollow();
    });

    bot.on('end', stopFollow);

    chatCommands.registerCommand('follow', function(username, args, responderFunc) {
        var entity;
        if (args.length && args[0].toLowerCase() !== 'me') {
            var player = players.lookupPlayerName(args[0]);
            if (player == null) {
                return responderFunc("I don't know any players named " + username + '.');
            }
            entity = player.entity;
            if (entity == null) {
                return responderFunc("I can't see " + player.username + '.');
            }
        } else {
            entity = bot.players[username].entity;
            if (entity == null) {
                return responderFunc("I can't see you, " + username + '.');
            }
        }
        responderFunc('Now following ' + entity.username + '.');
        if (responderFunc.username !== entity.username && (responderFunc.chatType !== 'chat' || bot.quietMode)) {
            bot.whisper(entity.username, "I'm now following you, " + entity.username + '.');
        }
        followEntity(entity, responderFunc);
    }, 0, 1);
    chatCommands.addCommandHelp('follow', "'follow [username]' - Start following a player.");

    chatCommands.registerCommand('follow.stop', function(username, args, responderFunc) {
        if (targetEntity == null) return;
        if (commanderRespondFunc.username === targetEntity.username) {
            commanderRespondFunc("I'm no longer following you.");
        } else {
            commanderRespondFunc("I'm no longer following " + targetEntity.username + '.');
            if (commanderRespondFunc.chatType !== 'chat' || bot.quietMode) {
                bot.whisper(targetEntity.username, "I'm no longer following you.");
            }
        }
        if (commanderRespondFunc.username !== username && username !== targetEntity.username) {
            responderFunc("I'm no longer following " + targetEntity.username + '.');
        }
        stopFollow();
    }, 0, 0);
    chatCommands.addCommandHelp('follow.stop', "'follow.stop' - Stop following players.");
}