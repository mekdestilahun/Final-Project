
import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { listTables, updateTable } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";

export default function SeatReservation() {
  let { reservation_id } = useParams();

  const history = useHistory();

  const initialFormState = {
    table_id: "",
    reservation_id,
  };

  const [formData, setFormData] = useState({ ...initialFormState });
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);

  useEffect(loadTables, []);

  function loadTables() {
    const abortController = new AbortController();
    setError(null);
    listTables(abortController.signal).then(setTables).catch(setError);
    return () => abortController.abort();
  }

  const changeHandler = ({ target }) => {
    let value = target.value;

    setFormData({
      ...formData,
      [target.name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const abortController = new AbortController();

    async function seatingReservation() {
      try {
        await updateTable({ data: formData }, abortController.signal);
        history.push(`/dashboard`);
      } catch (error) {
        setError(error);
      }
    }
    seatingReservation();
    return () => abortController.abort();
  };

  return (
    <div>
      <h1>Seat Reservation {reservation_id}</h1>
      <ErrorAlert error={error} />
      <form id="seatReservationForm">
        <div className="form-row">
          <div className="col-3">
            <label className="form-label" htmlFor="table_id">
              Select table for reservation
            </label>
            <select
              id="table_id"
              name="table_id"
              className="custom-select mb-3"
              onChange={changeHandler}
              value={formData.table_id}
            >
              <option defaultValue>Open tables</option>
              {tables.map(
                (table) =>
                  table.reservation_id === null && (
                    <option key={table.table_id} value={table.table_id}>
                      {table.table_name} - {table.capacity}
                    </option>
                  )
              )}
            </select>
          </div>
        </div>
      </form>
      <button
        form="seatReservationForm"
        type="submit"
        className="btn btn-primary"
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  );
}