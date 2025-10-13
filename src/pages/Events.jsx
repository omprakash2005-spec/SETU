import React, { useState } from "react";
import { FaUser, FaCalendarAlt, FaTimes } from "react-icons/fa";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";

const Events = () => {
  const [events, setEvents] = useState([
    { id: 1, title: "SYMPOSIUM 3.0", registered: 120, capacity: 200, date: "2025-10-20", description: "An exciting tech symposium featuring innovative projects and workshops." },
    { id: 2, title: "AI Conference 2025", registered: 80, capacity: 150, date: "2025-11-05", description: "A deep dive into the world of Artificial Intelligence and ML trends." },
    { id: 3, title: "Hackathon 2.0", registered: 200, capacity: 250, date: "2025-12-10", description: "24-hour coding marathon where ideas meet execution." },
  ]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    capacity: "",
    description: "",
  });

  const handleRegister = (id) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === id && ev.registered < ev.capacity
          ? { ...ev, registered: ev.registered + 1 }
          : ev
      )
    );
    alert("Registered successfully!");
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.capacity) {
      alert("Please fill in all required fields.");
      return;
    }
    const newEventData = {
      id: events.length + 1,
      ...newEvent,
      registered: 0,
      capacity: parseInt(newEvent.capacity),
    };
    setEvents((prev) => [...prev, newEventData]);
    setNewEvent({ title: "", date: "", capacity: "", description: "" });
    setShowAddEvent(false);
  };

  const EventCard = ({ id, title, registered, capacity, date }) => (
    <div className="bg-gray-800 rounded-xl border border-gray-600 p-6 flex flex-col items-center gap-6 min-h-[340px] w-full shadow-lg hover:shadow-2xl transition-shadow duration-300">
      <img src={assets.event} className="w-full h-55 " />
      <div className="text-white text-xl font-semibold text-center tracking-wide">
        {title}
      </div>
      <div className="text-gray-400 text-sm mb-2 flex items-center gap-2">
        <FaCalendarAlt className="text-amber-400" /> {date}
      </div>

      <div className="bg-gray-900 border border-gray-600 rounded-lg text-white px-8 py-2 flex items-center gap-3 justify-center mb-4 drop-shadow-md">
        <FaUser className="text-gray-300" />
        <span className="text-sm font-medium">
          {registered} / {capacity}
        </span>
      </div>

      <div className="flex w-full gap-4">
        <button
          onClick={() => handleRegister(id)}
          className="flex-1 px-6 py-3 bg-transparent border border-gray-600 text-white rounded-lg text-lg font-medium hover:bg-gray-700 hover:border-amber-400 transition-colors duration-300"
        >
          Register
        </button>
        <button
          onClick={() => setSelectedEvent(events.find((ev) => ev.id === id))}
          className="flex-1 px-6 py-3 bg-transparent border border-gray-600 text-white rounded-lg text-lg font-medium hover:bg-gray-700 hover:border-amber-400 transition-colors duration-300"
        >
          Event Details
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-black px-8 pt-24 pb-8">
        <h1 className="text-white text-3xl font-bold mb-6">UPCOMING EVENTS</h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowCalendar(true)}
            className="bg-transparent border border-gray-400 rounded-full px-8 py-2 text-white font-medium hover:bg-gray-700 transition"
          >
            CALENDAR
          </button>
          <button
            onClick={() => setShowAddEvent(true)}
            className="bg-transparent border border-gray-400 rounded-full px-8 py-2 text-white font-medium hover:bg-gray-700 transition"
          >
            ADD EVENT
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((ev) => (
            <EventCard key={ev.id} {...ev} />
          ))}
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md relative">
            <button
              onClick={() => setShowCalendar(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
            <h2 className="text-white text-xl font-semibold mb-4">
              Select Event Date
            </h2>
            <input
              type="date"
              className="w-full p-3 bg-gray-800 text-white rounded-md"
            />
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowCalendar(false)}
                className="bg-[#F0D41D] hover:bg-[#DCBE05] px-6 py-2 rounded-md text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl w-full max-w-lg relative">
            <button
              onClick={() => setShowAddEvent(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
            <h2 className="text-white text-2xl font-semibold mb-6">
              Add New Event
            </h2>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <input
                type="text"
                placeholder="Event Title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                className="w-full bg-gray-800 p-3 rounded-md text-white outline-none"
                required
              />
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
                className="w-full bg-gray-800 p-3 rounded-md text-white outline-none"
                required
              />
              <input
                type="number"
                placeholder="Capacity"
                value={newEvent.capacity}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, capacity: e.target.value })
                }
                className="w-full bg-gray-800 p-3 rounded-md text-white outline-none"
                required
              />
              <textarea
                placeholder="Event Description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                className="w-full bg-gray-800 p-3 rounded-md text-white outline-none"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-[#F0D41D] hover:bg-[#DCBE05] py-3 rounded-md text-white font-semibold transition-colors"
              >
                Add Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl w-full max-w-lg relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
            <h2 className="text-white text-2xl font-semibold mb-4">
              {selectedEvent.title}
            </h2>
            <p className="text-gray-400 mb-2">
              📅 Date: {selectedEvent.date}
            </p>
            <p className="text-gray-400 mb-4">
              👥 {selectedEvent.registered} / {selectedEvent.capacity} Registered
            </p>
            <p className="text-gray-300">{selectedEvent.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
