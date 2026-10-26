# Basic Discord Moderation Bot

A beginner-friendly Discord bot using Node.js and discord.js v14.

## Commands

- `/ping`
- `/kick member reason`
- `/ban member reason`
- `/timeout member minutes reason` (1–40,320 minutes)
- `/role give member role`
- `/role remove member role`
- `/purge amount` (1–100 recent messages)
- `/userinfo member`
- `/serverinfo`

Discord permissions and role hierarchy are checked before moderation actions. Use moderation commands responsibly and only in servers where you have permission.

## 1. Create the bot

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create an application, then open **Bot** and create/reset its bot token.
3. Copy the **Application ID** from **General Information**. This is `CLIENT_ID`.
4. Open **OAuth2 > URL Generator**. Select scopes `bot` and `applications.commands`.
5. Under bot permissions, select only what you need: Kick Members, Ban Members, Moderate Members, Manage Roles, Manage Messages, View Channels, and Send Messages. Generate the invite URL and invite the bot to your test server.
6. In your server's role settings, move the bot role above the roles it needs to manage. It cannot manage roles above or equal to its own top role.

## 2. Configure locally

1. Install Node.js 20 or newer from [nodejs.org](https://nodejs.org/).
2. Download this repository, or clone it.
3. Copy `.env.example` to a new file named `.env`.
4. Fill in `DISCORD_TOKEN` and `CLIENT_ID`.
5. For testing, set `GUILD_ID` to your test server's ID. To copy it, enable Developer Mode in Discord, then right-click/tap-hold the server and choose Copy Server ID.
6. Open a terminal in this folder and run:

   ```bash
   npm install
   npm start
   ```

Guild commands usually appear faster during testing. If you leave `GUILD_ID` blank, commands register globally and may take time to appear.

## 3. Put it on GitHub

Upload the project files to a new GitHub repository. Keep `.env` private; `.gitignore` excludes it. Do not paste the token into `index.js`, README, screenshots, or public chats. If a token is exposed, reset it immediately in the Developer Portal.

## 4. Hosting

GitHub stores the code but does not keep a bot online by itself. Use a host that supports a persistent Node.js process. Add `DISCORD_TOKEN`, `CLIENT_ID`, and optionally `GUILD_ID` as environment variables in the host's settings, then use `npm install` / `npm start` or the host's equivalent.

## Troubleshooting

- **Commands don't show:** Check `CLIENT_ID`, the invite includes `applications.commands`, and `GUILD_ID` is correct. Restart the bot after changing configuration.
- **Missing Access / Missing Permissions:** Give the bot only the needed permissions and move its role above the target role.
- **Invalid token:** Reset the token in the Developer Portal and update the private `.env` or host environment variables.
