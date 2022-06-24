const {
  Client,
  Intents,
  MessageEmbed,
  Collection,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const prettyMilliseconds = require("pretty-ms");
const jsoning = require("jsoning"); // Documentation: https://jsoning.js.org/
const { Manager } = require("erela.js");
const ConfigFetcher = require("../util/getConfig");
const Logger = require("./Logger");
const spotify = require("better-erela.js-spotify").default;
const { default: AppleMusic } = require("better-erela.js-apple");
const deezer = require("erela.js-deezer");
const facebook = require("erela.js-facebook");
const Server = require("../api");
const getLavalink = require("../util/getLavalink");
const getChannel = require("../util/getChannel");
const colors = require("colors");
const filters = require("erela.js-filters");

require("./EpicPlayer");

class DiscordMusicBot extends Client {
  /**
   * Create the music client
   * @param {import("discord.js").ClientOptions} props - Client options
   */
  constructor(
    props = {
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGES,
      ],
    }
  ) {
    super(props);

    ConfigFetcher()
      .then((conf) => {
        this.config = conf;
        this.build();
      })
      .catch((err) => {
        throw Error(err);
      });

    //Load Events and stuff
    /**@type {Collection<string, import("./SlashCommand")} */
    this.slashCommands = new Collection();
    this.contextCommands = new Collection();

    this.logger = new Logger(path.join(__dirname, "..", "logs.log"));

    this.LoadCommands();
    this.LoadEvents();

    this.database = new jsoning("db.json");

    this.deletedMessages = new WeakSet;
    this.getLavalink = getLavalink;
    this.getChannel = getChannel;
    this.ms = prettyMilliseconds;
    this.commandsRan = 0
    this.songsPlayed = 0
  }

  /**
   * Send an info message
   * @param {string} text
   */
  log(text) {
    this.logger.log(text);
  }

  /**
   * Send an warning message
   * @param {string} text
   */
  warn(text) {
    this.logger.warn(text);
  }

  /**
   * Send an error message
   * @param {string} text
   */
  error(text) {
    this.logger.error(text);
  }

  /**
   * Build em
   */
  build() {
    this.warn("Started the bot...");
    this.login(this.config.token);
    this.server = new Server(this); //constructing also starts it
    if (this.config.debug === true) {
      this.warn("Debug mode is enabled!");
      this.warn("Only enable this if you know what you are doing!");
      process.on("unhandledRejection", (error) => console.log(error));
      process.on("uncaughtException", (error) => console.log(error));
    } else {
      process.on("unhandledRejection", (error) => {
        return;
      });
      process.on("uncaughtException", (error) => {
        return;
      });
    }

    let client = this;

    /**
     * will hold at most 100 tracks, for the sake of autoqueue
     */
    let playedTracks = [];

    this.manager = new Manager({
      plugins: [
        new deezer(),
        new AppleMusic(),
        new spotify(),
        new facebook(),
        new filters(),
      ],
      autoPlay: true,
      nodes: this.config.nodes,
      retryDelay: this.config.retryDelay,
      retryAmount: this.config.retryAmount,
      clientName: `DiscordMusic/v${require("../package.json").version} (Bot: ${this.config.clientId
        })`,
      send: (id, payload) => {
        let guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
      },
    })
      .on("nodeConnect", (node) =>
        this.log(
          `Node: ${node.options.identifier} | Lavalink node is connected.`
        )
      )
      .on("nodeReconnect", (node) =>
        this.warn(
          `Node: ${node.options.identifier} | Lavalink node is reconnecting.`
        )
      )
      .on("nodeDestroy", (node) =>
        this.warn(
          `Node: ${node.options.identifier} | Lavalink node is destroyed.`
        )
      )
      .on("nodeDisconnect", (node) =>
        this.warn(
          `Node: ${node.options.identifier} | Lavalink node is disconnected.`
        )
      )
      .on("nodeError", (node, err) => {
        this.warn(
          `Node: ${node.options.identifier} | Lavalink node has an error: ${err.message}.`
        );
      })
      // on track error warn and create embed
      .on("trackError", (player, err) => {
        this.warn(
          `Player: ${player.options.guild} | Track had an error: ${err?.message}.`
        );
        //console.log(err);
        let song = player.queue.current;

        let errorEmbed = new MessageEmbed()
          .setColor("RED")
          .setTitle("Playback error!")
          .setDescription(`Failed to load track: \`${song.title}\``)
          .setFooter({
            text: "Oops! something went wrong but it's not your fault!",
          });
        client.channels.cache
          .get(player.textChannel)
          .send({ embeds: [errorEmbed] });
      })

      .on("trackStuck", (player, err) => {
        this.warn(`Track has an error: ${err.message}`);
        //console.log(err);
        let song = player.queue.current;

        let errorEmbed = new MessageEmbed()
          .setColor("RED")
          .setTitle("Track error!")
          .setDescription(`Failed to load track: \`${song.title}\``)
          .setFooter({
            text: "Oops! something went wrong but it's not your fault!",
          });
        client.channels.cache
          .get(player.textChannel)
          .send({ embeds: [errorEmbed] });
      })
      .on("playerMove", (player, oldChannel, newChannel) => {
        const guild = client.guilds.cache.get(player.guild);
        if (!guild) return;
        const channel = guild.channels.cache.get(player.textChannel);
        if (oldChannel === newChannel) return;
        if (newChannel === null || !newChannel) {
          if (!player) return;
          const twentyFourSeven = player.get("twentyFourSeven");
          if(twentyFourSeven){
            if(Date.now() - player.lastDisconnectTime < 10000)
              return player.destroy();
            player.lastDisconnectTime = Date.now();
            client.log(`Player ${player.guild} was disconnected and is currently reconnecting`)
            if(!player.manuallyPaused && player.members != 0) {
              setTimeout(() => {
                client.log(`Player ${player.guild} was disconnected and is being resumed`)
                player.pause(false);
              }, 100);
              return player.connect();
            }
          }
          if (channel)
            channel.send({
              embeds: [
                new MessageEmbed()
                  .setColor(client.config.embedColor)
                  .setDescription(`Disconnected from <#${oldChannel}>`),
              ],
            });
          return player.destroy();
        } else {
          player.voiceChannel = newChannel;
          if(player.paused && !player.manuallyPaused && !player.autoPaused)
          setTimeout(() => player.pause(false), 500);
          return undefined;
        }
      })
      .on("playerCreate", (player) => {
        player.guildName = client.guilds.cache.get(player.options.guild).name;
        player.guildName = player.guildName? player.guildName : "a guild";

        this.warn(
          `[${player.guildName}] | Player: ${player.options.guild
          } | A wild player has been created`)
            player.set("twentyFourSeven", true);
            player.songsPlayed = 0
      }
      )
      .on("playerDestroy", async (player) => {
            this.warn(
                `[${player.guildName}] | Player: ${ player.options.guild
                } | A wild player has been destroyed`)
            await player.sendNowplayingMessage(client, true);
          }
      )
      // on LOAD_FAILED send error message
      .on("loadFailed", (node, type, error) =>
        this.warn(
          `Node: ${node.options.identifier} | Failed to load ${type}: ${error.message}`
        )
      )
      // on TRACK_START send message
      .on("trackStart", async (player, track) => {
        this.songsPlayed++;
        player.songsPlayed++;
        playedTracks.push(track.identifier);
        if (playedTracks.length >= 100) playedTracks.shift();
        player.track = track;
        this.warn(
          `[${player.guildName}] | Player: ${player.options.guild
          } | Track has been started playing [${colors.blue(track.title)}]`
        );

        player.sendNowplayingMessage(client);
      })

      .on("queueEnd", async (player, track) => {
        const autoQueue = player.get("autoQueue");

        if (autoQueue) {
          const requester = player.get("requester");
          const identifier = track.identifier;
          const search = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
          const res = await player.search(search, requester);
          let nextTrackIndex;

          res.tracks.some((track, index) => {
            nextTrackIndex = index;
            return !playedTracks.includes(track.identifier);
          });

          if (res.exception) {
            client.channels.cache.get(player.textChannel).send({
              embeds: [
                new MessageEmbed()
                  .setColor("RED")
                  .setAuthor({
                    name: `${res.exception.severity}`,
                    iconURL: client.config.iconURL,
                  })
                  .setDescription(
                    `Could not load track.\n**ERR:** ${res.exception.message}`
                  ),
              ],
            });
            return player.destroy();
          }

          player.play(res.tracks[nextTrackIndex]);
          player.queue.previous = track;
        } else {
          const twentyFourSeven = player.get("twentyFourSeven");
          const isMusicChannel = client.config.guilds.some(guild => guild.textChannel == player.textChannel);
          if(isMusicChannel) {
            await player.sendNowplayingMessage(client, true);
          }

          if (player.songsPlayed > 1) {
            let queueEmbed = new MessageEmbed()
                .setColor(client.config.embedColor)
                .setAuthor({
                  name: "The queue has ended",
                  iconURL: client.config.iconURL,
                })
                .setFooter({ text: "Queue ended" })
                .setTimestamp();
            let queueEndedMessage = await client.channels.cache
                .get(player.textChannel)
                .send({ embeds: [queueEmbed] });
            player.setQueueEndedMessage(client, queueEndedMessage);
          }

          if(isMusicChannel){
            player.setMusicMessage(client);
          }
          player.songsPlayed = 0;

          try {
            if (!player.playing && !twentyFourSeven) {
              setTimeout(() => {
                if (!player.playing && player.state !== "DISCONNECTED") {
                  client.channels.cache.get(player.textChannel).send({
                    embeds: [
                      new MessageEmbed()
                        .setColor(client.config.embedColor)
                        .setAuthor({
                          name: "Disconnected",
                          iconURL: client.config.iconURL,
                        })
                        .setDescription(
                          `The player has been disconnected due to inactivity.`
                        ),
                    ],
                  });
                  player.destroy();
                } else if (player.playing) {
                  client.warn(
                    `Player: ${player.options.guild} | Still playing`
                  );
                }
              }, client.config.disconnectTime);
            } else if (!player.playing && twentyFourSeven) {
              client.warn(
                `Player: ${player.options.guild
                } | Queue has ended [${colors.blue("24/7 ENABLED")}]`
              );
            } else {
              client.warn(
                `Something unexpected happened with player ${player.options.guild}`
              );
            }
          } catch (err) {
            client.error(err);
          }
        }
      });
  }

  /**
   * Checks if a message has been deleted during the run time of the Bot
   * @param {Message} message
   * @returns
   */
  isMessageDeleted(message) {
    return this.deletedMessages.has(message);
  }

  /**
   * Marks (adds) a message on the client's `deletedMessages` WeakSet so it's
   * state can be seen through the code
   * @param {Message} message
   */
  markMessageAsDeleted(message) {
    this.deletedMessages.add(message);
  }

  /**
   *
   * @param {string} text
   * @returns {MessageEmbed}
   */
  Embed(text) {
    let embed = new MessageEmbed().setColor(this.config.embedColor);
    if (text) embed.setDescription(text);

    return embed;
  }

  /**
   *
   * @param {string} text
   * @returns {MessageEmbed}
   */
  ErrorEmbed(text) {
    let embed = new MessageEmbed()
      .setColor("RED")
      .setDescription("❌ | " + text);

    return embed;
  }

  LoadEvents() {
    let EventsDir = path.join(__dirname, "..", "events");
    fs.readdir(EventsDir, (err, files) => {
      if (err) throw err;
      else
        files.forEach((file) => {
          const event = require(EventsDir + "/" + file);
          this.on(file.split(".")[0], event.bind(null, this));
          this.warn("Event Loaded: " + file.split(".")[0]);
        });
    });
  }

  LoadCommands() {
    let SlashCommandsDirectory = path.join(
      __dirname,
      "..",
      "commands",
      "slash"
    );
    fs.readdir(SlashCommandsDirectory, (err, files) => {
      if (err) throw err;
      else
        files.forEach((file) => {
          let cmd = require(SlashCommandsDirectory + "/" + file);

          if (!cmd || !cmd.run)
            return this.warn(
              "Unable to load Command: " +
              file.split(".")[0] +
              ", File doesn't have an valid command with run function"
            );
          this.slashCommands.set(file.split(".")[0].toLowerCase(), cmd);
          this.log("Slash Command Loaded: " + file.split(".")[0]);
        });
    });

    let ContextCommandsDirectory = path.join(
      __dirname,
      "..",
      "commands",
      "context"
    );
    fs.readdir(ContextCommandsDirectory, (err, files) => {
      if (err) throw err;
      else
        files.forEach((file) => {
          let cmd = require(ContextCommandsDirectory + "/" + file);
          if (!cmd.command || !cmd.run)
            return this.warn(
              "Unable to load Command: " +
              file.split(".")[0] +
              ", File doesn't have either command/run"
            );
          this.contextCommands.set(file.split(".")[0].toLowerCase(), cmd);
          this.log("ContextMenu Loaded: " + file.split(".")[0]);
        });
    });
  }

  /**
   *
   * @param {import("discord.js").TextChannel} textChannel
   * @param {import("discord.js").VoiceChannel} voiceChannel
   */
  createPlayer(textChannel, voiceChannel, guild) {
    if(guild)
      return this.manager.create({
        guild: guild.id,
        voiceChannel: guild.voiceChannel,
        textChannel: guild.textChannel,
        selfDeafen: this.config.serverDeafen,
        volume: this.config.defaultVolume,
      });
    else
      return this.manager.create({
      guild: textChannel.guild.id,
      voiceChannel: voiceChannel.id,
      textChannel: textChannel.id,
      selfDeafen: this.config.serverDeafen,
      volume: this.config.defaultVolume,
    });
  }

  createController(guild, player, disabled = false) {
    return new MessageActionRow().addComponents(
      new MessageButton()
        .setStyle("SECONDARY")
        .setCustomId(`controller:${guild}:Stop`)
        .setEmoji("⏹️").setDisabled(disabled),

      new MessageButton()
        .setStyle("PRIMARY")
        .setCustomId(`controller:${guild}:Replay`)
        .setEmoji("⏮️").setDisabled(player.state !== "CONNECTED"),

      new MessageButton()
        .setStyle(player.playing ? "PRIMARY" : "SECONDARY")
        .setCustomId(`controller:${guild}:PlayAndPause`)
        .setEmoji(player.playing ? "⏸️" : "▶️").setDisabled(disabled),

      new MessageButton()
        .setStyle("PRIMARY")
        .setCustomId(`controller:${guild}:Next`)
        .setEmoji("⏭️").setDisabled(disabled),

      new MessageButton()
        .setStyle(player.queueRepeat || player.trackRepeat ? "SUCCESS" : "SECONDARY")
        .setCustomId(`controller:${guild}:Loop`)
        .setEmoji(player.trackRepeat ? "🔂" : "🔁").setDisabled(disabled),
    );
  }
}

module.exports = DiscordMusicBot;
