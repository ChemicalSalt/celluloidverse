// index.js (entry)
require("dotenv").config();
const client = require("./client/client");
const webServer = require("./web/server");

// start Discord client (client/client.js exports .start())
client.start();

// start web server
webServer.start();
