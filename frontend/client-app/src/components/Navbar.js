import React, { useState, useEffect, useRef } from "react";
import {
  BiHome,
  BiCalendar,
  BiHistory,
  BiTask,
  BiMailSend,
  BiLogOut,
} from "react-icons/bi";
import { FaBars, FaTimes } from "react-icons/fa"; // For hamburger icon
import "../index.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, logout } from "../redux/userSlice";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Fade from "@mui/material/Fade";

const NavBar = ({ notificationsLength, getNotifications }) => {
  const [isOpen, setIsOpen] = useState(false); // for the hamburger
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  let userRole = "";
  let userPosition = "";
  const menuRef = useRef(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [anchorEl1, setAnchorEl1] = React.useState(null);
  const open = Boolean(anchorEl);
  const open1 = Boolean(anchorEl1);
  const location = useLocation(); // Track route changes

  const handleOpenClick = (events) => {
    setAnchorEl1(events.currentTarget);
  };
  const handleCloseClick = () => {
    setAnchorEl1(null);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  if (user !== null) {
    userRole = user.role;
    userPosition = user.position;
  }

  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate("/login");
  };

  useEffect(() => {
    if (user) {
      getNotifications(); // Only call once
    }
  }, [user, location, getNotifications]); // Combine user and location as dependencies

  // Function to toggle menu visibility
  // const toggleMenu = () => {
  //   setIsOpen(!isOpen);
  // };
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    const menu = document.querySelector(".menu");
    if (!isOpen) {
      menu.classList.add("open");
      menu.classList.remove("closed");
    } else {
      menu.classList.add("closed");
      menu.classList.remove("open");
    }
  };

  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="menu h-screen mr-4" ref={menuRef}>
      {/* Hamburger Icon */}
      {user && (
        <div className="hamburger-icon">
          <IconButton onClick={toggleMenu}>
            {isOpen ? <FaTimes /> : <FaBars />}{" "}
          </IconButton>
        </div>
      )}

      <div className={`menu--list ${isOpen ? "open" : "closed"}`}>
        {user && (
          <>
            <a href="/PersonalSchedule" className="item">
              <IconButton>
                <BiHome className="icon" />
              </IconButton>{" "}
              <Link to="/PersonalSchedule">
                <span>Home</span>
              </Link>
            </a>
            <a href="/teamSchedule" className="item">
              <IconButton>
                <BiCalendar className="icon" />
              </IconButton>
              <Link to="/teamSchedule">View Team Schedule</Link>
            </a>
            <a href="/auditTrail" className="item">
              <IconButton>
                <BiHistory className="icon"  />
              </IconButton>
              <Link to="/auditTrail">Audit Trail</Link>
            </a>
            <a href="/notifications" className="item">
              <IconButton aria-label={notificationsLength}>
                <Badge badgeContent={notificationsLength} color="secondary">
                  <BiMailSend
                    className="icon"
                    id="basic-button"
                    aria-controls={open ? "basic-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={handleClick}
                  />
                </Badge>
              </IconButton>
              <Link
                to="/notifications"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Notification
              </Link>
            </a>
          </>
        )}
        {userRole === 1 &&
          userPosition !== "HR Team" &&
          userPosition !== "MD" && (
            <>
              <div className="item" onClick={handleOpenClick}>
                <IconButton
                  id="fade-button"
                  aria-controls={open1 ? "fade-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open1 ? "true" : undefined}
                  onClick={handleOpenClick}
                >
                  <BiTask className="icon" />
                </IconButton>
                Requests
              </div>
              <Menu
                id="fade-menu"
                MenuListProps={{
                  "aria-labelledby": "fade-button",
                }}
                anchorEl={anchorEl1}
                open={open1}
                onClose={handleCloseClick}
                TransitionComponent={Fade}
              >
                <MenuItem onClick={handleCloseClick}>
                  <Link
                    to="/requestsPage"
                    className="block py-2 px-4 lg:inline-block"
                  >
                    My Employees Request
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleCloseClick}>
                  <Link
                    to="/myRequestsPage"
                    className="block py-2 px-4 lg:inline-block"
                  >
                    My Requests
                  </Link>
                </MenuItem>
              </Menu>
            </>
          )}
        {userRole === 1 && userPosition === "MD" && (
          <>
            <div className="item" onClick={handleOpenClick}>
              <IconButton
                id="fade-button"
                aria-controls={open1 ? "fade-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open1 ? "true" : undefined}
                onClick={handleOpenClick}
              >
                <BiTask className="icon" />
              </IconButton>
              Requests
            </div>
            <Menu
              id="fade-menu"
              MenuListProps={{
                "aria-labelledby": "fade-button",
              }}
              anchorEl={anchorEl1}
              open={open1}
              onClose={handleCloseClick}
              TransitionComponent={Fade}
            >
              <MenuItem onClick={handleCloseClick}>
                <Link
                  to="/jackRequestsPage"
                  className="block py-2 px-4 lg:inline-block"
                >
                  My Employees Request
                </Link>
              </MenuItem>
              <MenuItem onClick={handleCloseClick}>
                <Link
                  to="/jackPersonalRequestsPage"
                  className="block py-2 px-4 lg:inline-block"
                >
                  My Requests
                </Link>
              </MenuItem>
            </Menu>
          </>
        )}
        {userRole === 1 && userPosition === "HR Team" && (
          <>
            <div className="item" onClick={handleOpenClick}>
              <IconButton
                id="fade-button"
                aria-controls={open1 ? "fade-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open1 ? "true" : undefined}
                onClick={handleOpenClick}
              >
                <BiTask className="icon" />
              </IconButton>
              Requests
            </div>
            <Menu
              id="fade-menu"
              MenuListProps={{
                "aria-labelledby": "fade-button",
              }}
              anchorEl={anchorEl1}
              open={open1}
              onClose={handleCloseClick}
              TransitionComponent={Fade}
            >
              <MenuItem onClick={handleCloseClick}>
                <Link
                  to="/employeeRequests"
                  className="block py-2 px-4 lg:inline-block"
                >
                  My Employees Request
                </Link>
              </MenuItem>
              <MenuItem onClick={handleCloseClick}>
                <Link
                  to="/hrRequestsPage"
                  className="block py-2 px-4 lg:inline-block"
                >
                  My Requests
                </Link>
              </MenuItem>
            </Menu>
          </>
        )}

        {userRole === 3 && (
          <>
            <div className="item" onClick={handleOpenClick}>
              <IconButton
                id="fade-button"
                aria-controls={open1 ? "fade-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open1 ? "true" : undefined}
                onClick={handleOpenClick}
              >
                <BiTask className="icon" />
              </IconButton>
              Requests
            </div>
            <Menu
              id="fade-menu"
              MenuListProps={{
                "aria-labelledby": "fade-button",
              }}
              anchorEl={anchorEl1}
              open={open1}
              onClose={handleCloseClick}
              TransitionComponent={Fade}
            >
              <MenuItem onClick={handleCloseClick}>
                <Link
                  to="/managerRequestsPage"
                  className="block py-2 px-4 lg:inline-block"
                >
                  My Employees Request
                </Link>
              </MenuItem>
              <MenuItem onClick={handleCloseClick}>
                <Link
                  to="/myManagerRequestsPage"
                  className="block py-2 px-4 lg:inline-block"
                >
                  My Requests
                </Link>
              </MenuItem>
            </Menu>
          </>
        )}

      {user && (
        <a href='/logout' className="item" onClick={(e) => handleLogout(e)}>
          <IconButton>
            <BiLogOut className="icon" onClick={(e) => handleLogout(e)}/>
          </IconButton>
          <Link
            to="/logout"
            onClick={(e) => handleLogout(e)}
          >
            Logout
          </Link>
        </a>  
      )}
      </div>
    </div>
  );
};

export default NavBar;
