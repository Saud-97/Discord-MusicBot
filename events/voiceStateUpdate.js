const { MessageEmbed } = require("discord.js");

/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").VoiceState} oldState
 * @param {import("discord.js").VoiceState} newState
 * @returns {Promise<void>}
 */
module.exports = async (client, oldState, newState) => {
	// get guild and player
	let guildId = newState.guild.id;
	const player = client.manager.get(guildId);
	
	// check if the bot is active (playing, paused or empty does not matter (return otherwise)
	if (!player || player.state !== "CONNECTED") {
		return;
	}
	
	// prepreoces the data
	const stateChange = {};
	// get the state change
	if (oldState.channel === null && newState.channel !== null) {
		stateChange.type = "JOIN";
	}
	if (oldState.channel !== null && newState.channel === null) {
		stateChange.type = "LEAVE";
	}
	if (oldState.channel !== null && newState.channel !== null) {
		stateChange.type = "MOVE";
	}
	if (oldState.channel === null && newState.channel === null) {
		return;
	} // you never know, right
	if (
		newState.serverMute == true &&
		oldState.serverMute == false &&
		newState.id === client.config.clientId
	) {
		if (!player.paused) {
			player.pause(true);
			player.sendNowplayingMessage(client);
		}
		return;
	}
	if (
		newState.serverMute == false &&
		oldState.serverMute == true &&
		newState.id === client.config.clientId
	) {
		if (player.paused && player.queue.current) {
			player.pause(false);
			player.sendNowplayingMessage(client);
		}
		return;
	}
	// move check first as it changes type
	if (stateChange.type === "MOVE") {
		if (oldState.channel.id === player.voiceChannel) {
			stateChange.type = "LEAVE";
		}
		if (newState.channel.id === player.voiceChannel) {
			stateChange.type = "JOIN";
		}
	}
	// double triggered on purpose for MOVE events
	if (stateChange.type === "JOIN") {
		stateChange.channel = newState.channel;
	}
	if (stateChange.type === "LEAVE") {
		stateChange.channel = oldState.channel;
	}
	
	// check if the bot's voice channel is involved (return otherwise)
	if (!stateChange.channel || stateChange.channel.id !== player.voiceChannel) {
		return;
	}
	
	// filter current users based on being a bot
	player.prevMembers = player.members
	stateChange.members = stateChange.channel.members.filter(member => !member.user.bot);
	player.members = stateChange.members.size
	switch (stateChange.type) {
		case "JOIN":
			if (client.config.alwaysPlay === false) {
				if (player.members && player.paused && player.prevMembers != player.members && !player.manuallyPaused && player.autoPaused) {
					player.autoPaused = false;
					player.pause(false);
					player.sendNowplayingMessage(client);
					client.log("Player resumed due to being in a channel with someone else")
				} else if (player.prevMembers && !player.manuallyPaused && newState.channel.members.size === 1 && newState.channel.members.some(user => user.id == client.user.id)) {
					client.log("Player paused due to moving to a channel alone");
					player.autoPaused = true;
					player.pause(true);
					if (player.songsPlayed) {
						await player.sendNowplayingMessage(client);
					}
				}
			}
			break;
		case "LEAVE":
			if (client.config.alwaysPlay === false) {
				if (
					(stateChange.members.size === 0) &&
					!player.paused &&
					player.playing
				) {
					player.autoPaused = true;
					player.pause(true);
					player.sendNowplayingMessage(client);
					let playerPaused = new MessageEmbed().setColor(client.config.embedColor)
						.setTitle(`Paused!`, client.config.iconURL).setFooter({
							text: `The current song has been paused because theres no one in the voice channel.`,
						});
					
					let pausedMessage = await client.channels.cache.get(player.textChannel).send({ embeds: [playerPaused] });
					player.setPausedMessage(client, pausedMessage);
				}
			}
			break;
	}
};
