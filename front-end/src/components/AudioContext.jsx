import React, { createContext, useState } from "react";

export const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [script, setScript] = useState("welcome");
  const [playAudio, setPlayAudio] = useState(false);
  const [audioAnimation, setAudioAnimation] = useState("default"); // valeur par défaut
  const [facialExpression, setFacialExpression] = useState("default"); // 🆕 déclaration manquante

  return (
    <AudioContext.Provider
      value={{
        script,
        setScript,
        playAudio,
        setPlayAudio,
        audioAnimation,
        setAudioAnimation,
        facialExpression,        // ✅ bien inclus
        setFacialExpression,     // ✅ bien inclus
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
