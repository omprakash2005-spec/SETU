import { getMentorRecommendationsFromAI } from "../utils/mentorAI.js";

export const recommendMentors = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills) {
      return res.status(400).json({ message: "Skills required" });
    }

    const mentors = await getMentorRecommendationsFromAI(skills);

    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
