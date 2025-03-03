const { MessageEmbed } = require("discord.js");
/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").ButtonInteraction} interaction
 */
module.exports = async (client, interaction) => {
	let guild = client.guilds.cache.get(interaction.customId.split(":")[1]);
	let property = interaction.customId.split(":")[2];
	let player = client.manager.get(guild.id);
	
	if (!player) {
		await interaction.reply({
			embeds: [
				client.Embed("❌ | **There is no player to control in this server.**"),
			],
		});
		setTimeout(() => {
			interaction.deleteReply();
		}, 5000);
		return;
	}
	if (!interaction.member.voice.channel) {
		const joinEmbed = new MessageEmbed().setColor(client.config.embedColor).setDescription(
			"❌ | **You must be in a voice channel to use this action!**",
		);
		return interaction.reply({ embeds: [joinEmbed], ephemeral: true });
	}
	
	if (
		interaction.guild.me.voice.channel &&
		!interaction.guild.me.voice.channel.equals(interaction.member.voice.channel)
	) {
		const sameEmbed = new MessageEmbed().setColor(client.config.embedColor).setDescription(
			"❌ | **You must be in the same voice channel as me to use this action!**",
		);
		return interaction.reply({ embeds: [sameEmbed], ephemeral: true });
	}
	
	if (property === "Stop") {
		player.queue.clear();
		player.stop();
		player.set("autoQueue", false);
		client.warn(`Player: ${ player.options.guild } | Successfully stopped the player`);
		
		return interaction.update({
			components: [client.createController(player.options.guild, player)],
		});
	}
	
	// if there's no previous song, return an error.
	if (property === "Replay") {
		client.log("Player previous song was requested");
		if (!player.queue.previous) {
			const msg = await interaction.channel.send({
				embeds: [client.Embed("❌ | **There is no previous song to replay.**")],
			});
			setTimeout(() => {
				msg.delete();
			}, 5000);
		} else {
			const currentSong = player.queue.current;
			player.play(player.queue.previous);
			if (currentSong) {
				player.queue.unshift(currentSong);
			}
		}
		return interaction.deferUpdate();
	}
	
	if (property === "PlayAndPause") {
		if (!player || (!player.playing && player.queue.totalSize === 0)) {
			const msg = await interaction.channel.send({
				embeds: [
					new MessageEmbed().setColor("RED").setDescription("There is no song playing right now."),
				],
			});
			setTimeout(() => {
				msg.delete();
			}, 5000);
			return interaction.deferUpdate();
		}
		if (player.paused) {
			player.pause(false);
			player.manuallyPaused = false;
			interaction.guild.me.voice.setMute(false);
		} else {
			player.manuallyPaused = true
			player.pause(true);
			interaction.guild.me.voice.setMute(true);
			
		}
		client.warn(`Player: ${ player.options.guild } | Successfully ${ player.paused? "paused" : "resumed" } the player`);
		
		return interaction.update({
			components: [client.createController(player.options.guild, player)],
		});
	}
	
	
	if (property === "Next") {
		client.log("Player next song was requested");
		
		player.stop();
		return interaction.deferUpdate();
	}
	
	if (property === "Loop") {
		if (player.trackRepeat) {
			player.setTrackRepeat(false);
			player.setQueueRepeat(true);
		} else if (player.queueRepeat) {
			player.setQueueRepeat(false);
		} else {
			player.setTrackRepeat(true);
		}
		client.warn(`Player: ${ player.options.guild } | Successfully toggled loop the player`);
		
		return interaction.update({
			components: [client.createController(player.options.guild, player)],
		});
	}
	
	return interaction.reply({
		ephemeral: true,
		content: "❌ | **Unknown controller option**",
	});
};
