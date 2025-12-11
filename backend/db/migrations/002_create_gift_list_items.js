export const up = async (knex) => {
  await knex.schema.createTable("gift_list_items", (table) => {
    table.increments("id").primary();
    table
      .integer("gift_list_id")
      .unsigned()
      .references("id")
      .inTable("gift_lists")
      .onDelete("CASCADE");
    table.string("product_id").notNullable();
    table.string("variant_id").notNullable();
    table.integer("quantity").notNullable().defaultTo(1);
    table.boolean("purchased").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

export const down = async (knex) => {
  await knex.schema.dropTableIfExists("gift_list_items");
};

