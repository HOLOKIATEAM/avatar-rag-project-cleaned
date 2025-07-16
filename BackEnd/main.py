"""
main.py - API principale pour la génération de texte et proxy TTS
"""


from fastapi import FastAPI, HTTPException # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel # type: ignore
from typing import List, Optional # type: ignore
from langchain_groq import ChatGroq # type: ignore
from langchain_core.output_parsers import StrOutputParser # type: ignore
from langchain_core.prompts import ChatPromptTemplate # type: ignore
from dotenv import load_dotenv # type: ignore
import logging
import os

# Chargement des variables d'environnement
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)
print("Chemin .env chargé :", dotenv_path)
for k, v in os.environ.items():
    if "GROQ" in k:
        print(f"{k}={v}")

print("GROQ KEY:", os.getenv("GROQ_API_KEY"))
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialisation du modèle LLM
llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens=200,
    temperature=0.5
)

# Initialisation de l'application FastAPI
app = FastAPI(
    title="Avatar Backend API",
    description="API pour la génération de texte et la synthèse vocale",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration du logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("avatar-backend")

# Modèles Pydantic
class Message(BaseModel):
    role: str
    content: str

class GenerateRequest(BaseModel):
    history: List[Message]

class GenerateResponse(BaseModel):
    text: str
    audioId: Optional[str] = None

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_response(request: GenerateRequest):
    """
    Génère une réponse textuelle à partir de l'historique de conversation.
    """
    try:
        # Préparation du prompt
        recent_history = request.history[-5:]
        conversation = "\n".join(f"{msg.role}: {msg.content}" for msg in recent_history)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Tu es un avatar IA conversationnelle, tu t'appelles HOLOKIA. Réponds aux questions de l'utilisateur avec précision et sois bref."),
            ("user", conversation)
        ])
        parser = StrOutputParser()
        model = prompt | llm | parser
        response = model.invoke({"question": conversation})

        if not response or len(response.strip()) < 5:
            response = "Je n'ai pas compris, pouvez-vous reformuler ?"

        logger.info(f"Réponse générée : {response}")
        return GenerateResponse(text=response)
    except Exception as e:
        logger.exception(f"Erreur de génération : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération de la réponse.")

import httpx # type: ignore

@app.post("/api/tts")
async def generate_tts(text: str, audio_id: str, lang: str):
    """
    Proxy vers le service TTS.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:5000/generate-tts/",
                json={"text": text, "lang": lang, "audio_id": audio_id}
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Audio généré : {result['audioId']}")
            return {"audioId": result["audioId"]}
    except httpx.RequestError as e:
        logger.error(f"Erreur de requête TTS : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la requête TTS.")
    except Exception as e:
        logger.exception(f"Erreur TTS : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération TTS.")

if __name__ == "__main__":
    import uvicorn # type: ignore 
    uvicorn.run(app, host="0.0.0.0", port=5001)