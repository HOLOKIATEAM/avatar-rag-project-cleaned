import React, { useState, useContext, useEffect, useRef } from "react";
import { AudioContext } from "./AudioContext.jsx";
import { FaPlay, FaPause, FaPaperPlane, FaSpinner, FaMoon, FaSun, FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { apiClient } from "../config/api-config";
import { ttsService } from "../config/tts-service";
import "./ChatInterface.css";
import { Message } from "./Message.jsx";
import { Notification } from "./Notification.jsx";
import { AudioPlayer } from "./AudioPlayer.jsx";
import { AudioRecorder } from "./AudioRecorder.jsx";
import { Avatar } from "./Avatar.jsx";

const LANGUAGES = [
  { value: "en-us", label: "English", gtts: "en" },
  { value: "fr-fr", label: "Français", gtts: "fr" },
  { value: "ar", label: "العربية", gtts: "ar" },
];

export const ChatInterface = () => {
  const { script, setScript, playAudio, setPlayAudio, setAudioAnimation, setFacialExpression } = useContext(AudioContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("chatMessages")) || []);
  const [isLoading, setIsLoading] = useState(false);
  const [audios, setAudios] = useState([]);
  const [theme, setTheme] = useState("neon");
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [sendFeedback, setSendFeedback] = useState(false);
  const [lang, setLang] = useState("en-us");
  const messagesEndRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
  const handleUserInteraction = () => setUserInteracted(true);
  const options = { once: true };

  window.addEventListener("click", handleUserInteraction, options);
  window.addEventListener("keydown", handleUserInteraction, options);
  window.addEventListener("focusin", handleUserInteraction, options);
  window.addEventListener("submit", handleUserInteraction, options);

  return () => {
    window.removeEventListener("click", handleUserInteraction);
    window.removeEventListener("keydown", handleUserInteraction);
    window.removeEventListener("focusin", handleUserInteraction);
    window.removeEventListener("submit", handleUserInteraction);
  };
}, []);


  useEffect(() => {
    fetch(`/audios-config.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load audios-config.json");
        return res.json();
      })
      .then((data) => setAudios(data.audios || []))
      .catch((err) => {
        console.error("Erreur chargement audios-config.json :", err);
        setError("Impossible de charger les audios.");
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    return () => {
      document.body.className = "";
    };
  }, [theme]);

  const getAnimationForResponse = (text) => {
    const lowerText = (text || "").toLowerCase();

    if (lowerText.includes("bonjour") || lowerText.includes("salut") || lowerText.includes("hello")) {
      return { animation: "Happy Idle", expression: "smile" };
    }
    if (lowerText.includes("heureux") || lowerText.includes("content") || lowerText.includes("super") || lowerText.includes("merci")) {
      return { animation: "Happy Idle", expression: "smile" };
    }
    if (lowerText.includes("triste") || lowerText.includes("mal") || lowerText.includes("dommage")) {
      return { animation: "Defeated", expression: "sad" };
    }
    if (lowerText.includes("colère") || lowerText.includes("fâché") || lowerText.includes("énervé")) {
      return { animation: "Angry", expression: "angry" };
    }
    if (lowerText.includes("étonné") || lowerText.includes("quoi") || lowerText.includes("incroyable")) {
      return { animation: "Surprised", expression: "surprised" };
    }
    if (lowerText.includes("haha") || lowerText.includes("blague") || lowerText.includes("drôle")) {
      return { animation: "Happy Idle", expression: "funnyFace" };
    }
    if (lowerText.includes("fou") || lowerText.includes("dingue")) {
      return { animation: "Thoughtful Head Shake", expression: "crazy" };
    }
    return { animation: "default", expression: "default" };
  };

  const generateAudioAndLipsync = async (text, originalMessage, audiosList, language) => {
    if (!text || !text.trim()) {
      setError("Le texte pour la synthèse vocale est vide.");
      setNotification(null);
      return null;
    }
    setNotification("Génération audio et synchronisation labiale...");
    const gttsLang = language;
    const newAudioId = `audio-${Date.now()}`;
    console.log("Texte envoyé à generateAudio:", text);
    const { audioId: generatedAudioId, error: ttsError, message: ttsMsg } = await ttsService.generateAudio(text, newAudioId, gttsLang);
    if (ttsError) {
      setError(ttsMsg || "Erreur lors de la génération audio");
      setNotification(null);
      return null;
    }
    const shortMessage = originalMessage.trim().substring(0, 20) + (originalMessage.length > 20 ? "..." : "");
    const audioLabel = `Réponse: ${shortMessage} (${newAudioId.slice(-8)})`;
    const newAudio = {
      id: generatedAudioId,
      label: audioLabel,
      extension: "wav",
      keywords: [],
      animation: getAnimationForResponse(text),
      category: "Réponses",
    };
    setAudios((prev) => [...prev, newAudio]);
    return generatedAudioId;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userMessage = { text: message, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setSendFeedback(true);
    setTimeout(() => setSendFeedback(false), 300);
    setIsLoading(true);
    setNotification("Génération de la réponse...");

    try {
      const conversationHistory = messages.slice(-5).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));
      conversationHistory.push({ role: "user", content: message });

      const response = await apiClient.generateResponse({ history: conversationHistory });

      if (response.error) {
        setError(response.message || "Erreur inconnue lors de la génération.");
        setNotification(null);
        setIsLoading(false);
        return;
      }

      if (!response.text || typeof response.text !== "string") {
        setError("Réponse du serveur invalide ou vide.");
        setNotification(null);
        setIsLoading(false);
        return;
      }

      let audioId = response.audioId;
      if (!audioId || !audios.find((audio) => audio.id === audioId)) {
        audioId = await generateAudioAndLipsync(response.text, message, audios, lang);
        if (!audioId) {
          setIsLoading(false);
          return;
        }
      }

      setScript(audioId || "welcome");
      setPlayAudio(true);
      const { animation, expression } = getAnimationForResponse(response.text);
      setAudioAnimation(animation);
      setFacialExpression(expression);

      const avatarMessage = { text: response.text, sender: "avatar" };
      setMessages((prev) => [...prev, avatarMessage]);
      setNotification(null);
    } catch (err) {
      setError(err.message || "Erreur lors de la génération de la réponse ou de l'audio.");
      setNotification(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    localStorage.removeItem("chatMessages");
    setScript("welcome");
    setPlayAudio(false);
    setNotification("Conversation réinitialisée !");
    setTimeout(() => setNotification(null), 2000);
  };

  const handleScriptSelect = (e) => {
    const scriptId = e.target.value;
    if (scriptId) {
      setScript(scriptId);
      setPlayAudio(true);
    }
  };

  const toggleAudio = () => setPlayAudio(!playAudio);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : prev === "light" ? "neon" : "dark"));
  };

  const toggleMinimize = () => setIsMinimized(!isMinimized);

  const groupedAudios = audios.reduce((acc, audio) => {
    const category = audio.label.includes("Salutation")
      ? "Salutations"
      : audio.label.includes("arabe")
      ? "Messages en arabe"
      : audio.category || "Réponses";
    acc[category] = acc[category] || [];
    acc[category].push(audio);
    return acc;
  }, {});

  const handleAudioTranscription = (transcribedText) => {
    setMessage(transcribedText);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      handleSendMessage(fakeEvent);
    }, 100);
  };

  return (
    
    
    <div className={`chat-container ${theme}`}>
      <div
        className={`fixed bottom-4 left-4 z-20 w-full max-w-[280px] rounded-lg shadow-xl p-4 transition-all duration-200 backdrop-blur-md ${
          theme === "dark"
            ? "bg-gray-800 bg-opacity-95 text-white"
            : theme === "light"
            ? "bg-white bg-opacity-95 text-gray-900"
            : "bg-gray-900 bg-opacity-95 text-white border border-blue-400"
        } ${isMinimized ? "h-12 overflow-hidden" : "min-h-[250px]"}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold tracking-tight">Chat Avatar</h2>
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className={`p-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                theme === "neon"
                  ? "bg-gray-800 text-blue-300 border-blue-400 focus:ring-2 focus:ring-blue-500 animate-neon-glow"
                  : theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              }`}
              aria-label="Choisir la langue"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-gray-600 transition-all duration-200"
              title="Changer le thème"
            >
              {theme === "dark" ? (
                <FaSun className="w-4 h-4 text-yellow-400" />
              ) : theme === "light" ? (
                <FaMoon className="w-4 h-4 text-blue-600" />
              ) : (
                <FaSun className="w-4 h-4 text-blue-400" />
              )}
            </button>
            <button
              onClick={toggleMinimize}
              className="p-1.5 rounded-full hover:bg-gray-600 transition-all duration-200"
              title="Réduire/Agrandir"
            >
              {isMinimized ? <FaPlus className="w-4 h-4" /> : <FaMinus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {error && <Notification message={typeof error === "string" ? error : JSON.stringify(error)} type="error" onClose={() => setError(null)} />}
            {notification && <Notification message={typeof notification === "string" ? notification : JSON.stringify(notification)} type="info" onClose={() => setNotification(null)} />}

            <div className="messages flex flex-col gap-2 overflow-y-auto max-h-80 p-2" aria-live="polite">
              {messages.map((msg, idx) => (
                <Message key={idx} text={msg.text} sender={msg.sender} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {isLoading && (
              <div className="flex justify-center items-center my-2">
                <FaSpinner className="animate-spin text-blue-500 text-2xl" aria-label="Chargement..." />
                <span className="ml-2 text-blue-500">L'avatar réfléchit...</span>
              </div>
            )}

            <div className="mb-3">
              <select
                onChange={handleScriptSelect}
                className={`w-full p-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  theme === "neon"
                    ? "bg-gray-800 text-blue-300 border-blue-400 focus:ring-2 focus:ring-blue-500 animate-neon-glow"
                    : theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-100 text-gray-900 border-gray-300"
                }`}
                defaultValue=""
              >
                <option value="" disabled>Sélectionner un audio</option>
                {Object.entries(groupedAudios).map(([category, audios]) => (
                  <optgroup key={category} label={category}>
                    {audios.map((audio) => (
                      <option key={audio.id} value={audio.id}>
                        {audio.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleAudio}
                className={`p-2 rounded-full transition-all duration-200 ${
                  playAudio ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                } shadow-sm`}
                title={playAudio ? "Pause" : "Jouer"}
              >
                {playAudio ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message..."
                className={`flex-1 p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs transition-all duration-200 ${
                  theme === "neon"
                    ? "bg-gray-800 text-blue-200 border-blue-400"
                    : theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage(e)}
              />
              <button
                onClick={handleSendMessage}
                className={`p-2 rounded-full transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white ${
                  sendFeedback ? "animate-pulse-icon" : ""
                } shadow-sm`}
                title="Envoyer"
              >
                <FaPaperPlane className="w-4 h-4" />
              </button>
              <AudioRecorder onTranscription={handleAudioTranscription} lang={lang} />
              <button
                onClick={handleResetChat}
                className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-sm"
                title="Réinitialiser"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};