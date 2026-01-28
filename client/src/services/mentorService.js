import axios from "axios";

export const getMentorRecommendations = async (token, skills) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/ai/mentor-recommendation`,
    {
      skills: skills, // 🔥 यही missing था
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
