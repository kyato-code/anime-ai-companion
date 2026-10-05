from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(req: ChatRequest):
    msg = req.message.lower()
    
    if "siapa nama" in msg or "nama kamu" in msg:
        reply = "Namaku Hikari! Kucing AI yang siap nemenin kamu browsing dan nyari informasi ☕✨"
    elif "halo" in msg or "hi" in msg or "p" in msg:
        reply = "Halo juga! Ada hal menarik yang lagi kamu cari atau mau didiskusiin?"
    elif "lagi apa" in msg:
        reply = "Lagi minum kopi sambil nemenin kamu internetan nih~ Meow!"
    else:
        reply = f"Meow~ Soal '{req.message}', aku mengerti! Ada lagi yang mau kamu tanyakan?"
        
    return {"reply": reply}
