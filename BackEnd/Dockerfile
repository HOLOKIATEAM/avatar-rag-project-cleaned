# 1. Utiliser une image légère Python
FROM python:3.11-slim

# 2. Définir le dossier de travail dans le conteneur
WORKDIR /app

# 3. Copier les fichiers nécessaires en premier (meilleure gestion du cache Docker)
COPY requirements.txt ./


# 4. Installer les dépendances Python
RUN pip install --upgrade pip --disable-pip-version-check && \
    pip install --no-cache-dir --timeout=100 --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt


# 5. Copier tout le code backend dans le conteneur
COPY . .

# 6. Exposer le port utilisé par uvicorn
EXPOSE 5001

# 7. Lancer le serveur avec main.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]
