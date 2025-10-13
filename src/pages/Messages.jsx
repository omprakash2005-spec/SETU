import React, { useState } from "react";
import { Smile, Paperclip, Mic } from "lucide-react";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";

const users = [
  { id: 1, name: "Justin Gethje", avatar: assets.person2 },
  { id: 2, name: "Kiara Kapoor", avatar: assets.person3 },
  { id: 3, name: "Vineet Arora", avatar: assets.person1 },
  { id: 4, name: "Henry Cejudo", avatar: assets.person4 },
  { id: 5, name: "Rahul Taneja", avatar: assets.person5 },
  { id: 6, name: "Max Holloway", avatar: assets.person6 },
];

const Messages = () => {
  const [selectedUser, setSelectedUser] = useState(users[5]);
  const [messages, setMessages] = useState([
    { from: "me", text: "Hey, how are you?" },
    { from: "them", text: "I'm good! How about you?" },
    { from: "me", text: "Doing great, thanks for asking!" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "me", text: input }]);
    setInput("");
  };

  return (
    <div className=" pt-20 min-h-screen bg-black text-white">
      <Navbar />
      <div className="flex h-[90vh] px-8 py-6">
        {/* Sidebar */}
        <div className="w-1/3 bg-gray-700 rounded-l-3xl p-4 flex flex-col">
          <h2 className="text-2xl font-bold mb-4">MESSAGES</h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer ${
                  selectedUser.id === user.id
                    ? "bg-gray-600"
                    : "hover:bg-gray-600/60"
                }`}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 bg-gray-800 rounded-r-3xl flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-700">
            <img
              src={selectedUser.avatar}
              alt={selectedUser.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold">{selectedUser.name}</h3>
              <p className="text-green-400 text-sm">● ONLINE</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.from === "me" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-xl max-w-[60%] ${
                    msg.from === "me"
                      ? "bg-[#DCBE05] text-white"
                      : "bg-[#867B2F] text-white"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-3 bg-gray-600 p-3 rounded-b-3xl">
            <Smile className="w-6 h-6 text-gray-300" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message"
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-300"
            />
            <Paperclip className="w-6 h-6 text-gray-300 cursor-pointer" />
            <Mic className="w-6 h-6 text-gray-300 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
