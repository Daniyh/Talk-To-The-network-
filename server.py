"""
RAN Optimization Dashboard - Flask Backend
Multi-Agent AI Pipeline using CrewAI + Groq (Llama 3.3 70B)

Agents:
  1. Intent Parser  - Parses natural language into structured network intent
  2. RAN Planner    - Generates 3GPP Release 18 network configuration
  3. Network Monitor- Reads live CSV data and assesses KPI health
  4. RAN Optimizer  - Selects best corrective action and measures improvement
"""

import os
import json
import logging
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

app = Flask(__name__)

# Allow requests from Vercel frontend and local dev
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://react-ran-optimization.vercel.app",
            "http://localhost:3000",
            "http://localhost:3001",
            "*"
        ]
    }
})


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    groq_key_set = bool(os.getenv("GROQ_API_KEY"))
    return jsonify({
        "status": "ok",
        "service": "RAN Optimizer Backend (CrewAI)",
        "groq_configured": groq_key_set,
        "model": "llama-3.3-70b-versatile",
        "agents": ["Intent Parser", "RAN Planner", "Network Monitor", "RAN Optimizer"]
    })


# ---------------------------------------------------------------------------
# Main intent endpoint
# ---------------------------------------------------------------------------

@app.route("/api/intent", methods=["POST"])
def handle_intent():
    data = request.get_json(silent=True)
    if not data or "intent" not in data:
        return jsonify({"success": False, "error": "Missing 'intent' field in request body"}), 400

    user_intent = str(data["intent"]).strip()
    if not user_intent:
        return jsonify({"success": False, "error": "Intent cannot be empty"}), 400

    log.info("Received intent: %s", user_intent[:120])

    try:
        from ran_crew import run_pipeline
        result = run_pipeline(user_intent)
        log.info("Pipeline completed successfully")
        return jsonify({"success": True, "result": result})

    except Exception as exc:
        log.error("Pipeline error: %s", exc)
        traceback.print_exc()

        # Return fallback so the frontend still renders something useful
        from fallbacks import build_fallback_result
        fallback = build_fallback_result(user_intent)
        return jsonify({
            "success": True,
            "result": fallback,
            "warning": f"AI agents encountered an error ({type(exc).__name__}). Showing rule-based fallback."
        })


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    debug = os.environ.get("FLASK_ENV", "production") == "development"
    log.info("Starting RAN Optimizer backend on port %d (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)
