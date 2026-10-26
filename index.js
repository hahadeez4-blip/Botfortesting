const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check if the bot is online."),
  new SlashCommandBuilder().setName("kick").setDescription("Kick a member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName("member").setDescription("Member to kick").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the kick")),
  new SlashCommandBuilder().setName("ban").setDescription("Ban a member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("member").setDescription("Member to ban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the ban")),
  new SlashCommandBuilder().setName("timeout").setDescription("Timeout a member for 1–28 days.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("member").setDescription("Member to timeout").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes (1–40320)").setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the timeout")),
  new SlashCommandBuilder().setName("role").setDescription("Give or remove a role from a member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s => s.setName("give").setDescription("Give a role.")
      .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("Role to give").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove a role.")
      .addUserOption(o => o.setName("member").setDescription("Member").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("Role to remove").setRequired(true))),
  new SlashCommandBuilder().setName("purge").setDescription("Delete 1–100 recent messages.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName("amount").setDescription("Number of messages (1–100)").setMinValue(1).setMaxValue(100).setRequired(true)),
  new SlashCommandBuilder().setName("userinfo").setDescription("Show info about a member.")
    .addUserOption(o => o.setName("member").setDescription("Member (defaults to you)")),
  new SlashCommandBuilder().setName("serverinfo").setDescription("Show info about this server.")
].map(c => c.toJSON());

async function registerCommands() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    throw new Error("Set DISCORD_TOKEN and CLIENT_ID in your .env file first.");
  }
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);
  await rest.put(route, { body: commands });
  console.log(process.env.GUILD_ID ? "Guild slash commands registered." : "Global slash commands registered (may take a while to appear).");
}

client.once("ready", c => console.log(`Logged in as ${c.user.tag}`));

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const { commandName } = interaction;

    if (commandName === "ping") {
      return interaction.reply({ content: `Pong! ${client.ws.ping}ms`, ephemeral: true });
    }

    if (commandName === "kick" || commandName === "ban") {
      const user = interaction.options.getUser("member", true);
      const reason = interaction.options.getString("reason") || `Action by ${interaction.user.tag}`;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: "That member isn't in this server.", ephemeral: true });
      if (user.id === interaction.user.id) return interaction.reply({ content: "You can't use this command on yourself.", ephemeral: true });
      if (user.id === client.user.id) return interaction.reply({ content: "I can't moderate myself.", ephemeral: true });

      const botMember = interaction.guild.members.me;
      const permission = commandName === "kick" ? PermissionFlagsBits.KickMembers : PermissionFlagsBits.BanMembers;
      if (!interaction.memberPermissions.has(permission)) return interaction.reply({ content: "You don't have the required server permission.", ephemeral: true });
      if (!botMember.permissions.has(permission)) return interaction.reply({ content: `I need the ${commandName === "kick" ? "Kick Members" : "Ban Members"} permission.`, ephemeral: true });
      if (member.roles.highest.position >= botMember.roles.highest.position) return interaction.reply({ content: "My highest role must be above that member's highest role.", ephemeral: true });
      if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) return interaction.reply({ content: "Your highest role must be above that member's highest role.", ephemeral: true });

      if (commandName === "kick") await member.kick(reason);
      else await member.ban({ reason });

      return interaction.reply({ content: `✅ ${user.tag} was ${commandName === "kick" ? "kicked" : "banned"}. Reason: ${reason}` });
    }

    if (commandName === "timeout") {
      const user = interaction.options.getUser("member", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const reason = interaction.options.getString("reason") || `Timeout by ${interaction.user.tag}`;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: "That member isn't in this server.", ephemeral: true });
      if (user.id === interaction.user.id) return interaction.reply({ content: "You can't timeout yourself.", ephemeral: true });
      const botMember = interaction.guild.members.me;
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: "You need the Moderate Members permission.", ephemeral: true });
      if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers)) return interaction.reply({ content: "I need the Moderate Members permission.", ephemeral: true });
      if (member.roles.highest.position >= botMember.roles.highest.position) return interaction.reply({ content: "My highest role must be above that member's highest role.", ephemeral: true });
      if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) return interaction.reply({ content: "Your highest role must be above that member's highest role.", ephemeral: true });
      await member.timeout(minutes * 60_000, reason);
      return interaction.reply({ content: `✅ ${user.tag} timed out for ${minutes} minute(s). Reason: ${reason}` });
    }

    if (commandName === "role") {
      const sub = interaction.options.getSubcommand();
      const user = interaction.options.getUser("member", true);
      const role = interaction.options.getRole("role", true);
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: "That member isn't in this server.", ephemeral: true });
      if (role.managed || role.id === interaction.guild.id) return interaction.reply({ content: "That role can't be assigned manually.", ephemeral: true });
      const botMember = interaction.guild.members.me;
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: "You need the Manage Roles permission.", ephemeral: true });
      if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: "I need the Manage Roles permission.", ephemeral: true });
      if (role.position >= botMember.roles.highest.position) return interaction.reply({ content: "Move my highest role above the role you want to assign.", ephemeral: true });
      if (role.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) return interaction.reply({ content: "Your highest role must be above that role.", ephemeral: true });

      if (sub === "give") {
        await member.roles.add(role, `Role given by ${interaction.user.tag}`);
        return interaction.reply({ content: `✅ Gave ${role} to ${user.tag}.` });
      }
      await member.roles.remove(role, `Role removed by ${interaction.user.tag}`);
      return interaction.reply({ content: `✅ Removed ${role} from ${user.tag}.` });
    }

    if (commandName === "purge") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: "You need the Manage Messages permission.", ephemeral: true });
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: "I need the Manage Messages permission.", ephemeral: true });
      const amount = interaction.options.getInteger("amount", true);
      const messages = await interaction.channel.bulkDelete(amount, true);
      return interaction.reply({ content: `🧹 Deleted ${messages.size} recent message(s). Messages older than 14 days can't be bulk-deleted.`, ephemeral: true });
    }

    if (commandName === "userinfo") {
      const user = interaction.options.getUser("member") || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const embed = new EmbedBuilder().setTitle(`User info: ${user.tag}`).setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "User ID", value: user.id },
          { name: "Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` },
          { name: "Joined server", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : "Not a server member" }
        ).setColor(0x5865F2);
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "serverinfo") {
      const g = interaction.guild;
      const embed = new EmbedBuilder().setTitle(g.name).setThumbnail(g.iconURL())
        .addFields(
          { name: "Server ID", value: g.id, inline: true },
          { name: "Members", value: String(g.memberCount), inline: true },
          { name: "Created", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true }
        ).setColor(0x5865F2);
      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error(error);
    const message = "Something went wrong. Check the bot's permissions and the terminal logs.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

registerCommands()
  .then(() => client.login(process.env.DISCORD_TOKEN))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
