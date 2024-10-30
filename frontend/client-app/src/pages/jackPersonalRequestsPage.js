import '../index.css'; // Make sure to import your CSS file
import JackTablePendingReq from '../components/JackTablePendingReq';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import { useParams, useNavigate } from "react-router-dom";


const JackPersonalRequests = () => {
  const user = useSelector(selectUser); // Get the logged-in user's info
  const staffId = user.staff_id; // Assuming 'staff_id' is a property in the user object
  const [activeTab, setActiveTab] = useState('all');
  const [wfhrequests, setWFHRequests] = useState(null);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'approved', label: 'Approved' },
  ];

  const {requestId} = useParams();
  const navigate = useNavigate();
  
  const handleTabChange = (newIndex) => {
    setActiveTab(newIndex);

    if (requestId) {
      navigate('/jackPersonalRequestsPage', { replace: true });
    }
  };

  const fetchWFHRequests = async () => {
    try {
      const response = await axios.get('https://scrumdaddybackend.studio/wfhRequests');
      const wfhrequests = response.data.data;
      setWFHRequests(wfhrequests);
    } catch (error) {
      console.log('error', error);
    }
  };

  useEffect(() => {
    fetchWFHRequests();
  }, []);

  const filteredRequests = () => {
    if (!wfhrequests) return [];

    // Filter based on the staff_id and overall_status
    return wfhrequests.filter(request => {
      const isRequesterId = request.requester_id === staffId;
      switch (activeTab) {
        case 'approved': // My Approved Requests
          return isRequesterId && request.overall_status === 'Approved';
        case 'all':
          return isRequesterId
          default:
          return [];
      }
    });
  };

  return (
    wfhrequests && (
      <div>
        <div className="separation-container">
            <div className="mb-3"><span className="text">My Requests</span></div>
        </div>
        <div className="tabs-container">
          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="tab-content">
            <JackTablePendingReq fetchWFHRequests={filteredRequests()} requestId={requestId} />
          </div>
        </div>
      </div>
    )
  );
};

export default JackPersonalRequests;
