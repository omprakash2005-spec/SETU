import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import axios from "axios";

const ConnectionProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🔍 ConnectionProfile - ID from URL:', id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `http://localhost:5001/api/auth/users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setProfile(response.data.data.user);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="pt-24 min-h-screen bg-[#0d0d0d] text-white p-6">
          <p className="text-center text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
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
          <p className="text-center text-red-400">{error || "Profile not found"}</p>
        </div>
      </div>
    );
  }

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
            {/* Profile Photo */}
            <img
              src={profile.profile_image || assets.profile}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-[#C5B239]"
            />
            <h2 className="text-2xl font-semibold mb-2 text-[#C5B239]">
              {profile.name}
            </h2>
            <p className="text-gray-400 mb-2">
              {profile.current_position || profile.role}
            </p>
            {profile.current_company && (
              <p className="text-gray-500 text-sm mb-4">
                {profile.current_company}
              </p>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="text-gray-300 text-sm mb-4 text-center max-w-2xl">
                <p>{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && (
              <div className="w-full mt-4">
                <h3 className="text-lg font-semibold text-[#C5B239] mb-2">
                  Skills
                </h3>
                <p className="text-gray-300 text-sm">
                  {Array.isArray(profile.skills)
                    ? profile.skills.join(", ")
                    : profile.skills}
                </p>
              </div>
            )}

            {/* Experience */}
            {profile.experience && (
              <div className="w-full mt-4">
                <h3 className="text-lg font-semibold text-[#C5B239] mb-2">
                  Experience
                </h3>
                <p className="text-gray-300 text-sm">{profile.experience}</p>
              </div>
            )}

            {/* Education */}
            {profile.education && (
              <div className="w-full mt-4">
                <h3 className="text-lg font-semibold text-[#C5B239] mb-2">
                  Education
                </h3>
                <p className="text-gray-300 text-sm">{profile.education}</p>
              </div>
            )}

            {/* College & Batch */}
            <div className="w-full mt-4 text-sm text-gray-400">
              {profile.college && <p>College: {profile.college}</p>}
              {profile.batch_year && <p>Batch: {profile.batch_year}</p>}
              {profile.department && <p>Department: {profile.department}</p>}
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  LinkedIn
                </a>
              )}
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-300"
                >
                  GitHub
                </a>
              )}
              {profile.facebook_url && (
                <a
                  href={profile.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400"
                >
                  Facebook
                </a>
              )}
            </div>

            {/* Message Button */}
            <button
              onClick={() => navigate(`/messages/${profile.id}`)}
              className="mt-6 bg-[#C5B239] text-black px-6 py-2 rounded-md hover:bg-[#b9a531]"
            >
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionProfile;
