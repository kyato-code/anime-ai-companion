from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import anime_agent

app = FastAPI()

# Izinkan CORS agar Chrome Extension bisa memanggil API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "Anime AI Server Active"}

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    result = await anime_agent.run(req.message)
    return {"reply": result.data}
