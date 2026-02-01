import { Routes, Route } from "react-router-dom";
import React from "react";
import LoginLanding from "./pages/LoginLanding";
import AlumniLogin from "./pages/AlumniLogin";
import StudentLogin from "./pages/StudentLogin";
import AdminLogin from "./pages/AdminLogin";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import AddEvents from "./pages/AddEvents";
import Post from "./pages/Post";
import MentorProfile from "./pages/MentorProfile";
import Donations from "./pages/Donations";
import Redeem from "./pages/Redeem";
import Apply from "./pages/Apply";
import ConnectionProfile from "./pages/ConnectionProfile";
import Map from "./pages/Map";
import Messages from "./pages/Messages";
import Dashboard from "./pages/Dashboard";
import Admin_Jobs from "./pages/Admin_Jobs";
import StudentSignup from "./pages/StudentSignup";
import AlumniSignup from "./pages/AlumniSignup";
import Admin_Directory from "./pages/Admin_Directory";
import Admin_Dashboard from "./pages/Admin_Dashboard";
import VerificationPending from "./pages/VerificationPending";
import ProtectedRoute from "./components/ProtectedRoute";
// import Feed from "./pages/Feed";

function App() {
  return (
    <div>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginLanding />} />
        <Route path="/alumniLogin" element={<AlumniLogin />} />
        <Route path="/studentLogin" element={<StudentLogin />} />
        <Route path="/adminLogin" element={<AdminLogin />} />
        <Route path="/student-signup" element={<StudentSignup />} />
        <Route path="/alumni-signup" element={<AlumniSignup />} />
        <Route path="/verification-pending" element={<VerificationPending />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/addEvents" element={<AddEvents />} />
          <Route path="/post" element={<Post />} />
          <Route path="/mentor/:id" element={<MentorProfile />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/redeem" element={<Redeem />} />
          <Route path="/apply/:jobId" element={<Apply />} />
          <Route path="/connectionProfile/:id" element={<ConnectionProfile />} />
          <Route path="/map" element={<Map />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/directory" element={<Admin_Directory />} />
          <Route path="/dashboard" element={<Admin_Dashboard />} />
          <Route path="/admin-jobs" element={<Admin_Jobs />} />
        </Route>
      </Routes>
    </div>

  );
}

export default App;