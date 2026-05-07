from django.urls import path
from .views import RatingListCreateView, UserRatingsView

urlpatterns = [
    path("", RatingListCreateView.as_view(), name="rating-list-create"),
    path("user/<int:user_id>/", UserRatingsView.as_view(), name="user-ratings"),
]