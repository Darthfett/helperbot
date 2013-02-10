#!/usr/bin/env node
var mf = require('mineflayer'),
    fs = require('fs'),
    path = require('path'),
    optimist = require('optimist'),
    prompt = require('prompt'),
    requireIndex = require('requireindex');

// Parse command line options:
var default_opts = {
    login: false,
    masters: [],
};
var aliases = {
    'l': 'login',
    'p': 'port',
    'q': 'quiet'
};

var argv = optimist
    .alias(aliases)
    .default(default_opts)
    .boolean('l')
    .argv;

// Split masters by commas in order to get all masters
argv.masters = argv.masters.length ? argv.masters.split(',').map(function(master) { return master.toLowerCase(); }) : [];

// First unnamed argument is the host, second is the username
if (argv._.length === 0) {

} else if (argv._.length === 1) {
    argv.host = argv._[0];
} else if (argv._.length === 2) {
    argv.host = argv._[0];
    argv.username = argv._[1];
} else {
    argv.host = argv._[0];
    argv.username = argv._[1];
    console.log("Ignoring unknown options: " + argv.slice(2).join(', '));
}

if (argv.login) {
    // If login flag is set, prompt user for any missing credentials

    required_fields = [];
    if (!argv.username) {
        required_fields.push('username');
    }
    if (!argv.password) {
        required_fields.push('password');
    }
    if (required_fields) {

        prompt.override = argv;

        // prompt bug doesn't allow for falsy value options, work around this by changing the defaults
        prompt.message = '';
        prompt.delimiter = '';
        prompt.colors = false;

        prompt.start({
            allowEmpty: true,
        });

        var schema = { properties: {} };

        for (i = 0; i < required_fields.length; i++) {
            schema.properties[required_fields[i]] = {
                description: required_fields[i].charAt(0).toUpperCase() + required_fields[i].slice(1) + ':',
                pattern: /.*/,
                required: true,
            };
        }

        if (schema.properties.password) {
            schema.properties.password.hidden = true;
        }

        prompt.get(schema, function get_login(err, result) {
            if (err) throw err;
            argv.username = result.username || argv.username;
            argv.password = result.password || argv.password;

            // Connect
            init(argv);
        });
    }
} else {
    // Set default credential options

    // Default username, no password makes it default to offline mode.
    if (argv.username == null) {
        argv.username = 'helperbot';
    }

    // Connect
    init(argv);
}

function init(argv) {

    var bot = mf.createBot(argv);

    bot.masters = argv.masters;
    bot.quietMode = argv.quiet;

    require('mineflayer-navigate')(mf)(bot);
    require('mineflayer-blockfinder')(mf)(bot);

    bot.on('error', function(error) {
        console.error(error.stack);
    });

    var plugins = requireIndex(path.join(__dirname, 'lib', 'plugins'));

    for (plugin in plugins) {
        if (plugins[plugin].inject != null) {
            plugins[plugin].inject(bot);
        } else {
            console.log(plugin, 'has no inject function.');
        }
    }
}