# Web2Graph

**Web2Graph** is an advanced Retrieval-Augmented Generation (RAG) engine that transforms unstructured web content into interactive, 3D knowledge graphs. It utilizes LLM-powered entity extraction to visualize relationships and provides grounded, context-aware answers to user queries in real-time.

---

## Features

* **URL Knowledge Extraction**: Automatically scrapes blog or article content and splits it into manageable text chunks.
* **3D Graph Visualization**: Renders an immersive, 3D force-directed graph powered by `react-force-graph-3d` and `Three.js`.
* **Hybrid RAG Pipeline**: Combines vector search using ChromaDB and HuggingFace embeddings with graph-based context to generate accurate responses.
* **Real-time Neural Streaming**: Uses WebSockets to stream graph nodes and edges to the UI as they are extracted from text chunks.
* **Interactive Neural Inspector**: Allows users to select nodes to view properties, descriptions, and outgoing/incoming relationships.
* **Strict JSON Data Modeling**: Leverages Llama 3.1 8B via Groq with specialized prompts to ensure reliable, structured data output.

---

## Tech Stack

### Backend (`rag_backend/app`)

* **Framework**: FastAPI
* **LLM Engine**: Groq (`llama-3.1-8b-instant`)
* **Vector Store**: ChromaDB
* **Embeddings**: HuggingFace (`all-MiniLM-L6-v2`)
* **Orchestration**: LangChain
* **Scraping**: BeautifulSoup4

### Frontend (`rag_frontend/src`)

* **Framework**: React
* **Visualization**: Three.js & `react-force-graph-3d`
* **Styling**: Custom Cyberpunk-themed CSS with animated glow effects and responsive layouts

---

## Project Structure

```text
.
├── rag_backend/
│   └── app/
│       ├── main.py          # API endpoints and WebSocket handlers
│       ├── models.py        # Pydantic data schemas for nodes, edges, and graphs
│       ├── prompts.py       # Specialized system prompts for JSON extraction
│       ├── rag_service.py   # RAG logic, vector search, and graph generation
│       └── scraper.py       # Web scraping and recursive text splitting
└── rag_frontend/
    └── src/
        └── App.jsx          # 3D visualization, state management, and UI logic

```

---

##  Installation & Setup

### 1. Prerequisites

* Python 3.10+
* Node.js 18+
* Groq API Key

### 2. Backend Setup

```bash
cd rag_backend
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install fastapi uvicorn langchain langchain-groq langchain-huggingface langchain-community chromadb beautifulsoup4 requests python-dotenv

# Configure environment variables
echo "GROQ_API_KEY=your_api_key_here" > .env

# Start the server
uvicorn app.main:app --reload

```

### 3. Frontend Setup

```bash
cd rag_frontend
# Install dependencies
npm install react-force-graph-3d three react

# Start development server
npm run dev

```

---

##  Usage

1. **Extract Data**: Paste a URL into the URI input and click **Extract** to begin the WebSocket-driven neural sync.
2. **Visual Interaction**:
* **Left Click**: Select an entity to open the **Neural Inspector**.
* **Deep Analysis**: Trigger a targeted LLM query regarding a specific node's role in the graph.


3. **Chat & Query**: Ask questions in the chat sidebar. The system retrieves relevant context and highlights related nodes in the 3D space.

---

##  Controls

| Key | Action |
| --- | --- |
| **ESC** | Clear selection / Close inspector |
| **R** | Reset camera and fit view |
| **L** | Toggle Node Labels |
| **CTRL + Space** | Focus camera on the selected node |
