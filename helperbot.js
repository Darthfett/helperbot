var mf = require('mineflayer'),
    fs = require('fs'),
    path = require('path'),
    optimist = require('optimist'),
    prompt = require('prompt'),
    requireIndex = require('requireindex'),
    string = require('./lib/string');

// Parse command line options:
var default_opts = {
    login: false,
};
var aliases = {
    'l': 'login',
    'p': 'port',
};

var argv = optimist
    .alias(aliases)
    .default(default_opts)
    .boolean('l')
    .argv;

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
    if (!argv.email) {
        required_fields.push('email');
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
                description: required_fields[i].capitalize() + ':',
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
            argv.email = result.email || argv.email;
            argv.password = result.password || argv.password;

            console.log(argv);

        });
    }
} else {
    // Set default credential options

    // default email and password are unnecessary (defaults to offline mode), so we just need a default username
    if (typeof(argv.username) === 'undefined') {
        argv.username = 'helperbot';
    }
}

var bot = mf.createBot(argv);

var plugins = requireIndex(path.join(__dirname, 'lib', 'plugins'));

for (plugin in plugins) {
    plugins[plugin].inject(bot);
}