import React, { useEffect, useState } from "react";
import { getMentorRecommendations } from "../services/mentorService";
import {
  FaLinkedin,
  FaGithub,
  FaFacebook,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import { authAPI } from "../services/api";



/* ------------------ Initial Data ------------------ */

const initialProfile = {
  name: "SARTHAK PANDEY",
  pronouns: "he/him",
  degree: "B.Tech, Computer Science and Engineering, 2021 batch",
  bio: "Tech enthusiast with 3+ years of experience in building scalable cloud platforms. Currently at Microsoft, passionate about AI, distributed systems, and mentoring young engineers.",
  social: [
    { icon: <FaLinkedin />, url: "#" },
    { icon: <FaGithub />, url: "#" },
    { icon: <FaFacebook />, url: "#" },
  ],
  experience: [
    "Software Intern, Infosys (2019, 3 months)",
    "Associate Engineer, TCS (2021–2023)",
    "Software Engineer, Microsoft (2023–Present)",
  ],
  skills: [
    "C, C++, Java, Python",
    "AI/ML, Data Science",
    "Content Writing",
    "3D Modelling",
  ],
  education: [
    "Delhi Public School, Kolkata (2005–2017)",
    "B.Tech, Academy Of Technology (2017–2021)",
  ],
  projects: [
    "AI-Powered Student Attendance System",
    "Stock Market Prediction",
    "Heart Disease Prediction",
    "Smart Traffic Monitoring",
  ],
};

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
  const [profile, setProfile] = useState(initialProfile);
  const [mentors, setMentors] = useState([]);

  const token = localStorage.getItem("token");

  /* -------- Fetch Mentor Recommendations -------- */
 useEffect(() => {
  const fetchMentors = async () => {
    try {
      const skillsText = profile.skills.join(" ");
const data = await getMentorRecommendations(token, skillsText);

      // 🔥 STEP-2 CONSOLE (YAHI ADD KARNA THA)
      console.log("MENTORS FROM BACKEND 👉", data);

      setMentors(data);
    } catch (error) {
      console.error("Failed to fetch mentors", error);
    }
  };

  if (token) {
    fetchMentors();
  } else {
    console.log("NO TOKEN FOUND");
  }
}, [token]);


  /* Top section edit */
  const [editingTop, setEditingTop] = useState(false);
  const [topDraft, setTopDraft] = useState({
    name: profile.name,
    pronouns: profile.pronouns,
    degree: profile.degree,
    bio: profile.bio,
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

  try {
    await authAPI.updateProfile({
      ...profile,
      [modalField]: cleaned,
    });

    // frontend state update
    setProfile(prev => ({
      ...prev,
      [modalField]: cleaned,
    }));

    setModalOpen(false);
  } catch (error) {
    console.error("Profile update failed", error);
    alert("Profile update failed");
  }
};



  const handleAddEntry = () =>
    setInputValues((prev) => [...prev, ""]);

  const handleRemoveEntry = (i) =>
    setInputValues((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div>
      <Navbar />

      <div className="min-h-screen bg-gray-900 px-4 py-8 pt-20 flex flex-col items-center">
        {/* ------------------ TOP SECTION ------------------ */}
        <div className="w-full max-w-4xl bg-gray-800/90 rounded-xl border border-gray-700 shadow-lg p-6 mb-8 flex gap-6">
          <div className="w-28 h-28 bg-gray-700 rounded-full overflow-hidden">
            <img
              src={assets.profile}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between">
              <div className="flex gap-3 text-xl text-gray-400">
                {profile.social.map((s, i) => (
                  <a key={i} href={s.url}>
                    {s.icon}
                  </a>
                ))}
              </div>

              {!editingTop && (
                <button
                  onClick={() => {
                    setTopDraft({
                      name: profile.name,
                      pronouns: profile.pronouns,
                      degree: profile.degree,
                      bio: profile.bio,
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
                  {profile.name}
                  <span className="ml-2 text-gray-400 text-base">
                    {profile.pronouns}
                  </span>
                </h1>
                <p className="text-gray-300">{profile.degree}</p>
                <h2 className="mt-3 font-semibold text-white">BIO</h2>
                <p className="text-gray-200">{profile.bio}</p>
              </>
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
                {profile[field].map((item, i) => (
                  <p key={i} className="text-gray-200 text-sm">
                    {item}
                  </p>
                ))}
              </Card>
            )
          )}
        </div>

        {/* ------------------ MENTOR RECOMMENDATIONS ------------------ */}
        <div className="w-full max-w-5xl mt-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            Recommended Mentors
          </h2>

          {mentors.length === 0 && (
            <p className="text-gray-400">
              No mentor recommendations yet.
            </p>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {mentors.map((mentor, index) => (
              <div
                key={index}
                className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 text-white shadow-md"
              >
                <h3 className="text-lg font-semibold text-[#C5B239]">
                  {mentor.Mentor_Name}
                </h3>
                <p className="text-sm text-gray-300">
                  <strong>Expertise:</strong> {mentor.Expertise}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Experience:</strong> {mentor.Experience} years
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default Profile;
