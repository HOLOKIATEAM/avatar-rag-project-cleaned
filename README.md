
# 🧠 Avatar RAG Project

Ce projet est une application web interactive combinant :

- 🎭 **Avatar 3D animé** avec synchronisation labiale et expressions faciales (React Three Fiber)
- 🧠 **Génération de texte par IA** via [Groq API]
- 🗣️ **Synthèse vocale (TTS)** + synchronisation labiale (Rhubarb)
- 🎤 **Reconnaissance vocale (STT)**
- 📦 Le tout orchestré avec **Docker** et **Docker Compose**

---



## 📁 Structure du projet

```
avatar-rag-project-cleaned/
├── BackEnd/                # API FastAPI + TTS + STT
│   ├── main.py             # Route principale pour la génération IA
│   ├── tts_server.py       # Service de synthèse vocale
│   ├── stt_server.py       # Service de reconnaissance vocale
│   ├── rhubarb.exe         # Utilitaire de synchronisation labiale
│   ├── requirements.txt    # Dépendances Python
│   └── .env                # Clé API Groq (à ajouter)
│
├── front-end/              # Application React (Vite + Three.js)
│   ├── public/audios/      # Fichiers .wav et .json générés
│   ├── src/                # Code source React
│   └── Dockerfile          # Image frontend
│
├── docker-compose.yml      # Orchestration multi-services
├── .dockerignore
├── .gitignore
└── README.md
```

---

## ✅ Pré-requis

- [x] Docker & Docker Compose installés
- [x] Une clé API Groq (à coller dans `.env`)
- [x] Git installé

---

## 🔧 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/HOLOKIATEAM/avatar-rag-project-cleaned.git
cd avatar-rag-project-cleaned
```

### 2. Ajouter le fichier `.env` dans le dossier `BackEnd/`

Exemple :

```ini
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Lancer tous les services

```bash
docker compose up --build
```

Cela démarre :

- 🧠 Backend IA (http://localhost:5001/docs)
- 🔊 TTS + lip-sync (http://localhost:5000/)
- 🎤 STT (http://localhost:5002/)
- 🌐 Frontend (http://localhost:5173/)

---

## 🧪 Test du projet

1. Accède à [http://localhost:5173/](http://localhost:5173/)
2. Écris un message dans le chat
3. L’IA génère une réponse avec :
   - Audio joué automatiquement
   - Bouche de l’avatar animée selon le texte
   - Expression faciale adaptée (joie, surprise…)

---

## ⚠️ Astuces & problèmes fréquents

- 🛑 **.env** ne doit **jamais être commité**
- 📂 Tous les audios sont stockés dans `front-end/public/audios/` via un volume partagé
- 🧠 Pour modifier les réponses IA, regarde `main.py` (modèle Groq)
- 🎭 Pour ajouter des animations faciales : `facialExpressions.js`
- 🐳 Pour voir les logs :

```bash
docker compose logs -f
```

---

## 🔁 Commandes Docker utiles

| Action                  | Commande                              |
|-------------------------|----------------------------------------|
| Démarrer les services   | `docker compose up --build`           |
| Arrêter les services    | `docker compose down`                 |
| Rebuild un seul service | `docker compose build tts`            |
| Voir les logs           | `docker compose logs -f`              |
| Entrer dans un conteneur| `docker exec -it <container> bash`    |


