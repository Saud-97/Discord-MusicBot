const { MessageEmbed } = require("discord.js");

module.exports = async (client, message) => {
	const mention = new RegExp(`^<@!?${ client.user.id }>( |)$`);
	
	if (message.content.match(mention)) {
		const mentionEmbed = new MessageEmbed().setColor(client.config.embedColor).setDescription(
			`My prefix on this server is \`/\` (Slash Command).\nTo get started you can type \`/help\` to see all my commands.\nIf you can't see it, Please [reinvite](https://discord.com/oauth2/authorize?client_id=${ client.config.clientId }&permissions=${ client.config.permissions }&scope=${ client.config.scopes.toString()
				.replace(/,/g, '%20') }) me with the correct permissions.`,
		);
		
		message.channel.send({
			embeds: [mentionEmbed],
		});
	}
	
	let spCharsRegExp = /^[!@#$%^&*()_+\-\[\]{};'`:"\\|,.<>\/?]+/;
	if (!message.author.bot && client.config.guilds.some(guild => guild.textChannel == message.channel.id) && !spCharsRegExp.test(message.content)) {
		
		let channel = await client.getChannel(client, message);
		if (!channel) {
			return;
		}
		
		let player;
		if (client.manager) {
			player = client.createPlayer(message.channel, channel);
		} else {
			return message.channel.send({
				embeds: [
					new MessageEmbed().setColor("RED").setDescription("Lavalink node is not connected"),
				],
			});
		}
		
		if (player.state !== "CONNECTED") {
			player.connect();
		}
		
		if (channel.id !== player.voiceChannel) {
			player.setVoiceChannel(channel.id);
			player.connect();
		}
		
		let msg = await message.channel.send({
			embeds: [
				new MessageEmbed().setColor(client.config.embedColor).setDescription(":mag_right: **Searching...**"),
			],
		});
		
		let query = message.content;
		let mixRequest = query.startsWith("==")
		if (mixRequest) {
			let url = query.indexOf("://");
			let lastIndex = query.indexOf("&list");
			lastIndex = url > 0 && lastIndex > 0? lastIndex : undefined;
			query = query.substring(2, lastIndex);
		}
		
		let res = await player.search(query, message.member).catch((err) => {
			client.error(err);
			return {
				loadType: "LOAD_FAILED",
			};
		});
		
		if (mixRequest && (res.loadType === "TRACK_LOADED" || res.loadType === "SEARCH_RESULT")) {
			const identifier = res.tracks[0].identifier;
			const mixQuery = `https://www.youtube.com/watch?v=${ identifier }&list=RD${ identifier }`;
			const mixRes = await player.search(mixQuery, message.member).catch((err) => {
				client.error(err);
				return {
					loadType: "LOAD_FAILED",
				};
			});
			if (mixRes.loadType != "LOAD_FAILED") {
				query = mixQuery;
				res = mixRes;
			}
		}
		message.delete()
		
		if (res.loadType === "TRACK_LOADED" || res.loadType === "SEARCH_RESULT") {
			player.queue.add(res.tracks[0]);
			
			if (!player.playing && !player.paused && !player.queue.size) {
				player.play();
			}
			
			let addQueueEmbed = new MessageEmbed().setColor(client.config.embedColor)
				.setAuthor({ name: "Added to queue", iconURL: client.config.iconURL }).setDescription(
					`[${ res.tracks[0].title }](${ res.tracks[0].uri })` || "No Title",
				).setURL(res.tracks[0].uri).addField("Added by", `<@${ message.member.id }>`, true).addField(
					"Duration",
					res.tracks[0].isStream
						? `\`LIVE\``
						: `\`${ client.ms(res.tracks[0].duration, {
							colonNotation: true,
						}) }\``,
					true,
				);
			
			try {
				addQueueEmbed.setThumbnail(
					res.tracks[0].displayThumbnail("maxresdefault"),
				);
			} catch (err) {
				addQueueEmbed.setThumbnail(res.tracks[0].thumbnail);
			}
			
			if (player.queue.totalSize > 1) {
				addQueueEmbed.addField(
					"Position in queue",
					`${ player.queue.size }`,
					true,
				);
			} else {
				player.queue.previous = player.queue.current;
			}
			
			return msg.edit({ embeds: [addQueueEmbed] }).catch(this.warn);
		}
		
		if (res.loadType === "PLAYLIST_LOADED") {
			player.queue.add(res.tracks);
			
			if (
				!player.playing &&
				!player.paused &&
				player.queue.totalSize === res.tracks.length
			) {
				player.play();
			}
			
			let playlistEmbed = new MessageEmbed().setColor(client.config.embedColor).setAuthor({
				name: "Playlist added to queue",
				iconURL: client.config.iconURL,
			}).setThumbnail(res.tracks[0].thumbnail).setDescription(`[${ res.playlist.name }](${ query })`)
				.addField("Enqueued", `\`${ res.tracks.length }\` songs`, false).addField(
					"Playlist duration",
					`\`${ client.ms(res.playlist.duration, { colonNotation: true }) }\``,
					false,
				);
			
			return msg.edit({ embeds: [playlistEmbed] }).catch(this.warn);
		}
		
		msg.edit({ embeds: [client.ErrorEmbed(`The query provided was invalid.\n\n> ${ query }`)] }).catch(this.warn);
		setTimeout(() => {
			msg.delete();
		}, 15000);
		client.log(`query = "${ query }"`)
		client.log(`res.loadType = "${ res.loadType }"`)
		
	}
};
