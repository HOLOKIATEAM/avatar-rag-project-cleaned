import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { FaPlay, FaPause } from "react-icons/fa";

export const AudioPlayer = ({ src, label = "Audio", autoPlay = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="audio-player flex items-center gap-2 my-2">
      <button
        onClick={handlePlayPause}
        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={isPlaying ? `Pause ${label}` : `Lire ${label}`}
      >
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
      <span className="text-xs text-gray-700">{label}</span>
    </div>
  );
};

AudioPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  label: PropTypes.string,
  autoPlay: PropTypes.bool,
}; 