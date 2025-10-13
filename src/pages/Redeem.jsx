import React, { useState } from "react";
import { assets } from "../assets/assets";
import Navbar from "../components/Navbar";

const rewards = [
  {
    title: "10% DISCOUNT",
    points: 40,
    image: "/assets/discount.jpg",
  },
  {
    title: "50% DISCOUNT",
    points: 120,
    image: "/assets/discount.jpg",
  },
  {
    title: "WELL DISCOUNT",
    points: 200,
    image: "/assets/discount.jpg",
  },
  {
    title: "PRIZE",
    points: 400,
    image: "/assets/discount.jpg",
  },
];

export default function RedeemPage() {
  const [selectedReward, setSelectedReward] = useState(null);
  const [code, setCode] = useState("");

  // Function to generate a random 10-letter code
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleRedeem = (reward) => {
    setSelectedReward(reward);
    setCode(generateCode());
  };

  const closePopup = () => {
    setSelectedReward(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans relative">
      {/* Navbar */}
      <Navbar/>

      {/* Title */}
      <h1 className="text-3xl font-bold text-center mt-8 tracking-wide">REDEEM</h1>

      {/* Grid of rewards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-8 py-12 place-items-center">
        {rewards.map((reward, idx) => (
          <div
            key={idx}
            className="bg-[#111] border border-gray-800 rounded-2xl p-6 w-72 flex flex-col items-center shadow-lg hover:shadow-[#DCBE05]/30 transition duration-300"
          >
            <img
              src={assets.discount}
              alt={reward.title}
              className="w-40 h-40 object-contain mb-4"
            />
            <h2 className="text-lg font-semibold mb-2 text-center">{reward.title}</h2>
            <div className="flex items-center space-x-2 mb-4">
              <span className="bg-gray-800 px-4 py-1 rounded-full text-sm">
                {reward.points} pts
              </span>
            </div>
            <button
              onClick={() => handleRedeem(reward)}
              className="px-6 py-2 rounded-full text-black font-semibold transition duration-300"
              style={{ backgroundColor: "#DCBE05" }}
            >
              REDEEM
            </button>
          </div>
        ))}
      </div>

      {/* Popup Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-[#3A3A3A] rounded-2xl w-80 p-6 relative text-center shadow-lg border border-gray-700">
            {/* Close button */}
            <button
              onClick={closePopup}
              className="absolute top-3 right-4 text-white text-lg hover:text-[#DCBE05]"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">REDEEM CARD</h2>

            <img
              src={assets.discount}
              alt="Reward"
              className="w-36 h-36 mx-auto mb-4"
            />

            <div
              className="bg-[#DCBE05] text-black font-bold py-2 px-4 rounded-full text-lg tracking-wider mb-2"
            >
              {code}
            </div>
            <p className="text-gray-300 text-sm">Use card during checkout</p>
          </div>
        </div>
      )}
    </div>
  );
}
