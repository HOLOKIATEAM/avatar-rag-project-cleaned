import axios from "axios";

const STT_SERVER_URL = import.meta.env.VITE_STT_URL || "http://localhost:5002/generate-stt/";

export const sttService = {
  generateText: async (audioURL) => {
    try {
      const response = await axios.post(
        STT_SERVER_URL,
        { audioURL },
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (err) {
      return {
        error: true,
        message: err.response?.data?.detail || "Échec lors de la transcription de l'audio",
      };
    }
  },
};