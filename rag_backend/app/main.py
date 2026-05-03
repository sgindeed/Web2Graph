from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.models import QueryRequest, RAGResponse
from app.scraper import scrape_and_chunk
from app.rag_service import process_rag_query, stream_document_graph

app = FastAPI(title="Nexus RAG Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/query", response_model=RAGResponse)
async def handle_query(request: QueryRequest):
    chunks = scrape_and_chunk(request.url)
    if not chunks:
        raise HTTPException(status_code=400, detail="Scrape failed")
    return process_rag_query(chunks, request.query, request.url)

@app.websocket("/ws/extract")
async def extract_graph_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        chunks = scrape_and_chunk(data.get("url"))
        if chunks:
            await stream_document_graph(chunks, data.get("url"), websocket)
    except WebSocketDisconnect:
        pass