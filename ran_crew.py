"""
CrewAI multi-agent pipeline for 5.5G / 5G-Advanced RAN optimization.

Pipeline (sequential):
    Agent 1 – Intent Parser       : NL → structured intent JSON
    Agent 2 – RAN Planner         : intent → 3GPP R18 config JSON
    Agent 3 – Safety Validator    : config + intent → safety verdict JSON
    Agent 4 – Network Monitor     : CSV tool → KPI health JSON
    Agent 5 – RAN Optimizer       : all context → optimisation result JSON
"""

import json
import logging
import os
import re
from datetime import datetime, timezone
from crewai import Agent, Task

from csv_tool import NetworkDataReaderTool
from fallbacks import (
    build_fallback_config,
    build_fallback_intent,
    build_fallback_monitor,
    build_fallback_optimization,
    build_fallback_safety,
)

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_llm():
    """Return a Groq LLM instance via CrewAI's built-in LiteLLM adapter."""
    from crewai import LLM  # lazy import

    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY environment variable is not set. "
            "Add it to your .env file or Railway environment variables."
        )
    return LLM(
        model="groq/llama-3.3-70b-versatile",
        api_key=api_key,
        temperature=0.15,        # low temperature for structured JSON output
        max_tokens=2048,
    )


def _extract_json(text: str) -> dict:
    """
    Robustly extract the first valid JSON object from an agent's raw output.
    Handles markdown fences, extra prose, and partial wrapping.
    """
    if not text:
        return {}

    # 1. Try direct parse
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # 2. Strip markdown code fences
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if fenced:
        try:
            return json.loads(fenced.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 3. Find the outermost { … } block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = text[start: end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    log.warning("Could not extract JSON from agent output (len=%d)", len(text))
    return {}


def _infer_location(text: str) -> str:
    """Map keywords in the user's intent to a dataset Location_Tag."""
    t = text.lower()
    if any(w in t for w in ["hospital", "clinic", "emergency", "ambulance", "medical"]):
        return "hospital"
    if any(w in t for w in ["stadium", "concert", "festival", "match", "arena", "fans"]):
        return "stadium"
    if any(w in t for w in ["factory", "manufacturing", "industrial", "robots", "robotics"]):
        return "factory"
    if any(w in t for w in ["downtown", "city center", "cbd", "urban core"]):
        return "downtown"
    if any(w in t for w in ["residential", "suburb", "home", "neighbourhood"]):
        return "residential"
    return ""   # no location filter — sample from whole network


def _task_raw(task) -> str:
    """Safely get the raw string output from a completed task."""
    try:
        if task.output:
            return task.output.raw or ""
    except AttributeError:
        pass
    return ""


# ---------------------------------------------------------------------------
# Agent & Task builders
# ---------------------------------------------------------------------------

def _build_intent_agent(llm) -> "Agent":
    return Agent(
        role="5G Network Intent Analyst",
        goal=(
            "Parse operator's natural language network intent into a precise, "
            "structured JSON document that downstream agents can act on."
        ),
        backstory=(
            "You are a senior telecommunications engineer and 3GPP standards expert "
            "with 20 years of experience in 5G RAN planning. You specialise in network "
            "slicing (eMBB / URLLC / mMTC), QoS flow mapping, and translating "
            "real-world operational needs into actionable technical parameters."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )


def _build_intent_task(agent, user_intent: str):
    return Task(
        description=f"""
You are given the following operator intent:

    INTENT: "{user_intent}"

Analyse it carefully and return ONLY a single valid JSON object. No prose before or after it.

Required JSON structure:
{{
    "intent_type": "<stadium_event | emergency | iot_deployment | general_optimization | voice_priority | video_streaming | industrial_iot | smart_city>",
    "slice_type": "<eMBB | URLLC | mMTC>",
    "confidence": <float 0.0–1.0>,
    "entities": {{
        "expected_users": <integer>,
        "application": "<voice | video | data | iot | mixed>",
        "priority": "<critical | high | normal | low>",
        "bandwidth_mbps": <integer>,
        "latency_target_ms": <integer>,
        "location_hint": "<descriptive string>"
    }},
    "raw_intent": "{user_intent}",
    "parsed_successfully": true,
    "llm_powered": true,
    "agent": "Intent Parser Agent (CrewAI + Groq Llama 3.3 70B)"
}}

Selection guidelines:
- Concert / stadium / festival / sports event → intent_type=stadium_event, slice_type=eMBB
- Ambulance / hospital / emergency services → intent_type=emergency, slice_type=URLLC, priority=critical
- Smart meters / sensors / agriculture IoT → intent_type=iot_deployment, slice_type=mMTC
- Factory / manufacturing / robotics → intent_type=industrial_iot, slice_type=URLLC
- Video streaming / 4K / broadcast → intent_type=video_streaming, slice_type=eMBB
- Default when unclear → intent_type=general_optimization, slice_type=eMBB
- Be realistic about expected_users (stadium ≈ 50 000, small venue ≈ 5 000, IoT ≈ 100 000 devices)
""",
        agent=agent,
        expected_output="A single valid JSON object with the parsed network intent.",
    )


def _build_planner_agent(llm):
    return Agent(
        role="5G-Advanced RAN Configuration Planner",
        goal=(
            "Generate a complete, 3GPP Release 18 compliant RAN configuration "
            "that satisfies the detected intent and maximises network performance."
        ),
        backstory=(
            "You are a principal RAN architect at a Tier-1 mobile operator. "
            "You design 5G-Advanced (3GPP Release 18) networks including network slicing, "
            "Massive MIMO, carrier aggregation, and QoS flow management. "
            "Your configurations are deployed in 40+ commercial networks worldwide."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )


def _build_planner_task(agent, intent_task):
    return Task(
        description="""
Using the intent parsed by the previous agent, generate a complete 3GPP Release 18
RAN configuration. Return ONLY a single valid JSON object. No prose before or after it.

Required JSON structure:
{
    "network_slice": {
        "name": "<descriptive slice name>",
        "type": "<eMBB | URLLC | mMTC>",
        "sst": <1=eMBB | 2=URLLC | 3=mMTC>,
        "allocated_bandwidth_mbps": <integer>,
        "latency_target_ms": <integer>,
        "priority": <integer 1–9, 1 = highest>
    },
    "qos_parameters": {
        "5qi": <integer — see guidelines below>,
        "arp_priority": <integer 1–15>,
        "max_bitrate_dl_mbps": <integer>,
        "max_bitrate_ul_mbps": <integer>,
        "packet_delay_budget_ms": <integer>,
        "packet_error_rate": "<scientific notation e.g. 1e-5>"
    },
    "ran_configuration": {
        "numerology": <0–4, higher = shorter slot = lower latency>,
        "scheduler": "<round_robin | proportional_fair | max_throughput>",
        "mimo_layers": "<2x2 | 4x4 | 8x8>",
        "carrier_aggregation": <true | false>,
        "massive_mimo": <true | false>,
        "active_cells": <integer>
    },
    "3gpp_release": "Release 18 (5G-Advanced)",
    "generated_by": "RAN Planner Agent (CrewAI + Groq Llama 3.3 70B)"
}

5QI guidelines:
- eMBB video/data: 5QI=9 (GBR, 100ms PDB)
- Voice: 5QI=1 (GBR, 100ms PDB)
- URLLC / emergency: 5QI=82 (Non-GBR, 10ms PDB)
- mMTC / IoT: 5QI=79 (Non-GBR, 50ms PDB)

Numerology: eMBB → 1 or 2; URLLC → 3 or 4; mMTC → 0 or 1
MIMO: high-density eMBB → 8x8 Massive MIMO; URLLC → 4x4; mMTC → 2x2
""",
        agent=agent,
        expected_output="A single valid JSON object with the full 3GPP R18 network configuration.",
        context=[intent_task],
    )


def _build_safety_agent(llm):
    return Agent(
        role="RAN Configuration Safety Validator",
        goal=(
            "Validate the generated RAN configuration against hard network limits "
            "and 3GPP feasibility constraints before it reaches the network."
        ),
        backstory=(
            "You are a senior network safety engineer at a Tier-1 mobile operator. "
            "You are the last line of defence before any configuration reaches live infrastructure. "
            "You enforce hard limits on bandwidth, latency feasibility per slice type, cell capacity, "
            "and QoS parameter consistency. You have blocked dozens of misconfigured deployments "
            "that would have caused outages."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )


def _build_safety_task(agent, intent_task, planner_task):
    return Task(
        description="""
Review the operator intent and the generated RAN configuration from the previous agents.
Validate the configuration against the hard limits below. Return ONLY a single valid JSON object.

Hard limits to check (perform ALL four checks):

1. BANDWIDTH LIMIT
   - allocated_bandwidth_mbps must be ≤ 1000 Mbps per slice
   - If exceeded: check fails, verdict = rejected

2. LATENCY FEASIBILITY
   - URLLC slice: latency_target_ms must be ≤ 10 ms
   - eMBB  slice: latency_target_ms must be ≤ 100 ms
   - mMTC  slice: latency_target_ms must be ≤ 300 ms
   - If exceeded: check fails, verdict = rejected

3. CAPACITY CHECK
   - Estimated capacity = active_cells × 1000 concurrent users per cell
   - If expected_users > capacity: check fails, verdict = approved_with_warnings (not rejected)

4. QOS CONSISTENCY
   - eMBB  → 5QI should be in [7, 8, 9]
   - URLLC → 5QI should be in [1, 2, 82, 83]
   - mMTC  → 5QI should be in [70, 79]
   - If mismatch: check fails, verdict = approved_with_warnings (not rejected)

Verdict rules:
  - All checks pass                        → "approved"
  - Any bandwidth or latency check fails   → "rejected"
  - Only capacity or QoS check fails       → "approved_with_warnings"

Required JSON structure:
{
    "verdict": "<approved | approved_with_warnings | rejected>",
    "checks": [
        {"name": "bandwidth_limit",    "passed": <bool>, "detail": "<one sentence>"},
        {"name": "latency_feasibility","passed": <bool>, "detail": "<one sentence>"},
        {"name": "capacity_check",     "passed": <bool>, "detail": "<one sentence>"},
        {"name": "qos_consistency",    "passed": <bool>, "detail": "<one sentence>"}
    ],
    "warnings": ["<warning string if any>"],
    "rejection_reason": "<string if rejected, else null>",
    "validated_by": "Config Safety Validator Agent (CrewAI + Groq Llama 3.3 70B)"
}
""",
        agent=agent,
        expected_output="A single valid JSON object with the safety validation verdict.",
        context=[intent_task, planner_task],
    )


def _build_monitor_agent(llm, csv_tool):
    return Agent(
        role="Real-time RAN Health Monitor",
        goal=(
            "Read live KPI data from the 6G HetNet dataset and produce an accurate "
            "network health assessment with violation detection and scoring."
        ),
        backstory=(
            "You are a NOC (Network Operations Centre) lead engineer with expertise in "
            "real-time 5G RAN performance monitoring. You analyse KPI streams, detect "
            "threshold violations, and generate health scores that guide optimisation decisions. "
            "You always base your assessment on real measured data, never on estimates."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
        tools=[csv_tool],
        max_iter=4,
    )


def _build_monitor_task(agent, intent_task, location_hint: str = ""):
    location_instruction = (
        f'Use location="{location_hint}" to filter cells to the relevant network zone.'
        if location_hint else
        "Leave location empty to sample from all network zones."
    )
    description = (
        "Use the NetworkDataReader tool to read current live network KPI data from the dataset,\n"
        "then assess network health. Return ONLY a single valid JSON object. No prose before or after it.\n\n"
        "Location context: " + location_instruction + "\n\n"
        "Steps:\n"
        '1. Call NetworkDataReader with query="random" and the location parameter above to get a representative sample.\n'
        "2. Evaluate each metric against the thresholds below.\n"
        "3. Compute health_score (0-100).\n\n"
        "KPI thresholds:\n"
        "  Throughput   : CRITICAL < 50 Mbps   | WARNING < 100 Mbps\n"
        "  Latency      : CRITICAL > 50 ms     | WARNING  > 30 ms\n"
        "  Packet Loss  : CRITICAL > 2 %       | WARNING  > 0.5 %\n"
        "  Resource Util: CRITICAL > 90 %      | WARNING  > 75 %\n\n"
        "Health score formula (start at 100, subtract penalties):\n"
        "  Each CRITICAL violation -> -25 pts\n"
        "  Each WARNING  violation -> -10 pts\n\n"
        'Required JSON structure:\n'
        '{\n'
        '    "timestamp": "<ISO 8601 UTC timestamp>",\n'
        '    "overall_status": "<healthy | warning | critical>",\n'
        '    "health_score": <integer 0-100>,\n'
        '    "metrics": {\n'
        '        "throughput_mbps": <float>,\n'
        '        "latency_ms": <float>,\n'
        '        "packet_loss_percent": <float>,\n'
        '        "cell_load_percent": <float resource_utilization * 100>,\n'
        '        "cell_type": "<Macro | Micro | Pico | Femto>",\n'
        '        "cell_id": <integer>,\n'
        '        "snr_db": <float>,\n'
        '        "bandwidth_mhz": <float>,\n'
        '        "location_tag": "<hospital | stadium | factory | downtown | residential>"\n'
        '    },\n'
        '    "violations": [\n'
        '        {"metric": "<name>", "severity": "<critical|warning>", "value": <float>, "threshold": <float>}\n'
        '    ],\n'
        '    "requires_action": <true | false>,\n'
        '    "monitored_by": "Network Monitor Agent (CrewAI + Groq Llama 3.3 70B)"\n'
        '}\n\n'
        "Set requires_action=true if health_score < 70 or any CRITICAL violation exists."
    )
    return Task(
        description=description,
        agent=agent,
        expected_output="A single valid JSON object with the current network health assessment.",
        context=[intent_task],
    )


def _build_optimizer_agent(llm, csv_tool):
    return Agent(
        role="RAN Performance Optimizer",
        goal=(
            "Select the optimal corrective network action, execute it, and quantify "
            "the KPI improvement using before/after measurements from the live dataset."
        ),
        backstory=(
            "You are a senior SON (Self-Organising Networks) engineer specialising in "
            "dynamic RAN resource management. You combine network health assessments with "
            "operator intent to select the most effective optimisation strategy. "
            "You always measure KPIs before and after to demonstrate concrete improvement."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
        tools=[csv_tool],
        max_iter=4,
    )


def _build_optimizer_task(agent, intent_task, planner_task, monitor_task):
    return Task(
        description="""
Review the operator intent, planned RAN configuration, and current network health
from the previous agents. Select the best optimisation action and quantify its impact.

Steps:
1. Pick the most appropriate action from the table below based on network health.
2. Call NetworkDataReader with query="random" to get a BEFORE state (use the monitor's
   values if the tool is unavailable).
3. Call NetworkDataReader again with query="healthy" to simulate the AFTER state
   (represents post-optimisation improvement).
4. Calculate improvement percentages:
     change_percent = ((after - before) / before) * 100   (positive = improvement)
   Note: for latency and packet_loss, a negative change_percent means improvement.

Action selection table:
  - cell_load_percent > 80 or throughput low   → "scale_bandwidth"
  - cell_load_percent > 80                     → "activate_cell"
  - latency or packet_loss violations          → "modify_qos"
  - slice_type mismatch or wrong priority      → "adjust_priority"
  - all metrics healthy (health_score > 85)    → "energy_saving"

Return ONLY a single valid JSON object. No prose before or after it.

Required JSON structure:
{
    "action": "<scale_bandwidth | activate_cell | adjust_priority | modify_qos | energy_saving>",
    "action_description": "<1-2 sentence human-readable explanation>",
    "success": true,
    "timestamp": "<ISO 8601 UTC timestamp>",
    "execution_details": {
        "before": {
            "throughput_mbps": <float>,
            "latency_ms": <float>,
            "packet_loss_percent": <float>,
            "cell_load_percent": <float>
        },
        "after": {
            "throughput_mbps": <float>,
            "latency_ms": <float>,
            "packet_loss_percent": <float>,
            "cell_load_percent": <float>
        },
        "improvements": {
            "throughput":    {"change_percent": <float>, "improved": <bool>},
            "latency":       {"change_percent": <float>, "improved": <bool>},
            "packet_loss":   {"change_percent": <float>, "improved": <bool>},
            "cell_load":     {"change_percent": <float>, "improved": <bool>}
        }
    },
    "optimized_by": "RAN Optimizer Agent (CrewAI + Groq Llama 3.3 70B)"
}
""",
        agent=agent,
        expected_output="A single valid JSON object with the optimisation action and measured improvements.",
        context=[intent_task, planner_task, monitor_task],
    )


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def run_pipeline(user_intent: str) -> dict:
    """
    Run the 4-agent CrewAI pipeline and return a dict with:
      intent, config, monitor, optimization
    """
    from crewai import Crew, Process  # lazy import

    llm = _get_llm()
    csv_tool = NetworkDataReaderTool()

    # Infer location_hint from user intent text for location-aware cell filtering
    location_hint = _infer_location(user_intent)
    log.info("Inferred location_hint: '%s'", location_hint)

    # Build agents
    intent_agent    = _build_intent_agent(llm)
    planner_agent   = _build_planner_agent(llm)
    safety_agent    = _build_safety_agent(llm)
    monitor_agent   = _build_monitor_agent(llm, csv_tool)
    optimizer_agent = _build_optimizer_agent(llm, csv_tool)

    # Build tasks
    intent_task    = _build_intent_task(intent_agent, user_intent)
    planner_task   = _build_planner_task(planner_agent, intent_task)
    safety_task    = _build_safety_task(safety_agent, intent_task, planner_task)
    monitor_task   = _build_monitor_task(monitor_agent, intent_task, location_hint)
    optimizer_task = _build_optimizer_task(
        optimizer_agent, intent_task, planner_task, monitor_task
    )

    # Assemble crew (sequential: intent → planner → safety → monitor → optimizer)
    crew = Crew(
        agents=[intent_agent, planner_agent, safety_agent, monitor_agent, optimizer_agent],
        tasks=[intent_task, planner_task, safety_task, monitor_task, optimizer_task],
        process=Process.sequential,
        verbose=True,
    )

    log.info("Kicking off CrewAI pipeline for intent: %s", user_intent[:80])
    crew_result = crew.kickoff()

    # --------------- Extract individual task outputs --------------------- #
    # CrewAI ≥ 0.70 exposes result.tasks_output (list of TaskOutput objects)
    intent_data = config_data = safety_data = monitor_data = optimizer_data = None

    try:
        outputs = crew_result.tasks_output  # list[TaskOutput]
        if outputs and len(outputs) >= 5:
            intent_data    = _extract_json(outputs[0].raw)
            config_data    = _extract_json(outputs[1].raw)
            safety_data    = _extract_json(outputs[2].raw)
            monitor_data   = _extract_json(outputs[3].raw)
            optimizer_data = _extract_json(outputs[4].raw)
    except AttributeError:
        pass

    # Fallback: try crew.tasks[i].output.raw (older CrewAI API)
    if not intent_data:
        try:
            intent_data    = _extract_json(_task_raw(crew.tasks[0]))
            config_data    = _extract_json(_task_raw(crew.tasks[1]))
            safety_data    = _extract_json(_task_raw(crew.tasks[2]))
            monitor_data   = _extract_json(_task_raw(crew.tasks[3]))
            optimizer_data = _extract_json(_task_raw(crew.tasks[4]))
        except Exception as exc:
            log.warning("Could not read task outputs via crew.tasks: %s", exc)

    # Apply fallbacks for any missing piece
    resolved_intent = intent_data or build_fallback_intent(user_intent)
    resolved_config = config_data or build_fallback_config(resolved_intent)
    return {
        "intent":       resolved_intent,
        "config":       resolved_config,
        "safety":       safety_data or build_fallback_safety(resolved_config, resolved_intent),
        "monitor":      monitor_data or build_fallback_monitor(),
        "optimization": optimizer_data or build_fallback_optimization(monitor_data or {}),
    }
