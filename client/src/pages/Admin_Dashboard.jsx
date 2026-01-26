import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { jobsAPI } from '../services/api';
import { FaTimes, FaCheck, FaBriefcase, FaBuilding, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const Admin_Dashboard = () => {
  const [activeTab, setActiveTab] = useState("pending-jobs");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (activeTab === "pending-jobs") {
      fetchPendingRequests();
    }
  }, [activeTab]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getPendingRequests();
      if (response.success) {
        setPendingRequests(response.data);
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      alert("Failed to load pending job requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm("Are you sure you want to approve this job request?")) return;

    try {
      const response = await jobsAPI.approveRequest(requestId);
      if (response.success) {
        alert("Job request approved and published successfully!");
        fetchPendingRequests(); // Refresh the list
      }
    } catch (err) {
      console.error("Error approving request:", err);
      alert(err.response?.data?.message || "Failed to approve job request.");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await jobsAPI.rejectRequest(requestId, rejectionReason);
      if (response.success) {
        alert("Job request rejected successfully.");
        setSelectedRequest(null);
        setRejectionReason("");
        fetchPendingRequests(); // Refresh the list
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert(err.response?.data?.message || "Failed to reject job request.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="pt-24 min-h-screen bg-black text-white p-6">
        <h1 className="text-3xl font-bold mb-6 text-[#F0D41D]">Admin Dashboard</h1>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-gray-700 pb-3 mb-6">
          <button
            onClick={() => setActiveTab("pending-jobs")}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${activeTab === "pending-jobs"
              ? "bg-[#F0D41D] text-black"
              : "text-gray-400 hover:text-[#F0D41D]"
              }`}
          >
            Pending Job Requests
          </button>
          {/* Add more tabs here as needed */}
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === "pending-jobs" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#F0D41D]">
                  Job Posting Requests from Alumni
                </h2>
                <span className="text-gray-400">
                  {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading requests...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="bg-gray-800 p-8 rounded-xl text-center text-gray-400">
                  No pending job requests at the moment.
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.request_id}
                    className="bg-gray-800 border border-gray-600 p-6 rounded-xl space-y-3 hover:bg-gray-700 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl text-[#F0D41D] mb-2 flex items-center gap-2">
                          <FaBriefcase />
                          {request.job_title}
                        </h3>
                        <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-400">
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
                          <span className="flex items-center gap-1">
                            <FaClock />
                            Submitted: {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-3">
                          {request.description}
                        </p>
                        {request.requirements && (
                          <div className="text-gray-400 text-sm mb-3">
                            <span className="font-semibold">Requirements:</span> {request.requirements}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-gray-600">
                      <button
                        onClick={() => handleApprove(request.request_id)}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <FaCheck />
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => setSelectedRequest(request.request_id)}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <FaTimes />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md relative">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
              <h2 className="text-white text-2xl font-semibold mb-6">
                Reject Job Request
              </h2>
              <div className="space-y-4">
                <textarea
                  placeholder="Reason for rejection (optional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-gray-800 p-3 rounded-md text-white outline-none resize-none"
                  rows={4}
                ></textarea>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-md text-white font-semibold transition-colors"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setRejectionReason("");
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-md text-white font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin_Dashboard;
