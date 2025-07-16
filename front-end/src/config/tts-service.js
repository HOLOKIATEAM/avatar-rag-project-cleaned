import axios from "axios";

const TTS_SERVER_URL = import.meta.env.VITE_TTS_URL || "http://localhost:5000/generate-tts/";

export const ttsService = {
  generateAudio: async (text, audioId, language = "en-us", speaker = "female-pt-4") => {
    console.log("Appel TTS avec payload:", {
      text,
      audio_id: audioId,
      lang: language,
      speaker,
    });

    try {
      // Note : backend FastAPI attend les noms exacts text, lang, audio_id, speaker
      const response = await axios.post(
        TTS_SERVER_URL,
        {
          text: text,
          lang: language,
          audio_id: audioId,
          speaker: speaker,
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      const lipsyncJson = response.data.lipsyncPath
        ? await (await fetch(`${import.meta.env.VITE_FRONT_URL || "http://localhost:5173"}${response.data.lipsyncPath}`)).json()
        : null;

      return {
        audioPath: response.data.audioPath,
        lipsyncJson,
        audioId: response.data.audioId,
      };
    } catch (err) {
      console.error("Erreur TTS:", err.response?.data || err.message);
      return {
        error: true,
        message: err.response?.data?.detail || "Échec de la génération audio ou synchronisation labiale",
      };
    }
  },
};
