const { MessageEmbed } = require("discord.js");
/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 */
module.exports = (client) => {
	if (client.manager) {
		client.manager.init(client.user.id);
	}
	
	const activities = client.config.presence.activities;
	
	setInterval(() => {
		const index = Math.floor(Math.random() * (activities.length - 1));
		client.user.setActivity({
			name: activities[index].name,
			type: activities[index].type,
		});
	}, 10000);
	client.log("Successfully logged in as " + client.user.tag);
	
	setTimeout(autoJoinDefaultGuilds, 1000);
	
	async function autoJoinDefaultGuilds() {
		for (const guild of client.config.guilds) {
			try {
				const channel = await client.channels.cache.get(guild.textChannel);
				await clearChannel(channel);
				channel.send({
					embeds: [
						client.Embed(":white_check_mark: | **The bot have been restarted.**"),
					],
				});
				client.createPlayer(0, 0, guild).connect(true).setMusicMessage(client);
				
			} catch (e) {
				client.error(`Failed to auto join guild ${ guild.name }. Verify guild configs.`);
			}
		}
	}
	
	async function clearChannel(channel, n = 0, old = false) {
		let collected = await channel.messages.fetch();
		if (collected.size > 0) {
			if (old) {
				for (let msg of collected.array()) {
					await msg.delete();
					n++;
				}
			} else {
				let deleted = await channel.bulkDelete(100, true);
				if (deleted.size < collected.size) {
					old = true;
				}
				n += deleted;
			}
			
			return n + await clearChannel(channel, old);
		} else {
			return 0;
		}
	}
	
};
