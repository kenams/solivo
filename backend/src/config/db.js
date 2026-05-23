const knex = require("knex");
const { env } = require("./env");

// En production, on parse la DATABASE_URL pour injecter ssl explicitement
function getConnection() {
  if (env.nodeEnv !== "production") {
    return env.databaseUrl;
  }
  return {
    connectionString: env.databaseUrl,
    ssl: { rejectUnauthorized: false },
  };
}

const db = knex({
  client: "pg",
  connection: getConnection(),
  pool: { min: 0, max: 10 },
  acquireConnectionTimeout: 30000,
});

module.exports = { db };
