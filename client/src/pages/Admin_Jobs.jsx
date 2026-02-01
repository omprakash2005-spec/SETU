import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { jobsAPI } from "../services/api";
import { useUser } from "../context/UserContext";
import {
  FaTimes,
  FaBriefcase,
  FaBuilding,
  FaMapMarkerAlt,
  FaUserTie,
  FaTrash,
} from "react-icons/fa";

const Admin_Jobs = () => {
  const { user } = useUser();

  // Tabs
  const [activeTab, setActiveTab] = useState("approve");

  // ================= APPROVE JOBS =================
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [reason, setReason] = useState("");

  // ================= ADD JOBS =================
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);

  const [jobFormData, setJobFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    requirements: "",
  });

  // ================= FETCH REQUESTS =================
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/jobs/pending/requests");
      setRequests(res.data.data || res.data.requests || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load job requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ================= FETCH JOBS =================
  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await jobsAPI.getAll();
      if (response.success) setJobs(response.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load jobs");
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "add") fetchJobs();
  }, [activeTab]);

  // ================= APPROVE / REJECT =================
  const approveRequest = async (id) => {
    if (!window.confirm("Approve this job post request?")) return;
    await api.post(`/jobs/approve/${id}`);
    setRequests((prev) => prev.filter((r) => r.request_id !== id));
  };

  const rejectRequest = async () => {
    await api.post(`/jobs/reject/${rejectModal.id}`, {
      rejection_reason: reason,
    });
    setRequests((prev) =>
      prev.filter((r) => r.request_id !== rejectModal.id)
    );
    setRejectModal({ open: false, id: null });
    setReason("");
  };

  // ================= ADD JOB =================
  const handleAddJob = async (e) => {
    e.preventDefault();

    if (!jobFormData.title || !jobFormData.company || !jobFormData.description) {
      alert("Please fill in title, company, and description.");
      return;
    }

    let response;

    if (user?.role === "admin") {
      response = await jobsAPI.create(jobFormData);
    } else if (user?.role === "alumni") {
      response = await jobsAPI.requestJob({
        job_title: jobFormData.title,
        company: jobFormData.company,
        location: jobFormData.location,
        description: jobFormData.description,
        requirements: jobFormData.requirements,
      });
    } else {
      alert("You don't have permission to create jobs.");
      return;
    }

    if (response?.success) {
      alert(
        user.role === "admin"
          ? "Job created successfully!"
          : "Job request submitted for approval!"
      );
      setShowAddJobModal(false);
      setJobFormData({
        title: "",
        company: "",
        location: "",
        description: "",
        requirements: "",
      });
      if (user.role === "admin") fetchJobs();
    }
  };

  // ================= DELETE JOB =================
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      const response = await jobsAPI.deleteJob(jobId);
      
      if (response.success) {
        // Remove job from local state
        setJobs((prev) => prev.filter((job) => job.job_id !== jobId));
        alert("Job deleted successfully!");
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to delete job";
      alert(errorMsg);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="pt-24 min-h-screen bg-[#0d0d0d] text-white p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Page Header */}
          <div>
            <h2 className="text-2xl font-semibold text-[#C5B239]">
              Job Management
            </h2>
            <p className="text-gray-400 text-sm">
              Approve job requests or add new job postings
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-700 pb-3">
            {["approve", "add"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md font-medium ${activeTab === tab
                    ? "bg-[#C5B239] text-black"
                    : "text-gray-400 hover:text-[#C5B239]"
                  }`}
              >
                {tab === "approve" ? "Approve Jobs" : "Add Jobs"}
              </button>
            ))}
          </div>

          {/* ================= APPROVE JOBS ================= */}
          {activeTab === "approve" && (
            <>
              <h3 className="text-xl font-semibold">Pending Job Requests</h3>
              <p className="text-gray-400 text-sm">
                Review and approve alumni-submitted job postings
              </p>

              {loading ? (
                <p className="text-gray-400 mt-6">Loading...</p>
              ) : requests.length === 0 ? (
                <p className="text-gray-400 mt-6">
                  No pending job requests
                </p>
              ) : (
                <div className="mt-6 overflow-hidden rounded-xl bg-gray-900 border border-gray-800">
                  <table className="w-full">
                    <thead className="bg-gray-800/60">
                      <tr>
                        <th className="px-4 py-3 text-left">Job Title</th>
                        <th className="px-4 py-3 text-left">Company</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-left">Submitted By</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr
                          key={req.request_id}
                          className="border-t border-gray-800"
                        >
                          <td className="px-4 py-3">{req.job_title}</td>
                          <td className="px-4 py-3">{req.company}</td>
                          <td className="px-4 py-3">
                            {req.location || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {req.alumni_email}
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() =>
                                approveRequest(req.request_id)
                              }
                              className="bg-emerald-500 px-3 py-1 rounded text-black text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                setRejectModal({
                                  open: true,
                                  id: req.request_id,
                                })
                              }
                              className="bg-red-500 px-3 py-1 rounded text-black text-sm"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ================= ADD JOBS ================= */}
          {activeTab === "add" && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-[#C5B239]">
                    Job Openings
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Jobs visible to students and alumni
                  </p>
                </div>

                {(user?.role === "admin" || user?.role === "alumni") && (
                  <button
                    onClick={() => setShowAddJobModal(true)}
                    className="bg-[#C5B239] hover:bg-[#b9a531] text-black font-medium px-4 py-2 rounded-md text-sm"
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
                    className="bg-[#1a1a1a] p-5 rounded-xl shadow-md space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg text-[#C5B239] flex items-center gap-2">
                        <FaBriefcase />
                        {job.title}
                      </h3>

                      {/* Delete button for admin */}
                      {user?.role === "admin" && (
                        <button
                          onClick={() => handleDeleteJob(job.job_id)}
                          className="text-red-400 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-lg transition-all"
                          title="Delete job"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-400">
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
                    </div>

                    <p className="text-gray-300 text-sm">
                      {job.description}
                    </p>

                    {job.requirements && (
                      <p className="text-gray-400 text-sm">
                        <strong>Requirements:</strong>{" "}
                        {job.requirements}
                      </p>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= REJECT MODAL ================= */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 w-[420px]">
            <h3 className="text-lg font-semibold mb-2">
              Reject Job Request
            </h3>

            <textarea
              className="w-full h-24 mt-2 p-3 rounded-lg bg-gray-800 border border-gray-700"
              placeholder="Optional rejection reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={rejectRequest}
                className="bg-red-500 px-4 py-1.5 rounded-lg text-black"
              >
                Confirm Reject
              </button>
              <button
                onClick={() =>
                  setRejectModal({ open: false, id: null })
                }
                className="bg-gray-700 px-4 py-1.5 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD JOB MODAL ================= */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] p-8 rounded-xl w-full max-w-lg relative">
            <button
              onClick={() => setShowAddJobModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <h2 className="text-2xl font-semibold mb-6">
              {user?.role === "admin"
                ? "Create Job"
                : "Request Job Posting"}
            </h2>

            <form onSubmit={handleAddJob} className="space-y-4">
              <input
                type="text"
                placeholder="Job Title *"
                value={jobFormData.title}
                onChange={(e) =>
                  setJobFormData({
                    ...jobFormData,
                    title: e.target.value,
                  })
                }
                className="w-full bg-[#111] text-white placeholder-gray-400 p-3 rounded-md outline-none"
              />

              <input
                type="text"
                placeholder="Company Name *"
                value={jobFormData.company}
                onChange={(e) =>
                  setJobFormData({
                    ...jobFormData,
                    company: e.target.value,
                  })
                }
                className="w-full bg-[#111] text-white placeholder-gray-400 p-3 rounded-md outline-none"
              />

              <input
                type="text"
                placeholder="Location"
                value={jobFormData.location}
                onChange={(e) =>
                  setJobFormData({
                    ...jobFormData,
                    location: e.target.value,
                  })
                }
                className="w-full bg-[#111] text-white placeholder-gray-400 p-3 rounded-md outline-none"
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
                className="w-full bg-[#111] text-white placeholder-gray-400 p-3 rounded-md outline-none resize-none"
                rows={4}
              />

              <textarea
                placeholder="Requirements (Optional)"
                value={jobFormData.requirements}
                onChange={(e) =>
                  setJobFormData({
                    ...jobFormData,
                    requirements: e.target.value,
                  })
                }
                className="w-full bg-[#111] text-white placeholder-gray-400 p-3 rounded-md outline-none resize-none"
                rows={3}
              />

              <button
                type="submit"
                className="w-full bg-[#C5B239] hover:bg-[#b9a531] py-3 rounded-md text-black font-semibold"
              >
                {user?.role === "admin"
                  ? "Create Job"
                  : "Submit Request"}
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

export default Admin_Jobs;
