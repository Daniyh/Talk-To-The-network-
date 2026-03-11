"""
Custom CrewAI tool for reading live KPI rows from the 6G HetNet dataset.
Requires the dataset to have a Location_Tag column for location-aware queries.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Type

import pandas as pd
from pydantic import BaseModel, Field

try:
    from crewai.tools import BaseTool as _BaseTool
except ImportError:
    class _BaseTool:  # type: ignore
        name: str = ""
        description: str = ""
        args_schema = None
        def _run(self, **_): return ""

log = logging.getLogger(__name__)

_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
_CSV_NAME = "6G_HetNet_with_location.csv"
_CSV_PATH = os.path.join(_DATA_DIR, _CSV_NAME)

REQUIRED_COLUMNS = [
    "Cell_ID", "Cell_Type", "Achieved_Throughput_Mbps", "Network_Latency_ms",
    "Resource_Utilization", "Packet_Loss_Ratio", "Signal_to_Noise_Ratio_dB",
    "Bandwidth_MHz", "Location_X", "Location_Y", "Location_Tag",
]

VALID_TAGS = {"hospital", "stadium", "factory", "downtown", "residential"}

_df: Optional[pd.DataFrame] = None


def _load_df() -> pd.DataFrame:
    global _df
    if _df is not None:
        return _df

    if not os.path.exists(_CSV_PATH):
        raise FileNotFoundError(
            f"Dataset not found at {_CSV_PATH}. Run download_dataset.py first."
        )

    df = pd.read_csv(_CSV_PATH)

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            f"Dataset is missing required columns: {missing}. "
            f"Required columns are: {REQUIRED_COLUMNS}"
        )

    _df = df
    log.info("Loaded dataset: %d rows, all required columns present.", len(_df))
    return _df


def _safe_float(value, default: float) -> float:
    try:
        return round(float(value), 3)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# Pydantic schema
# ---------------------------------------------------------------------------

class CSVToolInput(BaseModel):
    query: str = Field(
        default="random",
        description=(
            "Type of data to read: 'random' for any cell, "
            "'high_load' for a congested cell, 'healthy' for a well-performing cell."
        )
    )
    location: str = Field(
        default="",
        description=(
            "Filter cells by location tag. Must be one of: "
            "hospital, stadium, factory, downtown, residential. "
            "Leave empty to query across all locations."
        )
    )


# ---------------------------------------------------------------------------
# Tool
# ---------------------------------------------------------------------------

class NetworkDataReaderTool(_BaseTool):
    name: str = "NetworkDataReader"
    description: str = (
        "Reads real-time network KPI data from the 6G HetNet dataset. "
        "Returns a single cell's metrics: throughput, latency, packet loss, "
        "resource utilisation, SNR, cell type, and location tag. "
        "Use query='random'/'high_load'/'healthy' to filter by performance. "
        "Use location='hospital'/'stadium'/'factory'/'downtown'/'residential' "
        "to filter cells by network zone. Both parameters can be combined."
    )
    args_schema: Type[BaseModel] = CSVToolInput

    def _run(self, query: str = "random", location: str = "") -> str:
        try:
            df = _load_df()
        except (FileNotFoundError, ValueError) as exc:
            return f"ERROR: {exc}"

        return self._read_from_df(df, query, location.strip().lower())

    def _read_from_df(self, df: pd.DataFrame, query: str, location: str) -> str:
        try:
            subset = df.copy()

            # Filter by location tag
            if location:
                if location not in VALID_TAGS:
                    return (
                        f"ERROR: Invalid location '{location}'. "
                        f"Valid options are: {sorted(VALID_TAGS)}"
                    )
                subset = subset[subset["Location_Tag"].str.lower() == location]
                if len(subset) == 0:
                    return f"ERROR: No cells found with Location_Tag='{location}'."

            # Filter by performance
            q = query.lower().strip()
            if q == "high_load":
                filtered = subset[subset["Resource_Utilization"] > 0.75]
                subset = filtered if len(filtered) > 0 else subset
            elif q == "healthy":
                filtered = subset[subset["Resource_Utilization"] < 0.5]
                subset = filtered if len(filtered) > 0 else subset

            row = subset.sample(1).iloc[0]

            packet_loss_raw = _safe_float(row.get("Packet_Loss_Ratio", 0.01), 0.01)
            packet_loss_pct = round(packet_loss_raw * 100, 4)

            resource_raw = _safe_float(row.get("Resource_Utilization", 0.65), 0.65)
            resource_util = resource_raw / 100.0 if resource_raw > 1.0 else resource_raw

            return str({
                "source": "6G_HetNet_dataset",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "cell_id": int(row.get("Cell_ID", 0)),
                "cell_type": str(row.get("Cell_Type", "Macro")),
                "location_tag": str(row.get("Location_Tag", "")),
                "throughput_mbps": _safe_float(row.get("Achieved_Throughput_Mbps", 150.0), 150.0),
                "latency_ms": _safe_float(row.get("Network_Latency_ms", 15.0), 15.0),
                "packet_loss_percent": packet_loss_pct,
                "resource_utilization": resource_util,
                "snr_db": _safe_float(row.get("Signal_to_Noise_Ratio_dB", 20.0), 20.0),
                "bandwidth_mhz": _safe_float(row.get("Bandwidth_MHz", 100.0), 100.0),
                "location_x": _safe_float(row.get("Location_X", 0.0), 0.0),
                "location_y": _safe_float(row.get("Location_Y", 0.0), 0.0),
            })

        except Exception as exc:
            log.error("Error reading CSV row: %s", exc)
            return f"ERROR: Failed to read dataset row: {exc}"
