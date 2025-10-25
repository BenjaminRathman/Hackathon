from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

# --- force-load .env from THIS folder and override anything else ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")

# override=True means values in .env replace existing env vars
load_dotenv(dotenv_path=env_path, override=True)

app = Flask(__name__)
CORS(app)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print("DEBUG USING ENV PATH:", env_path)
print("DEBUG OPENAI_API_KEY prefix:", (OPENAI_API_KEY or "")[:40])

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    image_base64 = data.get("image")

    if not OPENAI_API_KEY:
        return jsonify({"error": "Missing OPENAI_API_KEY on server"}), 500
    if not image_base64:
        return jsonify({"error": "No image data received"}), 400

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    # IMPORTANT CHANGE: use a current multimodal chat model
    payload = {
    "model": "gpt-4o",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Analyze this drawing or handwritten content. "
                        "Provide a summary of what you see and suggest 3-5 relevant web links "
                        "that would be helpful for learning more about the topics shown. "
                        "Format your response as JSON with \"summary\" and \"links\" fields."
                    )
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": image_base64
                    }
                }
            ]
        }
    ],
    "max_tokens": 1000
}


    openai_response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers,
        json=payload
    )

    # normalize error vs success
    if openai_response.status_code != 200:
        try:
            err_json = openai_response.json()
        except Exception:
            err_json = {"error": "Unknown error from OpenAI"}
        return jsonify({"error": err_json}), openai_response.status_code

    data_json = openai_response.json()

    try:
        content_text = data_json["choices"][0]["message"]["content"]
    except Exception:
        return jsonify({
            "error": "Unexpected response format from OpenAI",
            "raw": data_json
        }), 500

    return jsonify({
        "content": content_text
    }), 200

if __name__ == "__main__":
    app.run(port=5000)
