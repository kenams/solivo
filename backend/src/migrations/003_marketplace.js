exports.up = async function (knex) {
  // Demandes de collecte (association → commerce)
  await knex.schema.createTable("collecte_requests", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("invenu_id").references("id").inTable("invendus").onDelete("CASCADE");
    t.uuid("commerce_id").references("id").inTable("commerces").onDelete("CASCADE");
    t.uuid("association_id").references("id").inTable("associations").onDelete("CASCADE");
    t.uuid("requested_by").references("id").inTable("users");
    t.enum("status", ["pending", "accepted", "rejected", "collected", "cancelled"]).defaultTo("pending");
    t.timestamp("pickup_scheduled_at");
    t.timestamp("collected_at");
    t.string("collector_name"); // Nom du bénévole qui collecte
    t.string("collector_phone");
    t.text("note_association");
    t.text("note_commerce");
    t.string("photo_url"); // Photo de confirmation de collecte
    t.float("quantity_collected"); // Quantité réellement collectée
    // Commission Solivo
    t.integer("commission_cents").defaultTo(150); // 1.50€ par défaut
    t.string("stripe_payment_intent_commission");
    t.enum("commission_status", ["pending", "paid", "waived", "failed"]).defaultTo("pending");
    t.timestamps(true, true);
  });

  // Abonnements commerces (optionnel — plan Pro = commissions réduites)
  await knex.schema.createTable("commerce_subscriptions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("commerce_id").references("id").inTable("commerces").onDelete("CASCADE").unique();
    t.enum("plan", ["free", "pro", "premium"]).defaultTo("free");
    t.string("stripe_customer_id");
    t.string("stripe_subscription_id");
    t.integer("commission_rate_cents").defaultTo(150); // 1.50€ free, 0.90€ pro, 0€ premium
    t.integer("monthly_pickups").defaultTo(0);
    t.integer("total_pickups").defaultTo(0);
    t.integer("total_kg_saved").defaultTo(0);
    t.boolean("active").defaultTo(true);
    t.timestamp("period_start");
    t.timestamp("period_end");
    t.timestamps(true, true);
  });

  // Avis / ratings des collectes
  await knex.schema.createTable("collecte_ratings", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("collecte_request_id").references("id").inTable("collecte_requests").onDelete("CASCADE").unique();
    t.integer("rating_by_association").checkBetween([1, 5]);
    t.integer("rating_by_commerce").checkBetween([1, 5]);
    t.text("comment_association");
    t.text("comment_commerce");
    t.timestamps(true, true);
  });

  // Impact report par commerce (généré mensuellement)
  await knex.schema.createTable("impact_reports", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("commerce_id").references("id").inTable("commerces").onDelete("CASCADE");
    t.integer("year").notNullable();
    t.integer("month").notNullable();
    t.integer("pickups_count").defaultTo(0);
    t.float("kg_saved").defaultTo(0);
    t.integer("meals_equivalent").defaultTo(0);
    t.integer("co2_saved_grams").defaultTo(0);
    t.integer("associations_helped").defaultTo(0);
    t.string("certificate_url");
    t.timestamps(true, true);
    t.unique(["commerce_id", "year", "month"]);
  });

  // Notifications push tokens
  await knex.schema.createTable("push_tokens", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    t.string("token").notNullable();
    t.string("platform").defaultTo("expo"); // expo, fcm, apns
    t.timestamps(true, true);
    t.unique(["user_id", "token"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("push_tokens");
  await knex.schema.dropTableIfExists("impact_reports");
  await knex.schema.dropTableIfExists("collecte_ratings");
  await knex.schema.dropTableIfExists("commerce_subscriptions");
  await knex.schema.dropTableIfExists("collecte_requests");
};
