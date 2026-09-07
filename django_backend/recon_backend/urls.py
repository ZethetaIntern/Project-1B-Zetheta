from django.urls import path
from reconciliation import views

urlpatterns = [
    path('api/reconcile/', views.execute_reconciliation, name='reconcile'),
    path('api/audit/<str:exception_id>/', views.get_audit_trail, name='audit_trail'),
    path('api/exceptions/<str:exception_id>/resolve/', views.resolve_exception, name='resolve_exception'),
]
