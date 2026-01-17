import axios from "axios";

export const getMentorRecommendationsFromAI = async (skills) => {
  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/mentor-recommend",
      { skills }
    );

    return response.data;
  } catch (error) {
    console.error("AI error:", error.message);
    throw new Error("AI service not reachable");
  }
};
