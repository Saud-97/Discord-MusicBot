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
	
autoJoinDefaultGuilds();
	
	async function autoJoinDefaultGuilds() {
		client.config.guilds.map(async guild => {
			try {
				const channel = await client.channels.cache.get(guild.textChannel);
				await clearChannel(channel);
				channel.send({
					embeds: [
						client.Embed(":white_check_mark: | **The bot have been restarted.**"),
					],
				});
				
				let interval = setInterval(() => {
					try {
						client.createPlayer(0, 0, guild).connect().setMusicMessage(client);
						clearInterval(interval);
					} catch (e) {
						if (e == "RangeError: No available nodes.") {
							console.log(`waiting for lavalink node`)
						} else {
							throw e;
						}
					}
				}, 1000)
				
				
			} catch (e) {
				client.error(`Failed to auto join guild ${ guild.name }. Verify guild configs.`);
				client.error(e)
			}
		});
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
