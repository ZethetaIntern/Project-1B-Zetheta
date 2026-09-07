"""
API Views and Pipeline Endpoints for Django Reconciliation Backend.
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
from .pipeline import ReconciliationPipeline

@csrf_exempt
def execute_reconciliation(request):
    """
    Executes the multi-bank automated settlement reconciliation pipeline.
    """
    sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_data"))
    pipeline = ReconciliationPipeline(data_dir=sample_dir)
    results = pipeline.run_pipeline()
    return JsonResponse(results)

@csrf_exempt
def get_audit_trail(request, exception_id):
    """
    Retrieves deep 6-tier audit trail for a specific reconciliation exception.
    """
    sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_data"))
    pipeline = ReconciliationPipeline(data_dir=sample_dir)
    results = pipeline.run_pipeline()
    audit_trails = results.get("audit_trails", {})
    if exception_id in audit_trails:
        return JsonResponse(audit_trails[exception_id])
    return JsonResponse({"error": "Exception not found"}, status=404)

@csrf_exempt
def resolve_exception(request, exception_id):
    """
    Applies Maker-Checker workflow resolution to an exception.
    """
    if request.method == "POST":
        try:
            payload = json.loads(request.body.decode("utf-8"))
            action_type = payload.get("action_type", "MAKER") # MAKER or CHECKER
            sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_data"))
            pipeline = ReconciliationPipeline(data_dir=sample_dir)
            
            if action_type == "MAKER":
                trail = pipeline.audit_store.record_maker_action(
                    exception_id,
                    maker_user=payload.get("user", "analyst@enterprise.com"),
                    action=payload.get("action", "RESOLVE"),
                    justification=payload.get("justification", "Manual review verified")
                )
                return JsonResponse({"status": "PENDING_CHECKER", "trail": trail})
            else:
                trail = pipeline.audit_store.record_checker_signoff(
                    exception_id,
                    checker_user=payload.get("user", "checker@enterprise.com"),
                    approved=payload.get("approved", True),
                    comments=payload.get("comments", "Second level approval granted")
                )
                return JsonResponse({"status": "RESOLVED", "trail": trail})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)
