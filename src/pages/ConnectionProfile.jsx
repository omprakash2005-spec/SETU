import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets"; // ✅ import assets

const ConnectionProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock user data for demo (you can replace this with your backend data later)
  const users = [
    { id: 1, name: "Justin Gethje", role: "Software Engineer", avatar: assets.person1 },
    { id: 2, name: "Kiara Kapoor", role: "UI/UX Designer", avatar: assets.person2 },
    { id: 3, name: "Vineet Arora", role: "Frontend Developer", avatar: assets.person3 },
    { id: 4, name: "Henry Cejudo", role: "Backend Engineer", avatar: assets.person4 },
  ];

  const user = users.find((u) => u.id === Number(id)) || {
    name: `User #${id}`,
    role: "Software Professional",
    avatar: assets.person1,
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-6">
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
            src={user.avatar}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#C5B239]"
          />
          <h2 className="text-2xl font-semibold mb-2 text-[#C5B239]">{user.name}</h2>
          <p className="text-gray-400 mb-4">{user.role}</p>
          <p className="text-gray-300 text-sm text-center">
            Enthusiastic tech professional focused on building impactful software
            products and mentoring peers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionProfile;
