/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").GuildCommandInteraction} interaction
 * @returns
 */
module.exports = async (client, interaction) => {
  return new Promise(async (resolve) => {
    if (!interaction.member.voice.channel) {
      const msg = await interaction.reply({
        embeds: [
          client.ErrorEmbed(
            "You must be in a voice channel to use this command!"
          ),
        ],
      });
      setTimeout(() => {
        interaction.version?  interaction.deleteReply() : msg.delete();
      }, 5000);

      return resolve(false);
    }

    if (
      interaction.guild.me.voice.channel &&
      interaction.member.voice.channel.id !==
        interaction.guild.me.voice.channel.id
    ) {

      let player;
      if (client.manager)
        player = client.manager.players.get(interaction.guild.id);
  
      if(player && (!player.queue.current || !player.playing || player.paused) && interaction.member.voice.channel.joinable){
        return resolve(interaction.member.voice.channel);
      }

      const msg = await interaction.reply({
        embeds: [
          client.ErrorEmbed(
            "You must be in the same voice channel as me to use this command!"
          ),
        ],
      });
      setTimeout(() => {
        interaction.version?  interaction.deleteReply() : msg.delete();
      }, 5000);

      return resolve(false);
    }
    if (!interaction.member.voice.channel.joinable) {
      await interaction.reply({
        embeds: [
          client.ErrorEmbed(
            "I don't have enough permission to join your voice channel!"
          ),
        ],
      });
      return resolve(false);
    }

    resolve(interaction.member.voice.channel);
  });
};
