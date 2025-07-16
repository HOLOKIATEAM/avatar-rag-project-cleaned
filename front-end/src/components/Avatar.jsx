import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import facialExpressions from "../constants/facialExpressions";
import { AudioContext } from "./AudioContext.jsx";

const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

export function Avatar({ script = "welcome", userInteracted }) {
  const {
    audioAnimation,
    setAudioAnimation,
    facialExpression,
    setFacialExpression,
  } = useContext(AudioContext);

  const group = useRef();
  const { nodes, materials } = useGLTF("/models/avatar.glb");

  const [audio, setAudio] = useState(null);
  const [lipsync, setLipsync] = useState(null);
  const [isTalking, setIsTalking] = useState(false);
  const [blink, setBlink] = useState(false);

  const animationFiles = [
    "Angry",
    "Defeated",
    "Dismissing Gesture",
    "Happy Idle",
    "Surprised",
    "Talking",
    "Thoughtful Head Shake",
    "Idle",
  ];

  const loadedAnimations = animationFiles.map((name) => ({
    name,
    data: useFBX(`/animations/${name}.fbx`).animations[0],
  }));

  const allAnimations = useMemo(() => {
    return loadedAnimations.map(({ name, data }) => {
      data.name = name;
      data.tracks = data.tracks.filter((track) => !track.name.includes("Hips"));
      return data;
    });
  }, [loadedAnimations]);

  const { actions } = useAnimations(allAnimations, group);

  useEffect(() => {
    if (!audioAnimation || !actions[audioAnimation]) return;
    Object.values(actions).forEach((action) => action.fadeOut(0.5));
    actions[audioAnimation].reset().fadeIn(0.5).play();
  }, [audioAnimation, actions]);

  const lerpMorphTarget = (target, value, speed = 0.2) => {
    Object.values(nodes).forEach((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index !== undefined) {
          child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            child.morphTargetInfluences[index],
            value,
            speed
          );
        }
      }
    });
  };

  useEffect(() => {
    if (!script) return;

    const newAudio = new Audio(`/audios/${script}.wav`);
    setAudio(newAudio);

    const lipsyncPath = `/audios/${script}.json`;

    const waitForLipsyncFile = async (maxRetries = 20, delay = 500) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const res = await fetch(lipsyncPath);
          if (res.ok) {
            const data = await res.json();
            return data;
          }
        } catch (_) {}
        await new Promise((res) => setTimeout(res, delay));
      }
      return null;
    };

    waitForLipsyncFile().then((data) => {
      if (!data) return;
      setLipsync(data);

      const startPlayback = () => {
        newAudio.play().catch((e) => console.warn("Erreur lecture audio :", e));
        setIsTalking(true);
      };

      newAudio.oncanplaythrough = () => {
        if (userInteracted) {
          startPlayback();
        } else {
          const onUserInteract = () => {
            startPlayback();
            window.removeEventListener("click", onUserInteract);
            window.removeEventListener("keydown", onUserInteract);
          };
          window.addEventListener("click", onUserInteract, { once: true });
          window.addEventListener("keydown", onUserInteract, { once: true });
        }
      };
    });

    newAudio.onended = () => {
      setIsTalking(false);
      setLipsync(null);
      setAudioAnimation("default");
      setFacialExpression("default");
    };

    return () => {
      newAudio.pause();
      newAudio.currentTime = 0;
    };
  }, [script, userInteracted]);

  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, 200);
      }, THREE.MathUtils.randInt(1000, 5000));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  useFrame(() => {
    Object.values(corresponding).forEach((viseme) => {
      lerpMorphTarget(viseme, 0, 0.5);
    });

    if (audio && lipsync && isTalking) {
      const time = audio.currentTime;
      const cue = lipsync.mouthCues.find((c) => time >= c.start && time <= c.end);
      if (cue && corresponding[cue.value]) {
        lerpMorphTarget(corresponding[cue.value], 1, 0.5);
      }
    }

    Object.keys(facialExpressions.default).forEach((key) => {
      lerpMorphTarget(key, 0, 0.1);
    });

    const expression = facialExpressions[facialExpression] || {};
    Object.entries(expression).forEach(([key, value]) => {
      lerpMorphTarget(key, value, 0.1);
    });

    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.5);
  });

  return (
    <group
      ref={group}
      dispose={null}
      position={[0, -0.9, 0]}
      scale={[1, 1, 1]}
      rotation={[Math.PI, Math.PI, Math.PI]}
    >
      <primitive object={nodes.Hips} />
      <skinnedMesh name="EyeLeft" geometry={nodes.EyeLeft.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeLeft.skeleton} morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary} morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences} />
      <skinnedMesh name="EyeRight" geometry={nodes.EyeRight.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeRight.skeleton} morphTargetDictionary={nodes.EyeRight.morphTargetDictionary} morphTargetInfluences={nodes.EyeRight.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Head" geometry={nodes.Wolf3D_Head.geometry} material={materials.Wolf3D_Skin} skeleton={nodes.Wolf3D_Head.skeleton} morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Teeth" geometry={nodes.Wolf3D_Teeth.geometry} material={materials.Wolf3D_Teeth} skeleton={nodes.Wolf3D_Teeth.skeleton} morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences} />
      <skinnedMesh geometry={nodes.Wolf3D_Hair.geometry} material={materials.Wolf3D_Hair} skeleton={nodes.Wolf3D_Hair.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Body.geometry} material={materials.Wolf3D_Body} skeleton={nodes.Wolf3D_Body.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Bottom.geometry} material={materials.Wolf3D_Outfit_Bottom} skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Footwear.geometry} material={materials["aleksandr@readyplayer"]} skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Top.geometry} material={materials.Wolf3D_Outfit_Top} skeleton={nodes.Wolf3D_Outfit_Top.skeleton} />
    </group>
  );
}

useGLTF.preload("/models/avatar.glb");
[
  "Angry",
  "Defeated",
  "Dismissing Gesture",
  "Happy Idle",
  "Surprised",
  "Talking",
  "Thoughtful Head Shake",
  "Idle",
].forEach((name) => useFBX.preload(`/animations/${name}.fbx`));
