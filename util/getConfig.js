module.exports = () => {
	return new Promise((res, rej) => {
		try {
			const config = require("../dev-config");
			res(config);
			console.log("Running using dev-config.js")
		} catch {
			try {
				const config = require("../config");
				res(config);
			} catch {
				rej("No config file found.");
			}
		}
	});
};
