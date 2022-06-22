const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");

const command = new SlashCommand()
    .setName("clean")
    .setDescription("Cleans the last 100 bot messages from channel.")
    .addIntegerOption((option) =>
        option
            .setName("number")
            .setDescription("Number of messages to delete.")
            .setRequired(false)
    )
    .setRun(async (client, interaction, options) => {

        await interaction.deferReply();
        let number = interaction.options.getInteger("number");
        number = number? ++number : 100;

        let isMusicChannel = client.config.guilds.some(guild => guild.textChannel == interaction.channel.id);
        let player;

        if(isMusicChannel){
            player = client.manager.get(interaction.guild.id);
            if(player){
                player.setSendMusicMessage(client, null);
                player.setNowplayingMessage(client, null);
            }
        }

        interaction.channel.messages.fetch({
            limit: number
        }).then((messages) => {
            const botMessages = [];
            messages.filter(m => m.author.id === client.user.id).forEach(msg =>  botMessages.push(msg))

            botMessages.shift();
            interaction.channel.bulkDelete(botMessages, true)
                .then(async deletedMessages => {
                    //Filtering out messages that did not get deleted.
                    messages = messages.filter(msg => {
                        !deletedMessages.some(deletedMsg => deletedMsg == msg);
                    });
                    if (messages.size > 0) {
                        client.log(`Deleting [${messages.size}] messages older than 14 days.`)
                        messages.deleteAll();
                    }

                    await interaction.editReply({ embeds: [client.Embed(`:white_check_mark: | Deleted ${ botMessages.length } bot messages`)] });
                    setTimeout(() => {
                        interaction.deleteReply();
                    }, 5000);

                    if(isMusicChannel && player){
                        let sendMusicMessage =  await client.channels.cache
                            .get(player.textChannel)
                            .send({
                                embeds: [
                                    new MessageEmbed()
                                        .setDescription("🎶 | Send a song name/link below this message to play music!"),
                                ],
                            });
                        player.setSendMusicMessage(client, sendMusicMessage);
                        if(player.track)
                            player.sendNowplayingMessage(client);
                    }
                })

        });
    })

module.exports = command;
