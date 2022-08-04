
import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { createReservation, readReservation, updateReservation } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import ReservationsForm from "../reservations/ReservationsForm";

export default function EditReservations() {
  let { reservation_id } = useParams();

  const history = useHistory();

  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);


  function loadReservation() {
    const abortController = new AbortController();
    setError(null);
    readReservation({ reservation_id }, abortController.signal)
      .then(setFormData)
      .catch(setError);
    return () => abortController.abort();
  }

  useEffect(loadReservation, [reservation_id]);

  const changeHandler = ({ target }) => {
    let value = target.value;
    if (target.name === "people") {
      value = Number(value);
    }
    setFormData({
      ...formData,
      [target.name]: value,
    });
  };

  function handleSubmit(event) {
    event.preventDefault();
    if(reservation_id) {
      updateReservation({ data: { ...formData, reservation_time: formData.reservation_time.slice(0, 5) }})
      .then(() => {
        history.push(`/dashboard?date=${formData.reservation_date}`)
      })
      .catch(setError)
    } else {
      createReservation(formData)
      .then(() => {
        history.push(`/dashboard?date=${formData.reservation_date}`)
      })
    }
  };

  return (
    <>
      <h1>Edit Reservation</h1>
      <ErrorAlert error={error} />
      <ReservationsForm changeHandler={changeHandler} formData={formData} />
      <button className="btn btn-secondary mr-2" onClick={history.goBack}>
        Cancel
      </button>
      <button
        form="reservationForm"
        type="submit"
        className="btn btn-primary"
        onClick={handleSubmit}
      >
        Submit
      </button>
    </>
  );
}
