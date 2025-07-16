import React, { useState } from "react";

export const AvatarSelector = ({ onSelectAvatar }) => {
  const avatars = [
    { id: "avatar1", label: "Avatar par défaut", path: "/models/avatar.glb" },
    { id: "avatar2", label: "Avatar alternatif", path: "/models/avatar2.glb" },
  ];

  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0].id);

  const handleSelect = (avatar) => {
    setSelectedAvatar(avatar.id);
    onSelectAvatar(avatar.path);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {avatars.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => handleSelect(avatar)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
            selectedAvatar === avatar.id
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {avatar.label}
        </button>
      ))}
    </div>
  );
};