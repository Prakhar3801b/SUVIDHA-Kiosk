"""
download_model.py — Run this ONCE to download GPT-2 locally.
After running, model files will be saved to ./gpt2_model/
Then model_server.py will load from there (no internet needed after this).

Usage: python download_model.py
"""
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import os

SAVE_DIR = os.path.join(os.path.dirname(__file__), "gpt2_model")
print(f"Downloading GPT-2 model to: {SAVE_DIR}")
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")
tokenizer.save_pretrained(SAVE_DIR)
model.save_pretrained(SAVE_DIR)
print("✅ GPT-2 saved successfully! You can now run model_server.py")
