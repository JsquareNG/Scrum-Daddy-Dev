import '../index.css'; // Make sure to import your CSS file
import TablePendingReq from '../components/TablePendingReq';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import { useParams, useNavigate } from "react-router-dom";


const RequestsPage = () => {
  const user = useSelector(selectUser); // Get the logged-in user's info
  const staffId = user.staff_id; // Assuming 'staff_id' is a property in the user object
  const [activeTab, setActiveTab] = useState('all');
  const {requestId} = useParams();
  const navigate = useNavigate();

  const handleTabChange = (newIndex) => {
    setActiveTab(newIndex);

    if (requestId) {
      navigate('/requestsPage', { replace: true });
    }
  };

  const [wfhrequests, setWFHRequests] = useState(null)
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'reviewed', label: 'Reviewed' },
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

  const filteredRequests = () => {
    if (!wfhrequests) return [];
    
    return wfhrequests.filter(request => {
      const isRequesterId = request.requester_id === staffId;
      const isReportingManager = request.reporting_manager === staffId;
      
      switch (activeTab) {
        case 'pending':
          return (isReportingManager && request.overall_status === 'Pending') || 
          (isReportingManager && request.overall_status === 'Pending Withdrawal') ||
          (isReportingManager && request.overall_status === 'Reviewed' && 
            request.entries.some(entry => entry.status === 'Pending Withdrawal') && 
            (!isRequesterId));
        case 'reviewed':
          return isReportingManager && request.overall_status === 'Reviewed' && 
          request.entries.some(entry => entry.status === 'Approved') && (!isRequesterId);
        case 'approved':
          return isReportingManager && request.overall_status === 'Approved';
        case 'all':
        default:
          return isReportingManager; // Show all requests managed by the user
      }
    });
  };

  return (
    wfhrequests && (
    <div>
      <div className="separation-container">
        <div className="mb-3"><span className="text">My Employees Requests</span></div>
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
          <TablePendingReq fetchWFHRequests={filteredRequests()} requestId={requestId} />
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
//         <Tab label="Pending Requests" />
//         <Tab label="Approved Requests" />
//         <Tab label="Pending Withdrawal Requests" />
//         <Tab label="All Requests" />
//       </Tabs>

//       {/* Tab Content */}
//       <TabPanel value={tabIndex} index={0}>
//       <TablePendingReq fetchWFHRequests={filteredRequests()} />
//       </TabPanel>
//         <TabPanel value={tabIndex} index={1}>
//           <TablePendingReq fetchWFHRequests={filteredRequests()} />
//         </TabPanel>
//         <TabPanel value={tabIndex} index={2}>
//           <TablePendingReq fetchWFHRequests={filteredRequests()} />
//         </TabPanel>
//         <TabPanel value={tabIndex} index={3}>
//           <TablePendingReq fetchWFHRequests={filteredRequests()} requestId={requestId} />
//         </TabPanel>
//       </div>
// )
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
export default RequestsPage;
