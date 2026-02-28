from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch, uvicorn, os

app = FastAPI(title="SUVIDHA AI Server")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── Load GPT-2 on startup ───────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "gpt2_model")
tokenizer, model = None, None

@app.on_event("startup")
def load_model():
    global tokenizer, model
    print("[AI] Loading GPT-2 model...")
    tokenizer = GPT2Tokenizer.from_pretrained(MODEL_DIR if os.path.exists(MODEL_DIR) else "gpt2")
    model     = GPT2LMHeadModel.from_pretrained(MODEL_DIR if os.path.exists(MODEL_DIR) else "gpt2")
    model.eval()
    print("[AI] ✅ GPT-2 ready")

# ─── Context injected before each prompt ─────────────────────────
CONTEXT = """You are SUVIDHA, a government kiosk assistant. Help users with:
1. Paying electricity bills (needs IVRS number)
2. Paying gas bills (needs account number and mobile)
3. Paying property tax (needs property ID)
4. Applying for new gas connection
5. Booking driving test slots (needs learner licence number)
6. Enrolling in health schemes
7. Scholarship applications
8. Filing complaints/grievances with departments
Keep answers short, helpful, and step-by-step. Do not discuss unrelated topics.

User: """

class ChatRequest(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    reply: str

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not model:
        return ChatResponse(reply="AI assistant is loading. Please wait a moment.")

    prompt = CONTEXT + req.message + "\nSUVIDHA Assistant:"
    inputs = tokenizer.encode(prompt, return_tensors="pt", max_length=300, truncation=True)

    with torch.no_grad():
        outputs = model.generate(
            inputs,
            max_new_tokens=100,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,
        )

    # Extract only the newly generated tokens
    generated = tokenizer.decode(outputs[0][inputs.shape[-1]:], skip_special_tokens=True)
    # Clean up — take only up to the first newline
    reply = generated.split('\n')[0].strip() or "I'm not sure about that. Please ask staff for help."
    return ChatResponse(reply=reply)

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

if __name__ == "__main__":
    uvicorn.run("model_server:app", host="0.0.0.0", port=8001, reload=False)
