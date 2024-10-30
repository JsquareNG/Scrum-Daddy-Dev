import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import "moment-timezone";
import axios from "axios";
import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import HomeSharpIcon from "@mui/icons-material/HomeSharp";
import ApartmentSharpIcon from "@mui/icons-material/ApartmentSharp";
import LogoutSharpIcon from "@mui/icons-material/LogoutSharp";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Typography from "@mui/material/Typography";
import { ButtonGroup } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WFHModal from "../components/WFHModal";
import "../index.css"; // Import your new CSS here
import DelegateModal from "../components/DelegateForm";
import DelegateCardPage from "../components/Delegate";
import WorkIcon from "@mui/icons-material/Work"; // MUI Icon Example
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd"; // MUI Icon Example

const CustomToolbar = React.memo((toolbar) => {
  const goToMonthView = () => {
    toolbar.onView("month");
  };

  const goToWeekView = () => {
    toolbar.onView("week");
  };

  const goToDayView = () => {
    toolbar.onView("day");
  };

  return (
    <div className="flex md:flex-row flex-col justify-between pb-4 items-center">
      <div>
        <ButtonGroup aria-label="Basic button group">
          <Button
            sx={{
              border: "1px solid #888",
              color: "#888",
              backgroundColor: "#fff", // Background color black
              "&:hover": {
                backgroundColor: "#999", // Slightly lighter shade on hover
              },
            }}
            onClick={() => toolbar.onNavigate("PREV")}
          >
            <ArrowBackIcon />
          </Button>
          <Button
            sx={{
              border: "1px solid #888",
              color: "#888",
              backgroundColor: "#fff",
              "&:hover": {
                backgroundColor: "#999",
              },
            }}
            onClick={() => toolbar.onNavigate("TODAY")}
          >
            Today
          </Button>
          <Button
            sx={{
              border: "1px solid #888",
              color: "#888",
              backgroundColor: "#fff", // Background color black
              "&:hover": {
                backgroundColor: "#999", // Slightly lighter shade on hover
              },
            }}
            onClick={() => toolbar.onNavigate("NEXT")}
          >
            <ArrowForwardIcon />
          </Button>
        </ButtonGroup>
      </div>
      <div className="">{toolbar.label}</div>
      <div>
        <ButtonGroup>
          <Button
            sx={{
              border: "1px solid #888",
              color: "#888",
              backgroundColor: "#fff", // Background color black
              "&:hover": {
                backgroundColor: "#999", // Slightly lighter shade on hover
              },
            }}
            onClick={goToMonthView}
            className={toolbar.view === "month" ? "rbc-active" : ""}
          >
            Month
          </Button>
          <Button
            sx={{
              border: "1px solid #888",
              color: "#888",
              backgroundColor: "#fff", // Background color black
              "&:hover": {
                backgroundColor: "#999", // Slightly lighter shade on hover
              },
            }}
            onClick={goToWeekView}
            className={toolbar.view === "week" ? "rbc-active" : ""}
          >
            Week
          </Button>
          <Button
            sx={{
              border: "1px solid #888",
              color: "#888",
              backgroundColor: "#fff",
              "&:hover": {
                backgroundColor: "#999",
              },
            }}
            onClick={goToDayView}
            className={toolbar.view === "day" ? "rbc-active" : ""}
          >
            Day
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
});

const PersonalCalendar = () => {
  const user = useSelector(selectUser);
  const staffId = user.staff_id;
  const firstName = user.staff_fname;
  const lastName = user.staff_lname;
  const position = user.position;
  const department = user.dept;

  const localizer = momentLocalizer(moment);
  const [openDelegateModal, setOpenDelegateModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "event-popover" : undefined;

  const [WFHModalOpen, setWFHModalOpen] = useState(false);
  const openWFHModal = () => setWFHModalOpen(true);
  const closeWFHModal = () => setWFHModalOpen(false);

  const [userWFHInfo, setUserWFHInfo] = useState({
    totalWFHDays: 0,
    totalLeaveDays: 0,
    totalOfficeDays: 0,
    todayArrangement: "",
    tomorrowArrangement: "",
  });

  const [wfhrequests, setWFHRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Concurrently fetch WFH and Leave Requests
  const fetchWFHAndLeaveRequests = async () => {
    try {
      const [wfhResponse, leaveResponse] = await Promise.all([
        axios.get(
          `https://scrumdaddybackend.studio/wfhRequests/requester/${staffId}`
        ),
        axios.get(`https://scrumdaddybackend.studio/leaves/staff/${staffId}`),
      ]);

      const wfhData = wfhResponse.data.data;
      const leaveData = leaveResponse.data.data;

      setWFHRequests(wfhData);
      setLeaveRequests(leaveData);

      // Perform calculations for user info
      calculateUserInfo(wfhData, leaveData);
    } catch (error) {
      console.log("Error fetching WFH and leave requests:", error);
    }
  };

  const calculateUserInfo = (wfhData, leaveData) => {
    const today = moment();
    const startOfWeek = today.clone().startOf("week");
    const endOfWeek = today.clone().endOf("week");

    // Calculate WFH days
    const totalWFHDays = wfhData
      .flatMap((request) => request.entries)
      .filter((entry) => entry.status === "Approved")
      .filter((entry) =>
        moment(entry.entry_date).isBetween(startOfWeek, endOfWeek, null, "[]")
      ).length;

    // Calculate Leave days
    const totalLeaveDays = leaveData.filter((leave) =>
      moment(leave.leave_date).isBetween(startOfWeek, endOfWeek, null, "[]")
    ).length;

    // Calculate Office days
    const totalOfficeDays = 5 - (totalWFHDays + totalLeaveDays); // Assuming 5 workdays in a week

    const todayEntry = wfhData
      .flatMap((request) => request.entries)
      .find((entry) => moment(entry.entry_date).isSame(today, "day"));

    const tomorrowEntry = wfhData
      .flatMap((request) => request.entries)
      .find((entry) =>
        moment(today).add(1, "day").isSame(entry.entry_date, "day")
      );

    const isTodayWeekend = today.day() === 0 || today.day() === 6;
    const isTomorrowWeekend =
      today.clone().add(1, "day").day() === 0 ||
      today.clone().add(1, "day").day() === 6;

    let todayArrangement = isTodayWeekend
      ? "Weekends"
      : todayEntry
      ? todayEntry.status
      : "Office";
    let tomorrowArrangement = isTomorrowWeekend
      ? "Weekends"
      : tomorrowEntry
      ? tomorrowEntry.status
      : "Office";

    setUserWFHInfo({
      totalWFHDays,
      totalLeaveDays,
      totalOfficeDays,
      todayArrangement:
        todayArrangement === "Approved" ? "WFH" : todayArrangement,
      tomorrowArrangement:
        tomorrowArrangement === "Approved" ? "WFH" : tomorrowArrangement,
    });
  };

  useEffect(() => {
    fetchWFHAndLeaveRequests();
  }); // Only fetch once on component mount

  const events = useMemo(() => {
    // Process WFH events
    const wfhEvents =
      wfhrequests.length > 0
        ? wfhrequests.flatMap((request) =>
            request.entries
              .filter((entry) => entry.status === "Approved")
              .map((entry) => {
                let start, end;

                if (entry.duration === "Full Day") {
                  start = moment
                    .tz(entry.entry_date, "Asia/Singapore")
                    .set({ hour: 8, minute: 0 })
                    .toDate();
                  end = moment
                    .tz(entry.entry_date, "Asia/Singapore")
                    .set({ hour: 17, minute: 0 })
                    .toDate();
                } else if (entry.duration === "AM") {
                  start = moment
                    .tz(entry.entry_date, "Asia/Singapore")
                    .set({ hour: 8, minute: 0 })
                    .toDate();
                  end = moment
                    .tz(entry.entry_date, "Asia/Singapore")
                    .set({ hour: 12, minute: 0 })
                    .toDate();
                } else if (entry.duration === "PM") {
                  start = moment
                    .tz(entry.entry_date, "Asia/Singapore")
                    .set({ hour: 13, minute: 0 })
                    .toDate();
                  end = moment
                    .tz(entry.entry_date, "Asia/Singapore")
                    .set({ hour: 17, minute: 0 })
                    .toDate();
                }

                return {
                  request_id: entry.request_id,
                  start,
                  end,
                  description: entry.reason || "No reason provided",
                  type: "WFH", // Mark it as WFH event
                };
              })
          )
        : [];

    // Process Leave events
    const leaveEvents =
      leaveRequests.length > 0
        ? leaveRequests.map((leave) => {
            const start = moment
              .tz(leave.leave_date, "Asia/Singapore")
              .startOf("day")
              .toDate();
            const end = moment
              .tz(leave.leave_date, "Asia/Singapore")
              .endOf("day")
              .toDate();

            return {
              leave_id: leave.leave_id,
              start,
              end,
              description: "Leave",
              type: "Leave", // Mark it as Leave event
            };
          })
        : [];

    // Combine WFH and Leave events
    const allEvents = [...wfhEvents, ...leaveEvents];

    const uniqueEvents = [];
    const seenKeys = new Set();

    allEvents.forEach((event) => {
      const key = `${event.start}-${event.end}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueEvents.push(event);
      }
    });

    return uniqueEvents;
  }, [wfhrequests, leaveRequests]); // Memoize on both WFH and leave requests

  const EventComponent = ({ event }) => {
    const startTime = moment(event.start).format("h:mmA");
    const endTime = moment(event.end).format("h:mmA");

    return (
      <div className="text-gray-600 text-xs py-0.5 flex">
        {startTime} - {endTime}
      </div>
    );
  };

  const eventPropGetter = (event) => {
    const startHour = moment(event.start).hour();
    const endHour = moment(event.end).hour();
    let backgroundColor = "grey";

    if (event.type === "WFH") {
      if (startHour === 8 && endHour === 17) {
        backgroundColor = "#fed7aa";
      } else if (startHour === 8 && endHour === 12) {
        backgroundColor = "#fbcfe8";
      } else if (startHour === 13 && endHour === 17) {
        backgroundColor = "#bfdbfe";
      }
    } else if (event.type === "Leave") {
      backgroundColor = "#a7f3d0"; // Leave events in pink
    }

    return {
      style: {
        backgroundColor,
      },
    };
  };

  const dayPropGetter = (date) => {
    const day = moment(date).day();
    if (day === 0 || day === 6) {
      // 0 is Sunday, 6 is Saturday
      return {
        className: "rbc-off-range",
      };
    }
    return {};
  };

  return (
    <>
      <div className="flex gap-5 p-3 lg:flex-row flex-col overflow-x-hidden justify-start ">
        <div className=" w-full lg:w-3/4 py-2">
          <Calendar
            localizer={localizer}
            startAccessor={"start"}
            endAccessor={"end"}
            events={events}
            style={{ height: "calc(100vh - 100px)" }}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            onSelectEvent={(event, e) => {
              setAnchorEl(e.currentTarget);
              setSelectedEvent(event);
            }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            components={{
              toolbar: CustomToolbar,
              month: {
                event: EventComponent, // Custom event rendering for the month view
              },
            }}
          />
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            PaperProps={{
              width: "25%",
              margin: "0 auto",
              padding: "5px",
            }}
          >
            <div style={{ padding: "10px" }}>
              {selectedEvent && (
                <Typography>
                  <span className="text-base p-2">
                    Reason: {selectedEvent.description}
                  </span>
                </Typography>
              )}
            </div>
          </Popover>
          <div className="py-2">
            {/* Legend Section */}
            <div className="border rounded-xl p-4 md:flex-row flex-col flex justify-between bg-white">
              <h3 className="text-md font-bold mb-2">Legend:</h3>
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-orange-200 mr-2"></div>
                <span>WFH (Full Day)</span>
              </div>
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-pink-200 mr-2"></div>
                <span>WFH (AM)</span>
              </div>
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-blue-200 mr-2"></div>
                <span>WFH (PM)</span>
              </div>
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-emerald-200 mr-2"></div>
                <span>On Leave</span>
              </div>
            </div>
          </div>
        </div>
        <div className=" w-full lg:w-1/4 mr-5 ">
          <div className="flex flex-col gap-3">
            <div className="flex flex-row justify-between">
              <div className="">
                <Button
                  onClick={openWFHModal}
                  variant="outlined"
                  startIcon={<WorkIcon />}
                  sx={{
                    borderRadius: "12px",
                    color: "#6fb3e5", // Text color
                    borderColor: "#6fb3e5", // Border color (outline color)
                    "&:hover": {
                      backgroundColor: "#d1d5db", // Hover background color
                      borderColor: "#d1d5db",
                    },
                  }}
                >
                  <span className="text-sm py-2 px-0.5">WFH</span>
                </Button>
                {openWFHModal && (
                  <WFHModal open={WFHModalOpen} onClose={closeWFHModal} />
                )}
              </div>
              <div>
                {user.role !== 2 && user.position !== "HR Team" && (
                  <>
                    <Button
                      onClick={() => setOpenDelegateModal(true)}
                      variant="outlined"
                      // color="fff"
                      startIcon={<AssignmentIndIcon />}
                      sx={{
                        borderRadius: "12px",
                        color: "#1e3a8a", // Text color
                        borderColor: "#1e3a8a", // Border color (outline color)
                        "&:hover": {
                          backgroundColor: "#d1d5db", // Hover background color
                          borderColor: "#d1d5db",
                        },
                      }}
                    >
                      <span className="text-sm  py-2 px-0.5">Delegate</span>{" "}
                    </Button>
                    {openDelegateModal && (
                      <DelegateModal
                        open={openDelegateModal}
                        onClose={() => setOpenDelegateModal(false)}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
            <Card
              sx={{ minWidth: 250, borderRadius: "12px" }}
              variant="outlined"
            >
              <CardContent className="text-sm">
                <p>
                  <span className="font-bold">Name: </span> {firstName}{" "}
                  {lastName}
                </p>
                <p>
                  <span className="font-bold">Department: </span> {department}
                </p>
                <p>
                  <span className="font-bold">Position: </span> {position}
                </p>
              </CardContent>
            </Card>
            <Card
              sx={{ minWidth: 250, borderRadius: "12px" }}
              variant="outlined"
            >
              <CardContent className="p-1 flex-col flex gap-1">
                <div className=" text-md text-center text-blue-900 font-bold">
                  This Week's Notice
                </div>
                <div className="flex flex-row justify-start gap-3 text-sm align-middle">
                  <HomeSharpIcon fontSize="small" />{" "}
                  <div>
                    <span className="font-bold">
                      {userWFHInfo.totalWFHDays}{" "}
                    </span>
                    Days At Home
                  </div>
                </div>
                <div className="flex flex-row justify-start gap-3 text-sm align-middle">
                  <ApartmentSharpIcon fontSize="small" />{" "}
                  <div>
                    <span className="font-bold">
                      {userWFHInfo.totalOfficeDays}{" "}
                    </span>
                    Days In Office
                  </div>
                </div>
                <div className="flex flex-row justify-start gap-3 text-sm align-middle">
                  <LogoutSharpIcon fontSize="small" />
                  <div>
                    <span className="font-bold">
                      {userWFHInfo.totalLeaveDays}
                    </span>{" "}
                    Days On Leave
                  </div>
                </div>
                <hr className="border border-gray-300 my-2" />
                <div className="p-1 flex-col flex gap-1 text-sm">
                  {/* <CardContent className="text-sm "> */}
                  <div className="flex flex-row gap-3 align-middle">
                    <CalendarMonthIcon fontSize="small" />
                    <div>
                      {" "}
                      <span className="font-bold">Today: </span>{" "}
                      {userWFHInfo.todayArrangement}
                    </div>
                  </div>
                  <div className="flex flex-row gap-3 align-middle">
                    <CalendarMonthIcon fontSize="small" />
                    <div>
                      <span className="font-bold">Tomorrow: </span>
                      {userWFHInfo.tomorrowArrangement}{" "}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user.role !== 2 && user.position !== "HR Team" && (
              <Card
                sx={{ minWidth: 250, borderRadius: "12px" }}
                variant="outlined"
              >
                <CardContent>
                  <DelegateCardPage />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PersonalCalendar;
