from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from groq import Groq
import os
import base64
import logging
import time

app = Flask(__name__)

# Enable CORS globally for all routes during development
CORS(app) # Allow all origins by default

# Set up basic logging if not already configured elsewhere
if not app.debug:
    # In production, you might want more sophisticated logging
    logging.basicConfig(level=logging.INFO)

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq client with API key
client = Groq(api_key=GROQ_API_KEY)
languages = {
    'en': 'English',
    'sw': 'swahili',
    
}

llm = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    temperature=0.7
)

# Updated system prompt with language instruction
def get_system_prompt(lang='en'):
    base_prompt = """You are an expert in kenyan agriculture with deep knowledge of:
- Traditional and modern farming practices across different regions
- Major crops and their cultivation patterns
- Agricultural policies and government initiatives
- Challenges faced by kenyan farmers
- Sustainable farming practices in the kenyan context
- Agricultural seasons (short and long rains)
- Irrigation systems and water management
- Soil types and crop suitability

Only provide information related to kenyan agriculture. If a question is outside this domain, 
politely redirect the conversation to kenyan agriculture topics.

Example exchanges:
Q: What crops are grown in mwea?
A: mwea is known as rice basket of kenya, primarily growing:
-Rice (during long rains season)
- Maize (during short rains season)
- Tomatoes
- French beans
The state's well-developed irrigation system and fertile soil support these crops.

Q: How is cryptocurrency doing?
A: I specialize in kenyan agriculture topics. Instead, I can tell you about how digital 
payment systems are transforming kenyan agriculture through initiatives like e-NAM 
(Electronic National Agriculture Market) or discuss agricultural commodities trading.
"""
    lang_instruction = f"\nPlease provide all responses in {languages.get(lang, 'English')}."
    return base_prompt + lang_instruction

@app.route('/chat', methods=['POST'])
def chat():
    start_time = time.time()
    try:
        data = request.get_json()
        if not data:
             app.logger.warning("Received empty/invalid JSON data for /chat")
             return jsonify({"response": "Error: Invalid request data.", "status": "error_bad_request"}), 400

        user_query = data.get('query')
        lang = data.get('language', 'en')

        if not user_query:
            app.logger.warning("Missing 'query' field in /chat request")
            return jsonify({"response": "Error: Query is required.", "status": "error_missing_query"}), 400

        if lang not in languages:
            app.logger.warning(f"Unsupported language code '{lang}' received for /chat")
            return jsonify({"response": f"Error: Unsupported language code. Supported: {list(languages.keys())}", "status": "error_unsupported_language"}), 400

        # Combine system prompt with user query
        messages = [
            {"role": "system", "content": get_system_prompt(lang)},
            {"role": "user", "content": user_query}
        ]

        # --- Robust Error Handling Around Groq Call ---
        try:
            app.logger.info(f"Sending request to Groq API (model: {llm.model_name}) for query starting with: {user_query[:50]}...")
            response = llm.invoke(messages)
            app.logger.info("Received response from Groq API.")
            
            # Validate response content
            response_content = getattr(response, 'content', None)
            if not response_content:
                 app.logger.error("Groq response content was empty or missing.")
                 raise ValueError("Received empty response from language model.") 

            # Log success duration
            duration = time.time() - start_time
            app.logger.info(f"Groq request successful. Total processing time: {duration:.2f} seconds")
            
            # Success case
            return jsonify({
                "response": response_content,
                "language": languages[lang],
                "status": "success"
            })

        except Exception as groq_error:
            # Log error duration
            duration = time.time() - start_time
            app.logger.error(f"Error during llm.invoke. Total time before error: {duration:.2f} seconds. Error: {groq_error}", exc_info=True)
            
            # User-friendly fallback message
            fallback_message = "I'm sorry, I encountered an issue while trying to reach my knowledge base. Please try again shortly."
            
            # Return structured error response to frontend
            return jsonify({
                "response": fallback_message,
                "language": languages[lang], # Still indicate language context
                "status": "error_llm_api"
            }), 503 # 503 Service Unavailable is appropriate here

    except Exception as e:
        # Log unexpected error duration
        duration = time.time() - start_time
        app.logger.error(f"Unexpected error in /chat. Total time before error: {duration:.2f} seconds. Error: {e}", exc_info=True)
        return jsonify({
            "response": "An unexpected server error occurred. Please try again.",
            "status": "error_server_internal"
        }), 500

@app.route('/classify_plant_disease', methods=['POST'])
def classify_plant_disease():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    lang = request.form.get('language', 'en')  # Get language from form data
    
    if lang not in languages:
        return jsonify({"error": f"Unsupported language code. Supported codes are: {', '.join(languages.keys())}"}), 400
    
    image_file = request.files['image']
    image_data_url = f"data:image/jpeg;base64,{base64.b64encode(image_file.read()).decode()}"
    
    prompt = f"What plant disease is shown and what is its cure? (Please respond in {languages[lang]})"
    
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data_url
                        }
                    }
                ]
            }
        ],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=False,
        stop=None
    )

    # Get the result and return it as JSON
    result = completion.choices[0].message
    return jsonify({
        "diagnosis": result.content,
        "language": languages[lang],
        "status": "success"
    }), 200

if __name__ == '__main__':
    app.run(port=5001, debug=True) # Add port=5001 here

   
    