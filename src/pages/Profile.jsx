import React, { useState } from "react";
import { FaLinkedin, FaGithub, FaFacebook, FaPlus, FaTrash } from "react-icons/fa";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";

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
    "Software Intern, Infosys (2019, 3 months) – Worked on Java-based backend systems.",
    "Associate Engineer, TCS (2021–2023).",
    "Software Engineer, Microsoft (2023–Present).",
  ],
  skills: ["C, C++, JAVA, PYTHON", "AI/ML, Data Science", "Content Writing", "3D Modelling"],
  education: [
    "Delhi Public School, Kolkata (2005–2017) – PCM (Science) with Computer Science.",
    "BTECH, Academy Of Technology (2017–2021).",
  ],
  projects: [
    "AI-Powered Student Attendance System using Face Recognition.",
    "Stock Market Prediction using Time Series Analysis.",
    "Predicting Heart Disease using Machine Learning.",
    "Smart Traffic Monitoring using Computer Vision.",
  ],
};

const Card = ({ title, children, onEdit }) => (
  <div className="bg-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700 p-6 flex flex-col gap-2 min-h-[170px] shadow-lg text-white relative">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {onEdit && (
        <button
          onClick={onEdit}
          className="bg-[#C5B239] text-black px-3 py-1 rounded-full text-sm font-medium hover:bg-[#b9a531] transition"
        >
          Edit
        </button>
      )}
    </div>
    {children}
  </div>
);

const Profile = () => {
  const [profile, setProfile] = useState(initialProfile);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState("");
  const [inputValues, setInputValues] = useState([]);

  const handleEdit = (field) => {
    setModalField(field);
    setInputValues([...profile[field]]);
    setModalOpen(true);
  };

  const handleSave = () => {
    const cleaned = inputValues.map((val) => val.trim()).filter((val) => val);
    setProfile((prev) => ({ ...prev, [modalField]: cleaned }));
    setModalOpen(false);
  };

  const handleAddEntry = () => {
    setInputValues((prev) => [...prev, ""]);
  };

  const handleRemoveEntry = (index) => {
    setInputValues((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-900 px-4 py-8 flex flex-col items-center justify-center pt-20">
        {/* Top: Avatar + Bio */}
        <div className="w-full max-w-4xl flex flex-row items-center bg-gray-800/90 backdrop-blur-xl rounded-xl border border-gray-700 shadow-lg md:px-8 px-4 py-6 mb-8">
          <div className="flex-shrink-0 w-28 h-28 bg-gray-700 rounded-full flex items-center justify-center mr-6 overflow-hidden">
            <img src={assets.profile} alt="avatar" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile.name}
                  <span className="text-base text-gray-400 font-light ml-2">{profile.pronouns}</span>
                </h1>
                <p className="mt-1 text-gray-300">{profile.degree}</p>
              </div>
              <div className="flex gap-2">
                {profile.social.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#C5B239] text-xl transition"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
            <h2 className="text-lg font-bold mt-3 mb-1">BIO</h2>
            <p className="text-gray-200">{profile.bio}</p>
          </div>
        </div>

        {/* Grid: Experience, Skills, Projects, Education */}
        <div className="w-full max-w-5xl grid md:grid-cols-2 grid-cols-1 gap-6">
          {["experience", "skills", "projects", "education"].map((field) => (
            <Card key={field} title={field.toUpperCase()} onEdit={() => handleEdit(field)}>
              {profile[field].map((item, idx) => (
                <div key={idx} className="text-gray-200 text-sm mb-1">
                  {item}
                </div>
              ))}
            </Card>
          ))}
        </div>
      </div>

      {/* Modal */}
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
                    const newArr = [...inputValues];
                    newArr[idx] = e.target.value;
                    setInputValues(newArr);
                  }}
                  className="w-full bg-gray-800 text-white rounded-md p-2 h-16 focus:outline-none border border-gray-600"
                  placeholder="Type your entry..."
                />
                <button
                  onClick={() => handleRemoveEntry(idx)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-500"
                  title="Remove this entry"
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            {/* Add new entry button */}
            <button
              onClick={handleAddEntry}
              className="flex items-center justify-center w-full bg-gray-700 text-white py-2 rounded-md mb-4 hover:bg-gray-600 transition"
            >
              <FaPlus className="mr-2" /> Add New Entry
            </button>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#C5B239] text-black rounded-md font-medium hover:bg-[#b9a531] transition"
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
