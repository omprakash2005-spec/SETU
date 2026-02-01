import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import "./LoginLanding.css";
import { authAPI } from "../services/api";

const StudentSignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    department: "",
    graduationYear: "",
  });

  const [idCard, setIdCard] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idCard) {
      setError("Student ID card is required.");
      return;
    }

    const payload = new FormData();
    payload.append("full_name", formData.name);
    payload.append("email", formData.email);
    payload.append("password", formData.password);
    payload.append("roll_number", formData.rollNumber);
    payload.append("department", formData.department);
    payload.append("graduation_year", formData.graduationYear);
    payload.append("student_id_card", idCard);

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/auth/student/signup', {
        method: 'POST',
        body: payload,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Show success message
      alert("Account created successfully! Redirecting to login for verification check...");

      // Store token and redirect to login
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
      navigate("/studentLogin");
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full overflow-y-auto bg-cover bg-center flex flex-col items-center justify-center relative"
      style={{ backgroundImage: `url(${assets.landingBG})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center mb-6 animate-slide-up">
        <div className="flex flex-row items-center">
          <div className="text-white">
            <h1 className="font-bold text-8xl leading-none drop-shadow-lg">
              SETU
            </h1>
            <p className="text-sm drop-shadow-md">
              Sharing Experience To Undergrads
            </p>
          </div>
          <img
            src={assets.logo}
            alt="Setu Logo"
            className="w-30 drop-shadow-xl"
          />
        </div>
      </div>

      {/* Signup Card */}
      <div className="relative z-10 bg-amber-400 bg-opacity-10 backdrop-blur-md rounded-3xl shadow-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto animate-slide-up">
        <h2 className="text-3xl font-bold mb-4 text-center text-white drop-shadow-md">
          Student Signup
        </h2>

        {error && (
          <div className="bg-red-500/80 text-white px-4 py-3 rounded-xl mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            className="border border-white/50 px-4 py-2 rounded-xl bg-white/60 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            onChange={handleChange}
            className="border border-white/50 px-4 py-2 rounded-xl bg-white/60 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="border border-white/50 px-4 py-2 rounded-xl bg-white/60"
            required
          />

          <input
            type="text"
            name="rollNumber"
            placeholder="Enrollment / Roll Number"
            onChange={handleChange}
            className="border border-white/50 px-4 py-2 rounded-xl bg-white/60"
            required
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            onChange={handleChange}
            className="border border-white/50 px-4 py-2 rounded-xl bg-white/60"
            required
          />

          <input
            type="number"
            name="graduationYear"
            placeholder="Graduation Year"
            onChange={handleChange}
            className="border border-white/50 px-4 py-2 rounded-xl bg-white/60"
            required
          />

          {/* Styled file upload */}
          <label className="cursor-pointer bg-white/30 text-white py-2 px-4 rounded-xl text-center hover:bg-white/50 transition">
            {idCard ? "ID Card Selected" : "Upload Student ID Card"}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setIdCard(e.target.files[0])}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="bg-white/30 text-white py-2 rounded-xl font-semibold hover:bg-white/50 transition"
          >
            {loading ? "Creating account..." : "Signup"}
          </button>
        </form>

        <p className="text-center text-white mt-2">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/studentLogin")}
            className="underline font-semibold hover:text-gray-300"
            type="button"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default StudentSignup;
