import axios from "axios";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Grid,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Snackbar,
  Alert,
  Slide,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const WFHModal = ({ open, onClose }) => {
  const user = useSelector(selectUser);

  const fullName = `${user.staff_fname} ${user.staff_lname}`;

  const [errors, setErrors] = useState([]);
  const [formData, setFormData] = useState({
    requester_id: user.staff_id,
    reporting_manager: user.reporting_manager,
    department: user.dept,
    entries: [{ entry_date: "", duration: "", reason: "" }],
  });
  const [reportingManager, setReportingManager] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false); // Snackbar state
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // success, error, warning, info

  useEffect(() => {
    const getManager = async () => {
      const managerName = await fetchReportingManagerName(
        user.reporting_manager
      );
      if (managerName) {
        setReportingManager(managerName);
      }
    };

    if (user.reporting_manager) {
      getManager();
    }
  }, [user.reporting_manager]);
  useEffect(() => {
    // Clear snackbar message after a successful submission or when the error is fixed
  }, [openSnackbar]);

  const fetchReportingManagerName = async (staffId) => {
    try {
      const response = await axios.get(
        `https://scrumdaddybackend.studio/employees/`,
        {
          params: { staff_id: staffId, dept: "" },
        }
      );
      console.log(response.data.data[0]);
      return (
        response.data.data[0].staff_fname +
        " " +
        response.data.data[0].staff_lname
      );
    } catch (error) {
      console.error("Error fetching reporting manager:", error);
      return null;
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedEntries = [...formData.entries];
    updatedEntries[index][field] = value;
    setFormData({
      ...formData,
      entries: updatedEntries,
    });
    validateField(index, field, value);
  };

  const validateField = (index, field, value) => {
    const newErrors = [...errors];
    const error = {};
    const today = new Date();
    const selectedDate = new Date(formData.entries[index].entry_date);

    // Helper function to determine the next working day
    const getNextWorkingDay = (date) => {
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 5) {
        // Friday submission; next working day is Monday
        date.setDate(date.getDate() + 3);
      } else if (dayOfWeek === 6 || dayOfWeek === 0) {
        // Saturday or Sunday submission; next working day is Monday
        date.setDate(date.getDate() + 2);
      } else {
        // Any other day; next working day is the following day
        date.setDate(date.getDate() + 1);
      }

      return date;
    };

    const nextWorkingDay = getNextWorkingDay(new Date(today));

    if (field === "entry_date" || field === "reason" || field === "duration") {
      if (field === "reason") {
        if (!value.trim()) {
          error.reason = "Reason cannot be blank";
        } else {
          error.reason = "";
        }
      }

      if (field === "entry_date") {
        if (!value.trim()) {
          error.entry_date = "Date must be selected";
        } else if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
          error.entry_date =
            "Work-from-home requests cannot be made for weekends";
        } else if (selectedDate <= nextWorkingDay) {
          error.entry_date = "Date must be at least one working day in advance";
        } else {
          error.entry_date = "";
        }
      }

      if (field === "duration") {
        if (!value.trim()) {
          error.duration = "Duration must be selected";
        } else {
          error.duration = "";
        }
      }
    }

    newErrors[index] = { ...newErrors[index], ...error };
    setErrors(newErrors);
  };
  const [wfhCounts, setWfhCounts] = useState({});

  const fetchWFHCount = async (index, date) => {
    try {
      const response = await axios.get(
        `https://scrumdaddybackend.studio/wfhRequests/getWeeklyCount`,
        {
          params: {
            entry_date: date,
            staff_id: user.staff_id,
          },
        }
      );
      if (response.status === 200) {
        const count = response.data.count;
        console.log(count);
        setWfhCounts((prevCounts) => ({
          ...prevCounts,
          [index]: count,
        }));
      }
    } catch (error) {
      console.error("Error fetching WFH count:", error);
    }
  };

  const validateAllRequests = () => {
    // Helper function to determine the next working day
    const getNextWorkingDay = (date) => {
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 5) {
        // Friday submission; next working day is Monday
        date.setDate(date.getDate() + 3);
      } else if (dayOfWeek === 6 || dayOfWeek === 0) {
        // Saturday or Sunday submission; next working day is Monday
        date.setDate(date.getDate() + 2);
      } else {
        // Any other day; next working day is the following day
        date.setDate(date.getDate() + 1);
      }

      return date;
    };

    const today = new Date();
    const nextWorkingDay = getNextWorkingDay(new Date(today)); // Get the next working day
    console.log(nextWorkingDay);
    const newErrors = formData.entries.map((request, index) => {
      const selectedDate = new Date(request.entry_date);
      const isWeekend =
        selectedDate.getDay() === 0 || selectedDate.getDay() === 6; // Check if it's weekend
      const isReasonValid = request.reason.trim() !== "";
      const isDurationValid = request.duration.trim() !== "";

      const error = {};
      if (!isReasonValid) error.reason = "Reason cannot be blank";
      if (!request.entry_date.trim()) {
        error.entry_date = "Date must be selected";
      } else if (isWeekend) {
        error.entry_date =
          "Work-from-home requests cannot be made for weekends"; // Add weekend validation
      } else if (selectedDate <= nextWorkingDay) {
        // Ensure the selected date is at least one working day in advance
        error.entry_date = "Date must be at least one working day in advance";
      }
      if (!isDurationValid) error.duration = "Duration must be selected";

      return error;
    });

    setErrors(newErrors);
    return newErrors.every((error) => Object.keys(error).length === 0);
  };

  const addMoreDates = () => {
    setFormData({
      ...formData,
      entries: [
        ...formData.entries,
        { entry_date: "", duration: "", reason: "" },
      ],
    });
    setErrors([...errors, {}]);
  };

  const deleteRequest = (index) => {
    const updatedEntries = formData.entries.filter((_, i) => i !== index);
    setFormData((prevFormData) => ({
      ...prevFormData,
      entries: updatedEntries,
    }));
    const newErrors = errors.filter((_, i) => i !== index);
    setErrors(newErrors);
  };

  const [errorQueue, setErrorQueue] = useState([]); // To hold the array of error messages
  const [openSnackbars, setOpenSnackbars] = useState([]); // To hold state of which snackbars are open

  let newErrorQueue = [];

  const checkExistingRequestsAndLeaves = async () => {
    try {
      const [wfhResponse, leaveResponse] = await Promise.all([
        axios.get(
          `https://scrumdaddybackend.studio/wfhRequests/staff/${user.staff_id}`
        ),
        axios.get(
          `https://scrumdaddybackend.studio/leaves/staff/${user.staff_id}`
        ),
      ]);

      const existingRequests = wfhResponse.data.data;
      const existingLeaves = leaveResponse.data.data;
      // console.log(existingRequests);

      // Check WFH requests for conflicts only for the current user
      for (let entry of formData.entries) {
        // Check for pending requests
        const matchedRequest = existingRequests.find(
          (request) =>
            request.requester_id === user.staff_id && // Ensure the requester_id matches
            request.entries.some(
              (r) => r.entry_date === entry.entry_date && r.status === "Pending"
            )
        );

        if (matchedRequest) {
          const errorMessage = `You have a pending WFH request on this date: ${entry.entry_date}`;
          if (!newErrorQueue.includes(errorMessage)) {
            newErrorQueue.push(errorMessage);
          }
        }
      }

      // Check for approved requests
      for (let entry of formData.entries) {
        const matchedRequest = existingRequests.find(
          (request) =>
            request.requester_id === user.staff_id && // Ensure the requester_id matches
            request.entries.some(
              (r) =>
                r.entry_date === entry.entry_date && r.status === "Approved"
            )
        );

        if (matchedRequest) {
          const errorMessage = `You have an approved WFH request on this date: ${entry.entry_date}`;
          if (!newErrorQueue.includes(errorMessage)) {
            newErrorQueue.push(errorMessage);
          }
        }
      }

      // Check Leaves for conflicts
      for (let entry of formData.entries) {
        const matchedLeave = existingLeaves.find(
          (leave) => leave.leave_date === entry.entry_date
        );
        if (matchedLeave) {
          const errorMessage = `You have an approved leave on this date: ${entry.entry_date}`;
          if (!newErrorQueue.includes(errorMessage)) {
            // Check if the error message already exists
            newErrorQueue.push(errorMessage);
          }
        }
      }

      const dateSet = new Set(); // To keep track of unique dates
      const duplicateDates = []; // To hold any duplicate dates found

      formData.entries.forEach((entry) => {
        const entryDate = entry.entry_date;
        if (entryDate) {
          if (dateSet.has(entryDate)) {
            duplicateDates.push(entryDate); // Found a duplicate date
          } else {
            dateSet.add(entryDate); // Add the date to the set
          }
        }
      });

      if (duplicateDates.length > 0) {
        newErrorQueue.push(
          `Duplicate dates found: ${duplicateDates.join(", ")}`
        );
      }

      if (newErrorQueue.length > 0) {
        setErrorQueue(newErrorQueue); // Update the queue with all the errors
        setOpenSnackbars(new Array(newErrorQueue.length).fill(true)); // Open all snackbars at once
        return false; // Stop submission if any conflicts found
      }

      return true; // Allow submission if no conflicts
    } catch (error) {
      console.error("Error checking existing requests and leaves:", error);
      return false;
    }
  };

  // Function to close specific snackbar
  const handleCloseSnackbar = (index) => {
    setOpenSnackbars((prevState) =>
      prevState.map((isOpen, i) => (i === index ? false : isOpen))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateAllRequests();
    const canSubmitRequests = await checkExistingRequestsAndLeaves();

    if (isValid && canSubmitRequests) {
      try {
        // Prepare form data for submission
        const updatedFormData = {
          ...formData,
          entries: formData.entries.map((entry) => ({
            ...entry,
            entry_date: `${entry.entry_date} 00:00:00`, // Append the time part
          })),
        };

        const response = await axios.post(
          "https://scrumdaddybackend.studio/wfhRequests",
          updatedFormData
        );
        console.log("Request submitted successfully:", response.data);

        // Reset form after successful submission
        setFormData({
          requester_id: user.staff_id,
          reporting_manager: user.reporting_manager,
          department: user.dept,
          entries: [{ entry_date: "", duration: "", reason: "" }],
        });
        setWfhCounts([]);
        // Show success Snackbar
        setSnackbarMessage("Request submitted successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true); // Trigger general Snackbar

        setTimeout(() => {
          onClose();
        }, 3000); 

      } catch (error) {
        console.error("Error submitting WFH request:", error);
        setSnackbarMessage("Error submitting request, please try again.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true); // Trigger general Snackbar for error
      }
    } else if (!isValid) {
      // Include validation errors in the error queue
      newErrorQueue.push("Submission failed. Please check form for errors.");
      setErrorQueue(newErrorQueue); // Update the error queue
      setOpenSnackbars(new Array(newErrorQueue.length).fill(true)); // Trigger general Snackbar for validation errors
    } else {
      // Error queue (duplicate requests)
      console.log("Validation failed or duplicate request detected.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ borderRadius: "12px" }}
    >
      <DialogTitle>
        <span>Apply for WFH</span>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose} // Close the modal
          aria-label="close"
          sx={{ position: 'absolute', right: 15, top: 8 }} // Position the button
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <div>
              <strong>Name:</strong> {fullName}
            </div>
          </Grid>
          <Grid item xs={6}>
            <div>
              <strong>Department/Team:</strong> {user.dept}
            </div>
          </Grid>
          <Grid item xs={6}>
            <div>
              <strong>Employee ID:</strong> {user.staff_id}
            </div>
          </Grid>
          <Grid item xs={6}>
            <div>
              <strong>Reporting Manager:</strong> {reportingManager}
            </div>
          </Grid>
        </Grid>

        {formData.entries.map((request, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              padding: 2,
              border: "1px solid #ccc",
              borderRadius: "12px",
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <div className="text-lg font-semibold">Request {index + 1}</div>
              </Grid>

              {wfhCounts[index] !== undefined && (
                <Grid item xs={12}>
                  <Typography color="primary" variant="body2">
                    WFH days taken on selected week: {wfhCounts[index]}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date"
                  type="date"
                  value={request.entry_date}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    handleInputChange(index, "entry_date", selectedDate);

                    if (selectedDate) {
                      fetchWFHCount(index, selectedDate);
                    } else {
                      setWfhCounts((prevCounts) => {
                        const newCounts = Array.isArray(prevCounts) ? [...prevCounts] : []; // Ensure it's an array
                        newCounts[index] = undefined; // Clear the count for the current index
                        return newCounts; // Return the updated array
                      });
                    }
                  }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                  error={!!errors[index]?.entry_date}
                  helperText={errors[index]?.entry_date || ""}
                  // Disable past dates by setting the minimum date to today
                  inputProps={{
                    min: new Date().toISOString().split("T")[0],
                  }}
                  sx={{
                    "& .MuiFormLabel-root": {
                      fontFamily: "'Montserrat', sans-serif",
                    },
                    "& .MuiInputBase-root": {
                      fontFamily: "'Montserrat', sans-serif",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel
                    style={{ fontFamily: 'Montserrat, sans-serif'}}
                  >
                    Duration
                  </InputLabel>
                  <Select
                    value={request.duration}
                    onChange={(e) =>
                      handleInputChange(index, "duration", e.target.value)
                    }
                    label="Duration"
                    required
                    style={{ fontFamily: 'Montserrat, sans-serif'}}
                  >
                    <MenuItem value="AM" style={{ fontFamily: 'Montserrat, sans-serif'}}>AM</MenuItem>
                    <MenuItem value="PM" style={{ fontFamily: 'Montserrat, sans-serif'}}>PM</MenuItem>
                    <MenuItem value="Full Day" style={{ fontFamily: 'Montserrat, sans-serif'}}>Full Day</MenuItem>
                  </Select>
                  {errors[index]?.duration && (
                    <Typography color="error" variant="body2">
                      {errors[index].duration}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Reason for Request"
                  multiline
                  rows={3}
                  value={request.reason}
                  onChange={(e) =>
                    handleInputChange(index, "reason", e.target.value)
                  }
                  fullWidth
                  required
                  sx={{
                    "& .MuiFormLabel-root": {
                      fontFamily: "'Montserrat', sans-serif",
                    },
                    "& .MuiInputBase-root": {
                      fontFamily: "'Montserrat', sans-serif",
                    },
                  }}
                  error={!!errors[index]?.reason}
                  helperText={errors[index]?.reason || ""}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <IconButton
                    onClick={() => deleteRequest(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ))}

        <Button
          onClick={addMoreDates}
          variant="outlined"
          sx={{
            mt: 0,
            borderRadius: "12px",
            color: "#6fb3e5", // Text color
            borderColor: "#6fb3e5", // Border color (outline color)
            "&:hover": {
              backgroundColor: "#d1d5db", // Hover background color
              borderColor: "#d1d5db",
            },
          }}
        >
          Add More Dates
        </Button>
      </DialogContent>

      <DialogActions>
    
        <Box mt={3} mr={1} mb={1}>
          <Button
            variant="outlined"
            onClick={handleSubmit}
            sx={{
              borderRadius: "12px",
              color: "#172554", // Text color
              borderColor: "#172554", // Border color (outline color)
              "&:hover": {
                backgroundColor: "#d1d5db", // Hover background color
                borderColor: "#d1d5db",
              },
            }}
          >
            Submit Request
          </Button>
        </Box>
      </DialogActions>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000} // Automatically hide after 6 seconds
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }} // Position the Snackbar at the top-center
        style={{ top: "10px", right: "10px" }} // Adjust top position to avoid the header
        TransitionComponent={SlideTransition}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {errorQueue.map((errorMessage, index) => (
        <Snackbar
          key={index}
          open={openSnackbars[index]}
          autoHideDuration={10000} // Automatically hide after 6 seconds
          onClose={() => handleCloseSnackbar(index)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }} // Position the Snackbar at the top-left
          style={{ top: `${(index-1) * 60 + 80}px`, right: "10px" }} // Adjust top position to avoid the header
        >
          <Alert onClose={() => handleCloseSnackbar(index)} severity="error">
            {errorMessage}
          </Alert>
        </Snackbar>
      ))}
    </Dialog>
  );
};

export default WFHModal;
