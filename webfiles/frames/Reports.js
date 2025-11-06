import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import '../css/ServiceRequest.css'; 
import '../css/Reports.css'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // 
import clearIcon from '../icons/clear.png';
import filterIcon from '../icons/filter.png';
import downloadIcon from '../icons/download.png';
import logo from '../icons/I-track logo.png'; 
import { getCurrentUser } from '../getCurrentUser';



const Reports = () => {
  const [requests, setRequests] = useState([]);
  const [inProgressRequests, setInProgressRequests] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [stock, setStock] = useState([]);
  const [unitSummary, setUnitSummary] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [fullUser, setFullUser] = useState(null);

  useEffect(() => {
    fetchCompletedRequests();
    // fetchInProgressRequests();
  }, []);

  

const fetchCompletedRequests = async () => {
  try {
    const res = await axios.get("https://itrack-web-backend.onrender.com/api/getCompletedRequests", { withCredentials: true });
     console.log("Completed Requests:", res.data); 
    setRequests(res.data); // Duration is already included

  } catch (err) {
    console.log(err);
  }
};


  // const fetchInProgressRequests = () => {
  //   axios.get("http://localhost:8000/api/getInProgressRequests")
  //     .then((res) => setInProgressRequests(res.data))
  //     .catch((err) => console.log(err));
  // };


 
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [isFilterActive, setIsFilterActive] = useState(false);
const [filteredRequests, setFilteredRequests] = useState([]);
const [filteredAllocations, setFilteredAllocations] = useState([]); // New state for filtered allocations


const isWithinDateRange = (dateString) => {
  const date = new Date(dateString);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
};

const handleFilter = () => {
  const combinedRequests = [...inProgressRequests, ...requests];
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const filtered = combinedRequests.filter((req) => {
    const reqDate = new Date(req.dateCreated);
    if (start && reqDate < start) return false;
    if (end && reqDate > end) return false;
    return true;
  });

  // Filter completedAllocations as well
  const filteredAllocations = completedAllocations.filter((item) => {
    const dateStr = item.date || item.createdAt;
    if (!dateStr) return false;
    const allocDate = new Date(dateStr);
    if (start && allocDate < start) return false;
    if (end && allocDate > end) return false;
    return true;
  });

  setFilteredRequests(filtered);
  setFilteredAllocations(filteredAllocations);
  setIsFilterActive(true);
};


const handleClearFilter = () => {
  setStartDate('');
  setEndDate('');
  setFilteredRequests([]);
  setFilteredAllocations([]); // Clear filtered allocations
  setIsFilterActive(false);
};


const [completedAllocations, setCompletedAllocations] = useState([]);

  const fetchCompletedAllocations = () => {
  axios.get("https://itrack-web-backend.onrender.com/api/getCompletedAllocations", { withCredentials: true }) // ✅ corrected endpoint
    .then((res) => {
      setCompletedAllocations(res.data);
    })
    .catch((err) => console.log(err));
};


useEffect(() => {
  fetchCompletedRequests();
  fetchCompletedAllocations();
}, []);


useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      const response = await axios.get("https://itrack-web-backend.onrender.com/api/getStock", { withCredentials: true });
      setStock(response.data);

      // Group by unitName and count occurrences
      const summary = response.data.reduce((acc, item) => {
        acc[item.unitName] = (acc[item.unitName] || 0) + 1;
        return acc;
      }, {});

      // Convert object to array for easier mapping
      const summaryArray = Object.entries(summary).map(([unitName, quantity]) => ({
        unitName,
        quantity
      }));

      setUnitSummary(summaryArray);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

 
const handleDownloadPDF = () => {
  const doc = new jsPDF();
  let y = 15;
  doc.setFontSize(16);
  doc.text('Reports', 14, y);
  y += 8;

  // Vehicle Preparation Table
  doc.setFontSize(13);
  doc.text('Vehicle Preparation', 14, y);
  y += 4;
  const prepData = (filteredRequests.length > 0 ? filteredRequests : [...inProgressRequests, ...requests]).map(req => [
    req.completedAt
      ? new Date(req.completedAt).toLocaleDateString('en-CA')
      : req.createdAt
        ? new Date(req.createdAt).toLocaleDateString('en-CA')
        : req.dateCreated
          ? new Date(req.dateCreated).toLocaleDateString('en-CA')
          : '',
    req.completedAt
      ? new Date(req.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : req.createdAt
        ? new Date(req.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : req.dateCreated
          ? new Date(req.dateCreated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : '',
    req.preparedBy || 'N/A',
    req.vehicleRegNo,
    Array.isArray(req.service) ? req.service.join(', ') : req.service,
    req.serviceTime !== null && req.serviceTime !== undefined ? `${req.serviceTime} mins` : 'N/A',
    req.status
  ]);
  autoTable(doc, {
    head: [['Date', 'Time', 'Prepared By', 'Conduction Number', 'Service', 'Service Time', 'Status']],
    body: prepData,
    startY: y + 2,
    theme: 'grid',
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // Vehicle Shipment Table
  doc.setFontSize(13);
  doc.text('Vehicle Shipment', 14, y);
  y += 4;
  const shipmentData = completedAllocations.map(item => [
    item.date ? new Date(item.date).toLocaleDateString('en-CA') : (item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-CA') : ''),
    item.date ? new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : (item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''),
    item.allocatedBy || 'N/A',
    item.unitId,
    item.assignedDriver,
    item.status
  ]);
  autoTable(doc, {
    head: [['Date', 'Time', 'Allocated By', 'Conduction Number', 'Assigned Driver', 'Status']],
    body: shipmentData,
    startY: y + 2,
    theme: 'grid',
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // Stocks Summary Table
  doc.setFontSize(13);
  doc.text('Stocks Summary', 14, y);
  y += 4;
  const stockData = unitSummary.map(item => [item.unitName, item.quantity]);
  autoTable(doc, {
    head: [['Unit Name', 'Quantity']],
    body: stockData,
    startY: y + 2,
    theme: 'grid',
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
    
  });

  // Full Inventory Table
doc.addPage();
doc.setFontSize(13);
doc.text('Full Inventory', 14, 15);

const inventoryData = stock.map(item => [
  item.unitName,
  item.unitId,
  item.bodyColor,
  item.variation,
  item.quantity,
  item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-CA') : 'N/A'
]);

autoTable(doc, {
  head: [['Unit Name', 'Conduction Number', 'Body Color', 'Variation', 'Quantity', 'Date Added']],
  body: inventoryData,
  startY: 20,
  theme: 'grid',
  styles: { fontSize: 10 },
  margin: { left: 14, right: 14 },
});


  doc.save('Reports.pdf');
};



  useEffect(() => {
    getCurrentUser().then(user => {
      setCurrentUser(user);
      if (user && user.email) {
        axios.get("https://itrack-web-backend.onrender.com/api/getUsers", { withCredentials: true })
          .then(res => {
            const found = res.data.find(u => u.email === user.email);
            setFullUser(found);
          })
          .catch(() => setFullUser(null));
      }
    });
  }, []);

  return (
    <div className="app">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main">
        <header className="header">
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <h3 className="header-title1">Reports</h3>
          {fullUser && fullUser.name && (
            <div className="loggedinuser" style={{ marginLeft: 'auto', fontWeight: 500, fontSize: 15 }}>
              Welcome, {fullUser.name}
            </div>
          )}
        </header>

        <div className="content">

          <div className='reportstitle'></div>

<div className="filter-controls">
  <label>
    Start Date
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
    />
  </label>

  <label>
    End Date
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
    />
  </label>

  <button className="clear-btn" onClick={handleClearFilter}>
    Clear
    <img src={clearIcon} alt="Clear" className="button-icon" />
  </button>

  <button className="filter-btn" onClick={handleFilter}>
    Filter
    <img src={filterIcon} alt="Filter" className="button-icon1" />
  </button>

  <button className="pdf-btn" onClick={handleDownloadPDF}>Download<img src={downloadIcon} alt="Download" className="button-icon" />
    
  </button>
</div>


          <div className="table-container">
            {/* Download PDF Button Only */}
            
            <div className="table-wrapper">
              {/* Service Requests Table */}
              <div className="single-table">
                <h4 className="table-label">Vehicle Preparation</h4>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Prepared By</th>
                        <th>Conduction Number</th>
                        <th>Service</th>
                        <th>Service Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredRequests.length > 0 ? filteredRequests : [...inProgressRequests, ...requests]).length === 0 ? (
                        <tr><td colSpan="7" style={{textAlign:'center',color:'#888'}}>No records found.</td></tr>
                      ) : (
                        <tr className="header-spacer-row"><td colSpan="7"></td></tr>
                      )}
                      {(filteredRequests.length > 0 ? filteredRequests : [...inProgressRequests, ...requests])
                        .map((req) => (
                          <tr key={req._id}>
                            <td>{req.completedAt ? new Date(req.completedAt).toLocaleDateString('en-CA') : (req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-CA') : '')}</td>
                            <td>{req.completedAt ? new Date(req.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : (req.createdAt ? new Date(req.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '')}</td>
                            <td>{req.preparedBy || 'N/A'}</td>
                            <td>{req.vehicleRegNo}</td>
                            <td>{Array.isArray(req.service) ? req.service.join(', ') : req.service}</td>
                            <td>{req.serviceTime !== null && req.serviceTime !== undefined
                              ? `${req.serviceTime} mins`
                              : 'N/A'}</td>
                            <td>
                              <span className={`status-badge ${
                                req.status === 'Pending' ? 'status-pending'
                                : req.status === 'In Progress' ? 'status-progress'
                                : 'status-completed'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                
                <div className="single-table" style={{marginTop: '32px'}}>
                  <h4 className="table-label">Vehicle Shipment</h4>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Allocated By</th>
                          <th>Conduction Number</th>
                          <th>Assigned Driver</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isFilterActive ? filteredAllocations : completedAllocations).length === 0 ? (
                          <tr><td colSpan="6" style={{textAlign:'center',color:'#888'}}>No records found.</td></tr>
                        ) : (
                          <tr className="header-spacer-row"><td colSpan="6"></td></tr>
                        )}
                        {(isFilterActive ? filteredAllocations : completedAllocations).map((item) => (
                          <tr key={item._id}>
                            <td>{item.completedAt ? new Date(item.completedAt).toLocaleDateString('en-CA') : (item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-CA') : (item.date ? new Date(item.date).toLocaleDateString('en-CA') : ''))}</td>
                            <td>{item.completedAt ? new Date(item.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : (item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : (item.date ? new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''))}</td>
                            <td>{item.allocatedBy || 'N/A'}</td>
                            <td>{item.unitId}</td>
                            <td>{item.assignedDriver}</td>
                            <td>
                              <span className="status-badge status-completed">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>


              
            </div>

            <div className="single-table">
  <h4 className="table-label">Inventory</h4>
  <div className="table-responsive">
    <table>
      <thead>
        <tr>
          <th>Unit Name</th>
          <th>Conduction Number</th>
          <th>Body Color</th>
          <th>Variation</th>
          <th>Quantity</th>
          <th>Date Added</th>
        </tr>
      </thead>
      <tbody>
        {stock.map((item) => (
          <tr key={item._id}>
            <td>{item.unitName}</td>
            <td>{item.unitId}</td>
            <td>{item.bodyColor}</td>
            <td>{item.variation}</td>
            <td>{item.quantity}</td>
            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>




          </div>
         
        </div>
      </div>
    </div>
  );
};

export default Reports;
