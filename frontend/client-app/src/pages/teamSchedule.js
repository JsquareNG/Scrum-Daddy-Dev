import * as React from 'react';
import { useSelector } from "react-redux";
import { useState, useEffect } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Checkbox, FormControlLabel, TablePagination, CircularProgress, Grid, Tooltip, Card, CardContent, Typography } from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import { styled } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip,Legend } from 'recharts'; 
import './AttendanceTracker.css'; 

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

const AttendanceTracker = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [employees, setEmployees] = useState([]);
  const [showWorkingFromHome, setShowWorkingFromHome] = useState(true);
  const [showWorkingInOffice, setShowWorkingInOffice] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaveData, setLeaveData] = useState([]);
  const [showOnLeave, setShowOnLeave] = useState(true)
  const [isDayNavigationEnabled, setIsDayNavigationEnabled] = useState(false);

  const user = useSelector((state) => state.user);
  const selectedDateString = selectedDate.format('YYYY-MM-DD');


  useEffect(() => {
    if (showFilters) {
      setLoading(true);
      const fetchData = async () => {
        try {
          // Fetch attendance data
          const attendanceResponse = await axios.get(`https://scrumdaddybackend.studio/attendance/`, {
            params: { date: selectedDateString },
          });
          let employees = attendanceResponse.data.data;
          if (user.userInfo.role === 3 || user.userInfo.role === 2) {
            employees = employees.filter(emp => emp.dept === user.userInfo.dept);
          }

          // Fetch leave data
          const leaveResponse = await axios.get(`https://scrumdaddybackend.studio/leaves/date/${selectedDateString}`);
          const leaveData = leaveResponse.data.data;
          console.log(leaveData)
          setEmployees(employees);
          setLeaveData(leaveData);
        } catch (error) {
          console.error('Error fetching attendance or leave data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedDateString, showFilters, user.userInfo.role, user.userInfo.dept]);

  const departments = [...new Set(employees.map(emp => emp.dept))];

   // Function to check if the employee is on leave
   const isEmployeeOnLeave = (employeeId) => {
    if (leaveData){
      return leaveData.some((leave) => leave.employee_id === employeeId);
    }
    else {
      setLeaveData([])
    }
  };
  
  const searchedEmployees = employees.filter((employee) =>
    employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredByDepartment = (selectedDept !== 'All')
    ? searchedEmployees.filter((employee) => employee.dept === selectedDept)
    : searchedEmployees;

    const filteredByStatus = filteredByDepartment.filter((employee) => {
      const isOnLeave = isEmployeeOnLeave(employee.requester_id); // Check if employee is on leave
      if (showOnLeave && isOnLeave) return true; // Include if the checkbox is checked and employee is on leave
      if (showWorkingFromHome && employee.workingFromHome) return true; // Include working from home
      if (showWorkingInOffice && !employee.workingFromHome) return true; // Include working in office
      return false; // Exclude if none of the conditions match
    });

  const pieData = [
    showWorkingFromHome && { name: 'Working from Home', value: filteredByStatus.filter(emp => emp.workingFromHome).length },
    showWorkingInOffice &&{ name: 'In Office', value: filteredByStatus.filter(emp => !emp.workingFromHome).length },
    showOnLeave && { name: 'On Leave', value: filteredByStatus.filter(emp => isEmployeeOnLeave(emp.requester_id)).length }
  ].filter(Boolean);

  //const renderCustomLabel = ({ name, value }) => `${name}: ${value}`;
 const COLORS = [];
  if (showWorkingFromHome) COLORS.push('#fed7aa'); // Color for Working from Home
  if (showWorkingInOffice) COLORS.push('#bfdbfe');  // Color for In Office
  if (showOnLeave) COLORS.push('#a7f3d0'); // Color for On Leave
  const departmentAttendance = departments.map(dept => {
    const deptTotal = employees.filter(emp => emp.dept === dept).length;
    return { dept, total: deptTotal };
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handlePreviousDay = () => {
    if (!isDayNavigationEnabled) return; // Check if navigation is enabled
    let previousDay = selectedDate.subtract(1, 'day');
    while (isWeekend(previousDay)) {
      previousDay = previousDay.subtract(1, 'day');
    }
    setSelectedDate(previousDay);
  };
  
  const handleNextDay = () => {
    if (!isDayNavigationEnabled) return; // Check if navigation is enabled
    let nextDay = selectedDate.add(1, 'day');
    while (isWeekend(nextDay)) {
      nextDay = nextDay.add(1, 'day');
    }
    setSelectedDate(nextDay);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedDept('All');
    setShowWorkingFromHome(true);
    setShowWorkingInOffice(true);
    setShowFilters(false);
  };

  // Function to check if the selected date is a weekend (Saturday or Sunday)
  const isWeekend = (date) => {
    const day = date.day(); // 0 for Sunday, 6 for Saturday
    return day === 0 || day === 6;
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

 
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeptCardClick = (dept) => {
    setSelectedDept(dept);
  };
 
  const handleWorkingFromHomeChange = (e) => {
    setShowWorkingFromHome(e.target.checked);
  };

  const handleWorkingInOfficeChange = (e) => {
    setShowWorkingInOffice(e.target.checked);
  };
  


  const handleShowAttendance = () => {
    setShowFilters(true);
    setIsDayNavigationEnabled(true); // Enable navigation buttons after showing schedule
  };

  //if (user.userInfo.role !== 1 && user.userInfo.role !== 3) {
    //return <h3>You do not have permission to view this page.</h3>;
  //}

  return (

    <div>
      <div className="separation-container">
        <div className="mb-3"><span className="text">Team Schedule</span></div>
        <div alignItems="center">
          <Grid item xs={12} sm={6}>
            <span style={{fontWeight: "bold"}}>View team's schedule on</span>
            <p style={{marginTop: "10px"}}>
              <LocalizationProvider dateAdapter={AdapterDayjs} >
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} />}
                  shouldDisableDate={(date) => {
                    const day = date.day(); // day() gives 0 for Sunday and 6 for Saturday
                    return day === 0 || day === 6; // Disable Sunday (0) and Saturday (6)
                  }}
                  style={{marginLeft:'10px',marginTop:'10px', fontFamily: "'Montserrat', sans-serif"}}
                  sx={{
                    '& .MuiFormLabel-root': {
                      fontFamily: "'Montserrat', sans-serif",
                    },
                    '& .MuiInputBase-root': {
                      fontFamily: "'Montserrat', sans-serif",
                    },
                  }}
                />
              </LocalizationProvider>
              {!isWeekend(selectedDate) && (
                <>
                <Button
                  variant="contained"
                  onClick={handlePreviousDay}
                  disabled={!isDayNavigationEnabled || isWeekend(selectedDate.subtract(1, 'day'))}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    marginLeft: "10px",
                    marginTop: "10px",
                    backgroundColor: (!isDayNavigationEnabled || isWeekend(selectedDate.subtract(1, 'day'))) ? '' : 'black', // Change 'yourEnabledColor' to the desired enabled color
                  }}
                >
                  Previous Day
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleShowAttendance}
                  style={{ fontFamily: "'Montserrat', sans-serif", marginLeft: "10px", marginTop: "10px", backgroundColor: 'black' }}
                >
                  Show Schedule
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNextDay}
                  disabled={!isDayNavigationEnabled || isWeekend(selectedDate.add(1, 'day'))}
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    marginLeft: "10px",
                    marginTop: "10px",
                    backgroundColor: (!isDayNavigationEnabled || isWeekend(selectedDate.subtract(1, 'day'))) ? '' : 'black', // Change 'yourEnabledColor' to the desired enabled color
                  }}
                >
                  Next Day
                </Button>
              </>
                
              )}
            </p>
          </Grid>
        </div>
      </div>

      {isWeekend(selectedDate) && (
        <p style={{ color: 'red', marginTop: '10px' }}>
          Attendance cannot be shown for weekends (Saturday and Sunday).
        </p>
      )}

      {showFilters && (
        <>
        <div className="team-container">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <CircularProgress />
            </div>
          ) : (
            <>
              <div style={{ maxWidth: "100%" }}>
                  <TextField
                    size="small"
                    label="Search by Name"
                    variant="outlined"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    fullWidth
                    sx={{
                      '& .MuiInputLabel-root': {
                        fontFamily: "'Montserrat', sans-serif",
                      },
                      '& .MuiInputBase-root': {
                        fontFamily: "'Montserrat', sans-serif",
                    }}}
                  />
              </div>
              <div>
                <div style={{fontSize: "30px", fontWeight: "bold", paddingTop: "5px"}}>Schedule for {selectedDate.format('YYYY-MM-DD')}</div>
                <Grid container spacing={2}>
                  <Grid item sm={12} md={4} style={{paddingTop: "20px"}}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showWorkingFromHome}
                          onChange={handleWorkingFromHomeChange}
                          color="primary"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        />
                      }
                      label="Working from Home"
                      sx={{
                        '& .MuiFormControlLabel-label': {
                          fontFamily: "'Montserrat', sans-serif",
                        },
                      }}
                    />
                    <p>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showWorkingInOffice}
                          onChange={handleWorkingInOfficeChange}
                          color="primary"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        />
                      }
                      label="Working in Office"
                      sx={{
                        '& .MuiFormControlLabel-label': {
                          fontFamily: "'Montserrat', sans-serif",
                        },
                      }}
                    />
                    </p>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showOnLeave}
                        onChange={(e) => setShowOnLeave(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="On Leave"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontFamily: "'Montserrat', sans-serif",
                      },
                    }}
                  />
                  <p>
                  <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleClear}
                      style={{ fontFamily: "'Montserrat', sans-serif", marginTop: "5px", backgroundColor: "navy" }}
                    >
                      Clear Filters
                    </Button>
                  </p>
                  </Grid>
                  <Grid item xs={12} sm={12} md={8}>
                  <PieChart width={570} height={250}> 
                      <Pie
                        data={pieData}
                        cx="15%"
                        cy="40%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    
                      {/* Add Legend to display the name and value */}
                      <Legend 
                        formatter={(value, entry) => `${entry.payload.name}: ${entry.payload.value}`} 
                        layout="vertical" 
                        verticalAlign="middle"
                      />
                      <RechartsTooltip />
                    </PieChart>
                    </Grid>
                </Grid>
              </div>
         
              <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
              <Grid container spacing={2}>
              <div style={{fontSize: "20px", fontWeight: "bold", paddingLeft: "20px", paddingTop: "10px" }}>Click cards to filter by department</div>
              {user.userInfo.role === 1 && (
                <Grid item xs={12}>
                <Card
                  onClick={() => handleDeptCardClick('All')}
                  style={{ cursor: 'pointer', minHeight: '85px',
                    backgroundColor: selectedDept === 'All' ? '#cfe8fc' : 'white', // Change color if selected
                  }}
                  variant="outlined"
                >
                  <CardContent>
                    <Typography style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: "bold"}}>All Departments</Typography>
                    <Typography style={{ fontFamily: "'Montserrat', sans-serif" }}>Total: {employees.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
                )}
                {departmentAttendance.map((deptInfo) => (
                  <Grid item xs={12} key={deptInfo.dept}>
                  <Card
                    onClick={() => handleDeptCardClick(deptInfo.dept)}
                    style={{ cursor: 'pointer', minHeight: '85px', 
                      backgroundColor: selectedDept === deptInfo.dept ? '#cfe8fc' : 'white'
                    }}
                    variant="outlined"
                  >
                    <CardContent>
                      <Typography style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: "bold" }}>{deptInfo.dept}</Typography>
                      <Typography style={{ fontFamily: "'Montserrat', sans-serif" }}>Attendance: {deptInfo.total}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                ))}
              </Grid>
              </Grid>

              <Grid item xs={12} sm={8}>
              <TableContainer component={Paper} style={{ overflowX: 'auto' }} sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
                <Table>
                  <TableHead>
                    <StyledTableRow>
                      <StyledTableCell>Name</StyledTableCell>
                      <StyledTableCell>Department</StyledTableCell>
                      <StyledTableCell>Status</StyledTableCell>
                      <StyledTableCell>Duration</StyledTableCell>
                      <StyledTableCell>Reason</StyledTableCell>
                      <StyledTableCell>Date</StyledTableCell>
                    </StyledTableRow>
                  </TableHead>
                  <TableBody>
                      {filteredByStatus
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((employee) => {
                          // Create the URL based on the user's position
                          let requestUrl = '';
                          const onLeave = isEmployeeOnLeave(employee.requester_id); 
                          console.log(user.userInfo)
                          if (user.userInfo.staff_id === employee.requester_id && user.userInfo.role===3 ) {
                            requestUrl = `/myManagerRequestsPage`;
                          } else if (user.userInfo.staff_id === employee.requester_id && user.userInfo.position.includes("MD")) {
                            requestUrl = `/jackPersonalRequestsPage`;
                          } else if (user.userInfo.staff_id === employee.requester_id && user.userInfo.position.includes("Director")) {
                            requestUrl = `/myRequestsPage`;
                          } else if(user.userInfo.staff_id === employee.request_id && user.userInfo.position === "HR Team"){
                            requestUrl = `/hrRequestsPage`;
                          } else if(user.userInfo.staff_id === employee.request_id && user.userInfo.role===2){
                            requestUrl = `/staffRequestsPage`;
                          }

                          if (user.userInfo.staff_id !== employee.requester_id && user.userInfo.role!==2 && user.userInfo.staff_id !== employee.reporting_manager ) {
                            requestUrl = `auditTrail`;
                          } 

                          if (user.userInfo.staff_id === employee.reporting_manager && user.userInfo.role===3 ) {
                            requestUrl = `managerRequestsPage`;
                          } else if (user.userInfo.staff_id === employee.reporting_manager && user.userInfo.position.includes("MD")&&user.userInfo.staff_id !== employee.requester_id) {
                            requestUrl = `jackRequestsPage`;
                          } else if (user.userInfo.staff_id === employee.reporting_manager && user.userInfo.position.includes("Director")) {
                            requestUrl = `requestsPage`;
                          } else if(user.userInfo.staff_id === employee.reporting_manager && user.userInfo.position === "HR Team"){
                            requestUrl = `employeeRequestsPage`;
                          }


                          return (
                            <StyledTableRow key={employee.employee_name}>
                              <StyledTableCell>
                                {employee.workingFromHome && requestUrl ? (
                                  <Tooltip title="Working from Home">
                                    {/* Conditionally wrap with <a> if user position matches */}
                                    <a href={requestUrl} style={{ textDecoration: 'underline', color: 'blue' }} >
                                      
                                      {employee.employee_name}
                                    </a>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title={employee.workingFromHome ? 'Working from Home' : 'In Office'}>
                                    <span>{employee.employee_name}</span>
                                  </Tooltip>
                                )}
                              </StyledTableCell>
                              <StyledTableCell>{employee.dept}</StyledTableCell>
                              <StyledTableCell> {onLeave ? 'On Leave' : employee.workingFromHome ? 'Working from Home' : 'Working in Office'}</StyledTableCell>
                              <StyledTableCell>{employee.duration !== null ? employee.duration : '-'}</StyledTableCell>
                              <StyledTableCell>{employee.reason !== null ? employee.reason : '-'}</StyledTableCell>
                              <StyledTableCell>{employee.date !== null ? employee.date : '-'}</StyledTableCell>
                            </StyledTableRow>
                          );
                        })}
                    </TableBody>
                  
                </Table>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredByStatus.length}
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
              </Grid>
              </Grid>
            </>

          )}
          </div>
        </>
      )}
    </div>
    
  );
};

export default AttendanceTracker;
