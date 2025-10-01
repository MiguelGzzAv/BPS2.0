import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <Routes>
      {/* For now, the login page is the only page */}
      <Route path="/" element={<Login />} />
      {/* We can add more routes here later, e.g., for a protected dashboard */}
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
    </Routes>
  );
}

export default App;