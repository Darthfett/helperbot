# HelperBot

A Node.js Minecraft bot that helps you out by performing menial tasks.

## Current Project Status

Supports Minecraft 1.4.7

## Available In-game Commands

You can give a bot a command by talking in chat, or in whispered chat.
You can direct a specific bot in chat by speaking their name first, e.g. "helperbot, come".

 - **come** - Make the bot come to your current location.
 - **echo** message - Repeat the given 'message' into chat.
 - **find** block name - Make the bot find the coordinates of the nearest 'block name' block.
 - **give** username [count] block name - Make the bot /give 'username' 'count' of a given block.
 - **gimme** [count] block name - Make the bot /give you 'count' of a given block.
 - **help** command - Gives help on a given command.
 - **list** - List the bot's inventory.
 - **masters** [add/rm username] - Display the bot's list of masters, or add/remove a master.
 - **mine** block name - Start mining 'block name'. You can add multiple target blocks.
 - **mine.resume** - Resume mining after an interruption.
 - **mine.status** - Display information about the current mining job.
 - **mine.stop** - Stop mining.
 - **quiet mode** [on/off] - Enable/disable quiet mode.
 - **quit** - Make the bot leave the server.
 - **strip** - Start strip mining whatever chunk the bot is in.
 - **strip.stop** - Stop strip mining.
 - **toss** [player] [count] [item name] - Toss 'player' 'count' items that match 'item name'.

## Usage

```sh
Usage: node helperbot.js [SERVER] [USERNAME] [OPTIONS]
Connect a mineflayer bot to SERVER as USERNAME.
By default connects 'helperbot' to localhost.

      --help               display this help and exit
      -l, --login          prompt for credentials and login to minecraft.net
      --password=PASSWORD  connect to minecraft.net with the given PASSWORD
      -p, --port=PORT      connect to the given port (defaults to 25565)
      --masters=usr1,...   set the bot's masters to usr1, ...
```

 - Example online mode:

```sh
helperbot server username --password=12345678
```

 - Example online mode #2:

```sh
helperbot server --login
```

 - Example offline mode:

```sh
helperbot server
```

## Installation

`npm install -g helperbot`
