module.exports = {
	cmdPerPage: 10, //Number of commands per page of help command
	adminId: "339261785053855744", // Admin of the bot
	guilds: [
		{
			name: "22 Community",
			id: "684644748073369629",
			voiceChannel: "684650826773430295", // voice channel ID to auto join on bot restart
			textChannel: "987259543446777916", // text channel ID to listen for song names and autoplay them
		},
		{
			name: "Saud's Server",
			id: "689135944078852154",
			voiceChannel: "878731071481602049", // voice channel ID to auto join on bot restart
			textChannel: "985988530125815859", // text channel ID to listen for song names and autoplay them
		},
		{
			name: "Narcos's Server",
			id: "754644311114514444",
			voiceChannel: "771532867019735091", // voice channel ID to auto join on bot restart
			textChannel: "989715634315231332", // text channel ID to listen for song names and autoplay them
		},
	],
	token: process.env.Token || "", //Bot's Token
	clientId: process.env.Discord_ClientID || "", //ID of the bot
	clientSecret: process.env.Discord_ClientSecret || "", //Client Secret of the bot
	port: process.env.PORT || 4200, //Port of the API and Dashboard
	scopes: ["identify", "guilds", "applications.commands"], //Discord OAuth2 Scopes
	serverDeafen: false, //If you want bot to stay deafened
	defaultVolume: 100, //Sets the default volume of the bot, You can change this number anywhere from 1 to 100
	supportServer: "https://discord.gg/sbySMS7m3v", //Support Server Link
	Issues: "https://github.com/SudhanPlayz/Discord-MusicBot/issues", //Bug Report Link
	permissions: 277083450689, //Bot Inviting Permissions
	disconnectTime: 30000, //How long should the bot wait before disconnecting from the voice channel. in miliseconds. set to 1 for instant disconnect.
	alwaysPlay: false, // when set to true music will always play no matter if there's no one in voice channel.
	debug: true, //Debug mode
	cookieSecret: "CodingWithSudhan is epic", //Cookie Secret
	website: "http://localhost:" + this.port, //without the / at the end
	// Lavalink server; optional public lavalink -> https://lavalink-list.darrennathanael.com/
	// The default one should work fine.
	nodes: [
		{
			identifier: this.host, //- Used for identifier in stats commands.
			host: "audio.alexanderof.xyz",
			port: 2000,
			password: "lavalink",
			retryAmount: 9999, //- The amount of times to retry connecting to the node if connection got dropped.
			retryDelay: 40, //- Delay between reconnect attempts if connection is lost.
			secure: false, //- Can be either true or false. Only use true if ssl is enabled!
		},
	],
	embedColor: "#000000", //Color of the embeds, hex supported
	presence: {
		//PresenceData object | https://discord.js.org/#/docs/main/stable/typedef/PresenceData
		status: "online", // You can have online, idle, and dnd(invisible too, but it makes people think the bot is offline)
		activities: [
			{
				name: "22 On Top", //Status Text
				type: "WATCHING", // PLAYING, WATCHING, LISTENING, STREAMING
			},
		],
	},
	iconURL: "https://cdn.darrennathanael.com/icons/spinning_disk.gif", //This icon will be in every embed's author field
};
