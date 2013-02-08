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