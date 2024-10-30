// import * as React from 'react';
import HRTablePendingReq from '../components/HRTablePendingReq';
import axios from 'axios'
import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import { useParams, useNavigate } from "react-router-dom";

const HRRequests = () => {
  const user = useSelector(selectUser); // Get the logged-in user's info
  const staffId = user.staff_id; // Assuming 'staff_id' is a property in the user object
  // const [tabIndex, setTabIndex] = React.useState(0);
  const {requestId} = useParams();
  const navigate = useNavigate();

  const handleTabChange = (event, newIndex) => {
    setActiveTab(newIndex);

    if (requestId) {
      navigate('/hrRequestsPage', { replace: true });
    }
  };

  const [activeTab, setActiveTab] = useState('all');
  const [wfhrequests, setWFHRequests] = useState(null);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
  ];

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

  // useEffect(() => {
  //   if(requestId){
  //     setTabIndex(2)
  //   }
  // }, [requestId])

  const filteredRequests = () => {
    if (!wfhrequests) return [];

    // Filter based on the staff_id and overall_status
    return wfhrequests.filter(request => {
      const isRequesterId = request.requester_id === staffId;
      switch (activeTab) {
        case 'pending': // My Pending Requests
          return isRequesterId && request.overall_status === 'Pending';
        case 'approved': // My Approved Requests
          return (isRequesterId && request.overall_status === 'Approved') ||
          (isRequesterId && request.overall_status === 'Reviewed' && 
            request.entries.some(entry => entry.status === 'Approved'));
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
            <HRTablePendingReq fetchWFHRequests={filteredRequests()} requestId={requestId}/>
          </div>
        </div>
      </div>
    )
  );
};

// return (
//   wfhrequests && (
//     <div>
//       {/* Tabs Section */}
//       <Tabs value={tabIndex} onChange={handleTabChange} 
//       variant="scrollable"
//       scrollButtons="auto"
//       aria-label="scrollable auto tabs example">
//         <Tab label = "My Pending Requests"/>
//         <Tab label = "My Approved Requests"/>
//         <Tab label = "All My Requests"/>
//       </Tabs>

//       {/* Tab Content */}
//       <TabPanel value={tabIndex} index={0}>
//         <HRTablePendingReq fetchWFHRequests={filteredRequests()} />
//       </TabPanel>
//       <TabPanel value={tabIndex} index={1}>
//         <HRTablePendingReq fetchWFHRequests={filteredRequests()} />
//       </TabPanel>
//       <TabPanel value={tabIndex} index={2}>
//         <HRTablePendingReq fetchWFHRequests={filteredRequests()} requestId={requestId} />
//       </TabPanel>
//     </div>
//   )
// );
// }

// // TabPanel Component to render content conditionally based on the active tab
// function TabPanel(props) {
// const { children, value, index, ...other } = props;

// return (
//   <div
//     role="tabpanel"
//     hidden={value !== index}
//     id={`simple-tabpanel-${index}`}
//     aria-labelledby={`simple-tab-${index}`}
//     {...other}
//   >
//     {value === index && (
//       <Box sx={{ p: 3 }}>
//         {children}
//       </Box>
//     )}
//   </div>
//   )
  
// };

export default HRRequests;