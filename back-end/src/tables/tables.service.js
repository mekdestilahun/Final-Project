const knex = require("../db/connection");

const tableName = "tables";

function list() {
  return knex(tableName).orderBy("table_name");
}

function create(newTable) {
  return knex(tableName)
    .insert(newTable, "*")
    .then((createdTable) => createdTable[0]);
}

function read(table_id) {
  return knex(tableName).where({ table_id }).first();
}

function update(updateTable, table_id) {
  return knex(tableName)
    .where({ table_id })
    .update(updateTable)
    .returning("*")
    .then((updatedTable) => updatedTable[0]);
}

function destroy(table_id) {
  return knex(tableName)
    .where({ table_id })
    .update({ reservation_id: null })
    .returning("*")
    .then((data) => data[0]);
}

module.exports = {
  list,
  create,
  read,
  update,
  delete: destroy,
};
