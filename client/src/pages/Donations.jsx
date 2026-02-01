import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { assets } from "../assets/assets";
import Navbar from "../components/Navbar";
import {
  createCheckoutSession,
  getRecentDonations,
  getDonationAnalytics,
} from "../services/donationService";

const Donations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [recentDonations, setRecentDonations] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalDonations: 0,
    alumniDonations: 0,
  });

  const [loadingData, setLoadingData] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const [user, setUser] = useState(null);

  // ✅ Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // ✅ Fetch donation data
  const fetchData = async (currentUser) => {
    if (!currentUser) return;

    try {
      setLoadingData(true);

      const alumniId = currentUser.id;

      const [donationsRes, analyticsRes] = await Promise.all([
        getRecentDonations(5),
        getDonationAnalytics(alumniId),
      ]);

      setRecentDonations(donationsRes?.donations || []);
      setAnalytics(analyticsRes?.analytics || {});
    } catch (error) {
      console.error("Error fetching donation data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch data when user is loaded
  useEffect(() => {
    if (user) {
      fetchData(user);
    }
  }, [user]);

  // ✅ Stripe success/cancel handling
  useEffect(() => {
    if (!user) return;

    if (searchParams.get("session_id")) {
      setShowSuccess(true);

      setTimeout(() => {
        fetchData(user);
      }, 2000);

      setTimeout(() => {
        setShowSuccess(false);
        navigate("/donations", { replace: true });
      }, 5000);
    }

    if (searchParams.get("cancelled")) {
      setShowCancel(true);

      setTimeout(() => {
        setShowCancel(false);
        navigate("/donations", { replace: true });
      }, 5000);
    }
  }, [searchParams, navigate, user]);

  // ✅ Donate handler
  const handleDonate = async () => {
    const donationAmount = parseFloat(amount);

    if (!donationAmount || donationAmount < 50) {
      alert("Please enter a valid donation amount (minimum ₹50)");
      return;
    }

    if (!user) {
      alert("Please login to donate");
      navigate("/alumniLogin");
      return;
    }

    try {
      setLoading(true);

      const { url } = await createCheckoutSession(donationAmount, {
        alumniId: user.id,
        alumniName: user.name || "Anonymous",
        alumniEmail: user.email,
      });

      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert(error.message || "Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    {
      name: "Net Amount Donated",
      value: analytics.totalDonations || 0,
      color: "#d1d5db",
    },
    {
      name: "Donated by You",
      value: analytics.alumniDonations || 0,
      color: "#c084fc",
    },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <Navbar />

      {showSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-pulse">
          <FaCheckCircle className="text-2xl" />
          <span className="font-semibold">
            Thank you for your donation! Payment successful.
          </span>
        </div>
      )}

      {showCancel && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50">
          <FaTimesCircle className="text-2xl" />
          <span className="font-semibold">
            Donation cancelled. You can try again anytime.
          </span>
        </div>
      )}

      <div className="w-full mt-8 text-left pt-10">
        <h1 className="text-3xl font-bold">DONATIONS</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10 w-full max-w-5xl">
        {/* Left */}
        <div className="flex flex-col items-center">
          <img
            src={assets.donation}
            alt="donation illustration"
            className="w-64 h-64 object-contain"
          />

          <div className="mt-8 w-full bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">OVER THE YEARS</h2>

            {loadingData ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <ResponsiveContainer width="50%" height={150}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="text-sm space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>
                      {formatCurrency(analytics.totalDonations)} Net amount
                      donated
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span>
                      {formatCurrency(analytics.alumniDonations)} Donated by you
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col justify-center items-start space-y-6">
          <h2 className="text-3xl font-semibold leading-snug">
            YOUR SUPPORT, <br /> THEIR FUTURE
          </h2>

          <div className="w-full">
            <label className="block text-sm font-medium mb-2">
              Enter Donation Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              min="50"
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <button
            onClick={handleDonate}
            disabled={loading}
            className="bg-gray-200 text-black px-10 py-3 rounded-2xl font-semibold hover:bg-[#DCBE05] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "DONATE NOW"}
          </button>

          <div className="w-full mt-6 space-y-4">
            <h3 className="text-lg font-semibold">RECENT DONATIONS</h3>

            {loadingData ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400"></div>
              </div>
            ) : recentDonations.length > 0 ? (
              recentDonations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="bg-gray-900 rounded-xl h-16 flex justify-between items-center px-6"
                >
                  <span className="font-medium">
                    {donation.alumni_name || "Anonymous"}
                  </span>

                  <span className="text-purple-400 font-semibold">
                    {formatCurrency(donation.amount)}
                  </span>

                  <span className="text-gray-400 text-sm">
                    {formatDate(donation.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-gray-900 rounded-xl h-32 flex justify-center items-center text-gray-400">
                No donations yet. Be the first to donate!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donations;
