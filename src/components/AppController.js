import React from "react"

import {BrowserRouter,Route,Routes} from 'react-router-dom'
import axios from "axios"

import ManageUser from "./frames/ManageUser"
import Login from "./frames/Login"
import ServiceRequest from "./frames/ServiceRequest"
import DriverAllocation from "./frames/DriverAllocation"
import Dashboard from "./frames/Dashboard"
import Inventory from "./frames/Inventory"
import Reports from "./frames/Reports"
import ResetPassword from "./frames/ResetPassword"
import SendResetLinks from "./frames/SendResetLinks"
import ProtectedRoute from "./ProtectedRoute"
import TestDrive from "./frames/TestDrive"

axios.defaults.withCredentials = true;



const AppController = () =>{ 

    return(
      
        <>
        <BrowserRouter>
            <Routes>
                <Route path="/users" element={ <ProtectedRoute allowedRoles={["Admin"]}>  <ManageUser/> </ProtectedRoute> }/>
                <Route path="/" element={ <Login/> }/>
                <Route path="/reports" element={<ProtectedRoute allowedRoles={["Admin","Sales Agent","Manager","Supervisor"]}>  <Reports/> </ProtectedRoute>}/>
                <Route path="/inventory" element={ <ProtectedRoute allowedRoles={["Admin","Sales Agent","Manager","Supervisor"]}>  <Inventory/> </ProtectedRoute>}/>
                <Route path="/driverallocation" element={ <ProtectedRoute allowedRoles={["Admin"]}>  <DriverAllocation/> </ProtectedRoute>}/>
                <Route path="/servicerequest" element={<ProtectedRoute allowedRoles={["Admin","Sales Agent","Manager","Supervisor"]}> <ServiceRequest/> </ProtectedRoute>}/>
                <Route path="/testdrive" element={<ProtectedRoute allowedRoles={["Admin","Sales Agent","Manager","Supervisor"]}> <TestDrive/> </ProtectedRoute>}/>
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["Admin","Sales Agent","Manager","Supervisor"]}> <Dashboard/> </ProtectedRoute> } />
                
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/send-reset-links" element={<SendResetLinks />} />
            </Routes>
        </BrowserRouter>
        </>
    )
}
export default AppController
