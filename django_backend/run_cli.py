#!/usr/bin/env python3
"""
CLI runner for Multi-Bank Reconciliation Engine.
Outputs execution summary and full reconciliation JSON to stdout.
"""

import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from reconciliation.pipeline import ReconciliationPipeline

def main():
    sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../sample_data"))
    pipeline = ReconciliationPipeline(data_dir=sample_dir)
    results = pipeline.run_pipeline()
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
