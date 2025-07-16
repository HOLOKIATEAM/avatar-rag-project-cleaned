import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Scenario } from "./components/Scenario";
import { ChatInterface } from "./components/ChatInterface";
import { AudioProvider } from "./components/AudioContext.jsx";

function App() {
  return (
    <AudioProvider>
      <Loader />
      <Leva collapsed />
      <div className="flex h-screen w-screen">
        {/* Chatbox à gauche */}
        <ChatInterface />
        {/* Avatar à droite */}
        <div className="fixed top-0 right-0 w-1/2 h-full">
          <Canvas
            shadows
            camera={{ near: 0.01, far: 1000 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 0, // Sous l'interface
            }}
          >
            <Scenario />
          </Canvas>
        </div>
      </div>
    </AudioProvider>
  );
}

export default App;