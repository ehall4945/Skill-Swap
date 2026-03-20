from django.urls import path
from .views import SkillListCreateView

urlpatterns = [
    # This maps 'api/skills/' directly to your new Class-Based View
    path('', SkillListCreateView.as_view(), name='skill-list-create'),
]