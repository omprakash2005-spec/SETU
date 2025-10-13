import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";
import Navbar from "../components/Navbar";

const Donations = () => {
  const data = [
    { name: "Net Amount Donated", value: 100237, color: "#d1d5db" },
    { name: "Donated by You", value: 9700, color: "#c084fc" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      {/* Navbar */}
      <Navbar/>

      {/* Title */}
      <div className="w-full mt-8 text-left pt-10">
        <h1 className="text-3xl font-bold">DONATIONS</h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10 w-full max-w-5xl">
        {/* Left Section */}
        <div className="flex flex-col items-center">
          <img
            src={assets.donation}
            alt="donation illustration"
            className="w-64 h-64 object-contain"
          />
          <div className="mt-8 w-full bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">OVER THE YEARS</h2>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="50%" height={150}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={3}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="text-sm space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span>1,00,237 Net amount donated</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span>9,700 Donated by you</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col justify-center items-start space-y-6">
          <h2 className="text-3xl font-semibold leading-snug">
            YOUR SUPPORT, <br /> THEIR FUTURE
          </h2>

          <button className="bg-gray-200 text-black px-10 py-3 rounded-2xl font-semibold hover:bg-[#DCBE05] hover:text-white transition-all">
            DONATE NOW
          </button>

          <div className="w-full mt-6 space-y-4">
            <h3 className="text-lg font-semibold">RECENT DONATIONS</h3>
            <div className="bg-gray-900 rounded-xl h-16 flex justify-center items-center ">IBM $200</div>
            <div className="bg-gray-900 rounded-xl h-16 flex justify-center items-center">Cognizant $300</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donations;
