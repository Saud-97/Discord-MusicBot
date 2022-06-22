/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 */
module.exports = (client) => {
  if (client.manager)
    client.manager.init(client.user.id);

  const activities = client.config.presence.activities;

  setInterval(() => {
    const index = Math.floor(Math.random() * (activities.length - 1));
    client.user.setActivity({
      name: activities[index].name,
      type: activities[index].type
    });
  }, 10000);
  client.log("Successfully logged in as " + client.user.tag);

  setTimeout(autoJoinDefaultGuilds , 5000);

  function autoJoinDefaultGuilds() {
      client.config.guilds.forEach(guild => {
              try {
                  let player = client.createPlayer(0, 0, guild).connect(true)
                  client.channels.cache
                  .get(player.textChannel)
                  .send({
                      embeds: [
                          client.Embed(":white_check_mark: | **The bot have been restarted.**"),
                      ],
                  });
              } catch (e) {
                  client.error(`Failed to auto join ${guild.name} server. Verify guilds configs.`)
              }
          }
      );
  }

};
