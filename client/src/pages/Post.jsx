import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import { useUser } from "../context/UserContext";
import { jobsAPI, postsAPI, connectionsAPI } from "../services/api";
import {
  FaTimes,
  FaBriefcase,
  FaMapMarkerAlt,
  FaBuilding,
  FaUserTie,
  FaTrash,
} from "react-icons/fa";
import axios from "axios";

// Helper function to get random avatar
const getRandomAvatar = () => {
  const avatars = [
    assets.person1,
    assets.person2,
    assets.person3,
    assets.person4,
    assets.person5,
    assets.person6,
  ];
  return avatars[Math.floor(Math.random() * avatars.length)];
};

const Post = () => {
  const [activeTab, setActiveTab] = useState("recommendations");
  const navigate = useNavigate();
  const { user } = useUser();

  // Student connection requests (for alumni)
  const [studentRequests, setStudentRequests] = useState([]);
  const [loadingStudentRequests, setLoadingStudentRequests] = useState(false);

  // Jobs applied by user (student/alumni)
  const [myApplications, setMyApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);


  const [searchQuery, setSearchQuery] = useState("");

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);

  // Alumni job requests state
  const [myJobRequests, setMyJobRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

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

  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [connectedMentorNames, setConnectedMentorNames] = useState(new Set());

  const [connections, setConnections] = useState([]);

  // Fetch existing connections on mount
  // Fetch existing connections
  const fetchConnections = React.useCallback(async () => {
    if (!user) return;

    try {
      const response = await connectionsAPI.getAll();
      if (response.success) {
        console.log('🔍 Raw connections data:', response.connections);

        // Format connections for display
        const formattedConnections = response.connections.map((conn) => {
          // Format skills - handle both array and string formats
          let skillDisplay = conn.mentor_skill;
          if (Array.isArray(skillDisplay)) {
            skillDisplay = skillDisplay.join(', ');
          } else if (typeof skillDisplay === 'string') {
            // Already a string, use as-is
            skillDisplay = skillDisplay;
          } else {
            skillDisplay = '';
          }

          return {
            id: conn.connection_user_id, // Use the actual user ID, not connection table ID
            name: conn.mentor_name,
            skill: skillDisplay,
            avatar: conn.mentor_avatar || assets.profile,
            match: conn.match_score,
          };
        });

        console.log('📋 Formatted connections:', formattedConnections);
        setConnections(formattedConnections);

        // Track connected mentor names
        const connectedNames = new Set(
          response.connections.map((c) => c.mentor_name)
        );
        setConnectedMentorNames(connectedNames);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    }
  }, [user]);

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    const fetchStudentRequests = async () => {
      if (!user || user.role !== "alumni") return;

      try {
        setLoadingStudentRequests(true);
        const res = await connectionsAPI.getPendingRequests();
        if (res.success) {
          setStudentRequests(res.requests);
        }
      } catch (err) {
        console.error("Failed to fetch student requests:", err);
      } finally {
        setLoadingStudentRequests(false);
      }
    };

    fetchStudentRequests();
  }, [user]);

  // Fetch mentors from AI model
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.log("❌ No token in localStorage");
          return;
        }

        const res = await axios.get(
          "http://localhost:5001/api/mentor-recommend",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("✅ Mentor API raw data:", res.data);

        const formatted = res.data.map((m, index) => {
          console.log(`🔍 Mentor ${index} - ${m.name}:`, {
            match_percentage: m.match_percentage,
            score: m.score,
            skill_match_count: m.skill_match_count,
            calculated_match: m.match_percentage !== undefined ? m.match_percentage : Math.round((m.score || 0.5) * 100)
          });
          return {
            id: m.id || index,
            name: m.name,
            skill: m.skills.join(", "),
            match: m.match_percentage !== undefined ? m.match_percentage : Math.round((m.score || 0.5) * 100),
            avatar: m.profile_image || assets.profile,
          };
        });

        console.log("📋 Formatted mentors:", formatted);
        setRecommendedMentors(formatted);
      } catch (err) {
        console.error(
          "❌ Mentor fetch error:",
          err.response?.data || err.message
        );
      }
    };

    fetchMentors();
  }, []);




  const handleConnect = async (mentor) => {
    try {
      // Check if user is logged in
      if (!user) {
        alert("Please log in to connect with mentors");
        return;
      }

      // Save connection to database
      const response = await connectionsAPI.create({
        receiver_id: mentor.id,
        mentor_name: mentor.name,
        mentor_skill: mentor.skill,
        match_score: mentor.match,
        mentor_identifier: `${mentor.id}`,
      });

      if (response.success) {
        // Mark as pending (don't add to connections yet)
        setConnectedMentorNames((prev) => new Set([...prev, mentor.name]));

        // Remove from recommendations
        setRecommendedMentors((prev) => prev.filter((m) => m.id !== mentor.id));

        // Show pending status message
        alert(`Connection request sent to ${mentor.name}! Waiting for approval.`);
      }
    } catch (error) {
      console.error("Failed to connect:", error);

      // Handle duplicate connection
      if (error.response?.data?.alreadyConnected) {
        alert("You are already connected with this mentor");
        setConnectedMentorNames((prev) => new Set([...prev, mentor.name]));
        setRecommendedMentors((prev) => prev.filter((m) => m.id !== mentor.id));
      } else if (error.response?.data?.message?.includes("already sent")) {
        alert("Connection request already sent to this mentor");
        setConnectedMentorNames((prev) => new Set([...prev, mentor.name]));
        setRecommendedMentors((prev) => prev.filter((m) => m.id !== mentor.id));
      } else {
        alert("Failed to send connection request. Please try again.");
      }
    }
  };
  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await connectionsAPI.acceptRequest(requestId);
      if (res.success) {
        setStudentRequests(prev => prev.filter(r => r.request_id !== requestId));
        fetchConnections(); // refresh mentor list
        alert("Connection accepted!");
      }
    } catch (err) {
      console.error("Accept failed:", err);
      alert("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const res = await connectionsAPI.rejectRequest(requestId);
      if (res.success) {
        setStudentRequests(prev => prev.filter(r => r.request_id !== requestId));
        alert("Request rejected");
      }
    } catch (err) {
      console.error("Reject failed:", err);
      alert("Failed to reject request");
    }
  };


  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // 🔹 Create Post state
  const [newPost, setNewPost] = useState({
    text: "",
    image: null,
  });

  // 🔹 Image preview and crop state
  const [showImageModal, setShowImageModal] = useState(false);
  const [tempImageFile, setTempImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);

  // 🔹 Create Post handler
  const handleCreatePost = async () => {
    if (!newPost.text.trim() && !newPost.image) {
      alert("Please enter some text or select an image");
      return;
    }

    if (!user) {
      alert("Please log in to create a post");
      return;
    }

    try {
      console.log("Creating post...", { user, content: newPost.text });

      const response = await postsAPI.create({
        content: newPost.text,
        image: newPost.image,
      });

      console.log("Post response:", response);

      if (response.success) {
        // Add the new post to the feed
        const formattedPost = {
          post_id: response.post.post_id,
          user_id: response.post.user_id,
          user_role: response.post.user_role,
          content: response.post.content,
          image_url: response.post.image_url,
          created_at: response.post.created_at,
          author_name: response.post.author_name,
          author_avatar: response.post.author_avatar,
          likes_count: response.post.likes_count || 0,
          comments_count: response.post.comments_count || 0,
          is_liked: response.post.is_liked || false,
        };

        setPosts((prev) => [formattedPost, ...prev]);
        setNewPost({ text: "", image: null });
        alert("Post created successfully!");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      const errorMsg =
        error.response?.data?.message || error.message || "Unknown error";
      alert(`Failed to create post: ${errorMsg}`);
    }
  };

  // 🔹 Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      setTempImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setShowImageModal(true);
      setImageZoom(1);
    }
  };

  // 🔹 Confirm and use the selected image
  const handleConfirmImage = async () => {
    if (!tempImageFile) return;

    const img = new Image();
    img.src = imagePreview;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      width *= imageZoom;
      height *= imageZoom;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const processedFile = new File([blob], tempImageFile.name, {
            type: tempImageFile.type,
            lastModified: Date.now(),
          });

          setNewPost({ ...newPost, image: processedFile });
          setShowImageModal(false);
          setTempImageFile(null);
        },
        tempImageFile.type,
        0.9
      );
    };
  };

  // 🔹 Cancel image selection
  const handleCancelImage = () => {
    setShowImageModal(false);
    setTempImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageZoom(1);
  };

  // 🔹 Remove selected image from post
  const handleRemoveImage = () => {
    if (newPost.image) {
      setNewPost({ ...newPost, image: null });
    }
  };

  // 🔹 Delete post handler
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await postsAPI.delete(postId);

      if (response.success) {
        setPosts((prev) => prev.filter((post) => post.post_id !== postId));
        alert("Post deleted successfully!");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      const errorMsg =
        error.response?.data?.message || error.message || "Unknown error";
      alert(`Failed to delete post: ${errorMsg}`);
    }
  };

  // 🔹 Like/Unlike handler
  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await postsAPI.unlike(postId);
      } else {
        await postsAPI.like(postId);
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.post_id === postId
            ? {
              ...post,
              is_liked: !isLiked,
              likes_count: isLiked
                ? post.likes_count - 1
                : post.likes_count + 1,
            }
            : post
        )
      );
    } catch (error) {
      console.error("Failed to like/unlike post:", error);
      alert("Failed to update like");
    }
  };

  // 🔹 Comment state and handler
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});

  const handleAddComment = async (postId) => {
    const text = commentText[postId];
    if (!text || !text.trim()) {
      alert("Please enter a comment");
      return;
    }

    try {
      const response = await postsAPI.addComment(postId, text);

      if (response.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.post_id === postId
              ? { ...post, comments_count: post.comments_count + 1 }
              : post
          )
        );

        setCommentText((prev) => ({ ...prev, [postId]: "" }));

        if (showComments[postId]) {
          fetchComments(postId);
        }
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment");
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await postsAPI.getComments(postId);
      if (response.success) {
        setComments((prev) => ({ ...prev, [postId]: response.comments }));
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const toggleComments = (postId) => {
    const isCurrentlyShowing = showComments[postId];
    setShowComments((prev) => ({ ...prev, [postId]: !isCurrentlyShowing }));

    if (!isCurrentlyShowing && !comments[postId]) {
      fetchComments(postId);
    }
  };

  // Fetch jobs when jobpost tab is active
  useEffect(() => {
    if (activeTab === "jobpost") {
      fetchJobs();
      fetchMyJobRequests();
    }
  }, [activeTab]);

  // Fetch posts when feed tab is active
  useEffect(() => {
    if (activeTab === "feed") {
      fetchPosts();
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await postsAPI.getAll({ page: postsPage, limit: 10 });

      if (response.success) {
        setPosts(response.posts);
        setHasMorePosts(response.pagination.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

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

  // Fetch alumni job requests
  const fetchMyJobRequests = async () => {
    if (user?.role !== "alumni") return;

    try {
      setLoadingRequests(true);
      const response = await jobsAPI.getMyRequests();
      if (response.success) {
        setMyJobRequests(response.data || response.requests || []);
      }
    } catch (err) {
      console.error("Error fetching job requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    const fetchMyApplications = async () => {
      if (!user) return;

      try {
        setLoadingApplications(true);
        const res = await jobsAPI.getMyApplications(); // ⚠️ backend required
        if (res.success) {
          setMyApplications(res.data || res.applications || []);
        }
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setLoadingApplications(false);
      }
    };

    if (activeTab === "jobpost") {
      fetchMyApplications();
    }
  }, [user, activeTab]);


  // Delete job handler
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      const response = await jobsAPI.deleteJob(jobId);

      if (response.success) {
        setJobs((prev) => prev.filter((job) => job.job_id !== jobId));
        alert("Job deleted successfully!");
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
      const errorMsg =
        error.response?.data?.message || error.message || "Failed to delete job";
      alert(errorMsg);
    }
  };

  // Delete pending job request handler (for alumni)
  const handleDeletePendingRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this job request?")) {
      return;
    }

    try {
      const response = await jobsAPI.deletePendingRequest(requestId);

      if (response.success) {
        setMyJobRequests((prev) =>
          prev.filter((req) => req.request_id !== requestId)
        );
        alert("Job request deleted successfully!");
      }
    } catch (error) {
      console.error("Failed to delete job request:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete job request";
      alert(errorMsg);
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

        fetchJobs();
      }
    } catch (err) {
      console.error("Application error:", err);
      alert(
        err.response?.data?.message ||
        "Failed to submit application. Please try again."
      );
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();

    console.log("=== Job Submission Debug ===");
    console.log("User from context:", user);
    console.log("User role:", user?.role);
    console.log("Token in localStorage:", localStorage.getItem("token"));

    if (!jobFormData.title || !jobFormData.company || !jobFormData.description) {
      alert("Please fill in title, company, and description.");
      return;
    }

    try {
      let response;
      if (user?.role === "admin") {
        console.log("Admin creating job with data:", jobFormData);
        response = await jobsAPI.create(jobFormData);
      } else if (user?.role === "alumni") {
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
        alert(
          "You don't have permission to create jobs. Your role: " +
          (user?.role || "not logged in")
        );
        return;
      }

      if (response && response.success) {
        const message =
          user?.role === "admin"
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
          fetchJobs();
        } else if (user?.role === "alumni") {
          fetchMyJobRequests();
        }
      }
    } catch (err) {
      console.error("=== Error Details ===");
      console.error("Full error:", err);
      console.error("Error response:", err.response);
      console.error("Error response data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error message:", err.message);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit job request. Please try again.";
      alert("ERROR: " + errorMessage);
    }
  };

  // Filter mentors: exclude already connected ones, apply search, sort by match
  const filteredMentors = recommendedMentors
    .filter((m) => !connectedMentorNames.has(m.name))
    .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.match - a.match)
    .slice(0, 50);

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
                        onClick={() => {
                          navigate(`/mentor/${mentor.id}`);
                        }}
                        className="text-xs text-gray-400 hover:text-[#C5B239]"
                      >
                        View Profile
                      </button>

                      <button
                        onClick={() => handleConnect(mentor)}
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
            <div className="flex gap-6">

              {/* LEFT: Main Connections List (UNCHANGED CODE MOVED HERE) */}
              <div className="flex-1 space-y-4">
                <h2 className="text-xl font-semibold text-[#C5B239]">
                  Your Connections
                </h2>

                <input
                  type="text"
                  placeholder="Search connections by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111] text-white p-3 rounded-lg outline-none border border-gray-700 focus:border-[#C5B239]"
                />

                {connections.length === 0 ? (
                  <p className="text-gray-400 text-center py-10">
                    You have no connections yet. Start connecting with mentors.
                  </p>
                ) : (
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
                              <h3 className="font-semibold text-[#C5B239]">
                                {conn.name}
                              </h3>
                              <p className="text-gray-400 text-sm">{conn.skill}</p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/messages");
                            }}
                            className="bg-[#C5B239] hover:bg-[#b9a531] text-black font-medium px-3 py-1 rounded-md text-sm transition"
                          >
                            Message
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Student Requests Sidebar (ALUMNI ONLY) */}
              {user?.role === "alumni" && (
                <div className="w-80 bg-[#1a1a1a] p-4 rounded-xl border border-gray-700 h-fit sticky top-24">
                  <h3 className="text-lg font-semibold text-[#C5B239] mb-3">
                    Student Connection Requests
                  </h3>

                  {loadingStudentRequests ? (
                    <p className="text-gray-400 text-sm">Loading...</p>
                  ) : studentRequests.length === 0 ? (
                    <p className="text-gray-500 text-sm">No pending requests</p>
                  ) : (
                    <div className="space-y-3">
                      {studentRequests.map((req) => (
                        <div
                          key={req.request_id}
                          className="bg-[#111] p-3 rounded-lg border border-gray-700"
                        >
                          <p className="text-sm font-semibold text-white">
                            {req.student_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {req.student_skill || "Student"}
                          </p>

                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleAcceptRequest(req.request_id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.request_id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Feed */}
          {activeTab === "feed" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 text-[#C5B239]">Feed</h2>

              {/* 🔹 Create Post */}
              <div className="bg-[#1a1a1a] p-4 rounded-xl shadow-md space-y-3">
                <textarea
                  value={newPost.text}
                  onChange={(e) =>
                    setNewPost({ ...newPost, text: e.target.value })
                  }
                  placeholder="Create a post..."
                  rows={3}
                  className="w-full bg-[#111] text-white p-3 rounded-lg outline-none resize-none"
                />

                {/* Image upload button */}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-[#2a2a2a] hover:bg-[#333] text-gray-300 px-4 py-2 rounded-lg transition flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Add Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  {newPost.image && (
                    <span className="text-green-400 text-sm flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Image added
                    </span>
                  )}
                </div>

                {/* Image preview */}
                {newPost.image && (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(newPost.image)}
                      alt="Preview"
                      className="w-full max-h-96 object-contain rounded-lg border border-gray-700 bg-black"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition"
                      title="Remove image"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
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

              {/* Loading state */}
              {loadingPosts && (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading posts...</p>
                </div>
              )}

              {/* Posts from API */}
              {!loadingPosts &&
                posts.map((post) => (
                  <div
                    key={post.post_id}
                    className="bg-[#1a1a1a] p-4 rounded-xl shadow-md space-y-3 hover:bg-[#1e1e1e] transition-all"
                  >
                    {/* Author Info with Delete Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.author_avatar || assets.profile}
                          alt="User"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-[#C5B239]">
                            {post.author_name ||
                              `${post.user_role === "student"
                                ? "Student"
                                : "Alumni"
                              } (ID: ${post.user_id})`}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {post.user_role}
                          </p>
                        </div>
                      </div>

                      {/* Delete button - only visible to post owner */}
                      {user &&
                        (user.id === post.user_id ||
                          user.user_id === post.user_id ||
                          user.student_id === post.user_id) && (
                          <button
                            onClick={() => handleDeletePost(post.post_id)}
                            className="text-red-400 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-lg transition-all"
                            title="Delete post"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                    </div>

                    {/* Post Text */}
                    <p className="text-gray-300">{post.content}</p>

                    {/* Post Image */}
                    {post.image_url && (
                      <div className="w-full rounded-lg overflow-hidden border border-gray-800 bg-black">
                        <img
                          src={post.image_url}
                          alt="Post visual"
                          className="w-full max-h-[600px] object-contain"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between mt-3 pt-2 border-t border-gray-700">
                      <button
                        onClick={() => handleLike(post.post_id, post.is_liked)}
                        className={`${post.is_liked ? "text-[#C5B239]" : "text-gray-400"
                          } hover:text-[#C5B239] text-sm transition`}
                      >
                        👍 {post.is_liked ? "Liked" : "Like"} ({post.likes_count})
                      </button>

                      <button
                        onClick={() => toggleComments(post.post_id)}
                        className="text-gray-400 hover:text-[#C5B239] text-sm transition"
                      >
                        💬 Comment ({post.comments_count})
                      </button>

                      <button className="text-gray-400 hover:text-[#C5B239] text-sm transition">
                        ✉️ Message
                      </button>
                    </div>

                    {/* Comments Section */}
                    {showComments[post.post_id] && (
                      <div className="mt-4 border-t border-gray-700 pt-4">
                        {/* Add Comment Input */}
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            value={commentText[post.post_id] || ""}
                            onChange={(e) =>
                              setCommentText((prev) => ({
                                ...prev,
                                [post.post_id]: e.target.value,
                              }))
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(post.post_id);
                              }
                            }}
                            placeholder="Write a comment..."
                            className="flex-1 bg-[#212529] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#C5B239]"
                          />
                          <button
                            onClick={() => handleAddComment(post.post_id)}
                            className="bg-[#C5B239] text-black px-4 py-2 rounded-lg hover:bg-[#d4c04a] transition"
                          >
                            Post
                          </button>
                        </div>

                        {/* Display Comments */}
                        <div className="space-y-3">
                          {comments[post.post_id]?.length > 0 ? (
                            comments[post.post_id].map((comment) => (
                              <div
                                key={comment.comment_id}
                                className="bg-[#212529] p-3 rounded-lg"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-6 h-6 rounded-full bg-[#C5B239] flex items-center justify-center text-black text-xs font-bold">
                                    {comment.user_role?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm text-gray-400">
                                    {comment.user_role}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(
                                      comment.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  {comment.comment_text}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm text-center py-2">
                              No comments yet. Be the first to comment!
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {/* No posts message */}
              {!loadingPosts && posts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    No posts yet. Be the first to share!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Job Post */}
          {activeTab === "jobpost" && (
            <div className="flex gap-6">

              {/* LEFT: Existing Job Content */}
              <div className="flex-1 space-y-6">

                {/* Alumni: My Pending Job Requests */}
                {user?.role === "alumni" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-[#C5B239]">
                      My Pending Job Requests
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Jobs you've requested that are awaiting admin approval
                    </p>

                    {loadingRequests ? (
                      <div className="text-center text-gray-400 py-8">
                        Loading your requests...
                      </div>
                    ) : myJobRequests.filter(req => req.status === 'pending').length === 0 ? (
                      <div className="text-center text-gray-400 py-6">
                        No pending job requests. You can request a new job posting below.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myJobRequests.filter(req => req.status === 'pending').map((request) => (
                          <div
                            key={request.request_id}
                            className="bg-[#1a1a1a] p-5 rounded-xl shadow-md space-y-3 hover:bg-[#1e1e1e] transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-[#C5B239] flex items-center gap-2">
                                  <FaBriefcase className="text-sm" />
                                  {request.job_title}
                                </h3>
                                <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-400 mt-2">
                                  <span className="flex items-center gap-1">
                                    <FaBuilding />
                                    {request.company}
                                  </span>
                                  {request.location && (
                                    <span className="flex items-center gap-1">
                                      <FaMapMarkerAlt />
                                      {request.location}
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${request.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-500"
                                      : request.status === "approved"
                                        ? "bg-green-500/20 text-green-500"
                                        : "bg-red-500/20 text-red-500"
                                      }`}
                                  >
                                    {request.status.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm mb-2">
                                  {request.description}
                                </p>
                                {request.requirements && (
                                  <div className="text-gray-400 text-sm">
                                    <span className="font-semibold">Requirements:</span>{" "}
                                    {request.requirements}
                                  </div>
                                )}
                              </div>

                              {/* Delete button - only for pending requests */}
                              {request.status === "pending" && (
                                <button
                                  onClick={() =>
                                    handleDeletePendingRequest(request.request_id)
                                  }
                                  className="text-red-400 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-lg transition-all ml-4"
                                  title="Delete request"
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Job Openings */}
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
                        {user.role === "admin"
                          ? "Create Job"
                          : "Request Job Posting"}
                      </button>
                    )}
                  </div>

                  {loadingJobs ? (
                    <div className="text-center text-gray-400 py-8">
                      Loading jobs...
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      No jobs available at the moment.
                    </div>
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
                                Posted by:{" "}
                                {job.posted_by_role === "admin"
                                  ? "Admin"
                                  : "Alumni"}
                              </span>
                              {job.application_count > 0 && (
                                <span className="text-[#C5B239]">
                                  {job.application_count}{" "}
                                  {job.application_count === 1
                                    ? "application"
                                    : "applications"}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm mb-2">
                              {job.description}
                            </p>
                            {job.requirements && (
                              <div className="text-gray-400 text-sm">
                                <span className="font-semibold">
                                  Requirements:
                                </span>{" "}
                                {job.requirements}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            {/* Delete button - Admin can delete any job */}
                            {user && user.role === "admin" && (
                              <button
                                onClick={() => handleDeleteJob(job.job_id)}
                                className="text-red-400 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-lg transition-all"
                                title="Delete job"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            )}

                            {/* Apply button */}
                            {user &&
                              (user.role === "student" ||
                                user.role === "alumni") && (
                                <button
                                  onClick={() => setShowApplyModal(job.job_id)}
                                  className="bg-[#C5B239] hover:bg-[#b9a531] text-black font-medium px-4 py-2 rounded-md text-sm transition"
                                >
                                  Apply
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div> {/* END LEFT COLUMN */}



              {/* RIGHT SIDEBAR: My Applications */}
              {user && (user.role === "student" || user.role === "alumni") && (
                <div className="w-80 bg-[#1a1a1a] p-4 rounded-xl border border-gray-700 h-fit sticky top-24">
                  <h3 className="text-lg font-semibold text-[#C5B239] mb-3">
                    My Job Applications
                  </h3>

                  {loadingApplications ? (
                    <p className="text-gray-400 text-sm">Loading...</p>
                  ) : myApplications.length === 0 ? (
                    <p className="text-gray-500 text-sm">No applications yet</p>
                  ) : (
                    <div className="space-y-3">
                      {myApplications.map((app) => (
                        <div
                          key={app.application_id}
                          className="bg-[#111] p-3 rounded-lg border border-gray-700"
                        >
                          <p className="text-sm font-semibold text-white">
                            {app.job_title}
                          </p>
                          <p className="text-xs text-gray-400">{app.company}</p>

                          <span
                            className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${app.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : app.status === "accepted"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                              }`}
                          >
                            {app.status?.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                    setApplicationData({
                      ...applicationData,
                      resume_url: e.target.value,
                    })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={applicationData.full_name}
                  onChange={(e) =>
                    setApplicationData({
                      ...applicationData,
                      full_name: e.target.value,
                    })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Email *
                </label>
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
                <label className="text-gray-400 text-sm mb-1 block">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={applicationData.phone}
                  onChange={(e) =>
                    setApplicationData({
                      ...applicationData,
                      phone: e.target.value,
                    })
                  }
                  className="w-full bg-[#111] p-3 rounded-md text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Current Location *
                </label>
                <input
                  type="text"
                  value={applicationData.location}
                  onChange={(e) =>
                    setApplicationData({
                      ...applicationData,
                      location: e.target.value,
                    })
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
                    setApplicationData({
                      ...applicationData,
                      resume_text: e.target.value,
                    })
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
                    setApplicationData({
                      ...applicationData,
                      cover_letter: e.target.value,
                    })
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
                    setApplicationData({
                      ...applicationData,
                      additional_details: e.target.value,
                    })
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
                  setJobFormData({
                    ...jobFormData,
                    description: e.target.value,
                  })
                }
                className="w-full bg-[#111] p-3 rounded-md text-white outline-none resize-none"
                rows={4}
                required
              ></textarea>
              <textarea
                placeholder="Requirements (Optional)"
                value={jobFormData.requirements}
                onChange={(e) =>
                  setJobFormData({
                    ...jobFormData,
                    requirements: e.target.value,
                  })
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

      {/* 🔹 Image Preview & Resize Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-[#C5B239]">
                Preview & Adjust Image
              </h3>
              <button
                onClick={handleCancelImage}
                className="text-gray-400 hover:text-white transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Image Preview Area */}
            <div className="flex-1 overflow-auto p-6 bg-[#0a0a0a] flex items-center justify-center">
              {imagePreview && (
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      transform: `scale(${imageZoom})`,
                      transition: "transform 0.2s ease",
                      maxWidth: "100%",
                      maxHeight: "70vh",
                      objectFit: "contain",
                    }}
                    className="rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-gray-700 space-y-4">
              {/* Zoom Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Zoom</label>
                  <span className="text-sm text-[#C5B239]">
                    {Math.round(imageZoom * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.1))}
                    className="bg-[#2a2a2a] hover:bg-[#333] text-white p-2 rounded-lg transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </button>

                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={imageZoom}
                    onChange={(e) =>
                      setImageZoom(parseFloat(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #C5B239 0%, #C5B239 ${((imageZoom - 0.5) / 1.5) * 100
                        }%, #374151 ${((imageZoom - 0.5) / 1.5) * 100
                        }%, #374151 100%)`,
                    }}
                  />

                  <button
                    onClick={() => setImageZoom(Math.min(2, imageZoom + 0.1))}
                    className="bg-[#2a2a2a] hover:bg-[#333] text-white p-2 rounded-lg transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => setImageZoom(1)}
                    className="bg-[#2a2a2a] hover:bg-[#333] text-white px-3 py-2 rounded-lg transition text-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelImage}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImage}
                  className="flex-1 bg-[#C5B239] hover:bg-[#b9a531] text-black py-3 rounded-lg transition font-medium"
                >
                  Use This Image
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Tip: Adjust the zoom to fit your image perfectly. The image will
                be optimized for posting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
