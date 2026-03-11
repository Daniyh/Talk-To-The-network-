"""
Downloads the 6G HetNet dataset from the GitHub repo into the data/ folder.
Run once before starting the server.

Usage:
    python download_dataset.py
"""

import os
import sys
import urllib.request

DATASET_URL = (
    "https://raw.githubusercontent.com/DAleid/React_RAN_optimization/"
    "master/public/data/6G_HetNet_with_location.csv"
)
OUT_DIR = os.path.join(os.path.dirname(__file__), "data")
OUT_FILE = os.path.join(OUT_DIR, "6G_HetNet_with_location.csv")


def download():
    os.makedirs(OUT_DIR, exist_ok=True)

    if os.path.exists(OUT_FILE):
        size = os.path.getsize(OUT_FILE)
        print(f"Dataset already present: {OUT_FILE}  ({size:,} bytes)")
        return

    print(f"Downloading dataset from:\n  {DATASET_URL}")
    try:
        urllib.request.urlretrieve(DATASET_URL, OUT_FILE)
        size = os.path.getsize(OUT_FILE)
        print(f"Saved to: {OUT_FILE}  ({size:,} bytes)")
    except Exception as exc:
        print(f"ERROR: {exc}")
        print("\nThe server will use synthetic data instead — no action needed.")
        sys.exit(0)


if __name__ == "__main__":
    download()
