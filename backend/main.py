from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import anime_agent

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
async def chat_endpoint(request: ChatRequest):
    try:
        result = await anime_agent.run(request.message)
        # Mendapatkan teks respons dari AgentRunResult (menggunakan .output atau str(result.data))
        response_text = str(getattr(result, 'output', getattr(result, 'data', result)))
        return {"reply": response_text}
    except Exception as e:
        print(f"Error saat memproses chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
