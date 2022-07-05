const winston = require("winston");
const colors = require("colors");

class Logger {
	constructor(file) {
		this.logger = winston.createLogger({
			transports: [new winston.transports.File({ filename: file })],
		});
	}
	
	log(Text) {
		const date = new Date().toISOString().replace("T", " - ").split(".")[0]
		this.logger.log({
			level: "info",
			message: "info: " + Text,
		});
		console.log(
			colors.gray(`[${ date }]`) + colors.green(" | " + Text),
		);
	}
	
	warn(Text) {
		const date = new Date().toISOString().replace("T", " - ").split(".")[0]
		this.logger.log({
			level: "warn",
			message: "warn: " + Text,
		});
		console.log(
			colors.gray(`[${ date }]`) + colors.yellow(" | " + Text),
		);
	}
	
	error(Text) {
		const date = new Date().toISOString().replace("T", " - ").split(".")[0]
		this.logger.log({
			level: "error",
			message: "error: " + Text,
		});
		console.log(
			colors.gray(`[${ date }]`) + colors.red(" | " + Text),
		);
	}
}

module.exports = Logger;
