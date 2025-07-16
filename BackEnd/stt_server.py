import whisper # type: ignore
from fastapi import FastAPI, File, UploadFile, HTTPException # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
import os
import uvicorn # type: ignore
import logging
from typing import Set # type: ignore
app = FastAPI(
    title="STT Server",
    description="API de transcription audio avec Whisper",
    version="1.0.0"
)
# Configurer CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurer les logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stt-server")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.get("/models", response_model=Set[str])
def models_stt():
    """
    Liste les modèles Whisper disponibles.
    """
    return {'tiny', 'base', 'small', 'medium', 'large'}

@app.post("/generate-stt/")
async def generate_stt(file: UploadFile = File(...), model_size: str = "base"):
    """
    Transcrit un fichier audio en texte.
    """
    try:
        if model_size not in {'tiny', 'base', 'small', 'medium', 'large'}:
            raise HTTPException(status_code=400, detail="Modèle non supporté.")
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        model = whisper.load_model(model_size)
        result = model.transcribe(audio=file_path)
        logger.info(f"Transcription : {result['text']}")
        os.remove(file_path)
        return {"text": result["text"]}
    except Exception as e:
        logger.error(f"Erreur lors de la génération du texte : {e}")
        raise HTTPException(status_code=400, detail="Impossible de générer le texte.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5002)
