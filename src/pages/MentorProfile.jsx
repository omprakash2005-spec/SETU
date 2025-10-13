import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets"; // ✅ import assets

const MentorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const mentors = [
    { id: 1, name: "Arjun Patel", role: "Full Stack Mentor", avatar: assets.person4 },
    { id: 2, name: "Kiara Kapoor", role: "Design Mentor", avatar: assets.person2 },
    { id: 3, name: "Vineet Arora", role: "Frontend Mentor", avatar: assets.person3 },
  ];

  const mentor = mentors.find((m) => m.id === Number(id)) || {
    name: `Mentor #${id}`,
    role: "Expert in Full Stack Development",
    avatar: assets.person5,
  };

  return (
    <div>
      <Navbar />
      <div className="pt-24 min-h-screen bg-[#0d0d0d] text-white p-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-500 hover:underline mb-4"
        >
          ← Back
        </button>

        <div className="max-w-3xl mx-auto bg-[#1a1a1a] p-6 rounded-xl shadow-md">
          <div className="flex flex-col items-center">
            {/* ✅ Profile Photo */}
            <img
              src={mentor.avatar}
              alt={mentor.name}
              className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#C5B239]"
            />
            <h2 className="text-2xl font-semibold mb-2 text-[#C5B239]">{mentor.name}</h2>
            <p className="text-gray-400 mb-4">{mentor.role}</p>

            <div className="text-gray-300 text-sm space-y-2 text-center">
              <p>
                Experienced professional with 8+ years in software development and
                mentoring.
              </p>
              <p>Specialized in React, Node.js, and scalable web architecture.</p>
              <p>
                Helps mentees grow their technical and problem-solving skills.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
