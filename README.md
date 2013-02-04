# HelperBot

A Node.js Minecraft bot that helps you out by performing menial tasks.

## Current Project Status

Supports Minecraft 1.4.7

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
