from pydantic import BaseModel, Field
from typing import List, Any

class Node(BaseModel):
    id: str = Field(description="Unique identifier (e.g., n1, n2)")
    label: str = Field(description="Name of the entity")
    type: str = Field(description="Classification (e.g., person, location, concept)")

class Edge(BaseModel):
    source: str = Field(description="Source Node ID")
    target: str = Field(description="Target Node ID")
    label: str = Field(description="Relationship label")

class KnowledgeGraph(BaseModel):
    nodes: List[Node] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)

class RAGResponse(BaseModel):
    answer: str = Field(description="Grounded response to the query")
    graph: KnowledgeGraph

class QueryRequest(BaseModel):
    url: str
    query: str