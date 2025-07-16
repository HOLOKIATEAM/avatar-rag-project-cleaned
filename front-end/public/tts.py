from fastapi import FastAPI, UploadFile
from pydantic import BaseModel
import uvicorn
import subprocess
import torch
from TTS.api import TTS
import gradio as gr 
import os
from fastapi.responses import FileResponse

app = FastAPI()

class TextInput(BaseModel):
    text: str

@app.get("/")
def welcome():
    return {"message": "Welcome to HOLOKIA API"}

@app.post("/generate_audio")
def generate_audio(input: TextInput):
    # Choix du device
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Créer le répertoire s'il n'existe pas
    os.makedirs("audios", exist_ok=True)

    # Initialiser le modèle
    tts = TTS(model_name="tts_models/en/ljspeech/fast_pitch").to(device)

    # Générer l'audio
    output_path = "audios/output.wav"
    tts.tts_to_file(text=input.text, file_path=output_path)

    # Retourner le fichier audio
    return FileResponse(output_path, media_type="audio/wav", filename="output.wav")


@app.post("/generate_lip_sync")
async def generate_lip_sync(data: TextInput):
    # 1. Générer l'audio à partir du texte

    audio_path = generate_audio(text=TextInput)
    
    # 2. Appeler SadTalker avec vidéo d'entrée et audio généré
    subprocess.run([
        "python3", "inference.py",
        "--checkpoint_path", "checkpoints/wav2lip.pth",
        "--face", "input_video.mp4",
        "--audio", audio_path
    ])

    return {"video_url": "output/result_voice.mp4"}


if __name__ == "__main__":
    uvicorn.run(app, port=8000)





