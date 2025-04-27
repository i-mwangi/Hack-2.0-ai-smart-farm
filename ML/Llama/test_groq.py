# test_groq.py
import os
import time
from dotenv import load_dotenv
from langchain_groq import ChatGroq

# Load environment variables from .env file in the current directory
print("Loading environment variables...")
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY not found in environment variables.")
    print("Please ensure you have a .env file in the same directory with GROQ_API_KEY=your-key")
    exit()

def test_groq():
    print("Testing Groq API connection...")
    # Use a fast model for a quick connection test
    test_model = "llama3-8b-8192" 
    print(f"Using model: {test_model}")
    
    try:
        llm = ChatGroq(
            model=test_model, 
            temperature=0.2 # Low temp for predictable response
        )
        
        messages = [
            {"role": "system", "content": "You are a test assistant."},
            {"role": "user", "content": "Respond with only the word: pong"}
        ]
        
        print("Sending simple request to Groq...")
        start = time.time()
        response = llm.invoke(messages)
        duration = time.time() - start
        print(f"Request successful in {duration:.2f} seconds.")
        print(f"Response content: {response.content}")
        
        if "pong" in response.content.lower():
            print("\n*** Groq API connection test PASSED! ***")
        else:
            print("\n*** Groq API connection test WARNING: Received response, but content was unexpected. ***")
            
        return True
    except Exception as e:
        print(f"\n*** Groq API connection test FAILED! ***")
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_groq() 