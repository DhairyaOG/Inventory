import os
import logging
from dotenv import load_dotenv
load_dotenv()
from pymongo import MongoClient
import certifi
import chromadb
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from urllib.parse import quote_plus
from langchain_community.vectorstores import Chroma

logger = logging.getLogger(__name__)

# MongoDB Connection
MONGO_USERNAME = os.getenv("MONGO_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_CLUSTER  = os.getenv("MONGO_CLUSTER", "items.xws9ags.mongodb.net")
MONGO_APP_NAME = os.getenv("MONGO_APP_NAME", "Items")

if MONGO_USERNAME and MONGO_PASSWORD:
    MONGO_URI = (
        f"mongodb+srv://{quote_plus(MONGO_USERNAME)}:{quote_plus(MONGO_PASSWORD)}"
        f"@{MONGO_CLUSTER}/?appName={MONGO_APP_NAME}"
    )
else:
    MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client['restaurant_db']

# ChromaDB Setup
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")

def get_vectorstore():
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    embedding_function = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-2", 
        google_api_key=os.environ.get("GEMINI_API_KEY")
    )
    
    try:
        return Chroma(
            client=chroma_client,
            collection_name="restaurant_data",
            embedding_function=embedding_function,
        )
    except Exception as e:
        if "dimension" in str(e).lower():
            logger.warning("Dimension mismatch detected. Deleting old ChromaDB collection...")
            try:
                chroma_client.delete_collection("restaurant_data")
            except Exception:
                pass
            return Chroma(
                client=chroma_client,
                collection_name="restaurant_data",
                embedding_function=embedding_function,
            )
        raise e

def sync_data():
    """Fetches MongoDB data and updates ChromaDB"""
    logger.info("🔄 Syncing MongoDB to ChromaDB...")
    
    docs = []
    
    # 1. Fetch Inventory
    inventory = db.inventory.find()
    for item in inventory:
        text = f"Inventory Item: {item.get('name')}. We currently have {item.get('stock')} {item.get('unit', 'units')} in stock. The lead time to order more is {item.get('lead_time')} days."
        docs.append(Document(page_content=text, metadata={"source": "inventory", "item": item.get("name")}))
        
    # 2. Fetch Recent Sales (Grouped by Item to reduce embedding count)
    # This prevents hitting the 100 requests/minute Gemini API rate limit.
    pipeline = [
        {"$group": {
            "_id": "$item_name", 
            "total_sold_ever": {"$sum": "$qty_sold"},
            "sales_history": {"$push": {"date": "$date", "qty": "$qty_sold"}}
        }},
        {"$limit": 100}
    ]
    sales = db.sales.aggregate(pipeline)
    for sale in sales:
        item_name = sale['_id']
        total = sale['total_sold_ever']
        
        # Sort history and keep only recent 30 to avoid exceeding token limits
        history = sorted(sale['sales_history'], key=lambda x: x['date'], reverse=True)[:30]
        history_str = ", ".join([f"{h['date']}: {h['qty']}" for h in history])
        
        text = f"Sales Record for {item_name}: We have sold a lifetime total of {total} units. Recent daily sales: {history_str}."
        docs.append(Document(page_content=text, metadata={"source": "sales", "item": str(item_name)}))

    if not docs:
        logger.warning("No data found to sync.")
        return False
        
    # Fetch the client directly to delete
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        chroma_client.delete_collection("restaurant_data")
    except Exception:
        pass
        
    vectorstore = get_vectorstore()
    vectorstore.add_documents(docs)
    
    logger.info(f"✅ Synced {len(docs)} documents to ChromaDB.")
    return True

def ask_question(query, gemini_api_key):
    """Run a RAG query using Gemini"""
    if not gemini_api_key:
        return "Error: Gemini API Key is required to ask questions."
        
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        google_api_key=gemini_api_key,
        temperature=0.2
    )
    
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
    
    prompt_template = """
    You are Pantri AI, a helpful restaurant management assistant. 
    Use the following pieces of retrieved context from the restaurant's database to answer the manager's question. 
    If you don't know the answer based on the context, just say that you don't have that data in the database.
    Keep the answer concise, professional, and directly address the manager's concern.

    Context:
    {context}

    Question: {question}
    Answer:
    """
    PROMPT = PromptTemplate.from_template(prompt_template)
    
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)
        
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | PROMPT
        | llm
        | StrOutputParser()
    )
    
    try:
        result = rag_chain.invoke(query)
        return result
    except Exception as e:
        logger.error(f"RAG Error: {e}")
        return f"Sorry, I encountered an error while thinking: {str(e)}"
