import sys
import logging
logging.basicConfig(level=logging.DEBUG)

print("Starting import...")
from rag_pipeline import ask_question
import os

key = os.environ.get("GEMINI_API_KEY")
print("Key length:", len(key) if key else 0)

print("Invoking ask_question...")
try:
    ans = ask_question("test", key)
    print("Answer:", ans)
except Exception as e:
    print("Error:", e)
print("Done")
