const knex = require("knex");
const { env } = require("./env");

const db = knex({
  client: "pg",
  connection: {
    connectionString: env.databaseUrl,
    ssl: env.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
  },
  pool: { min: 2, max: 10 },
});

module.exports = { db };
