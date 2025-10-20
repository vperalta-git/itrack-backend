import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // axios.get("http://localhost:8000/api/checkAuth", { withCredentials: true })
    axios.get("https://itrack-web-backend.onrender.com/api/checkAuth", { withCredentials: true })
      .then(res => {
        setUser(res.data.authenticated ? res.data.user : null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [location.pathname]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

export default ProtectedRoute;
