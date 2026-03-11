"""
Quick local smoke-test — runs without starting the HTTP server.
Tests the full pipeline end-to-end.

Usage:
    python test_server.py
"""

import json
import os
import sys

# Ensure GROQ_API_KEY is set before importing ran_crew
from dotenv import load_dotenv
load_dotenv()

if not os.getenv("GROQ_API_KEY"):
    print("WARNING: GROQ_API_KEY not set – testing fallback path only")


def test_fallback():
    print("\n=== Testing fallback pipeline ===")
    from fallbacks import build_fallback_result
    result = build_fallback_result("prepare the network for 50,000 fans at the stadium tonight")
    print(json.dumps(result, indent=2))
    assert "intent" in result
    assert "config" in result
    assert "monitor" in result
    assert "optimization" in result
    assert result["intent"]["slice_type"] == "eMBB"
    print("\n✓ Fallback pipeline OK")


def test_full_pipeline():
    if not os.getenv("GROQ_API_KEY"):
        print("\nSkipping full pipeline test (no GROQ_API_KEY)")
        return

    print("\n=== Testing full CrewAI pipeline ===")
    from ran_crew import run_pipeline
    result = run_pipeline("prepare the network for 50,000 fans at the stadium tonight")
    print(json.dumps(result, indent=2))
    assert "intent" in result
    assert "config" in result
    assert "monitor" in result
    assert "optimization" in result
    print("\n✓ Full pipeline OK")


def test_flask_app():
    print("\n=== Testing Flask app (no HTTP) ===")
    # Temporarily patch run_pipeline to avoid needing Groq
    import server
    import ran_crew as rc

    _original = rc.run_pipeline

    def _mock(intent):
        from fallbacks import build_fallback_result
        return build_fallback_result(intent)

    rc.run_pipeline = _mock

    with server.app.test_client() as client:
        # Health check
        resp = client.get("/health")
        assert resp.status_code == 200, resp.data
        data = resp.get_json()
        print("Health:", data)

        # Intent endpoint
        resp = client.post(
            "/api/intent",
            json={"intent": "deploy IoT sensors for smart metering across the city"},
            content_type="application/json",
        )
        assert resp.status_code == 200, resp.data
        data = resp.get_json()
        assert data["success"] is True
        print("Intent result keys:", list(data["result"].keys()))
        print("\n✓ Flask app OK")

    rc.run_pipeline = _original


if __name__ == "__main__":
    try:
        test_fallback()
        test_flask_app()
        test_full_pipeline()
        print("\n=== All tests passed ===\n")
    except AssertionError as exc:
        print(f"\nTEST FAILED: {exc}")
        sys.exit(1)
