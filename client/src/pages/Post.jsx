import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets"; // Import your assets here
import { useUser } from "../context/UserContext";
import { jobsAPI } from "../services/api";
import { FaTimes, FaBriefcase, FaMapMarkerAlt, FaBuilding, FaUserTie } from "react-icons/fa";


const Post = () => {
  const [activeTab, setActiveTab] = useState("recommendations");
  const navigate = useNavigate();
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);

  // Application form state
  const [applicationData, setApplicationData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    experience_years: "",
    expected_salary: "",
    availability: "",
    resume_url: "",
    resume_text: "",
    cover_letter: "",
    additional_details: "",
  });


  // Job creation/request form state
  const [jobFormData, setJobFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    requirements: "",
  });

  const mentors = [
    { id: 1, name: "Sneha Patel", skill: "UI/UX Design", match: 95, avatar: assets.person5 },
    { id: 2, name: "Aarav Mehta", skill: "Full Stack Development", match: 92, avatar: assets.person1 },
    { id: 3, name: "Riya Sharma", skill: "Data Science & ML", match: 87, avatar: assets.person3 },
    { id: 4, name: "Vikram Nair", skill: "Cybersecurity", match: 81, avatar: assets.person2 },
    { id: 5, name: "Kunal Sinha", skill: "Backend Engineering", match: 78, avatar: assets.person4 },
    { id: 6, name: "Neha Reddy", skill: "Product Management", match: 76, avatar: assets.person6 },
    { id: 7, name: "Ishaan Roy", skill: "Mobile Development", match: 73, avatar: assets.person3 },
    { id: 8, name: "Divya Nair", skill: "QA Automation", match: 70, avatar: assets.person2 },
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

  const [posts, setPosts] = useState([
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
  ]);
  // 🔹 Create Post state
  const [newPost, setNewPost] = useState({
    text: "",
    image: null,
  });


  // 🔹 Create Post handler
  const handleCreatePost = () => {
    if (!newPost.text.trim() && !newPost.image) return;
    if (!user) return;

    const post = {
      id: Date.now(),
      author: user.name || "You",
      role: user.role,
      text: newPost.text,
      avatar: assets.person1,
      bgImage: newPost.image
        ? URL.createObjectURL(newPost.image)
        : null,
    };

    setPosts((prev) => [post, ...prev]);
    setNewPost({ text: "", image: null });
  };


  // Fetch jobs when jobpost tab is active
  useEffect(() => {
    if (activeTab === "jobpost") {
      fetchJobs();
    }
  }, [activeTab]);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await jobsAPI.getAll();
      if (response.success) {
        setJobs(response.data);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      alert("Failed to load jobs. Please try again later.");
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleApplyForJob = async (e) => {
    e.preventDefault();

    if (
      !applicationData.full_name ||
      !applicationData.email ||
      !applicationData.phone ||
      !applicationData.location ||
      !applicationData.experience_years ||
      !applicationData.expected_salary ||
      !applicationData.availability
    ) {
      alert("Please fill all required candidate details.");
      return;
    }


    try {
      const response = await jobsAPI.apply(showApplyModal, applicationData);
      if (response.success) {
        alert("Application submitted successfully!");
        setShowApplyModal(null);
        setApplicationData({
          full_name: "",
          email: "",
          phone: "",
          location: "",
          experience_years: "",
          expected_salary: "",
          availability: "",
          resume_url: "",
          resume_text: "",
          cover_letter: "",
          additional_details: "",
        });

        fetchJobs(); // Refresh jobs to update application count
      }
    } catch (err) {
      console.error("Application error:", err);
      alert(err.response?.data?.message || "Failed to submit application. Please try again.");
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();

    console.log("=== Job Submission Debug ===");
    console.log("User from context:", user);
    console.log("User role:", user?.role);
    console.log("Token in localStorage:", localStorage.getItem('token'));

    if (!jobFormData.title || !jobFormData.company || !jobFormData.description) {
      alert("Please fill in title, company, and description.");
      return;
    }

    try {
      let response;
      if (user?.role === "admin") {
        // Admin creates job directly
        console.log("Admin creating job with data:", jobFormData);
        response = await jobsAPI.create(jobFormData);
      } else if (user?.role === "alumni") {
        // Alumni submits request
        const requestData = {
          job_title: jobFormData.title,
          company: jobFormData.company,
          location: jobFormData.location,
          description: jobFormData.description,
          requirements: jobFormData.requirements,
        };
        console.log("Alumni submitting job request:", requestData);
        response = await jobsAPI.requestJob(requestData);
        console.log("Response received:", response);
      } else {
        alert("You don't have permission to create jobs. Your role: " + (user?.role || "not logged in"));
        return;
      }

      if (response && response.success) {
        const message = user?.role === "admin"
          ? "Job created and published successfully!"
          : "Job request submitted successfully! It will be visible after admin approval.";
        alert(message);
        setShowAddJobModal(false);
        setJobFormData({
          title: "",
          company: "",
          location: "",
          description: "",
          requirements: "",
        });
        if (user?.role === "admin") {
          fetchJobs(); // Only refresh if admin (job is immediately visible)
        }
      }
    } catch (err) {
      console.error("=== Error Details ===");
      console.error("Full error:", err);
      console.error("Error response:", err.response);
      console.error("Error response data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error message:", err.message);

      const errorMessage = err.response?.data?.message || err.message || "Failed to submit job request. Please try again.";
      alert("ERROR: " + errorMessage);
    }
  };
  const filteredMentors = mentors
  .filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .sort((a, b) => b.match - a.match)
  .slice(0, 10);




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
    <h2 className="text-xl font-semibold text-[#C5B239]">
      Mentor Recommendations
    </h2>

    {/* Search */}
    <input
      type="text"
      placeholder="Search mentors by name..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full bg-[#111] text-white p-3 rounded-lg outline-none border border-gray-700 focus:border-[#C5B239]"
    />

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {filteredMentors.map((mentor) => (
        <div
          key={mentor.id}
          className="bg-[#1a1a1a] p-3 rounded-lg shadow-sm hover:bg-[#222] transition"
        >
          <div className="flex items-center gap-3">
            <img
              src={mentor.avatar}
              alt={mentor.name}
              className="w-10 h-10 rounded-full object-cover"
            />

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#C5B239]">
                {mentor.name}
              </h3>
              <p className="text-xs text-gray-400">{mentor.skill}</p>
            </div>

            <span className="text-xs text-gray-300 font-medium">
              {mentor.match}%
            </span>
          </div>

          {/* Match bar */}
          <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
            <div
              className="bg-[#C5B239] h-1.5 rounded-full"
              style={{ width: `${mentor.match}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between mt-3">
            <button
              onClick={() => navigate(`/mentor/${mentor.id}`)}
              className="text-xs text-gray-400 hover:text-[#C5B239]"
            >
              View Profile
            </button>

            <button
              onClick={() => navigate("/messages")}
              className="bg-[#C5B239] text-black text-xs px-3 py-1 rounded-md hover:bg-[#b9a531]"
            >
              Connect
            </button>
          </div>
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
              <input
                type="text"
                placeholder="Search connections by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] text-white p-3 rounded-lg outline-none border border-gray-700 focus:border-[#C5B239]"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                {connections
                  .filter((conn) =>
                    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((conn) => (

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

              {/* 🔹 Create Post */}
              <div className="bg-[#1a1a1a] p-4 rounded-xl shadow-md space-y-3">
                <textarea
                  value={newPost.text}
                  onChange={(e) => setNewPost({ text: e.target.value })}
                  placeholder="Create a post..."
                  rows={3}
                  className="w-full bg-[#111] text-white p-3 rounded-lg outline-none resize-none"
                />
                {/* Image upload */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setNewPost({
                      ...newPost,
                      image: e.target.files[0],
                    })
                  }
                  className="text-gray-400 text-sm"
                />

                {/* Image preview */}
                {newPost.image && (
                  <img
                    src={URL.createObjectURL(newPost.image)}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-700"
                  />
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleCreatePost}
                    className="bg-[#C5B239] hover:bg-[#b9a531] text-black font-medium px-4 py-2 rounded-md transition"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* 🔹 Existing Posts (UNCHANGED) */}
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
                      <h3 className="font-semibold text-[#C5B239]">
                        {post.author}
                      </h3>
                      <p className="text-gray-400 text-sm">{post.role}</p>
                    </div>
                  </div>

                  {/* Post Text */}
                  <p className="text-gray-300">{post.text}</p>

                  {/* Post Image */}
                  {post.bgImage && (
                    <img
                      src={post.bgImage}
                      alt="Post visual"
                      className="w-full h-64 rounded-lg object-cover border border-gray-800"
                    />
                  )}


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
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-[#C5B239]">
                  Job Openings
                </h2>

                {/* Add Job button for Alumni and Admin */}
                {user && (user.role === "alumni" || user.role === "admin") && (
                  <button
                    onClick={() => setShowAddJobModal(true)}
                    className="bg-[#C5B239] hover:bg-[#b9a531] text-black font-medium px-4 py-2 rounded-md text-sm transition"
                  >
                    {user.role === "admin" ? "Create Job" : "Request Job Posting"}
                  </button>
                )}
              </div>

              {loadingJobs ? (
                <div className="text-center text-gray-400 py-8">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No jobs available at the moment.</div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="bg-[#1a1a1a] p-5 rounded-xl shadow-md space-y-3 hover:bg-[#1e1e1e] transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-[#C5B239] mb-2 flex items-center gap-2">
                          <FaBriefcase className="text-sm" />
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <FaBuilding />
                            {job.company}
                          </span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <FaMapMarkerAlt />
                              {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FaUserTie />
                            Posted by: {job.posted_by_role === "admin" ? "Admin" : "Alumni"}
                          </span>
                          {job.application_count > 0 && (
                            <span className="text-[#C5B239]">
                              {job.application_count} {job.application_count === 1 ? 'application' : 'applications'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mb-2">
                          {job.description}
                        </p>
                        {job.requirements && (
                          <div className="text-gray-400 text-sm">
                            <span className="font-semibold">Requirements:</span> {job.requirements}
                          </div>
                        )}
                      </div>

                      {/* Apply button for students and alumni */}
                      {user && (user.role === "student" || user.role === "alumni") && (
                        <button
                          onClick={() => setShowApplyModal(job.job_id)}
                          className="bg-[#C5B239] hover:bg-[#b9a531] text-black font-medium px-4 py-2 rounded-md text-sm transition ml-4"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* Job Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#1a1a1a] p-8 rounded-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowApplyModal(null);
                setApplicationData({
                  full_name: "",
                  email: "",
                  phone: "",
                  location: "",
                  experience_years: "",
                  expected_salary: "",
                  availability: "",
                  resume_url: "",
                  resume_text: "",
                  cover_letter: "",
                  additional_details: "",
                });

              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
            <h2 className="text-white text-2xl font-semibold mb-6">
              Apply for Job
            </h2>
            <form onSubmit={handleApplyForJob} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Resume URL (e.g., Google Drive, Dropbox)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={applicationData.resume_url}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, resume_url: e.target.value })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={applicationData.full_name}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, full_name: e.target.value })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Email *</label>
                <input
                  type="email"
                  value={applicationData.email}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, email: e.target.value })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Phone Number *</label>
                <input
                  type="tel"
                  value={applicationData.phone}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, phone: e.target.value })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Current Location *</label>
                <input
                  type="text"
                  value={applicationData.location}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, location: e.target.value })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={applicationData.experience_years}
                    onChange={(e) =>
                      setApplicationData({
                        ...applicationData,
                        experience_years: e.target.value,
                      })
                    }
                    className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-1 block">
                    Expected Salary *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 8 LPA"
                    value={applicationData.expected_salary}
                    onChange={(e) =>
                      setApplicationData({
                        ...applicationData,
                        expected_salary: e.target.value,
                      })
                    }
                    className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Availability / Notice Period *
                </label>
                <input
                  type="text"
                  placeholder="Immediate / 15 days / 30 days"
                  value={applicationData.availability}
                  onChange={(e) =>
                    setApplicationData({
                      ...applicationData,
                      availability: e.target.value,
                    })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                  required
                />
              </div>

              <div className="text-center text-gray-500 text-sm">OR</div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Paste Resume Text
                </label>
                <textarea
                  placeholder="Paste your resume content here..."
                  value={applicationData.resume_text}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, resume_text: e.target.value })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none resize-none"
                  rows={4}
                ></textarea>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Cover Letter (Optional)
                </label>
                <textarea
                  placeholder="Write your cover letter..."
                  value={applicationData.cover_letter}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, cover_letter: e.target.value })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none resize-none"
                  rows={4}
                ></textarea>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Additional Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Portfolio link, LinkedIn, etc."
                  value={applicationData.additional_details}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, additional_details: e.target.value })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#C5B239] hover:bg-[#b9a531] py-3 rounded-md text-black font-semibold transition-colors"
              >
                Submit Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add/Request Job Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#1a1a1a] p-8 rounded-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowAddJobModal(false);
                setJobFormData({
                  title: "",
                  company: "",
                  location: "",
                  description: "",
                  requirements: "",
                });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
            <h2 className="text-white text-2xl font-semibold mb-6">
              {user?.role === "admin" ? "Create Job" : "Request Job Posting"}
            </h2>
            <form onSubmit={handleAddJob} className="space-y-4">
              <input
                type="text"
                placeholder="Job Title *"
                value={jobFormData.title}
                onChange={(e) =>
                  setJobFormData({ ...jobFormData, title: e.target.value })
                }
                className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                required
              />
              <input
                type="text"
                placeholder="Company Name *"
                value={jobFormData.company}
                onChange={(e) =>
                  setJobFormData({ ...jobFormData, company: e.target.value })
                }
                className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                required
              />
              <input
                type="text"
                placeholder="Location (e.g., Remote, Mumbai, Bangalore)"
                value={jobFormData.location}
                onChange={(e) =>
                  setJobFormData({ ...jobFormData, location: e.target.value })
                }
                className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
              />
              <textarea
                placeholder="Job Description *"
                value={jobFormData.description}
                onChange={(e) =>
                  setJobFormData({ ...jobFormData, description: e.target.value })
                }
                className="w-full bg-[#111] p-3 rounded-md text-white outline-none resize-none"
                rows={4}
                required
              ></textarea>
              <textarea
                placeholder="Requirements (Optional)"
                value={jobFormData.requirements}
                onChange={(e) =>
                  setJobFormData({ ...jobFormData, requirements: e.target.value })
                }
                className="w-full bg-[#111] p-3 rounded-md text-white outline-none resize-none"
                rows={3}
              ></textarea>
              <button
                type="submit"
                className="w-full bg-[#C5B239] hover:bg-[#b9a531] py-3 rounded-md text-black font-semibold transition-colors"
              >
                {user?.role === "admin" ? "Create Job" : "Submit Request"}
              </button>
              {user?.role === "alumni" && (
                <p className="text-gray-400 text-sm text-center">
                  Your job posting will be visible after admin approval.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
