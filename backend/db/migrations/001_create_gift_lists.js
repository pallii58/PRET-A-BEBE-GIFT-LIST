export const up = async (knex) => {
  await knex.schema.createTable("gift_lists", (table) => {
    table.increments("id").primary();
    table.string("shop_domain").notNullable();
    table.string("customer_email").notNullable();
    table.string("first_name");
    table.string("last_name");
    table.string("phone");
    table.string("title").notNullable();
    table.string("public_url").notNullable().unique();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

export const down = async (knex) => {
  await knex.schema.dropTableIfExists("gift_lists");
};

