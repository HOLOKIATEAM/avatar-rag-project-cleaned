import React from "react";
import PropTypes from "prop-types";

export const Message = ({ text, sender }) => {
  // Forcer la conversion en string si ce n'est pas déjà une string
  const displayText = typeof text === "string" ? text : JSON.stringify(text);

  return (
    <div
      className={`message ${sender} px-3 py-2 my-1 rounded-lg shadow-md max-w-[85%] text-sm transition-all duration-200 ${
        sender === "user"
          ? "bg-blue-500 text-white self-end animate-slide-in-right"
          : "bg-gray-200 text-gray-900 self-start animate-slide-in-left"
      }`}
      aria-label={sender === "user" ? "Message utilisateur" : "Message avatar"}
      tabIndex={0}
    >
      <span>{displayText}</span>
    </div>
  );
};

Message.propTypes = {
  // Accepter aussi un objet pour text, car il arrive que ce soit un objet
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  sender: PropTypes.oneOf(["user", "avatar"]).isRequired,
};
