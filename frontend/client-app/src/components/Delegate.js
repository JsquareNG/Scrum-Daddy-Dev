import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import IndividualDelegateCard from "./DelegateCard";
import { Snackbar, Slide, Alert, Card, Collapse, CircularProgress, Box } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const DelegateCardPage = () => {
  const user = useSelector(selectUser);
  const staffId = user.staff_id;

  const [delegateData, setDelegateData] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState({})
  const [loading, setLoading] = useState(true); // Add loading state

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const fetchEmployeeDetails = useCallback(async (data) => {
    const details = { ...employeeDetails }; // Clone current details

    await Promise.all(
      data.map(async (record) => {
        const staffIdsToFetch = [record.delegate_from, record.delegate_to].filter(
          (id) => id && !details[id] // Check if staffId exists in details
        );

        await Promise.all(
          staffIdsToFetch.map(async (id) => {
            try {
              const response = await axios.get(`https://scrumdaddybackend.studio/employees/`, {
                params: { staff_id: id, dept: "" },
              });

              if (response.data.data) {
                details[id] = response.data.data[0];
              }
            } catch (error) {
              console.error(`Error fetching name for staff_id ${id}:`, error);
            }
          })
        );
      })
    );

    setEmployeeDetails(details); // Update state with all fetched details
    setLoading(false); // Set loading to false after employee details are fetched
  }, [employeeDetails]);

  useEffect(() => {
    if (delegateData.length > 0) {
      fetchEmployeeDetails(delegateData);
    }
  }, [delegateData, fetchEmployeeDetails]);


  const fetchDelegateByStaffId = async (staffId) => {
    try {
      const response = await axios.get(
        `https://scrumdaddybackend.studio/employees/delegate/${staffId}`
      );
      if (response.data.status_code === 200) {
        setDelegateData(response.data.data);
      } else {
        setDelegateData([]);
        console.error("No records found or error fetching records.");
      }
    } catch (error) {
      console.error("Error fetching delegate records", error);
    }
  };

  const changeDelegateStatus = async (
    delegate_id,
    delegate_from,
    delegate_to,
    status
  ) => {
    try {
      const response = await axios.post(
        `https://scrumdaddybackend.studio/employees/delegate-status-history`,
        { delegate_id, delegate_from, delegate_to, status }
      );

      console.log(response);
      if (response.data.status_code === 200) {
        fetchDelegateByStaffId(staffId);
        setSnackbarMessage("Submitted successfully");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Error updating status");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    fetchDelegateByStaffId(staffId);

    const intervalId = setInterval(() => {
      fetchDelegateByStaffId(staffId);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [staffId]);

  const handleExpandClick = (cardId) => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
  };

  const acceptedDelegates = delegateData
    .filter((record) => record.status === "accepted")
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const pendingDelegates = delegateData.filter(
    (record) => record.status === "pending"
  );
  const myPendingDelegates = pendingDelegates.filter(
    (record) => record.delegate_from === staffId
  );
  const othersPendingDelegates = pendingDelegates.filter(
    (record) => record.delegate_from !== staffId
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ borderRadius: "12px" }} variant="none">
      <p
        gutterBottom
        className="pl-3 font-bold text-md text-center text-blue-900"
      >
        Delegation Requests
      </p>
      {othersPendingDelegates.length > 0 && (
        <div className="text-sm">Pending Requests</div>
      )}
      {othersPendingDelegates.length > 0 ? (
        othersPendingDelegates.map((record) => (
          <IndividualDelegateCard
            key={record.delegate_id}
            record={record}
            employeeDetails={employeeDetails}
            expandedCardId={expandedCardId}
            handleExpandClick={handleExpandClick}
            changeDelegateStatus={changeDelegateStatus}
            user={user}
          />
        ))
      ) : (
        <Card
          variant="body2"
          color="textSecondary"
          className="text-xs text-center font-bold p-2"
        >
          You have no delegation request.
        </Card>
      )}

      {myPendingDelegates.length > 0 && (
        <div className="p-2">
          <div
            onClick={() => handleExpandClick("sent")}
            className="cursor-pointer text-sm flex justify-between"
          >
            <div>Sent Requests</div>
            <div>
              {expandedCardId === "sent" ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </div>
          </div>
          <Collapse in={expandedCardId === "sent"} timeout="auto" unmountOnExit>
            {myPendingDelegates.map((record, index) => (
              <Card
                className="text-xs p-2 flex gap-2 my-2 mx-1"
                variant="outlined"
              >
                <div className="">{index + 1}.</div>
                <div>
                  <div className="font-bold">
                    {`${String(new Date(record.start_date).getDate()).padStart(
                      2,
                      "0"
                    )}/${String(
                      new Date(record.start_date).getMonth() + 1
                    ).padStart(2, "0")}/${new Date(
                      record.start_date
                    ).getFullYear()}`}{" "}
                    -
                    {`${String(new Date(record.end_date).getDate()).padStart(
                      2,
                      "0"
                    )}/${String(
                      new Date(record.end_date).getMonth() + 1
                    ).padStart(2, "0")}/${new Date(
                      record.end_date
                    ).getFullYear()}`}
                  </div>
                  <div>Reason: {record.reason}</div>
                  <div>
                    From:{" "}
                    {record.delegate_from === user.staff_id
                      ? "Me"
                      : `${employeeDetails[record.delegate_from]?.staff_fname} ${employeeDetails[record.delegate_from]?.staff_lname}`}
                  </div>
                  <div>To: {employeeDetails[record.delegate_to].staff_fname} {employeeDetails[record.delegate_to].staff_lname}</div>
                </div>
              </Card>
            ))}
          </Collapse>
        </div>
      )}

      {acceptedDelegates.length > 0 && (
        <div className="p-2">
          <div
            onClick={() => handleExpandClick("accepted")}
            className="cursor-pointer text-sm flex justify-between"
          >
            <div>Accepted Requests</div>
            <div>
              {expandedCardId === "accepted" ? (
                <ExpandLessIcon className="" />
              ) : (
                <ExpandMoreIcon />
              )}
            </div>
          </div>
          <Collapse
            in={expandedCardId === "accepted"}
            timeout="auto"
            unmountOnExit
          >
            {acceptedDelegates.map((record, index) => (
              <div className="py-1">
                <Card
                  variant="outlined"
                  className="text-xs p-2 flex gap-2"
                  key={record.delegate_id}
                >
                  <div className="">{index + 1}.</div>
                  <div>
                    <div className="font-bold">
                      {`${String(
                        new Date(record.start_date).getDate()
                      ).padStart(2, "0")}/${String(
                        new Date(record.start_date).getMonth() + 1
                      ).padStart(2, "0")}/${new Date(
                        record.start_date
                      ).getFullYear()}`}{" "}
                      -
                      {`${String(new Date(record.end_date).getDate()).padStart(
                        2,
                        "0"
                      )}/${String(
                        new Date(record.end_date).getMonth() + 1
                      ).padStart(2, "0")}/${new Date(
                        record.end_date
                      ).getFullYear()}`}
                    </div>
                    <div>Reason: {record.reason}</div>
                    <div>
                      From:{" "}
                      {record.delegate_from === user.staff_id
                        ? "Me"
                        : `${employeeDetails[record.delegate_from]?.staff_fname} ${employeeDetails[record.delegate_from]?.staff_lname}`}
                    </div>
                    <div>
                      To:{" "}
                      {record.delegate_to === user.staff_id
                        ? "Me"
                        : `${employeeDetails[record.delegate_to]?.staff_fname} ${employeeDetails[record.delegate_to]?.staff_lname}`}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </Collapse>
        </div>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={SlideTransition}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default DelegateCardPage;
