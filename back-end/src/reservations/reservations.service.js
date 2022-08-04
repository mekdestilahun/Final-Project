const knex = require("../db/connection");

const tableName = "reservations";

function list(reservation_date) {
  if (reservation_date) {
    return knex(tableName)
      .where({ reservation_date })
      .whereNot({ status: "finished" })
      .whereNot({ status: "canceled" })
      .orderBy("reservation_time");
  }

  return knex(tableName).orderBy("reservation_id");
}

function search(mobile_number) {
  return knex(tableName)
    .where("mobile_number", "like", `%${mobile_number}%`)
    .orderBy("reservation_time");
}

function create(newReservation) {
  return knex(tableName)
    .insert(newReservation, "*")
    .then((createdReservation) => createdReservation[0]);
}

function read(reservation_id) {
  return knex(tableName).where({ reservation_id }).first();
}

function update(newReservation, reservation_id) {
  return knex(tableName)
    .where({ reservation_id })
    .update(newReservation, "*")
    .then((updatedReservation) => updatedReservation[0]);
}

function destroy(reservation_id) {
  return knex(tableName).where({ reservation_id }).del();
}

module.exports = {
  list,
  search,
  create,
  read,
  update,
  delete: destroy,
};
