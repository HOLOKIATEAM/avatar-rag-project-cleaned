from fastapi import FastAPI, HTTPException # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel # type: ignore
import yaml # type: ignore
import os
from gtts import gTTS # type: ignore
import io
import uuid
import subprocess
import json
import logging
from pydub import AudioSegment # type: ignore

app = FastAPI(
    title="TTS Server",
    description="API de synthèse vocale et synchronisation labiale",
    version="1.0.0"
)

# Configurer CORS
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurer les logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tts-server")

# Charger la configuration
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "lipsync_config.yaml")
try:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        logger.info(f"Chargement du fichier de configuration : {os.path.abspath(f.name)}")
        config = yaml.safe_load(f)
except Exception as e:
    logger.error(f"Erreur lors de la lecture de lipsync_config.yaml : {str(e)}")
    config = {"languages": ["fr-fr", "en-us","ar"], "speakers": ["female-pt-4", "male-en-1"]}

LANGUAGES = config.get("languages", ["fr-fr", "en-us","ar"])
SPEAKERS = config.get("speakers", ["female-pt-4", "male-en-1"])
logger.info(f"Langues disponibles : {LANGUAGES}")
logger.info(f"Locuteurs disponibles : {SPEAKERS}")

# Dossier de sortie
OUTPUT_DIR = "/audios"
os.makedirs(OUTPUT_DIR, exist_ok=True)
logger.info(f"Dossier de sortie : {OUTPUT_DIR}")

# Chemin vers rhubarb.exe
RHUBARB_PATH = os.path.join(BASE_DIR, "rhubarb")
if not os.path.exists(RHUBARB_PATH):
    logger.error(f"rhubarb.exe introuvable à : {RHUBARB_PATH}")
    raise FileNotFoundError(f"rhubarb.exe introuvable à : {RHUBARB_PATH}")

class SynthesisRequest(BaseModel):
    text: str
    lang: str
    audio_id: str | None = None
    speaker: str | None = None

@app.get("/languages/")
async def get_languages():
    """
    Retourne la liste des langues disponibles.
    """
    return {"languages": LANGUAGES}

@app.get("/speakers/")
async def get_speakers():
    """
    Retourne la liste des locuteurs disponibles.
    """
    return {"speakers": SPEAKERS}

@app.post("/generate-tts/")
async def generate_tts(request: SynthesisRequest):
    """
    Génère un fichier audio et la synchronisation labiale à partir d'un texte.
    """
    try:
        if not request.text.strip():
            logger.error("Texte manquant dans la requête")
            raise HTTPException(status_code=400, detail="Le texte ne peut pas être vide")

        lang_map = {"fr": "fr-fr", "en": "en-us","ar":"ar-MA"}
        normalized_lang = lang_map.get(request.lang, request.lang)
        if normalized_lang not in LANGUAGES:
            logger.error(f"Langue non supportée : {request.lang}")
            raise HTTPException(status_code=400, detail=f"Langue non supportée (attendu : {LANGUAGES})")

        if request.speaker and request.speaker not in SPEAKERS:
            logger.error(f"Locuteur non supporté : {request.speaker}")
            raise HTTPException(status_code=400, detail=f"Locuteur non supporté (attendu : {SPEAKERS})")

        tts = gTTS(text=request.text, lang=request.lang, slow=False)
        audio_id = request.audio_id or f"audio-{uuid.uuid4().hex}"
        audio_path = os.path.join(OUTPUT_DIR, f"{audio_id}.wav")
        temp_audio_path = os.path.join(OUTPUT_DIR, f"{audio_id}_temp.mp3")
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        with open(temp_audio_path, "wb") as f:
            f.write(audio_buffer.getvalue())
        logger.info(f"Audio MP3 temporaire généré : {temp_audio_path}")

        audio = AudioSegment.from_mp3(temp_audio_path)
        audio = audio.set_channels(1).set_frame_rate(44100).set_sample_width(2)
        audio.export(audio_path, format="wav")
        logger.info(f"Audio WAV généré : {audio_path}")

        os.remove(temp_audio_path)

        if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
            logger.error(f"Fichier audio invalide ou vide : {audio_path}")
            raise Exception(f"Fichier audio invalide ou vide : {audio_path}")

        json_path = os.path.join(OUTPUT_DIR, f"{audio_id}.json")
        logger.info(f"Exécution Rhubarb pour : {audio_path}")
        result = subprocess.run(
            [RHUBARB_PATH, "-o", json_path, audio_path, "--exportFormat", "json"],
            check=True,
            text=True,
            capture_output=True
        )
        logger.info(f"Synchronisation labiale générée : {json_path}")
        if result.stderr:
            logger.warning(f"Erreur Rhubarb (stderr) : {result.stderr}")

        with open(json_path, "r", encoding="utf-8") as f:
            lipsync_data = json.load(f)
        if not lipsync_data.get("mouthCues"):
            logger.error("Aucun viseme généré par Rhubarb")
            raise Exception("Aucun viseme généré par Rhubarb")

        config_path = os.path.abspath(os.path.join(BASE_DIR, "../front-end/public/audios-config.json"))
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
            config["audios"].append({
                "id": audio_id,
                "label": f"Réponse {audio_id[:8]}",
                "extension": "wav",
                "keywords": [],
                "animation": "Idle"
            })
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2)
            logger.info(f"Config audio mise à jour : {config_path}")
        except Exception as e:
            logger.error(f"Erreur mise à jour config : {e}")

        return {
            "audioId": audio_id,
            "audioPath": f"/audios/{audio_id}.wav",
            "lipsyncPath": f"/audios/{audio_id}.json"
        }
    except subprocess.CalledProcessError as e:
        logger.error(f"Erreur Rhubarb : {e.stderr}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la synchronisation labiale : {e.stderr}")
    except Exception as e:
        logger.error(f"Erreur dans generate-tts : {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la synthèse : {str(e)}")

if __name__ == "__main__":
    import uvicorn # type: ignore
    uvicorn.run(app, host="0.0.0.0", port=5000)