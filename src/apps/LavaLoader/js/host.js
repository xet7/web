function Host() {
	let plugins = {};

	this.register = (name, options) => {
		if (!name)
			throw new Error(`Cannot register plugin, name required`);
		if (plugins[name])
			throw new Error(`Cannot register plugin "${name}" - already registered`);
		if (!options.initialize)
			throw new Error(`Cannot register plugin "${name}" - "initialize" callback required`);
		if (!options.messageHandler)
			throw new Error(`Cannot register plugin "${name}" - "messageHandler" callback required`);
		if (!options.version)
			throw new Error(`Cannot register plugin "${name}" - "version" required`);
		if (!options.description)
			throw new Error(`Cannot register plugin "${name}" - "description" required`);

		plugins[name] = {
			name: name,
			isInitialized: false,
			options: options
		};
	};

	this.isLoaded = (name) => !!plugins[name];

	this.isInitialized = (name) => plugins[name].isInitialized;

	this.sendMessage = (toPlugin, msg) => {
		if (!toPlugin)
			throw new Error(`Cannot send message, plugin recipient required`);
		if (!msg)
			throw new Error(`Cannot send message to the plugin "${toPlugin}", should not be empty`);
		if (!plugins[name])
			throw new Error(`Cannot send message, plugin with name "${toPlugin}" should exist`);

		plugins[name].options.messageHandler(msg);
	};

	this.broadcastMessage = (msg) => {
		if (!msg)
			throw new Error(`Cannot broadcast empty message`);

		for(let pluginName of Object.keys(plugins))
			plugins[pluginName].messageHandler(msg);
	};
}

module.exports = new Host();