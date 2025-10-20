
// getCurrentUser.js
import axios from 'axios';

export const getCurrentUser = async () => {
  try { 
    // const res = await axios.get('http://localhost:8000/api/api/checkAuth', {
    const res = await axios.get('https://itrack-web-backend.onrender.com/api/checkAuth', {
   
      withCredentials: true
    });
    if (res.data.authenticated) return res.data.user;
    return null;
  } catch (err) {
    console.log('Error fetching current user:', err);
    return null;
  }
};

