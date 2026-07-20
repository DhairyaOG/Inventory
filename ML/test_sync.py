import sys
import logging
logging.basicConfig(level=logging.DEBUG)

print("Starting import...")
from rag_pipeline import sync_data

print("Invoking sync_data...")
try:
    ans = sync_data()
    print("Answer:", ans)
except Exception as e:
    import traceback
    traceback.print_exc()
print("Done")
