var chatCommands = require('./chatCommands');
var players = require('./players');
var vec3 = require('vec3');

exports.inject = inject;

function inject(bot) {
    chatCommands.registerCommand('tunnel', tunnel, 1, 2);
    chatCommands.addCommandHelp('tunnel', "'tunnel [width] [height]' - Tunnel from the player to infinity.");

    function getTunnelDirection(yaw) {
        if (yaw < (Math.PI / 4) || yaw > (7 * Math.PI / 4)) {
            return vec3(1, 0, 0);
        } else if (yaw > (5 * Math.PI / 4)) {
            return vec3(0, 0, 1);
        } else if (yaw > (3 * Math.PI / 4)) {
            return vec3(-1, 0, 0);
        } else if (yaw >= (Math.PI / 4)) {
            return vec3(0, 0, -1);
        }
    }

    function TunnelIterator(center, direction, width, height) {
        this.center = center;
        this.direction = direction;
        this.width = width;
        this.height = height;
        this.lr = -width - 1;
        this.y = height - 1;
    }

    TunnelIterator.prototype.next = function() {
        this.lr++;
        if (this.lr > this.width) {
            this.y--;
            this.lr = -this.width;
        }
        if (this.y < 0) {
            this.center = this.center.plus(this.direction);
            this.y = this.height - 1;
            this.lr = -this.width;
        }

        return this.center.offset(this.direction.z * this.lr, this.y, this.direction.x * this.lr);
    }

    function getEntityFromUsername(username, responderFunc) {
        var player = players.lookupPlayerName(username);
        if (player == null) {
            responderFunc("I don't know any players named " + username + '.');
            return null;
        }
        var entity = player.entity;
        if (entity == null) {
            responderFunc("I can't see " + player.username + '.');
            return null;
        }
        return entity;
    }

    function tunnel(username, args, responderFunc) {
        width = Math.abs(parseInt(args[0], 10));
        if (width != args[0] || (width % 2) != 1) {
            responderFunc('Width must be an odd integer');
            return;
        }
        if (args.length === 2) {
            height = Math.min(2, args[1]);
        } else {
            height = 2;
        }
        
        var player_entity = getEntityFromUsername(username, responderFunc);

        if (player_entity == null) {
            return;
        }

        direction = getTunnelDirection(player_entity.yaw);
        
        iter = new TunnelIterator(player_entity.position, direction, width, height);
    }

}
