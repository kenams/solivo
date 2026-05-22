exports.up = async function (knex) {
  // Extensions
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "unaccent"');

  // Users
  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.string("email").notNullable().unique();
    t.string("password_hash").notNullable();
    t.string("name").notNullable();
    t.string("avatar_url");
    t.enum("role", ["user", "volunteer", "association", "commerce", "admin"]).defaultTo("user");
    t.string("phone");
    t.string("city");
    t.float("lat");
    t.float("lng");
    t.integer("points").defaultTo(0);
    t.integer("total_donations").defaultTo(0);
    t.integer("maraudes_count").defaultTo(0);
    t.boolean("verified").defaultTo(false);
    t.boolean("email_verified").defaultTo(false);
    t.string("verification_token");
    t.string("reset_token");
    t.timestamp("reset_token_expires");
    t.jsonb("preferences").defaultTo("{}");
    t.timestamps(true, true);
  });

  // Associations
  await knex.schema.createTable("associations", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("owner_id").references("id").inTable("users").onDelete("CASCADE");
    t.string("name").notNullable();
    t.text("description");
    t.string("logo_url");
    t.string("address");
    t.float("lat");
    t.float("lng");
    t.string("city");
    t.string("phone");
    t.string("email");
    t.string("website");
    t.string("siret");
    t.boolean("verified").defaultTo(false);
    t.integer("volunteers_count").defaultTo(0);
    t.integer("beneficiaries_count").defaultTo(0);
    t.timestamps(true, true);
  });

  // Maraudes
  await knex.schema.createTable("maraudes", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("association_id").references("id").inTable("associations").onDelete("CASCADE");
    t.uuid("created_by").references("id").inTable("users");
    t.string("title").notNullable();
    t.text("description");
    t.timestamp("date_start").notNullable();
    t.timestamp("date_end");
    t.string("meeting_point").notNullable();
    t.float("lat").notNullable();
    t.float("lng").notNullable();
    t.string("city");
    t.integer("max_volunteers").defaultTo(10);
    t.integer("volunteers_count").defaultTo(0);
    t.enum("status", ["upcoming", "ongoing", "completed", "cancelled"]).defaultTo("upcoming");
    t.text("route_json");
    t.integer("beneficiaries_helped").defaultTo(0);
    t.timestamps(true, true);
  });

  // Maraude participants
  await knex.schema.createTable("maraude_participants", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("maraude_id").references("id").inTable("maraudes").onDelete("CASCADE");
    t.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    t.enum("status", ["registered", "confirmed", "present", "absent"]).defaultTo("registered");
    t.timestamps(true, true);
    t.unique(["maraude_id", "user_id"]);
  });

  // Signalements
  await knex.schema.createTable("signalements", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("reported_by").references("id").inTable("users");
    t.enum("type", ["homeless", "food", "medical", "family", "urgent", "other"]).notNullable();
    t.text("description");
    t.float("lat").notNullable();
    t.float("lng").notNullable();
    t.string("address");
    t.string("city");
    t.boolean("anonymous").defaultTo(true);
    t.enum("status", ["pending", "assigned", "resolved", "invalid"]).defaultTo("pending");
    t.uuid("assigned_to").references("id").inTable("users");
    t.uuid("assigned_maraude").references("id").inTable("maraudes");
    t.string("photo_url");
    t.integer("upvotes").defaultTo(0);
    t.timestamps(true, true);
  });

  // Dons
  await knex.schema.createTable("donations", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("donor_id").references("id").inTable("users");
    t.integer("amount_cents").notNullable();
    t.string("currency").defaultTo("eur");
    t.string("stripe_session_id");
    t.string("stripe_payment_intent");
    t.enum("status", ["pending", "completed", "refunded", "failed"]).defaultTo("pending");
    t.boolean("anonymous").defaultTo(false);
    t.boolean("recurring").defaultTo(false);
    t.string("recurring_interval");
    t.string("stripe_subscription_id");
    t.uuid("association_id").references("id").inTable("associations");
    t.text("message");
    t.timestamps(true, true);
  });

  // Dépenses (transparence)
  await knex.schema.createTable("expenses", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("association_id").references("id").inTable("associations").onDelete("CASCADE");
    t.uuid("declared_by").references("id").inTable("users");
    t.integer("amount_cents").notNullable();
    t.string("description").notNullable();
    t.enum("category", ["food", "transport", "equipment", "medical", "admin", "other"]).defaultTo("other");
    t.string("receipt_url");
    t.integer("beneficiaries_count").defaultTo(0);
    t.uuid("maraude_id").references("id").inTable("maraudes");
    t.timestamp("expense_date");
    t.timestamps(true, true);
  });

  // Commerces / Invendus
  await knex.schema.createTable("commerces", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("owner_id").references("id").inTable("users");
    t.string("name").notNullable();
    t.string("address");
    t.float("lat");
    t.float("lng");
    t.string("city");
    t.string("phone");
    t.string("email");
    t.enum("type", ["restaurant", "bakery", "supermarket", "other"]).defaultTo("other");
    t.boolean("verified").defaultTo(false);
    t.boolean("active").defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("invendus", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("commerce_id").references("id").inTable("commerces").onDelete("CASCADE");
    t.string("title").notNullable();
    t.text("description");
    t.integer("quantity").defaultTo(1);
    t.string("unit").defaultTo("portions");
    t.timestamp("available_until");
    t.enum("status", ["available", "reserved", "collected", "expired"]).defaultTo("available");
    t.uuid("reserved_by").references("id").inTable("associations");
    t.timestamps(true, true);
  });

  // Badges
  await knex.schema.createTable("badges", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    t.string("badge_key").notNullable();
    t.string("name").notNullable();
    t.text("description");
    t.string("icon");
    t.timestamps(true, true);
    t.unique(["user_id", "badge_key"]);
  });

  // Audit log
  await knex.schema.createTable("audit_logs", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("user_id").references("id").inTable("users");
    t.string("action").notNullable();
    t.jsonb("meta").defaultTo("{}");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("audit_logs");
  await knex.schema.dropTableIfExists("badges");
  await knex.schema.dropTableIfExists("invendus");
  await knex.schema.dropTableIfExists("commerces");
  await knex.schema.dropTableIfExists("expenses");
  await knex.schema.dropTableIfExists("donations");
  await knex.schema.dropTableIfExists("signalements");
  await knex.schema.dropTableIfExists("maraude_participants");
  await knex.schema.dropTableIfExists("maraudes");
  await knex.schema.dropTableIfExists("associations");
  await knex.schema.dropTableIfExists("users");
};
