//TODO: construct proper toml file
//https://www.npmjs.com/package/json2toml

export default (setup) => `[matrix]
homeserver = "${setup.services.matrix.homeserver}"
user = "${setup.services.matrix.bot.username}"
password = "${setup.services.matrix.bot.password}"
admins = ["${setup.services.matrix.bot.admins.join('","')}"]

[api]
listen = "127.0.0.1:8383"
secret = "${setup.services.matrix.bot.apikey}"

[backend]
host = "${setup.services.matrix.backend.host}"
integrations_endpoint = "${setup.services.matrix.backend.endpoint}"
user = "${setup.services.matrix.backend.username}"
password = "${setup.services.matrix.backend.password}"
`;