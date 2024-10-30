import "./App.css";
import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  // useLocation,
} from "react-router-dom";
import NavBar from "./components/Navbar";
import Login from "./pages/login";
import RequestsPage from "./pages/requestsPage";

import PersonalSchedule from "./pages/personalSchedule";

//all the requests page
import StaffRequests from "./pages/staffRequestsPage";
import ManagerRequests from "./pages/managerRequestsPage";
import HRRequests from "./pages/hrRequestsPage";
import PersonalRequests from "./pages/myRequestsPage";
import JackRequests from "./pages/jackRequestsPage";
import JackPersonalRequests from "./pages/jackPersonalRequestsPage";
import EmployeeRequests from "./pages/employeeRequests";

import TeamScheduleTracker from "./pages/teamSchedule";
import Notifications from "./pages/notification";
import AuditTrail from "./pages/auditTrail";

import { useSelector } from "react-redux";
import { selectUser } from "./redux/userSlice";
import MyManagerRequests from "./pages/myManagerRequestsPage";

function App() {
  const user = useSelector(selectUser);
  let userRole = "";
  let userPosition = "";
  const [notificationsLength, setNotificationsLength] = useState(0);

  const getNotifications = useCallback(async () => {
    if (user?.staff_id) {
      try {
        // Fetch the first notifications
        const firstResponse = await axios.get(
          `https://scrumdaddybackend.studio/wfhRequests/getNotificationsLength/${user?.staff_id}`
        );

        let totalNotificationsLength = 0;

        // Set the first notification length
        if (firstResponse) {
          totalNotificationsLength = firstResponse.data.data;
        }

        // Conditionally fetch the second notifications if user role is not 2
        if (user?.role !== 2) {
          const secondResponse = await axios.get(
            `https://scrumdaddybackend.studio/employees/getDelegateNotiLength/${user?.staff_id}`
          );

          // Add second response to the notifications length
          if (secondResponse) {
            totalNotificationsLength += secondResponse.data.data;
          }
        }

        // Set the total notifications length
        setNotificationsLength(totalNotificationsLength);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
  }, [user?.staff_id, user?.role]);

  if (user !== null) {
    userRole = user.role;
    userPosition = user.position;
  }

  useEffect(() => {
    if (user) {
      getNotifications(); // Fetch notifications when user changes
    }
  }, [user, getNotifications]);

  return (
    <>
      <Router>
        <div className="dashboard">
        {user && (
          <div className="app-navbar">
            <NavBar
              notificationsLength={notificationsLength}
              getNotifications={getNotifications}
            />
          </div>
        )}
          <div className={`dashboard--content ${user ? 'ml-[77px]' : ''}`}>
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate to={user ? "/PersonalSchedule" : "/login"} />
                }
              />
              <Route
                path="/login"
                                element={
                  !user ? <Login /> : <Navigate to="/PersonalSchedule" />
                }
              />
              {/* for the HR and directors request page view */}
              {userRole === 1 && userPosition === "MD" && (
                <>
                  <Route
                    path="/jackPersonalRequestsPage"
                    element={<JackPersonalRequests />}
                  />
                  <Route
                    path="/jackPersonalRequestsPage/:requestId"
                    element={<JackPersonalRequests />}
                  />
                  <Route path="/jackRequestsPage" element={<JackRequests />} />
                  <Route
                    path="/jackRequestsPage/:requestId"
                    element={<JackRequests />}
                  />
                </>
              )}

              {userRole === 1 &&
                userPosition !== "HR Team" &&
                userPosition !== "MD" && (
                  <>
                    <Route path="/requestsPage" element={<RequestsPage />} />
                    <Route
                      path="/requestsPage/:requestId"
                      element={<RequestsPage />}
                    />
                    <Route
                      path="/myRequestsPage"
                      element={<PersonalRequests />}
                    />
                    <Route
                      path="/myRequestsPage/:requestId"
                      element={<PersonalRequests />}
                    />
                  </>
                )}

              {userRole === 1 &&
                userPosition === "HR Team" &&
                userPosition !== "MD" && (
                  <>
                    <Route path="/hrRequestsPage" element={<HRRequests />} />
                    <Route
                      path="/hrRequestsPage/:requestId"
                      element={<HRRequests />}
                    />
                    <Route
                      path="/employeeRequests/"
                      element={<EmployeeRequests />}
                    />
                    <Route
                      path="/employeeRequests/:requestId"
                      element={<EmployeeRequests />}
                    />
                  </>
                )}
              {/* for the staff request page view */}
              {userRole === 2 && (
                <>
                  <Route
                    path="/staffRequestsPage"
                    element={<StaffRequests />}
                  />
                  <Route
                    path="/staffRequestsPage/:requestId"
                    element={<StaffRequests />}
                  />
                </>
              )}
              {/* for the manager request page view */}
              {userRole === 3 && (
                <>
                  <Route
                    path="/managerRequestsPage"
                    element={<ManagerRequests />}
                  />
                  <Route
                    path="/managerRequestsPage/:requestId"
                    element={<ManagerRequests />}
                  />
                  <Route
                    path="/myManagerRequestsPage/"
                    element={<MyManagerRequests />}
                  />
                  <Route
                    path="/myManagerRequestsPage/:requestId"
                    element={<MyManagerRequests />}
                  />
                </>
              )}
              {user && (
                <>
                  <Route
                    path="/PersonalSchedule"
                    element={<PersonalSchedule />}
                  />
                  <Route
                    path="/notifications"
                    element={
                      <Notifications getNotifications={getNotifications} />
                    }
                  />
                  <Route
                    path="/teamSchedule"
                    element={<TeamScheduleTracker />}
                  />
                  <Route path="/auditTrail" element={<AuditTrail />} />
                  <Route
                    path="/auditTrail/:requestId"
                    element={<AuditTrail />}
                  />
                </>
              )}
            </Routes>
          </div>
        </div>
      </Router>
    </>
  );
}

export default App;
