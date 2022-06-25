const { Message } = require("discord.js");
const { Structure } = require("erela.js");
const prettyMilliseconds = require("pretty-ms");

Structure.extend(
	"Player",
	(Player) =>
		class extends Player {
			constructor(...props) {
				super(...props);
				this.twentyFourSeven = false;
			}
			
			/**
			 * Set's (maps) the client's resume message so it can be deleted afterwards
			 * @param {Client} client
			 * @param {Message} message
			 * @returns the Set Message
			 */
			setResumeMessage(client, message) {
				if (this.pausedMessage && !client.isMessageDeleted(this.pausedMessage)) {
					this.pausedMessage.delete();
					client.markMessageAsDeleted(this.pausedMessage);
				}
				return (this.resumeMessage = message);
			}
			
			/**
			 * Set's (maps) the client's paused message, so it can be deleted afterwards
			 * @param {Client} client
			 * @param {Message} message
			 * @returns
			 */
			setPausedMessage(client, message) {
				if (this.resumeMessage && !client.isMessageDeleted(this.resumeMessage)) {
					this.resumeMessage.delete();
					client.markMessageAsDeleted(this.resumeMessage);
				}
				if (this.pausedMessage && !client.isMessageDeleted(this.pausedMessage)) {
					this.pausedMessage.delete();
					client.markMessageAsDeleted(this.pausedMessage);
				}
				return (this.pausedMessage = message);
			}
			
			/**
			 * Set's (maps) the client's queue ended message so it can be deleted afterwards
			 * @param {Client} client
			 * @param {Message} message
			 * @returns
			 */
			setQueueEndedMessage(client, message) {
				if (this.queueEndedMessage && !client.isMessageDeleted(this.queueEndedMessage)) {
					this.queueEndedMessage.delete();
					client.markMessageAsDeleted(this.queueEndedMessage);
				}
				return (this.queueEndedMessage = message);
			}
			
			/**
			 * Set's (maps) the client's send music message so it can be deleted afterwards
			 * @param {Client} client
			 * @param {Message} message
			 * @returns
			 */
			async setMusicMessage(client, reset = false) {
				if (this.sendMusicMessage && !client.isMessageDeleted(this.sendMusicMessage)) {
					this.sendMusicMessage.delete();
					client.markMessageAsDeleted(this.sendMusicMessage);
				}
				
				if (reset) {
					return (this.sendMusicMessage = null);
				}
				
				let sendMusicMessage = await client.channels.cache.get(this.textChannel).send({
					embeds: [
						client.Embed("**🎶 | Send a song name/link below this message to play music!**"),
					],
				});
				return (this.sendMusicMessage = sendMusicMessage);
			}
			
			/**
			 * Set's (maps) the client's now playing message so it can be deleted afterwards
			 * @param {Client} client
			 * @param {Message} message
			 * @returns
			 */
			setNowplayingMessage(client, message) {
				if (this.nowPlayingMessage && !client.isMessageDeleted(this.nowPlayingMessage)) {
					this.nowPlayingMessage.delete();
					client.markMessageAsDeleted(this.nowPlayingMessage);
				}
				this.setQueueEndedMessage(client, null);
				return (this.nowPlayingMessage = message);
			}
			
			async sendNowplayingMessage(client, disabled = false, track = this.track) {
				if (!track) {
					return;
				}
				if (!this.paused || !this.playing) {
					this.setPausedMessage(client, null);
				}
				let trackStartedEmbed = client.Embed().setAuthor({ name: "Now playing", iconURL: client.config.iconURL })
					.setDescription(`[${ track.title }](${ track.uri })` || "No Descriptions")
					.addField("Requested by", `${ track.requester }`, true)
					// show the duration of the track but if it's live say that it's "LIVE" if it's not anumber say it's live, if it's null say it's unknown
					.addField(
						"Duration",
						track.isStream
							? `\`LIVE\``
							: `\`${ prettyMilliseconds(track.duration, {
								colonNotation: true,
							}) }\``,
						true,
					);
				try {
					trackStartedEmbed.setThumbnail(
						track.displayThumbnail("maxresdefault"),
					);
				} catch (err) {
					trackStartedEmbed.setThumbnail(track.thumbnail);
				}
				let nowPlaying = await client.channels.cache.get(this.textChannel).send({
					embeds: [trackStartedEmbed],
					components: [client.createController(this.options.guild, this, disabled)],
				}).catch(client.warn);
				this.setNowplayingMessage(client, nowPlaying);
				
				
			}
		},
);
