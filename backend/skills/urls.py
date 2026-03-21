from django.urls import path
from .views import SkillListCreateView, SkillDetailView

urlpatterns = [
    # This handles GET (list all) and POST (create new)
    path('', SkillListCreateView.as_view(), name='skill-list-create'),

    # This handles DELETE (remove specific)
    path('<int:pk>/', SkillDetailView.as_view(), name='skill-delete'),
]
