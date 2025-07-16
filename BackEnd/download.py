"""
download.py - Script pour télécharger et sauvegarder un modèle HuggingFace
"""

from transformers import AutoModelForCausalLM, AutoTokenizer # type: ignore
import argparse
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("download-model")

def download_model(model_name: str, cache_dir: str, model_save_dir: str):
    """
    Télécharge et sauvegarde un modèle et un tokenizer HuggingFace.
    """
    try:
        logger.info(f"Téléchargement du modèle {model_name}...")
        model = AutoModelForCausalLM.from_pretrained(model_name, cache_dir=cache_dir)
        tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=cache_dir)
        os.makedirs(model_save_dir, exist_ok=True)
        model.save_pretrained(model_save_dir)
        tokenizer.save_pretrained(model_save_dir)
        logger.info("Modèle et tokenizer téléchargés et enregistrés avec succès.")
    except Exception as e:
        logger.error(f"Une erreur est survenue : {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Télécharge un modèle HuggingFace.")
    parser.add_argument("--model_name", type=str, required=True, help="Nom du modèle (ex: EleutherAI/gpt-neo-125m)")
    parser.add_argument("--cache_dir", type=str, default="./huggingface_cache", help="Répertoire de cache")
    parser.add_argument("--model_save_dir", type=str, default="./models", help="Répertoire de sauvegarde du modèle")
    args = parser.parse_args()
    download_model(args.model_name, args.cache_dir, args.model_save_dir)


""" from transformers import AutoModelForCausalLM, AutoTokenizer # type: ignore

model_name = 'HuggingFaceH4/zephyr-7b-beta'
cache_dir = 'E:\\huggingface_cache'
model_save_dir = 'E:\\models\\zephyr-7b-beta'

# Télécharger le modèle et le tokenizer
try:
    model = AutoModelForCausalLM.from_pretrained(model_name, cache_dir=cache_dir)
    tokenizer = AutoTokenizer.from_pretrained(model_name, cache_dir=cache_dir)

    # Enregistrer le modèle et le tokenizer
    model.save_pretrained(model_save_dir)
    tokenizer.save_pretrained(model_save_dir)

    print("Modèle et tokenizer téléchargés et enregistrés avec succès.")

except Exception as e:
    print(f"Une erreur est survenue : {e}") """