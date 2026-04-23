from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Assuming your teammates named their viewset ProfileViewSet
from .views import ProfileViewSet, PublicProfileViewSet 

router = DefaultRouter()
router.register(r'', ProfileViewSet, basename='profile')
public_profile_detail = PublicProfileViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    path('public/<int:user_id>/', public_profile_detail, name='public-profile-detail'),
    path('', include(router.urls)),
]
