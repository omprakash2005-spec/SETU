import pool from "../config/database.js";
import axios from "axios";

export const recommendMentors = async (req, res) => {
  try {
    // 🔐 Auth check (must be INSIDE function)
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const studentId = req.user.id;

    // 1️⃣ Fetch student skills
    const studentResult = await pool.query(
      "SELECT skills FROM users WHERE id = $1 AND role = 'student'",
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ Parse student skills correctly
    const studentSkillsArray =
      typeof studentResult.rows[0].skills === "string"
        ? JSON.parse(studentResult.rows[0].skills)
        : studentResult.rows[0].skills || [];

    const studentSkills = studentSkillsArray.join(" ");
    console.log("Student skills:", studentSkills);

    // 2️⃣ Fetch alumni mentors (NO available column)
    const mentorResult = await pool.query(
      `SELECT id, name, email, skills, experience
       FROM users
       WHERE role = 'alumni'`
    );

    const mentors = mentorResult.rows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      skills:
        typeof m.skills === "string" ? JSON.parse(m.skills) : m.skills || [],
      experience: m.experience || 0,
    }));

    console.log("Mentors sent to AI:", mentors.length);

    // 3️⃣ Call Python AI
    const aiResponse = await axios.post(
      "http://127.0.0.1:8000/mentor-recommend",
      {
        student_skills: studentSkills,
        mentors,
      }
    );

    return res.json(aiResponse.data);
  } catch (error) {
    console.error("Mentor recommendation error:", error);
    return res.status(500).json({ message: "Mentor recommendation failed" });
  }
};
