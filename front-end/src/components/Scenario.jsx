// frontend/src/components/Scenario.jsx
import { CameraControls, Environment } from "@react-three/drei";
import { useEffect, useRef, useContext } from "react";
import { Avatar } from "./Avatar";
import { AudioContext } from "./AudioContext"; // 🆕 Import du contexte

export const Scenario = () => {
  const cameraControls = useRef();
  const { script, audioAnimation } = useContext(AudioContext); // 🆕 Récupération

  useEffect(() => {
    cameraControls.current.setLookAt(
      0, 1.6, 2.5,
      0, 0.8, 1.5,
      true
    );
  }, []);

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      <Avatar script={script} animation={audioAnimation} /> {/* 🆕 On passe l'animation */}
    </>
  );
};
