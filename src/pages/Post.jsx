import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets"; // Import your assets here

const Post = () => {
  const [activeTab, setActiveTab] = useState("recommendations");
  const navigate = useNavigate();

  const mentors = [
    { id: 1, name: "Aarav Mehta", skill: "Full Stack Development", match: 92, avatar: assets.person1 },
    { id: 2, name: "Riya Sharma", skill: "Data Science & Machine Learning", match: 87, avatar: assets.person3 },
    { id: 3, name: "Vikram Nair", skill: "Cybersecurity & Cloud Computing", match: 81, avatar: assets.person2 },
    { id: 4, name: "Sneha Patel", skill: "UI/UX Design", match: 95, avatar: assets.person5 },
  ];

  const connections = [
    { id: 1, name: "Ananya Gupta", role: "Frontend Developer", avatar: assets.person5 },
    { id: 2, name: "Rohit Verma", role: "Data Analyst", avatar: assets.person6 },
    { id: 3, name: "Mehul Jain", role: "Cloud Engineer", avatar: assets.person1 },
    { id: 4, name: "Priya Das", role: "UX Researcher", avatar: assets.person2 },
    { id: 5, name: "Ishaan Roy", role: "Mobile App Developer", avatar: assets.person3 },
    { id: 6, name: "Simran Kaur", role: "AI Engineer", avatar: assets.person4 },
    { id: 7, name: "Kunal Sinha", role: "Backend Developer", avatar: assets.person5 },
    { id: 8, name: "Neha Reddy", role: "Product Manager", avatar: assets.person6 },
    { id: 9, name: "Rahul Yadav", role: "Blockchain Specialist", avatar: assets.person1 },
    { id: 10, name: "Divya Nair", role: "QA Engineer", avatar: assets.person2 },
  ];

  const posts = [
    {
      id: 1,
      author: "Aarav Mehta",
      role: "Full Stack Developer",
      text: "Excited to share my latest MERN stack project — a real-time collaboration tool!",
      avatar: assets.person1,
      bgImage: assets.code
    },
    {
      id: 2,
      author: "Riya Sharma",
      role: "Data Scientist",
      text: "Achieved 98% model accuracy on an AI-driven healthcare dataset. Feeling accomplished!",
      avatar: assets.person2,
      bgImage: assets.code2,
    },
    {
      id: 3,
      author: "Vikram Nair",
      role: "Cybersecurity Analyst",
      text: "Conducted a security audit on a fintech startup — learned so much about ethical hacking.",
      avatar: assets.person3,
      bgImage: assets.post
    },
    {
      id: 4,
      author: "Sneha Patel",
      role: "UI/UX Designer",
      text: "Designing user experiences that feel human and intuitive is my true passion!",
      avatar: assets.person4,
      bgImage: assets.group
    },
    {
      id: 5,
      author: "Kunal Sinha",
      role: "Backend Developer",
      text: "Implemented a new microservices architecture — the performance boost was massive 🚀",
      avatar: assets.person5,
      bgImage: assets.code
    },
  ];

  return (
    <div>
      <Navbar />
      <div className="pt-24 min-h-screen bg-[#0d0d0d] text-white p-6">
        {/* Navigation Tabs */}
        <div className="flex justify-center gap-6 border-b border-gray-700 pb-3 mb-6">
          {["recommendations", "connections", "feed", "jobpost"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize px-4 py-2 rounded-md font-medium transition-colors duration-200 ${activeTab === tab
                  ? "bg-[#C5B239] text-black"
                  : "text-gray-400 hover:text-[#C5B239]"
                }`}
            >
              {tab === "jobpost" ? "Job Post" : tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Recommendations */}
          {activeTab === "recommendations" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 text-[#C5B239]">
                Mentor Recommendations
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {mentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    onClick={() => navigate(`/mentor/${mentor.id}`)}
                    className="bg-[#1a1a1a] p-5 rounded-xl shadow-md flex flex-col items-center cursor-pointer hover:bg-[#222] transition-all duration-200"
                  >
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-16 h-16 rounded-full object-cover mb-3"
                    />
                    <h3 className="font-semibold text-lg text-[#C5B239]">
                      {mentor.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-1">{mentor.skill}</p>
                    <div className="w-full bg-gray-800 rounded-full h-2.5 mt-3 mb-1">
                      <div
                        className="bg-[#C5B239] h-2.5 rounded-full"
                        style={{ width: `${mentor.match}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-400 text-xs">{mentor.match}% match</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connections */}
          {activeTab === "connections" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 text-[#C5B239]">
                Your Connections
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    onClick={() => navigate(`/connectionProfile/${conn.id}`)}
                    className="bg-[#1a1a1a] p-4 rounded-xl shadow-md flex justify-between items-center hover:bg-[#222] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={conn.avatar}
                        alt={conn.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-[#C5B239]">{conn.name}</h3>
                        <p className="text-gray-400 text-sm">{conn.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/messages`);
                      }}
                      className="bg-[#C5B239] hover:bg-[#b9a531] text-black font-medium px-3 py-1 rounded-md text-sm transition"
                    >
                      Message
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feed */}
          {/* Feed */}
          {activeTab === "feed" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 text-[#C5B239]">Feed</h2>
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-[#1a1a1a] p-4 rounded-xl shadow-md space-y-3 hover:bg-[#1e1e1e] transition-all"
                >
                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <img
                      src={post.avatar}
                      alt={post.author}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-[#C5B239]">{post.author}</h3>
                      <p className="text-gray-400 text-sm">{post.role}</p>
                    </div>
                  </div>

                  {/* Post Text */}
                  <p className="text-gray-300">{post.text}</p>

                  {/* Post Image */}
                  <img
                    src={post.bgImage}
                    alt="Post visual"
                    className="w-full h-64 rounded-lg object-cover border border-gray-800"
                  />

                  {/* Actions */}
                  <div className="flex justify-between mt-3 pt-2 border-t border-gray-700">
                    {["👍 Like", "💬 Comment", "✉️ Message"].map((action) => (
                      <button
                        key={action}
                        className="text-gray-400 hover:text-[#C5B239] text-sm transition"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}


          {/* Job Post */}
          {activeTab === "jobpost" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 text-[#C5B239]">Job Openings</h2>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] p-4 rounded-xl shadow-md flex justify-between items-start"
                >
                  <div>
                    <h3 className="font-semibold text-[#C5B239]">
                      Technical Support Officer
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      Company XYZ • Location: Remote
                    </p>
                    <p className="text-gray-300 text-sm">
                      Responsibilities include assisting customers with tech issues,
                      troubleshooting, and maintaining system logs.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/apply/${i}`)}
                    className="bg-[#C5B239] hover:bg-[#b9a531] text-black font-medium px-3 py-1 rounded-md text-sm transition"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Post;
