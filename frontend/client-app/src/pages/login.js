import LoginComponent from "../components/Login";
import React, { useEffect} from 'react';
import axios from 'axios';
import "../index.css";
import {
    Box
  } from "@mui/material";

const Login = () => {
    const fetchEmployeeDetails = async () => {
        try {
          await axios.get(`https://scrumdaddybackend.studio/wfhRequests/checkPending`);
        } catch (error) {
          console.error(`Error checking pending requests`, error);
        }
    };

    useEffect(()=> {
        fetchEmployeeDetails()
    }, [])
      
    return (
        <div className="login-container flex md:flex-row flex-col">
            <Box className="login-left">
                <img src="/wfh2.gif" alt="Illustration" className="login-image" />
            </Box>
            <Box className="login-right">
                <LoginComponent />
            </Box>
        </div>
    )
    
};

export default Login;
