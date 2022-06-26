const colors = require("colors");
const { MessageEmbed } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand().setName("247")
	.setDescription("Prevents the bot from ever disconnecting from a VC (toggle)")
	.addBooleanOption((option) =>
		option.setName("enabled").setDescription("Enable or disable the 24/7 mode"))
	.setRun(async (client, interaction, options) => {
		const channel = await client.getChannel(client, interaction);
		if (!channel) {
			return;
		}
		
		let player;
		if (client.manager) {
			player = client.manager.players.get(interaction.guild.id);
		} else {
			return interaction.reply({
				embeds: [
					new MessageEmbed().setColor("RED").setDescription("Lavalink node is not connected"),
				],
			});
		}
		
		if (!player) {
			return interaction.reply({
				embeds: [
					new MessageEmbed().setColor("RED").setDescription("The bot must be joined to a channel to play 24/7."),
				],
				ephemeral: true,
			});
		}
		
		let twentyFourSeven = player.get("twentyFourSeven");
		let enabled = interaction.options.getBoolean("Enable")
		if (enabled !== null && enabled != twentyFourSeven) {
			player.set("twentyFourSeven", enabled);
			twentyFourSeven = enabled;
			client.warn(
				`Player: ${ player.options.guild } | [${ colors.blue(
					"24/7",
				) }] was [${ colors.blue(
					twentyFourSeven? "ENABLED" : "DISABLED",
				) }] in ${
					client.guilds.cache.get(player.options.guild)
						? client.guilds.cache.get(player.options.guild).name
						: "a guild"
				}`,
			);
		}
		
		return interaction.reply({
			embeds: [client.Embed(
				`✅ | **24/7 mode is \`${ twentyFourSeven? "ON" : "OFF" }\`**`,
			)],
		});
	});

module.exports = command;
