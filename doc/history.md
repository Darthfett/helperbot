## 0.0.10
 * Bots now have quiet mode enabled by default.
 * 'Come' command now uses responderFunc.
 * Made 'strip' command be much more efficient.  Thanks, superjoe30!
 * Mining now works much faster.  Thanks, superjoe30!
 * Added 'follow' command, which makes the bot follow a player.

## 0.0.9
 * Update blockfinder algorithm to new, more accurate version.

## 0.0.8
 * Update 'list' command to merge together items of the same type.
 * Update 'gimme' command to give up to 36 stacks.
 * Update 'list' command to list how many empty inventory slots the bot has.
 * Revert blockfinder algorithm to old faster version.

## 0.0.7
 * New strip miner plugin - 'Strip' makes the bot start mining the chunk he's standing in, 'strip.stop' to stop.

## 0.0.6
 * blockFinder has been moved to another project and used as a dependency, see [mineflayer-blockfinder](https://github.com/Darthfett/mineflayer-blockfinder).
 * The 'find' and 'mine' should now get the absolute closest matching block(s).
 * The 'list' command should now also tell the user when the bot's inventory is empty.

## 0.0.5
 * Removed the block_in plugin, which was causing bots to crash when trying to respond to people speaking the word 'in'.
 * Added the ability to direct the bots by speaking their name, e.g. "helperbot, come".
 * Finder now announces what block it will be looking for.
 * Miner now uses Chat Commands responder func.  Thanks, superjoe30!
 * Miner improvements to avoid suffocation.  Thanks, superjoe30!
 * Bots now whisper their masters when they join to inform them on how to use them.
 * blockFinder's findBlock renamed to findBlockSync, new asynchronous findBlock added.
 * Finder no longer hogs the CPU, which could have caused timeout disconnections.
 * Added 'toss [player] [count] [item name]' command to toss 'player' 'count' items matching 'item name'.  Thanks, superjoe30 for original version!
 * Added 'list' command to list the bot's inventory.  Thanks, superjoe30!

## 0.0.4
 * Added 'mine block name' command and all related miner commands.  Thanks, superjoe30!
 * Fixed a bug with blockFinder accepting an array of item ids.  Thanks, superjoe30!

## 0.0.3
 * Added 'help [command]' command to display information about a given command.
 * Add quiet mode, which causes the bot to whisper all chatCommand responses (via a new responderFunc given to command handlers).
 * Added 'quiet mode [on/off]' command to enable/disable quiet mode.
 * chatCommands now supports whispered commands.
 * Added 'masters' command to list a bot's masters.
 * 'add master [username]' and 'rm master [username' syntax changed to 'masters [add/rm username]'.

## 0.0.2
 * The 'gimme' command now (officially) supports asking for a certain number of items (capped at 4 stacks at a time).  E.g. `gimme 100 cobblestone`
 * The 'gimme' command now supports getting the maximum number of stacks by adding an '!' after the item name.  E.g. `gimme torch!`
 * Masters can now be added with the 'add master' and 'rm master' commands.
 * Added 'echo' command: 'echo message' will make the bot echo back the message.
 * Added kick notice plugin to log to the console when the bot is kicked.
 * Added support for multiple masters for the bot, using the --masters=username1,username2,... command line option.  Bots will ignore commands from players that are not their master.
 * Updated the command line interface to the newest one defined by minecraft-protocol.  Your username is now either your email or username, depending on if the account was migrated.
 * Fixed a bug with the 'find' command causing commands issued by a player that the bot has not seen to crash.
 * Fixed the 'find' command's 'N blocks away' to be off in some cases.
 * Fixed bug with 'gimme' command that caused the bot to give the wrong item type when asking for a set number of items.

## 0.0.1

 * Added 'find' command: 'find block' will tell you where the nearest block of the given type is (e.g. 'find d o' is shorthand for finding diamond ore block).
 * Added 'quit' command which makes the bot quit.
 * Added 'gimme' command: 'gimme item' will make the bot user /give cheats to give you a specific item.
 * Added 'come' command which makes the bot come to your current location.
