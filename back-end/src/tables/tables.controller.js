const service = require("./tables.service");
const reservationsService = require("../reservations/reservations.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function list(req, res) {
  const data = await service.list();
  res.status(200).json({ data });
}

async function create(req, res) {
  const { data: newData = {} } = req.body;
  const data = await service.create(newData);
  res.status(201).json({ data });
}

async function read(req, res) {
  const data = res.locals.foundTable;
  res.status(200).json({ data });
}

async function update(req, res) {
  const { tableId } = req.params;
  const { data: updatedData } = req.body;
  const foundReservation = res.locals.foundReservation;

  const data = await service.update(updatedData, tableId);
  await reservationsService.update(
    { status: "seated" },
    foundReservation.reservation_id
  );

  res.status(200).json({ data });
}

async function destroy(req, res) {
  const { tableId } = req.params;
  const foundTable = res.locals.foundTable;
  const foundReservation = await reservationsService.read(
    foundTable.reservation_id
  );

  const data = await service.delete(tableId);
  await reservationsService.update(
    { status: "finished" },
    foundReservation.reservation_id
  );

  res.status(200).json({ data });
}

async function tableExists(req, res, next) {
  const { tableId } = req.params;
  const foundTable = await service.read(tableId);
  if (!foundTable) {
    return next({
      status: 404,
      message: `table number ${tableId} does not exist`,
    });
  }
  res.locals.foundTable = foundTable;
  next();
}

const createRequiredFields = ["table_name", "capacity"];
const updateRequiredFields = ["reservation_id"];

function validateProperties(requiredFields) {
  return (req, res, next) => {
    const { data } = req.body;

    requiredFields.map((field) => {
      if (!data?.[field]) {
        return next({
          status: 400,
          message: `Required field: ${field} is missing`,
        });
      }
    });

    res.locals.foundData = data;
    next();
  };
}

function validatedTableNameAndCapacity(req, res, next) {
  const { table_name, capacity } = res.locals.foundData;
  if (table_name.length < 2) {
    return next({
      status: 400,
      message: `table_name must be at least two characters long.`,
    });
  }

  if (typeof capacity !== "number") {
    return next({
      status: 400,
      message: `capacity value must be a number`,
    });
  }

  next();
}

async function updateValidations(req, res, next) {
  const { reservation_id, capacity } = res.locals.foundTable;
  const data = res.locals.foundData;
  const foundReservation = await reservationsService.read(data.reservation_id);

  if (!foundReservation) {
    return next({
      status: 404,
      message: `reservation number: ${data.reservation_id} does not exist`,
    });
  }

  if (reservation_id) {
    return next({
      status: 400,
      message: "table is occupied",
    });
  }

  if (capacity < foundReservation.people) {
    return next({
      status: 400,
      message: `table does not have sufficient capacity`,
    });
  }

  res.locals.foundReservation = foundReservation;
  next();
}

function isOccupied(req, res, next) {
  const foundTable = res.locals.foundTable;
  if (foundTable.reservation_id) {
    return next({
      status: 400,
      message: "Table is occupied",
    });
  }
  next();
}

function isNotOccupied(req, res, next) {
  const foundTable = res.locals.foundTable;
  if (!foundTable.reservation_id) {
    return next({
      status: 400,
      message: "Table is not occupied",
    });
  }
  next();
}

function isSeated(req, res, next) {
  const foundReservation = res.locals.foundReservation;

  if (foundReservation["status"] === "seated") {
    return next({
      status: 400,
      message: `reservation status is currently seated`,
    });
  }

  next();
}

module.exports = {
  list: asyncErrorBoundary(list),
  create: [
    validateProperties(createRequiredFields),
    validatedTableNameAndCapacity,
    asyncErrorBoundary(create),
  ],
  read: [asyncErrorBoundary(tableExists), asyncErrorBoundary(read)],
  update: [
    asyncErrorBoundary(tableExists),
    validateProperties(updateRequiredFields),
    asyncErrorBoundary(updateValidations),
    isOccupied,
    isSeated,
    asyncErrorBoundary(update),
  ],
  delete: [
    asyncErrorBoundary(tableExists),
    isNotOccupied,
    asyncErrorBoundary(destroy),
  ],
};
