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
};
