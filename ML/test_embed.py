import os
from dotenv import load_dotenv
load_dotenv()
from langchain_google_genai import GoogleGenerativeAIEmbeddings

api_key = os.environ.get("GEMINI_API_KEY")

for m in ["models/embedding-001", "embedding-001", "models/text-embedding-004", "text-embedding-004"]:
    try:
        print(f"Testing {m}...")
        emb = GoogleGenerativeAIEmbeddings(model=m, google_api_key=api_key)
        res = emb.embed_query("hello")
        print(f"Success with {m}, vector length: {len(res)}")
        break
    except Exception as e:
        print(f"Failed with {m}: {e}")
