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
// import Feed from "./pages/Feed";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginLanding />} />
        <Route path="/alumniLogin" element={<AlumniLogin />} />
        <Route path="/studentLogin" element={<StudentLogin />} />
        <Route path="/adminLogin" element={<AdminLogin />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/events" element={<Events />} />
        <Route path="/addEvents" element={<AddEvents />} />
        <Route path="/post" element={<Post />} />
        <Route path="/mentor/:name" element={<MentorProfile />} />
        <Route path="/Donations" element={<Donations />} />
        <Route path="/Redeem" element={<Redeem />} />
        {/* <Route path="/feed" element={<Feed />} /> */}
        <Route path="/mentor/:id" element={<MentorProfile />} />
        <Route path="/apply/:jobId" element={<Apply />} />
        <Route path="/connectionProfile/:id" element={<ConnectionProfile />} />
        <Route path="/map" element={<Map />} />
        <Route path="/messages" element={<Messages />} />
      </Routes>
    </div>

  );
}

export default App;