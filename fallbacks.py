"""
Rule-based fallback responses used when the LLM agents fail.
These ensure the frontend always receives a valid, well-formed response.
"""

import random
from datetime import datetime, timezone


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Keyword → intent mapping
# ---------------------------------------------------------------------------

_INTENT_RULES = [
    (["stadium", "concert", "festival", "fan", "match", "game", "event", "crowd"],
     "stadium_event", "eMBB", "video", "high", 50_000, 200, 20),
    (["emergency", "ambulance", "hospital", "fire", "police", "critical", "life"],
     "emergency", "URLLC", "mixed", "critical", 500, 50, 5),
    (["iot", "sensor", "meter", "device", "smart", "agriculture", "machine"],
     "iot_deployment", "mMTC", "iot", "normal", 100_000, 10, 100),
    (["factory", "robot", "manufacturing", "industrial", "automation"],
     "industrial_iot", "URLLC", "data", "high", 5_000, 50, 10),
    (["4k", "video", "stream", "broadcast", "hd", "uhd", "netflix"],
     "video_streaming", "eMBB", "video", "high", 10_000, 500, 15),
    (["voice", "call", "voip", "phone"],
     "voice_priority", "URLLC", "voice", "high", 20_000, 20, 10),
]

_DEFAULT = ("general_optimization", "eMBB", "mixed", "normal", 1_000, 100, 20)


def build_fallback_intent(user_intent: str) -> dict:
    text = user_intent.lower()
    intent_type, slice_type, application, priority, users, bw, lat = _DEFAULT

    for keywords, it, st, app, pri, u, b, l in _INTENT_RULES:
        if any(kw in text for kw in keywords):
            intent_type, slice_type, application, priority, users, bw, lat = it, st, app, pri, u, b, l
            break

    return {
        "intent_type": intent_type,
        "slice_type": slice_type,
        "confidence": 0.72,
        "entities": {
            "expected_users": users,
            "application": application,
            "priority": priority,
            "bandwidth_mbps": bw,
            "latency_target_ms": lat,
            "location_hint": "network-wide",
        },
        "raw_intent": user_intent,
        "parsed_successfully": True,
        "llm_powered": False,
        "agent": "Rule-based Fallback Parser",
    }


# ---------------------------------------------------------------------------
# Config fallback
# ---------------------------------------------------------------------------

_SLICE_CONFIGS = {
    "eMBB": {
        "sst": 1, "bw": 500, "lat": 20, "pri": 5,
        "5qi": 9, "arp": 8, "dl": 1000, "ul": 200, "pdb": 100, "per": "1e-6",
        "num": 2, "sched": "max_throughput", "mimo": "8x8", "ca": True, "mmimo": True, "cells": 12,
    },
    "URLLC": {
        "sst": 2, "bw": 100, "lat": 5, "pri": 1,
        "5qi": 82, "arp": 1, "dl": 200, "ul": 100, "pdb": 10, "per": "1e-5",
        "num": 3, "sched": "proportional_fair", "mimo": "4x4", "ca": False, "mmimo": False, "cells": 8,
    },
    "mMTC": {
        "sst": 3, "bw": 50, "lat": 100, "pri": 8,
        "5qi": 79, "arp": 11, "dl": 10, "ul": 5, "pdb": 50, "per": "1e-4",
        "num": 0, "sched": "round_robin", "mimo": "2x2", "ca": False, "mmimo": False, "cells": 20,
    },
}


def build_fallback_config(intent: dict) -> dict:
    slice_type = intent.get("slice_type", "eMBB")
    c = _SLICE_CONFIGS.get(slice_type, _SLICE_CONFIGS["eMBB"])
    entities = intent.get("entities", {})

    return {
        "network_slice": {
            "name": f"{slice_type} Network Slice ({intent.get('intent_type', 'General')})",
            "type": slice_type,
            "sst": c["sst"],
            "allocated_bandwidth_mbps": entities.get("bandwidth_mbps", c["bw"]),
            "latency_target_ms": entities.get("latency_target_ms", c["lat"]),
            "priority": c["pri"],
        },
        "qos_parameters": {
            "5qi": c["5qi"],
            "arp_priority": c["arp"],
            "max_bitrate_dl_mbps": c["dl"],
            "max_bitrate_ul_mbps": c["ul"],
            "packet_delay_budget_ms": c["pdb"],
            "packet_error_rate": c["per"],
        },
        "ran_configuration": {
            "numerology": c["num"],
            "scheduler": c["sched"],
            "mimo_layers": c["mimo"],
            "carrier_aggregation": c["ca"],
            "massive_mimo": c["mmimo"],
            "active_cells": c["cells"],
        },
        "3gpp_release": "Release 18 (5G-Advanced)",
        "generated_by": "Rule-based Fallback Planner",
    }


# ---------------------------------------------------------------------------
# Monitor fallback
# ---------------------------------------------------------------------------

def build_fallback_monitor() -> dict:
    tp = round(random.uniform(80, 450), 2)
    lat = round(random.uniform(5, 45), 2)
    pkt = round(random.uniform(0.01, 3.0), 3)
    util = round(random.uniform(0.35, 0.92), 3)

    violations = []
    score = 100

    if tp < 50:
        violations.append({"metric": "throughput_mbps", "severity": "critical", "value": tp, "threshold": 50})
        score -= 25
    elif tp < 100:
        violations.append({"metric": "throughput_mbps", "severity": "warning", "value": tp, "threshold": 100})
        score -= 10

    if lat > 50:
        violations.append({"metric": "latency_ms", "severity": "critical", "value": lat, "threshold": 50})
        score -= 25
    elif lat > 30:
        violations.append({"metric": "latency_ms", "severity": "warning", "value": lat, "threshold": 30})
        score -= 10

    if pkt > 2.0:
        violations.append({"metric": "packet_loss_percent", "severity": "critical", "value": pkt, "threshold": 2.0})
        score -= 25
    elif pkt > 0.5:
        violations.append({"metric": "packet_loss_percent", "severity": "warning", "value": pkt, "threshold": 0.5})
        score -= 10

    score = max(0, score)

    if score >= 80:
        status = "healthy"
    elif score >= 55:
        status = "warning"
    else:
        status = "critical"

    return {
        "timestamp": _now(),
        "overall_status": status,
        "health_score": score,
        "metrics": {
            "throughput_mbps": tp,
            "latency_ms": lat,
            "packet_loss_percent": pkt,
            "cell_load_percent": round(util * 100, 1),
            "cell_type": random.choice(["Macro", "Micro", "Pico", "Femto"]),
            "cell_id": random.randint(1, 49),
            "snr_db": round(random.uniform(8, 32), 1),
            "bandwidth_mhz": random.choice([20, 40, 80, 100]),
        },
        "violations": violations,
        "requires_action": score < 70 or any(v["severity"] == "critical" for v in violations),
        "monitored_by": "Rule-based Fallback Monitor",
    }


# ---------------------------------------------------------------------------
# Optimizer fallback
# ---------------------------------------------------------------------------

def build_fallback_optimization(monitor: dict) -> dict:
    metrics = monitor.get("metrics", {})
    cell_load = metrics.get("cell_load_percent", 65.0)
    tp = metrics.get("throughput_mbps", 150.0)
    lat = metrics.get("latency_ms", 20.0)
    pkt = metrics.get("packet_loss_percent", 0.5)

    # Select action
    if cell_load > 80:
        action = "scale_bandwidth"
        desc = "Scaled allocated bandwidth by 40% and redistributed load across adjacent cells."
    elif lat > 30 or pkt > 0.5:
        action = "modify_qos"
        desc = "Applied URLLC-grade QoS policies to reduce latency and packet loss."
    elif tp < 100:
        action = "activate_cell"
        desc = "Activated 3 additional small cells to boost coverage and throughput."
    else:
        action = "energy_saving"
        desc = "Network is healthy. Enabled energy-saving mode on underutilised cells."

    # Simulate before / after
    before = {
        "throughput_mbps": tp,
        "latency_ms": lat,
        "packet_loss_percent": pkt,
        "cell_load_percent": cell_load,
    }

    if action == "energy_saving":
        after = {
            "throughput_mbps": round(tp * random.uniform(0.95, 1.02), 2),
            "latency_ms": round(lat * random.uniform(0.98, 1.05), 2),
            "packet_loss_percent": round(pkt * random.uniform(0.96, 1.02), 3),
            "cell_load_percent": round(cell_load * random.uniform(0.88, 0.95), 1),
        }
    else:
        after = {
            "throughput_mbps": round(tp * random.uniform(1.15, 1.55), 2),
            "latency_ms": round(lat * random.uniform(0.55, 0.85), 2),
            "packet_loss_percent": round(pkt * random.uniform(0.30, 0.70), 3),
            "cell_load_percent": round(cell_load * random.uniform(0.60, 0.80), 1),
        }

    def _change(b_val, a_val, lower_is_better=False):
        if b_val == 0:
            return {"change_percent": 0.0, "improved": True}
        pct = round(((a_val - b_val) / b_val) * 100, 2)
        improved = (pct < 0) if lower_is_better else (pct > 0)
        return {"change_percent": abs(pct), "improved": improved}

    return {
        "action": action,
        "action_description": desc,
        "success": True,
        "timestamp": _now(),
        "execution_details": {
            "before": before,
            "after": after,
            "improvements": {
                "throughput": _change(before["throughput_mbps"], after["throughput_mbps"]),
                "latency": _change(before["latency_ms"], after["latency_ms"], lower_is_better=True),
                "packet_loss": _change(before["packet_loss_percent"], after["packet_loss_percent"], lower_is_better=True),
                "cell_load": _change(before["cell_load_percent"], after["cell_load_percent"], lower_is_better=True),
            },
        },
        "optimized_by": "Rule-based Fallback Optimizer",
    }


# ---------------------------------------------------------------------------
# Combined helper
# ---------------------------------------------------------------------------

def build_fallback_result(user_intent: str) -> dict:
    intent = build_fallback_intent(user_intent)
    config = build_fallback_config(intent)
    monitor = build_fallback_monitor()
    optimization = build_fallback_optimization(monitor)
    return {
        "intent": intent,
        "config": config,
        "monitor": monitor,
        "optimization": optimization,
        "fallback": True,
    }
