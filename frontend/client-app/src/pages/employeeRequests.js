// import * as React from 'react';
import HRTablePendingReq from '../components/HRTablePendingReq';
import axios from 'axios'
import React, { useState, useEffect } from 'react';

const EmployeeRequests = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [wfhrequests, setWFHRequests] = useState(null);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'approved', label: 'Approved' },
    { id: 'reviewed', label: 'Reviewed' },
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
      switch (activeTab) {
        case 'approved':
          return (request.overall_status === 'Approved' && 
          request.entries.some(entry => entry.status === 'Approved'))
        case 'reviewed':
          return request.overall_status === 'Reviewed' && 
            request.entries.some(entry => entry.status === 'Approved')
        case 'all':
        default:
          return []; // Show all requests managed by the user
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
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="tab-content">
          <HRTablePendingReq fetchWFHRequests={filteredRequests()} />
        </div>
      </div>
  </div>
    )
  );
};
export default EmployeeRequests;