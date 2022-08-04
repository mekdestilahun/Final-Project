const service = require("./reservations.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function list(req, res) {
  const { date } = req.query;
  const { mobile_number } = req.query;

  const data = mobile_number
    ? await service.search(mobile_number)
    : await service.list(date);

  res.status(200).json({ data });
}

async function create(req, res) {
  const { data: newData = {} } = req.body;
  const data = await service.create(newData);
  res.status(201).json({ data });
}

async function read(req, res) {
  const data = res.locals.foundReservation;
  res.status(200).json({ data });
}

async function update(req, res) {
  const { reservationId } = req.params;
  const { data: newData } = req.body;
  const data = await service.update(newData, reservationId);
  res.status(200).json({ data });
}

async function destroy(req, res) {
  const { reservationId } = req.params;
  await service.delete(reservationId);
  res.sendStatus(204);
}

async function reservationExists(req, res, next) {
  const { reservationId } = req.params;
  const foundReservation = await service.read(reservationId);

  if (!foundReservation) {
    return next({
      status: 404,
      message: `Reservation number ${reservationId} does not exist`,
    });
  }

  res.locals.foundReservation = foundReservation;
  next();
}

const requiredFields = [
  "first_name",
  "last_name",
  "mobile_number",
  "reservation_date",
  "reservation_time",
  "people",
];

function handleTimeDate(date, time) {
  return new Date( date.slice(0, 4), date.slice(5, 7) - 1, date.slice(8), time.slice(0, 2), time.slice(3) );
}

function validateRequiredProperties(req, res, next) {
  const { data = {} } = req.body;

  if (data?.["status"] && data["status"] !== "booked") {
    return next({
      status: 400,
      message: `reservation is ${data["status"]}`,
    });
  }

  if (!data["reservation_date"]?.match(/\d{4}-\d{2}-\d{2}/g)) {
    return next({
      status: 400,
      message: `reservation_date does not match the pattern`,
    });
  }

  if (!data["reservation_time"]?.match(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) {
    return next({
      status: 400,
      message: `reservation_time does not match pattern`,
    });
  }

  if (data["people"] && typeof data["people"] !== "number") {
    return next({
      status: 400,
      message: `people value must be a number`,
    });
  }

  requiredFields.map((field) => {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Required field: ${field} is missing`,
      });
    }
  });

  const errorAlerts = [];
  const reservationDate = data["reservation_date"];
  const reservationTime = data["reservation_time"];

  const now = new Date();
  const dateAndTime = handleTimeDate(reservationDate, reservationTime);

  if (dateAndTime < handleTimeDate(reservationDate, "10:30")) {
    errorAlerts.push(
      "The restaurant opens at 10:30 AM. Please pick a time during when the restaurant will be open"
    );
  }

  if (dateAndTime > handleTimeDate(reservationDate, "21:30")) {
    errorAlerts.push(
      "The restaurant closes at 10:30 PM. The reservation time is too close to the restaurant closing time."
    );
  }
  const dateOrTime = dateAndTime.getDay() === now.getDay() ? "time" : "date";

  if (dateAndTime < now) {
    errorAlerts.push(
      `The reservation ${dateOrTime} is in the past. Please pick a ${dateOrTime} in the future`
    );
  }

  if (dateAndTime.getDay() === 2) {
    errorAlerts.push(`The restaurant is closed on Tuesdays`);
  }

  if (errorAlerts.length > 0) {
    return next({
      status: 400,
      message: errorAlerts.length > 1 ? errorAlerts : errorAlerts[0],
    });
  }

  next();
}

function statusValidation(req, res, next) {
  const { data = {} } = req.body;
  const foundReservation = res.locals.foundReservation;
  if (data["status"] === "unknown") {
    return next({
      status: 400,
      message: `reservation status is ${data["status"]}`,
    });
  }

  if (foundReservation["status"] === "finished") {
    return next({
      status: 400,
      message: `reservation status is currently finished`,
    });
  }

  next();
}

module.exports = {
  list: asyncErrorBoundary(list),
  create: [validateRequiredProperties, asyncErrorBoundary(create)],
  read: [asyncErrorBoundary(reservationExists), asyncErrorBoundary(read)],
  update: [
    asyncErrorBoundary(reservationExists),
    validateRequiredProperties,
    statusValidation,
    asyncErrorBoundary(update),
  ],
  updateStatus: [
    asyncErrorBoundary(reservationExists),
    statusValidation,
    asyncErrorBoundary(update),
  ],
  delete: [asyncErrorBoundary(reservationExists), asyncErrorBoundary(destroy)],
};
