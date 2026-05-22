exports.up = async function (knex) {
  // Suivi individuel des bénéficiaires (pseudonymisé RGPD)
  await knex.schema.createTable("beneficiaires", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("association_id").references("id").inTable("associations").onDelete("CASCADE");
    t.string("pseudonym").notNullable(); // Jamais nom réel
    t.integer("age_approx");
    t.enum("genre", ["homme", "femme", "autre", "inconnu"]).defaultTo("inconnu");
    t.string("situation").defaultTo("rue"); // rue, hébergement_urgent, squat, etc.
    t.text("besoins"); // JSON: ["nourriture","vetements","medical"]
    t.text("notes"); // Notes équipe
    t.boolean("suivi_medical").defaultTo(false);
    t.boolean("suivi_social").defaultTo(false);
    t.boolean("consentement").defaultTo(false);
    t.string("zone_habituelle"); // Quartier/rue fréquentée
    t.float("last_seen_lat");
    t.float("last_seen_lng");
    t.timestamp("last_seen_at");
    t.enum("statut", ["actif", "relogé", "perdu_de_vue", "décédé"]).defaultTo("actif");
    t.timestamps(true, true);
  });

  // Rencontres lors des maraudes (lien maraude <-> bénéficiaire)
  await knex.schema.createTable("rencontres", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("maraude_id").references("id").inTable("maraudes").onDelete("CASCADE");
    t.uuid("beneficiaire_id").references("id").inTable("beneficiaires").onDelete("CASCADE");
    t.uuid("reported_by").references("id").inTable("users");
    t.float("lat");
    t.float("lng");
    t.text("note");
    t.jsonb("dons_materiel").defaultTo("[]"); // ["repas","couverture","kit_hygiene"]
    t.enum("etat_general", ["bon", "moyen", "mauvais", "urgence"]).defaultTo("moyen");
    t.boolean("oriente_structure").defaultTo(false);
    t.string("structure_orientation");
    t.timestamps(true, true);
  });

  // Rapport post-maraude
  await knex.schema.createTable("maraude_rapports", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("maraude_id").references("id").inTable("maraudes").onDelete("CASCADE").unique();
    t.uuid("redige_par").references("id").inTable("users");
    t.integer("personnes_rencontrees").defaultTo(0);
    t.integer("repas_distribues").defaultTo(0);
    t.integer("kits_distribues").defaultTo(0);
    t.integer("orientations").defaultTo(0);
    t.text("bilan_qualitatif");
    t.text("incidents");
    t.text("besoins_identifies");
    t.text("zone_couverte");
    t.float("duree_heures");
    t.timestamps(true, true);
  });

  // Messagerie d'équipe (pendant maraude)
  await knex.schema.createTable("team_messages", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("maraude_id").references("id").inTable("maraudes").onDelete("CASCADE");
    t.uuid("sender_id").references("id").inTable("users");
    t.text("content").notNullable();
    t.enum("type", ["text", "alert", "position", "status"]).defaultTo("text");
    t.float("lat");
    t.float("lng");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Positions live des bénévoles pendant maraude
  await knex.schema.createTable("team_positions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("maraude_id").references("id").inTable("maraudes").onDelete("CASCADE");
    t.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    t.float("lat").notNullable();
    t.float("lng").notNullable();
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.unique(["maraude_id", "user_id"]);
  });

  // Stocks/kits disponibles par association
  await knex.schema.createTable("stocks", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("association_id").references("id").inTable("associations").onDelete("CASCADE");
    t.string("item").notNullable();
    t.enum("categorie", ["nourriture", "vetements", "hygiene", "medical", "autre"]).defaultTo("autre");
    t.integer("quantite").defaultTo(0);
    t.string("unite").defaultTo("unités");
    t.timestamps(true, true);
  });

  // Alertes (grand froid, canicule, urgences)
  await knex.schema.createTable("alertes", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.enum("type", ["grand_froid", "canicule", "urgence", "collecte"]).notNullable();
    t.string("titre").notNullable();
    t.text("description");
    t.string("city");
    t.float("lat");
    t.float("lng");
    t.enum("niveau", ["info", "warning", "critical"]).defaultTo("info");
    t.boolean("active").defaultTo(true);
    t.timestamp("expires_at");
    t.uuid("created_by").references("id").inTable("users");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Collectes de matériel
  await knex.schema.createTable("collectes", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("association_id").references("id").inTable("associations");
    t.string("titre").notNullable();
    t.text("description");
    t.jsonb("items_recherches").defaultTo("[]");
    t.string("lieu_depot");
    t.float("lat");
    t.float("lng");
    t.timestamp("date_fin");
    t.enum("status", ["active", "completed"]).defaultTo("active");
    t.integer("participants").defaultTo(0);
    t.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("collectes");
  await knex.schema.dropTableIfExists("alertes");
  await knex.schema.dropTableIfExists("stocks");
  await knex.schema.dropTableIfExists("team_positions");
  await knex.schema.dropTableIfExists("team_messages");
  await knex.schema.dropTableIfExists("maraude_rapports");
  await knex.schema.dropTableIfExists("rencontres");
  await knex.schema.dropTableIfExists("beneficiaires");
};
