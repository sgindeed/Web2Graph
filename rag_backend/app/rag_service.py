import os
import asyncio
import json
from dotenv import load_dotenv
from fastapi import WebSocket, WebSocketDisconnect

load_dotenv()

from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from app.models import RAGResponse, KnowledgeGraph
from app.prompts import SYSTEM_PROMPT

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Initialize LLM with JSON Mode
llm = ChatGroq(
    model="llama-3.1-8b-instant", 
    temperature=0.0,
    api_key=os.getenv("GROQ_API_KEY"),
    model_kwargs={"response_format": {"type": "json_object"}}
)

def process_rag_query(chunks: list[str], query: str, url: str) -> RAGResponse:
    vectorstore = Chroma.from_texts(chunks, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    relevant_docs = retriever.invoke(query)
    context_text = "\n\n".join([doc.page_content for doc in relevant_docs])
    
    # Rigid prompt for JSON Mode
    json_prompt = f"""{SYSTEM_PROMPT}
    
    RETURN ONLY A JSON OBJECT. NO PREAMBLE. NO EXPLANATION.
    STRUCTURE:
    {{
      "answer": "your verbal response",
      "graph": {{
        "nodes": [{{ "id": "n1", "label": "name", "type": "category" }}],
        "edges": [{{ "source": "n1", "target": "n2", "label": "verb" }}]
      }}
    }}

    [CONTEXT]
    {context_text}

    [QUERY]
    {query}
    """
    
    try:
        # Direct invocation to get raw JSON string
        raw_res = llm.invoke(json_prompt)
        parsed = json.loads(raw_res.content)
        
        # Manually map to our RAGResponse model for validation
        return RAGResponse(
            answer=parsed.get("answer", "No answer generated."),
            graph=KnowledgeGraph(
                nodes=parsed.get("graph", {}).get("nodes", []),
                edges=parsed.get("graph", {}).get("edges", [])
            )
        )
    except Exception as e:
        print(f"JSON Mode Error: {e}")
        return RAGResponse(
            answer="The neural engine failed to format the response. Please try again.",
            graph=KnowledgeGraph(nodes=[], edges=[])
        )

async def stream_document_graph(chunks: list[str], url: str, websocket: WebSocket):
    # For streaming, we use a simpler prompt to keep it fast
    try:
        for i, chunk in enumerate(chunks):
            await websocket.send_json({"type": "status", "message": f"Syncing {i+1}/{len(chunks)}..."})
            
            stream_prompt = f"Extract entities and relationships from this text into a JSON object with 'nodes' and 'edges' arrays. Text: {chunk}"
            
            try:
                res = llm.invoke(stream_prompt)
                parsed = json.loads(res.content)
                nodes = parsed.get("nodes", [])
                edges = parsed.get("edges", [])

                if nodes or edges:
                    await websocket.send_json({
                        "type": "graph_update",
                        "data": {"nodes": nodes, "edges": edges}
                    })
            except:
                continue
            await asyncio.sleep(1)
            
        await websocket.send_json({"type": "status", "message": "Neural Sync Complete"})
        await websocket.send_json({"type": "done"})
    except (WebSocketDisconnect, RuntimeError):
        return