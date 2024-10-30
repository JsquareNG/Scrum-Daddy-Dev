import React, { useState, useEffect, useCallback, useMemo} from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import axios from "axios";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { styled } from '@mui/material/styles';
import Paper from "@mui/material/Paper";
import {
  IconButton,
  TablePagination,
  Collapse,
  Box,
  Typography,
  Button
} from "@mui/material";
import Chip from '@mui/material/Chip';
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent, {
    timelineOppositeContentClasses,
  } from '@mui/lab/TimelineOppositeContent';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import { useParams } from "react-router-dom";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    color: theme.palette.common.black,
    fontFamily: 'Montserrat, sans-serif',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    fontFamily: 'Montserrat, sans-serif',
  },
}));

const StyledTableRow = styled(TableRow)(() => ({
  '&:nth-of-type(odd)': {
    border:0,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const AuditTrail = () => {
  const user = useSelector(selectUser);
  const [outerAudit, setOuterAudit] = useState({});
  const [innerAudit, setInnerAudit] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [loading, setLoading] = useState(true); // Loading state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [open, setOpen] = useState({});
  const [secondOpen, setSecondOpen] = useState({});
  const [tabValue, setTabValue] = useState(0); // Track which tab is selected
  const tabs = [
    { id: 0, label: "WFH Requests Audit" },
    { id: 1, label: "Delegation Requests Audit", role: [1, 3] }
  ];
  const [deleOuterAudit, setDeleOuterAudit] = useState([]);
  const [deleInnerAudit, setDeleInnerAudit] = useState([]);
  const [entryDates, setEntryDates] = useState([]); // State for entryDates
  const [secondEntryDates, setSecondEntryDates] = useState([]); // State for entryDates
  const [dept, setDept] = useState([]);
  const deptNames = [
    'CEO',
    'Consultancy',
    'Engineering',
    'Sales',
    'Solutioning',
    'Finance',
    'HR',
    'IT',
  ]
  const [order, setOrder] = useState('asc'); // or 'desc'
  const [orderBy, setOrderBy] = useState(''); // Column to sort by
  const {requestId} = useParams();
  // const navigate = useNavigate();

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  const handleChange = (event) => {
    setPage(0)
    const {
      target: { value },
    } = event;
    setDept(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const getEmployeeByStaffID = useCallback(async (staff_id) => {
    try {
      const response = await axios.get(
        `https://scrumdaddybackend.studio/employees/`,
        {
          params: { staff_id },
        }
      );
      if (response?.data?.data) {
        return response.data.data[0]; // Assuming the API returns an array of employees
      }
    } catch (error) {
      console.error(
        `Error fetching employee with staff_id ${staff_id}:`,
        error
      );
    }
    return null; // Return null if no data
  }, []);

  const getOuterAudit = useCallback(async () => {
    try {
      const staff_id = user.staff_id;
      let response = null;
      if (user.role === 2 || user.role === 3){
        response = await axios.get(
          `https://scrumdaddybackend.studio/wfhRequests/staff/${staff_id}`
        );
      }
      else{
        response = await axios.get(
          `https://scrumdaddybackend.studio/wfhRequests`
        );
      }

      if (response) {
        const auditTrailData = response.data.data;

        setOuterAudit(auditTrailData);

        const employeePromises = [];
        const staffIds = new Set();

        auditTrailData.forEach((eachAuditTrail) => {
          const { requester_id, reporting_manager } = eachAuditTrail;

          if (requester_id && !staffIds.has(requester_id)) {
            staffIds.add(requester_id);
            employeePromises.push(
              getEmployeeByStaffID(requester_id).then((requestorDetails) => {
                if (requestorDetails) {
                  return { [requester_id]: requestorDetails };
                }
                return null;
              })
            );
          }

          if (reporting_manager && !staffIds.has(reporting_manager)) {
            staffIds.add(reporting_manager);
            employeePromises.push(
              getEmployeeByStaffID(reporting_manager).then(
                (reportingManagerDetails) => {
                  if (reportingManagerDetails) {
                    return { [reporting_manager]: reportingManagerDetails };
                  }
                  return null;
                }
              )
            );
          }
        });

        const employeeDetailsArray = await Promise.all(employeePromises);
        const newEmployeeDetails = employeeDetailsArray.reduce(
          (acc, detail) => {
            if (detail) {
              return { ...acc, ...detail };
            }
            return acc;
          },
          {}
        );

        setEmployeeDetails((prevDetails) => ({
          ...prevDetails,
          ...newEmployeeDetails,
        }));
      }
    } catch (error) {
      console.error(`Error fetching audit trail`);
    } finally {
      setLoading(false); // Stop loading after data is fetched
    }
  }, [user, getEmployeeByStaffID]);

  const getInnerAudit = useCallback(async (request_id) => {
    try {
      setInnerAudit([]);
      const response = await axios.get(
        `https://scrumdaddybackend.studio/wfhRequests/getAuditTrail/${request_id}`
      );

      if (response) {
        const fetchedInnerAudit = response.data.data;
        let dates = []; // Temporary array for entry_dates
        let i = 0;

        // Use a while loop to gather entry_dates and their indices
        while (i < fetchedInnerAudit.length) {
          if (fetchedInnerAudit[i].status === 'Pending' && fetchedInnerAudit[i].entry_date) {
            // Push an object with entry_date and index into the array
            dates.push({ date: fetchedInnerAudit[i].entry_date, index: i });
          }
          i++; // Move to the next instance
        }

        // Update the state with entryDates
        setEntryDates(dates);
        
        // Set the innerAudit state with fetched data
        setInnerAudit(fetchedInnerAudit.reverse());
      }
    } catch (error) {
      console.error(`Error fetching employee with`);
    }
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleRow = useCallback((request_id) => {
    setOpen((prevOpen) => (prevOpen === request_id ? null : request_id));
    getInnerAudit(request_id);
  }, [getInnerAudit]);

  const filteredOuterAudit = useMemo(() => {
    if(tabValue === 0){
      if (dept.length === 0) {
        return outerAudit; // Return all if no filters are applied
      }
      
      return outerAudit.filter(audit => 
        dept.includes(audit.department) // Assuming `audit.department` is where you check the department
      );
    }
    else{
      if (dept.length === 0) {
        return deleOuterAudit; // Return all if no filters are applied
      }
      
      return deleOuterAudit.filter(audit => 
        dept.includes(audit.department) // Assuming `audit.department` is where you check the department
      );
    }
   
  }, [outerAudit, deleOuterAudit, dept, tabValue]);

  const sortedAudits = useMemo(() => {
    // Ensure filteredOuterAudit is an array
    if (!Array.isArray(filteredOuterAudit)) {
      return []; // or return filteredOuterAudit || [] to avoid issues
    }
  
    return filteredOuterAudit.slice().sort((a, b) => {
      // Ensure orderBy is a valid property before trying to access it
      if (orderBy) {
        if (order === 'asc') {
          return a[orderBy] < b[orderBy] ? -1 : 1;
        }
        return a[orderBy] < b[orderBy] ? 1 : -1;
      }
      return 0; // No sorting if orderBy is not set
    });
  }, [filteredOuterAudit, order, orderBy]);

  
  

  useEffect(() => {
    if (requestId && tabValue === 0 && sortedAudits.length > 0) {
      // Find the index of the request with the matching requestId
      const index = sortedAudits.findIndex((audit) => audit.request_id === parseInt(requestId, 10));
  
      if (index !== -1) {
        // Calculate the page containing the request
        const requestPage = Math.floor(index / rowsPerPage);
        
        // Set the page to where the request is located
        setPage(requestPage);
  
        // Use handleToggleRow to open the specific request row
        handleToggleRow(requestId);
      }
    }
  }, [requestId, sortedAudits, rowsPerPage, tabValue, handleToggleRow]);
  

  const handleSecondToggleRow = (request_id) => {
    setSecondOpen((prevSecondOpen) =>
      prevSecondOpen === request_id ? null : request_id
    );
    getDeleInnerAudit(request_id);
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue); // Change active tab
    setLoading(true);
    setDept([])

    setPage(0);
    setRowsPerPage(5);

    setOpen({});
    setSecondOpen({});

    if (newValue === 1) {
      getDeleOuterAudit();
    } else {
      getOuterAudit();
    }
  };

  const getDeleOuterAudit = async () => {
    try {
      const staff_id = user.staff_id;
      let response = null;

      if (user.role === 1) {
        response = await axios.get(
          `https://scrumdaddybackend.studio/employees/delegate`
        );
      } else {
        response = await axios.get(
          `https://scrumdaddybackend.studio/employees/delegate/${staff_id}`
        );
      }
      
      if (response) {
        const delegateData = response.data.data;
        setDeleOuterAudit(delegateData);

        let dates = {}

        const employeePromises = [];
        const newEmployeeDetails = { ...employeeDetails }; // Start with existing employee details

        delegateData.forEach((delegate) => {
          const { delegate_from, delegate_to } = delegate;

          dates[delegate.delegate_id] = {
            start_date: delegate.start_date,
            end_date: delegate.end_date
          };

          // Check if delegate_from exists in employeeDetails
          if (!newEmployeeDetails[delegate_from]) {
            employeePromises.push(
              getEmployeeByStaffID(delegate_from).then((details) => {
                if (details) {
                  return { [delegate_from]: details };
                }
                return null;
              })
            );
          }

          // Check if delegate_to exists in employeeDetails
          if (!newEmployeeDetails[delegate_to]) {
            employeePromises.push(
              getEmployeeByStaffID(delegate_to).then((details) => {
                if (details) {
                  return { [delegate_to]: details };
                }
                return null;
              })
            );
          }
        });

        setSecondEntryDates(dates)

        // Wait for all employee details to resolve
        const employeeDetailsArray = await Promise.all(employeePromises);
        const updatedEmployeeDetails = employeeDetailsArray.reduce(
          (acc, detail) => {
            if (detail) {
              return { ...acc, ...detail };
            }
            return acc;
          },
          {}
        );

        // Update employeeDetails state with new data
        setEmployeeDetails((prevDetails) => ({
          ...prevDetails,
          ...updatedEmployeeDetails,
        }));
      }
    } catch (error) {
      console.error(`Error fetching employee with`);
    } finally {
      setLoading(false); // Stop loading after data is fetched
    }
  };

  const getDeleInnerAudit = async (request_id) => {
    try {
      setDeleInnerAudit([]);
      const response = await axios.get(
        `https://scrumdaddybackend.studio/employees/delegate-status-history/${request_id}`
      );

      if (response) {
        setDeleInnerAudit(response.data.data.reverse());
      }
    } catch (error) {
      console.error(`Error fetching employee with`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // 'en-GB' formats the date as DD/MM/YYYY
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);

    // Extract the components
    const day = String(date.getDate()).padStart(2, "0"); // Get day and pad with zero if needed
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Get month (0-based)
    const year = date.getFullYear(); // Get full year
    const hours = String(date.getHours()).padStart(2, "0"); // Get hours
    const minutes = String(date.getMinutes()).padStart(2, "0"); // Get minutes
    const seconds = String(date.getSeconds()).padStart(2, "0"); // Get seconds

    // Format the date and time
    return `${day}-${month}-${year}, ${hours}:${minutes}:${seconds}`;
  };


  
  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  

  

  useEffect(() => {
    if (user) {
      getOuterAudit();
    }
  }, [user, getOuterAudit]);

  return (
    <div>
      {/* Tabs for WFH and Delegation Requests */}
      <div className="audit-container">
      <div className="mb-3"><span className="text">Audit Logs</span></div>

      <div className="tabs mb-8">
        {tabs
          .filter(tab => !tab.role || tab.role.includes(user?.role)) // Filter based on role
          .map((tab) => (
            <button
              key={tab.id}
              className={`tab ${tabValue === tab.id ? 'active' : ''}`}
              onClick={(event) => handleChangeTab(event, tab.id)}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {user?.role === 1 && (
        <>
        <FormControl sx={{ mb: 3, width: "50%", height: '40px'}}>
          <InputLabel id="demo-multiple-checkbox-label" 
          style={{ fontFamily: 'Montserrat, sans-serif'}} 
          size="small"
          >Department</InputLabel>
          <Select
            labelId="demo-multiple-checkbox-label"
            id="demo-multiple-checkbox"
            multiple
            value={dept}
            onChange={handleChange}
            input={<OutlinedInput label="Department" />}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={MenuProps}
            style={{ fontFamily: 'Montserrat, sans-serif' }}
            sx={{ height: '40px', 
              '& .MuiSelect-select': {
                color: 'black', // Change text color
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'black', // Change border color
              },
             }}
          >
            {deptNames.map((name) => (
              <MenuItem key={name} value={name} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Checkbox checked={dept.includes(name)} />
                <ListItemText primary={name}
                sx={{
                  '& .MuiTypography-root': {fontFamily: 'Montserrat, sans-serif'}
                }}/>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {dept.length > 0 && (
          <Button 
            variant="outlined" 
            onClick={() => setDept([])} 
            sx={{ height: '40px', 
              marginLeft: 2,
              borderColor: 'black', // Change border color to black
              color: 'black', // Change text color to black 
              }} // Add some spacing to the left
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Clear
          </Button>
        )}
        </>
      )}
      </div>
      
      {/* Show loading spinner while loading */}
      {loading ? (
        <Stack
          spacing={2}
          direction="row"
          justifyContent="center"
          alignItems="center"
          sx={{ height: "80vh" }}
        >
          <CircularProgress />
        </Stack>
      ) : (
        <>
        <div className="tabs-container">
          {tabValue === 0 && (
            <>
            {sortedAudits.length === 0 ? (
              <Typography sx={{ textAlign: 'center', margin: 2 }} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                No WFH Requests Found.
              </Typography>
            ) : (
              <TableContainer component={Paper} sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
                <Table sx={{ minWidth: 650 }} aria-label="WFH requests table">
                  <TableHead>
                    <StyledTableRow>
                      <StyledTableCell />
                      <StyledTableCell onClick={() => handleSortRequest('request_id')}>
                        Request ID
                        {orderBy === 'request_id' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('requester')}>
                        Requester
                        {orderBy === 'requester' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('reporting_manager')}>
                        Reporting Manager
                        {orderBy === 'reporting_manager' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('department')}>
                        Department
                        {orderBy === 'department' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('created_at')}>
                        Created at
                        {orderBy === 'created_at' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('overall_status')}>
                        Overall Status
                        {orderBy === 'overall_status' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                    </StyledTableRow>
                  </TableHead>
                  <TableBody>
                    {sortedAudits
                      ?.slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((eachAudit, index) => {
                        let requesterLastName = employeeDetails[eachAudit.requester_id]?.staff_lname;
                        let requesterFirstName =
                          employeeDetails[eachAudit.requester_id]?.staff_fname;
                        let requesterName = requesterFirstName + " " + requesterLastName;
                        let reportingManagerFirstName = 
                        employeeDetails[eachAudit.reporting_manager]
                        ?.staff_fname;
                        let reportingManagerLastName =
                          employeeDetails[eachAudit.reporting_manager]
                            ?.staff_lname;
                        let reportingManagerName = reportingManagerFirstName + " " + reportingManagerLastName;

                        if (requesterFirstName === user.staff_fname) {
                          requesterName = "Me";
                        }
                        if (reportingManagerFirstName === user.staff_fname) {
                          reportingManagerName = "Me";
                        }

                        return (
                          <React.Fragment key={eachAudit.request_id}>
                            <StyledTableRow
                              sx={{
                                "&:last-child td, &:last-child th": { border: 0 },
                              }}
                            >
                              <StyledTableCell>
                                <IconButton
                                  aria-label="expand row"
                                  size="small"
                                  onClick={() =>
                                    handleToggleRow(eachAudit.request_id)
                                  }
                                >
                                  {open === eachAudit.request_id ? (
                                    <KeyboardArrowUpIcon />
                                  ) : (
                                    <KeyboardArrowDownIcon />
                                  )}
                                </IconButton>
                              </StyledTableCell>
                              <StyledTableCell>{eachAudit.request_id}</StyledTableCell>
                              <StyledTableCell>{requesterName}</StyledTableCell>
                              <StyledTableCell>{reportingManagerName}</StyledTableCell>
                              <StyledTableCell>{eachAudit.department}</StyledTableCell>
                              <StyledTableCell>
                                {formatDateTime(eachAudit.created_at)}
                              </StyledTableCell>
                              <StyledTableCell>
                              <Chip
                                label={eachAudit.overall_status}
                                sx={{
                                  backgroundColor:
                                    eachAudit.overall_status === 'Pending'
                                    ? '#f97316'
                                    : eachAudit.overall_status === 'Approved'
                                    ? '#065f46'
                                    : eachAudit.overall_status === 'Rejected'
                                    ? '#dc2626'
                                    : eachAudit.overall_status === 'Cancelled'
                                    ? '#be185d'
                                    : eachAudit.overall_status === 'Withdrawn'
                                    ? '#1e40af'
                                    : eachAudit.overall_status === 'Reviewed'
                                    ? '#581c87'
                                    : eachAudit.overall_status === 'Pending Withdrawal'
                                    ? '#854d0e'
                                    : eachAudit.overall_status === 'Auto Rejected'
                                    ? '#111827'
                                    : 'default',
                                  color: 'white',
                                }}
                              />
                              </StyledTableCell>
                            </StyledTableRow>
                            {/* Collapsible row */}
                            <StyledTableRow>
                              <StyledTableCell
                                style={{ paddingBottom: 0, paddingTop: 0 }}
                                colSpan={7}
                              >
                                <Collapse
                                  in={open === eachAudit.request_id}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <Box margin={1}>
                                    {innerAudit && (
                                      <Timeline 
                                          sx={{
                                              [`& .${timelineOppositeContentClasses.root}`]: {
                                              flex: 0.2,
                                              },
                                          }}
                                      >
                                        
                                          {innerAudit.map((eachIAudit, index) => {
                                              let requesterFirstName = employeeDetails[eachIAudit.requester_id]?.staff_fname;
                                              let requesterLastName = employeeDetails[eachIAudit.requester_id]?.staff_lname;
                                              let requesterName = requesterFirstName + " " + requesterLastName;
                                              let reportingManagerFirstName = employeeDetails[eachIAudit.reporting_manager]?.staff_fname;
                                              let reportingManagerLastName = employeeDetails[eachIAudit.reporting_manager]?.staff_lname;
                                              let reportingManagerName = reportingManagerFirstName + " " + reportingManagerLastName;
                                              let icon = null
                                              let message = ''
                                              let action = ''
                                              let color = ''
                                              let showDate = true;

                                              // if (index > 0 && innerAudit[index - 1].created_at === eachIAudit.created_at) {
                                              //     showDate = false; // Set flag to false if created_at is the same
                                              // }
                                              if (index < innerAudit.length - 1 && innerAudit[index + 1].created_at === eachIAudit.created_at) {
                                                showDate = false; // Set flag to false if created_at is the same in the reversed order
                                              }

                                              if (eachIAudit.status === "Pending"){
                                                  if(eachIAudit.entry_id){
                                                      message = `WFH request for ${eachIAudit.entry_date}.`; // Combine the dates
                                                  }
                                                  else{
                                                      message = `${requesterName} has requested for a WFH Request.`
                                                      icon = <EditNoteIcon/>
                                                  }
                                                  color = '#0288d1'
                                              }
                                              else if(eachIAudit.status === "Self-withdrawn" || eachIAudit.status === "Cancelled"){
                                                  if(eachIAudit.entry_id){
                                                      if(eachIAudit.status === "Self-withdrawn"){
                                                          action = 'withdrawn'
                                                      }
                                                      else{
                                                          action = 'cancelled'
                                                      }
                                                      message = `${requesterName} has ${action} their WFH Request on ${formatDate(eachIAudit.entry_date)}.`

                                                  }
                                                  else{
                                                      message = `Overall request status has changed to ${eachIAudit.status}.`
                                                  }
                                                  color = '#f44336'
                                                  
                                              }
                                              else{
                                                  if(eachIAudit.status === "Approved" || eachIAudit.status === "Approved"){
                                                    icon = <DoneOutlineIcon/>
                                                    color = '#66bb6a'
                                                  }
                                                  else if (eachIAudit.status === "Rejected" || eachIAudit.status === "Auto Rejected" || eachIAudit.status === "Withdrawn"){
                                                    icon = <HighlightOffIcon/>
                                                    color = '#f44336'
                                                  }
                                                  if(eachIAudit.entry_id){
                                                      action = eachIAudit.status.toLowerCase()
                                                      message = `${reportingManagerName} has ${action} WFH Request on ${formatDate(eachIAudit.entry_date)}.`
                                                    }
                                                  else{
                                                      message = `Overall request status has been updated to ${eachIAudit.status}.`
                                                      icon = <RateReviewOutlinedIcon/>
                                                      color = '#9e9e9e'
                          
                                                  }
                                              }

                                              return (
                                                !entryDates.some((entry) => entry.index === innerAudit.length - 1 - index) && (
                                                  <TimelineItem key={index}>
                                                      <TimelineOppositeContent
                                                          sx={{ m: 'auto 0' }}
                                                          align="right"
                                                          variant="body2"
                                                          color="text.secondary"
                                                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                                                      >
                                                          {showDate ? formatDateTime(eachIAudit.created_at) : ""}
                                                      </TimelineOppositeContent>
                                                      <TimelineSeparator>
                                                          <TimelineConnector />
                                                          <TimelineDot
                                                          sx={{
                                                            bgcolor: 
                                                              color
                                                          }}>
                                                              {icon}
                                                          </TimelineDot>
                                                          <TimelineConnector />
                                                      </TimelineSeparator>
                                                      <TimelineContent sx={{ py: '20px', px: 2 }}>
                                                          <Typography style={{ fontFamily: 'Montserrat, sans-serif' }} component="span">
                                                              {message}
                                                          </Typography>
                                                          {index === innerAudit.length - 1 && entryDates && (
                                                            <Typography style={{ fontFamily: 'Montserrat, sans-serif', fontSize: "14px", color: "gray" }}>
                                                              Following dates: {entryDates.map(entry => formatDate(entry.date)).join(', ')}
                                                            </Typography>
                                                          )}
                                                          {eachIAudit.action_reason && (
                                                            <Typography style={{ fontFamily: 'Montserrat, sans-serif', fontSize: "14px", color: "gray" }}>
                                                              Reason: {eachIAudit.action_reason}
                                                            </Typography>
                                                          )}
                                                          {eachIAudit.status === 'Auto Rejected' && (
                                                            <Typography style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                                              Reason: System auto rejected your request as it lapsed into the 24 working hours.
                                                            </Typography>
                                                          )}
                                                      </TimelineContent>
                                                  </TimelineItem>
                                                )
                                              );
                                          })}
                                      </Timeline>
                                    )}
                                  </Box>
                                </Collapse>
                              </StyledTableCell>
                            </StyledTableRow>
                          </React.Fragment>
                        );
                      })}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={sortedAudits?.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{
                    '& .MuiTablePagination-selectRoot': {
                      fontFamily: 'Montserrat, sans-serif', 
                    },
                    '& .MuiTablePagination-toolbar': {
                      fontFamily: 'Montserrat, sans-serif', 
                    },
                    '& .MuiTablePagination-displayedRows': {
                      fontFamily: 'Montserrat, sans-serif',
                    },
                    '& .MuiButtonBase-root': {
                      fontFamily: 'Montserrat, sans-serif', 
                    },
                    '& .MuiTablePagination-selectLabel': {
                      fontFamily: 'Montserrat, sans-serif', 
                    },
                    '& .MuiTablePagination-select': {
                      fontFamily: 'Montserrat, sans-serif',
                    },
                  }}
                />
              </TableContainer>
            )}
            </>
          )}</div>

          {/* Delegation Requests Audit Tab */}
          <div className="tabs-container">
          {tabValue === 1 && (
            <>
            {sortedAudits.length === 0 ? (
              <Typography style={{ fontFamily: 'Montserrat, sans-serif' }} sx={{ textAlign: 'center', margin: 2 }}>
                No Delegate Requests Found.
              </Typography>
            ) : (
              <TableContainer component={Paper} sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
                <Table
                  sx={{ minWidth: 650 }}
                  aria-label="delegation requests table"
                >
                  <TableHead>
                    <StyledTableRow>
                      <StyledTableCell />
                      <StyledTableCell onClick={() => handleSortRequest('request_id')}>
                        Request ID
                        {orderBy === 'request_id' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('requester')}>
                        Requester
                        {orderBy === 'requester' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('delegatee')}>
                        Delegatee
                        {orderBy === 'delegatee' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('department')}>
                        Department
                        {orderBy === 'department' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell>
                        Reason
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('start_date')}>
                        Start Date
                        {orderBy === 'start_date' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('end_date')}>
                        End Date
                        {orderBy === 'end_date' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                      <StyledTableCell onClick={() => handleSortRequest('overall_status')}>
                        Overall Status
                        {orderBy === 'overall_status' && (order === 'asc' ? <ArrowUpward /> : <ArrowDownward />)}
                      </StyledTableCell>
                    </StyledTableRow>
                  </TableHead>
                  <TableBody>
                    {sortedAudits
                      ?.slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((eachDeleAudit, index) => {
                        let requesterFirstName =
                          employeeDetails[eachDeleAudit.delegate_from]
                            ?.staff_fname;
                        let requesterLastName = 
                          employeeDetails[eachDeleAudit.delegate_from]
                          ?.staff_lname;
                        let requesterName = requesterFirstName + " " + requesterLastName;
                        let reportingManagerFirstName =
                          employeeDetails[eachDeleAudit.delegate_to]?.staff_fname;
                        let reportingManagerLastName = 
                          employeeDetails[eachDeleAudit.delegate_to]?.staff_lname;
                        let reportingManagerName = reportingManagerFirstName + " " + reportingManagerLastName;

                        if (requesterFirstName === user.staff_fname) {
                          requesterName = "Me";
                        }
                        if (reportingManagerFirstName === user.staff_fname) {
                          reportingManagerName = "Me";
                        }

                        return (
                          <React.Fragment key={eachDeleAudit.delegate_id}>
                            <StyledTableRow
                              sx={{
                                "&:last-child td, &:last-child th": { border: 0 },
                              }}
                            >
                              <StyledTableCell>
                                <IconButton
                                  aria-label="expand row"
                                  size="small"
                                  onClick={() =>
                                    handleSecondToggleRow(
                                      eachDeleAudit.delegate_id
                                    )
                                  }
                                >
                                  {secondOpen === eachDeleAudit.delegate_id ? (
                                    <KeyboardArrowUpIcon />
                                  ) : (
                                    <KeyboardArrowDownIcon />
                                  )}
                                </IconButton>
                              </StyledTableCell>
                              <StyledTableCell>{eachDeleAudit.delegate_id}</StyledTableCell>
                              <StyledTableCell>{requesterName}</StyledTableCell>
                              <StyledTableCell>{reportingManagerName}</StyledTableCell>
                              <StyledTableCell>{eachDeleAudit.department}</StyledTableCell>
                              <StyledTableCell>{eachDeleAudit.reason}</StyledTableCell>
                              <StyledTableCell>
                                {formatDate(eachDeleAudit.start_date)}
                              </StyledTableCell>
                              <StyledTableCell>
                                {formatDate(eachDeleAudit.end_date)}
                              </StyledTableCell>
                              <StyledTableCell>
                                 <Chip
                                  label={eachDeleAudit.status.charAt(0).toUpperCase() +
                                    eachDeleAudit.status.slice(1)}
                                  sx={{
                                    backgroundColor:
                                    eachDeleAudit.status.charAt(0).toUpperCase() +
                                    eachDeleAudit.status.slice(1) === 'Pending'
                                      ? '#f97316'
                                      : eachDeleAudit.status.charAt(0).toUpperCase() +
                                      eachDeleAudit.status.slice(1) === 'Accepted'
                                      ? '#065f46'
                                      : eachDeleAudit.status.charAt(0).toUpperCase() +
                                      eachDeleAudit.status.slice(1) === 'Rejected'
                                      ? '#dc2626'
                                      : 'default',
                                    color: 'white',
                                  }}
                                />
                              </StyledTableCell>
                            </StyledTableRow>
                            <StyledTableRow>
                              <StyledTableCell
                                style={{ paddingBottom: 0, paddingTop: 0 }}
                                colSpan={9}
                              >
                                <Collapse
                                  in={secondOpen === eachDeleAudit.delegate_id}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <Box margin={1}>
                                    {deleInnerAudit && (
                                      <Timeline
                                      sx={{
                                        [`& .${timelineOppositeContentClasses.root}`]: {
                                        flex: 0.2,
                                        },
                                      }}>
                                        {deleInnerAudit.map((eachDAudit, index) => {
                                          let requesterFirstName = employeeDetails[eachDAudit.delegate_from]?.staff_fname;
                                          let requesterLastName = employeeDetails[eachDAudit.delegate_from]?.staff_lname;
                                          let requesterName = requesterFirstName + " " + requesterLastName;
                                          let reportingManagerFirstName = employeeDetails[eachDAudit.delegate_to]?.staff_fname;
                                          let reportingManagerLastName = employeeDetails[eachDAudit.delegate_to]?.staff_lname;
                                          let reportingManagerName = reportingManagerFirstName + " " + reportingManagerLastName;
                                          let icon = null
                                          let message = ''
                                          let color = ''

                                          if(eachDAudit.status === "pending"){
                                            message = `${requesterName} has sent you a delegate request.`
                                            icon = <EditNoteIcon/>
                                            color = '#0288d1'
                                          }
                                          else{
                                            message = `${reportingManagerName} has ${eachDAudit.status} your delegate request.`
                                            if(eachDAudit.status === 'accepted'){
                                              icon = <DoneOutlineIcon/>
                                              color = '#66bb6a'
                                            }
                                            else{
                                              icon = <HighlightOffIcon/>
                                              color = '#f44336'
                                            }
                                          }

                                          return (
                                            <TimelineItem key={index}>
                                              <TimelineOppositeContent
                                                  sx={{ m: 'auto 0' }}
                                                  align="right"
                                                  variant="body2"
                                                  color="text.secondary"
                                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                              >
                                                  {formatDateTime(eachDAudit.updated_on)}
                                              </TimelineOppositeContent>
                                              <TimelineSeparator>
                                                  <TimelineConnector />
                                                  <TimelineDot
                                                  sx={{
                                                    bgcolor: 
                                                      color
                                                  }}>
                                                      {icon}
                                                  </TimelineDot>
                                                  <TimelineConnector />
                                              </TimelineSeparator>
                                              <TimelineContent sx={{ py: '20px', px: 2 }}>
                                                  <Typography style={{ fontFamily: 'Montserrat, sans-serif' }} component="span">
                                                      {message}
                                                  </Typography>
                                                  {index === deleInnerAudit.length - 1 && secondEntryDates && (
                                                    <Typography style={{ fontFamily: 'Montserrat, sans-serif', fontSize: "14px", color: 'gray' }}>
                                                      From {formatDate(secondEntryDates[eachDAudit.delegate_id].start_date)} to {formatDate(secondEntryDates[eachDAudit.delegate_id].end_date)}
                                                    </Typography>
                                                  )}
                                              </TimelineContent>
                                          </TimelineItem>
                                          )
                                        })}
                                      </Timeline>
                                    )}
                                  </Box>
                                </Collapse>
                              </StyledTableCell>
                            </StyledTableRow>
                          </React.Fragment>
                        );
                      })}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={sortedAudits?.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{
                    '& .MuiTablePagination-selectRoot': {
                      fontFamily: 'Montserrat, sans-serif', 
                    },
                    '& .MuiTablePagination-toolbar': {
                      fontFamily: 'Montserrat, sans-serif', 
                    },
                    '& .MuiTablePagination-displayedRows': {
                      fontFamily: 'Montserrat, sans-serif',
                    },
                    '& .MuiButtonBase-root': {
                      fontFamily: 'Montserrat, sans-serif', 
                    },
                    '& .MuiTablePagination-selectLabel': {
                      fontFamily: 'Montserrat, sans-serif', 
                    },
                    '& .MuiTablePagination-select': {
                      fontFamily: 'Montserrat, sans-serif',
                    },
                  }}
                />
              </TableContainer>
            )}
            </>
          )}
          </div>
        </>
      )}
    </div>
  );
};

export default AuditTrail;
