import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import './LoginLanding.css';
import { useUser } from "../context/UserContext";
import { authAPI } from "../services/api";

const AlumniLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call the login API
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        // Check if user is alumni
        if (response.data.user.role !== "alumni") {
          setError("This login is for alumni only. Please use the correct login page.");
          setLoading(false);
          return;
        }

        // Store token and user data
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Set user context
        setUser(response.data.user);

        // Navigate to home
        navigate("/home");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => {
    navigate("/alumni-signup");
  };

  return (
    <div
      className="h-screen w-full bg-cover bg-center flex flex-col items-center justify-center relative"
      style={{ backgroundImage: `url(${assets.landingBG})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 flex flex-col items-center mb-10 animate-slide-up">
        <div className="flex flex-row items-center">
          <div className="text-white">
            <h1 className="font-bold text-8xl md:text-8xl leading-none drop-shadow-lg">
              SETU
            </h1>
            <p className="text-sm md:text-sm drop-shadow-md">
              Sharing Experience To Undergrads
            </p>
          </div>
          <img
            src={assets.logo}
            alt="Setu Logo"
            className="w-30 md:w-34 drop-shadow-xl"
          />
        </div>
      </div>

      <div className="relative z-10 bg-amber-400 bg-opacity-10 backdrop-blur-md rounded-3xl shadow-xl p-8 w-full max-w-md animate-slide-up">
        <h2 className="text-3xl font-bold mb-6 text-center text-white drop-shadow-md">
          Alumni Login
        </h2>

        {error && (
          <div className="bg-red-500/80 text-white px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="border border-white/50 text-gray-900 px-4 py-3 rounded-xl bg-white/60 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70 transition"
            required
            disabled={loading}
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="border border-white/50 text-gray-900 px-4 py-3 rounded-xl bg-white/60 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70 transition"
            required
            disabled={loading}
          />

          <button
            type="submit"
            className="bg-white/30 text-white py-3 rounded-xl font-semibold hover:bg-white/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-white mt-4">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/alumni-signup")}
            className="underline font-semibold hover:text-gray-300 focus:outline-none"
            type="button"
            disabled={loading}
          >
            Signup
          </button>
        </p>
      </div>
    </div>
  );
};

export default AlumniLogin;
