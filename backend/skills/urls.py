from django.urls import path
from .views import SkillListCreateView, SkillDetailView, DismissedSkillCreateView

urlpatterns = [
    # This handles GET (list all) and POST (create new)
    path('', SkillListCreateView.as_view(), name='skill-list-create'),

    # This handles DELETE (remove specific)
    path('<int:pk>/', SkillDetailView.as_view(), name='skill-delete'),

    # This handles dismissing old swipes so they don't reappear on page refresh/reload
    path("dismissed-skills/", DismissedSkillCreateView.as_view(), name="dismissed-skills",
),
]
