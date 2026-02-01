import React, { useEffect, useState } from "react";

import {
  FaLinkedin,
  FaGithub,
  FaFacebook,
  FaPlus,
  FaTrash,
  FaCamera,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import { authAPI } from "../services/api";
import { useUser } from "../context/UserContext";
import ImageCropModal from "../components/ImageCropModal";

/* ------------------ Card Component ------------------ */

const Card = ({ title, children, onEdit }) => (
  <div className="bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700 p-6 shadow-lg text-white relative">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button
        onClick={onEdit}
        className="bg-[#C5B239] text-black px-3 py-1 rounded-full text-sm font-medium hover:bg-[#b9a531]"
      >
        Edit
      </button>
    </div>
    {children}
  </div>
);

const PRONOUN_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "he/they",
  "she/they",
  "prefer not to say",
];

/* ------------------ Profile Page ------------------ */

const Profile = () => {
  const { user: contextUser } = useUser();
  const [profile, setProfile] = useState({
    name: "",
    pronouns: "",
    degree: "",
    bio: "",
    profile_image: null,
    linkedin_url: "",
    github_url: "",
    facebook_url: "",
    experience: [],
    skills: [],
    education: [],
    projects: [],
  });

  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Load profile data from backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const userData = response.data.user;

        console.log('👤 Loaded profile for user:', {
          id: userData.id,
          name: userData.name,
          email: userData.email,
        });

        setProfile({
          name: userData.name || "",
          pronouns: userData.pronouns || "",
          degree: userData.degree || "",
          bio: userData.bio || "",
          profile_image: userData.profile_image || null,
          linkedin_url: userData.linkedin_url || "",
          github_url: userData.github_url || "",
          facebook_url: userData.facebook_url || "",
          experience: userData.experience || [],
          skills: userData.skills || [],
          education: userData.education || [],
          projects: userData.projects || [],
        });
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  /* Top section edit */
  const [editingTop, setEditingTop] = useState(false);
  const [topDraft, setTopDraft] = useState({
    name: profile.name,
    pronouns: profile.pronouns,
    degree: profile.degree,
    bio: profile.bio,
    linkedin_url: profile.linkedin_url,
    github_url: profile.github_url,
    facebook_url: profile.facebook_url,
  });

  /* Modal edit (lists only) */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState("");
  const [inputValues, setInputValues] = useState([]);

  const handleEditList = (field) => {
    setModalField(field);
    setInputValues([...profile[field]]);
    setModalOpen(true);
  };

  const handleSaveList = async () => {
    const cleaned = inputValues.map(v => v.trim()).filter(Boolean);

    const updateData = {
      [modalField]: cleaned,
    };

    console.log('🚀 Sending profile update:', updateData);

    try {
      const response = await authAPI.updateProfile(updateData);
      console.log('✅ Update successful:', response);

      // frontend state update
      setProfile(prev => ({
        ...prev,
        [modalField]: cleaned,
      }));

      setModalOpen(false);
    } catch (error) {
      console.error("Profile update failed", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Profile update failed";
      alert(errorMessage);
    }
  };

  const handleAddEntry = () =>
    setInputValues((prev) => [...prev, ""]);

  const handleRemoveEntry = (i) =>
    setInputValues((prev) => prev.filter((_, idx) => idx !== i));

  // Handle social media icon clicks
  const handleSocialClick = async (platform) => {
    const urlField = `${platform}_url`;
    const currentUrl = profile[urlField];

    if (currentUrl) {
      // If URL exists, open it in new tab
      window.open(currentUrl, '_blank');
    } else {
      // If no URL, prompt user to add one
      const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
      const url = prompt(`Enter your ${platformName} profile URL:`);

      if (url && url.trim()) {
        try {
          // Save the URL to database
          await authAPI.updateProfile({
            [urlField]: url.trim(),
          });

          // Update local state
          setProfile(prev => ({
            ...prev,
            [urlField]: url.trim(),
          }));

          alert(`${platformName} URL saved successfully!`);
        } catch (error) {
          console.error(`Failed to save ${platformName} URL:`, error);
          alert(`Failed to save ${platformName} URL`);
        }
      }
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('📸 File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large:', file.size);
      alert('File size must be less than 5MB');
      return;
    }

    console.log('✅ File validation passed, opening crop modal...');

    // Create preview URL and open crop modal
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropModalOpen(true);

    // Reset file input
    e.target.value = '';
  };

  // Handle cropped image upload
  const handleCroppedImage = async (croppedFile) => {
    try {
      setUploadingImage(true);
      setCropModalOpen(false);
      console.log('🚀 Uploading cropped image...');

      const response = await authAPI.uploadProfilePicture(croppedFile);

      // Update profile state with new image URL
      setProfile(prev => ({
        ...prev,
        profile_image: response.data.profile_image,
      }));

      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('❌ Profile picture upload failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to upload profile picture';
      alert(errorMessage);
    } finally {
      setUploadingImage(false);
      // Clean up the preview URL
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
    }
  };

  // Handle crop modal cancel
  const handleCropCancel = () => {
    setCropModalOpen(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <p className="text-white text-xl">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="min-h-screen bg-gray-900 px-4 py-8 pt-20 flex flex-col items-center">
        {/* ------------------ TOP SECTION ------------------ */}
        <div className="w-full max-w-4xl bg-gray-800/90 rounded-xl border border-gray-700 shadow-lg p-6 mb-8 flex gap-6">
          <div className="relative w-28 h-28 bg-gray-700 rounded-full overflow-hidden group">
            <img
              src={profile.profile_image || assets.profile}
              alt="avatar"
              className="w-full h-full object-cover"
            />
            <label
              htmlFor="profile-picture-input"
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingImage ? (
                <span className="text-white text-sm">Uploading...</span>
              ) : (
                <FaCamera className="text-white text-2xl" />
              )}
            </label>
            <input
              id="profile-picture-input"
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
              disabled={uploadingImage}
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between">
              <div className="flex gap-3 text-xl">
                <button
                  onClick={() => handleSocialClick('linkedin')}
                  className={`${profile.linkedin_url ? 'text-blue-500 hover:text-blue-400' : 'text-gray-400 hover:text-gray-300'} transition-colors`}
                  title={profile.linkedin_url ? 'Visit LinkedIn profile' : 'Add LinkedIn URL'}
                >
                  <FaLinkedin />
                </button>
                <button
                  onClick={() => handleSocialClick('github')}
                  className={`${profile.github_url ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-gray-300'} transition-colors`}
                  title={profile.github_url ? 'Visit GitHub profile' : 'Add GitHub URL'}
                >
                  <FaGithub />
                </button>
                <button
                  onClick={() => handleSocialClick('facebook')}
                  className={`${profile.facebook_url ? 'text-blue-600 hover:text-blue-500' : 'text-gray-400 hover:text-gray-300'} transition-colors`}
                  title={profile.facebook_url ? 'Visit Facebook profile' : 'Add Facebook URL'}
                >
                  <FaFacebook />
                </button>
              </div>

              {!editingTop && (
                <button
                  onClick={() => {
                    setTopDraft({
                      name: profile.name,
                      pronouns: profile.pronouns,
                      degree: profile.degree,
                      bio: profile.bio,
                      linkedin_url: profile.linkedin_url,
                      github_url: profile.github_url,
                      facebook_url: profile.facebook_url,
                    });
                    setEditingTop(true);
                  }}
                  className="bg-[#C5B239] text-black px-4 py-1 rounded-full text-sm"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {!editingTop && (
              <>
                <h1 className="text-2xl font-bold mt-2 text-white">
                  {profile.name || <span className="text-gray-500 italic">Click "Edit Profile" to add your name</span>}
                  {profile.name && (
                    <span className="ml-2 text-gray-400 text-base">
                      {profile.pronouns || ""}
                    </span>
                  )}
                </h1>
                <p className="text-gray-300">{profile.degree || "No degree specified"}</p>
                <h2 className="mt-3 font-semibold text-white">BIO</h2>
                <p className="text-gray-200">{profile.bio || "No bio added yet"}</p>
              </>
            )}
            {editingTop && (
              <div className="mt-3 space-y-3">
                <input
                  className="w-full bg-gray-800 text-white p-2 rounded"
                  placeholder="Name"
                  value={topDraft.name}
                  onChange={(e) =>
                    setTopDraft({ ...topDraft, name: e.target.value })
                  }
                />

                <select
                  className="w-full bg-gray-800 text-white p-2 rounded"
                  value={topDraft.pronouns}
                  onChange={(e) =>
                    setTopDraft({ ...topDraft, pronouns: e.target.value })
                  }
                >
                  {PRONOUN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <input
                  className="w-full bg-gray-800 text-white p-2 rounded"
                  placeholder="Degree (e.g., B.Tech, Computer Science and Engineering, 2021 batch)"
                  value={topDraft.degree}
                  onChange={(e) =>
                    setTopDraft({ ...topDraft, degree: e.target.value })
                  }
                />

                <textarea
                  className="w-full bg-gray-800 text-white p-2 rounded h-24"
                  placeholder="Bio"
                  value={topDraft.bio}
                  onChange={(e) =>
                    setTopDraft({ ...topDraft, bio: e.target.value })
                  }
                />

                <div className="border-t border-gray-700 pt-3 mt-3">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Social Media Links</h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FaLinkedin className="text-blue-500" />
                      <input
                        className="flex-1 bg-gray-800 text-white p-2 rounded text-sm"
                        placeholder="LinkedIn URL (e.g., https://linkedin.com/in/username)"
                        value={topDraft.linkedin_url}
                        onChange={(e) =>
                          setTopDraft({ ...topDraft, linkedin_url: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <FaGithub className="text-gray-300" />
                      <input
                        className="flex-1 bg-gray-800 text-white p-2 rounded text-sm"
                        placeholder="GitHub URL (e.g., https://github.com/username)"
                        value={topDraft.github_url}
                        onChange={(e) =>
                          setTopDraft({ ...topDraft, github_url: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <FaFacebook className="text-blue-600" />
                      <input
                        className="flex-1 bg-gray-800 text-white p-2 rounded text-sm"
                        placeholder="Facebook URL (e.g., https://facebook.com/username)"
                        value={topDraft.facebook_url}
                        onChange={(e) =>
                          setTopDraft({ ...topDraft, facebook_url: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingTop(false)}
                    className="px-4 py-1 bg-gray-600 rounded"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={async () => {
                      console.log('🚀 Sending top section update:', topDraft);
                      try {
                        const response = await authAPI.updateProfile(topDraft);
                        console.log('✅ Update successful:', response);
                        setProfile((prev) => ({ ...prev, ...topDraft }));
                        setEditingTop(false);
                      } catch (e) {
                        console.error("Update failed", e);
                        console.error("Error response:", e.response?.data);
                        const errorMessage = e.response?.data?.message || e.response?.data?.error || "Update failed";
                        alert(errorMessage);
                      }
                    }}
                    className="px-4 py-1 bg-[#C5B239] text-black rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ------------------ GRID SECTIONS ------------------ */}
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">
          {["experience", "skills", "projects", "education"].map(
            (field) => (
              <Card
                key={field}
                title={field.toUpperCase()}
                onEdit={() => handleEditList(field)}
              >
                {profile[field].length > 0 ? (
                  profile[field].map((item, i) => (
                    <p key={i} className="text-gray-200 text-sm mb-1">
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm italic">No {field} added yet</p>
                )}
              </Card>
            )
          )}
        </div>
      </div>
      {/* ------------------ MENTOR RECOMMENDATIONS ------------------ */}

      {/* ------------------ MODAL ------------------ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] rounded-xl p-6 w-[450px] border border-gray-700 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[#C5B239] mb-3">
              Edit {modalField.toUpperCase()}
            </h2>

            {inputValues.map((val, idx) => (
              <div key={idx} className="relative mb-3">
                <textarea
                  value={val}
                  onChange={(e) => {
                    const arr = [...inputValues];
                    arr[idx] = e.target.value;
                    setInputValues(arr);
                  }}
                  className="w-full bg-gray-800 text-white rounded p-2 h-16"
                  placeholder={`Enter ${modalField} item`}
                />
                <button
                  onClick={() => handleRemoveEntry(idx)}
                  className="absolute top-2 right-2 text-red-400"
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            <button
              onClick={handleAddEntry}
              className="w-full bg-gray-700 py-2 rounded mb-4 flex justify-center items-center gap-2"
            >
              <FaPlus /> Add New
            </button>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveList}
                className="px-4 py-2 bg-[#C5B239] text-black rounded font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {cropModalOpen && selectedImage && (
        <ImageCropModal
          imageSrc={selectedImage}
          onCropComplete={handleCroppedImage}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default Profile;

