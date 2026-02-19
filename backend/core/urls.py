"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def home_view(request):
    return JsonResponse({"status": "Skill-Swap Backend is Online"})

def test_api(request):
    return JsonResponse({"message": "Hello from Django! SkillSwap is ready."})

def home_redirect(request):
    # Redirect to React frontend login page
    return redirect('http://localhost:3000/login')

def login_view(request):
    return JsonResponse({"message": "Login endpoint — use POST with username & password"})
    
urlpatterns = [
    path('', home_redirect),
    path('admin/', admin.site.urls),
    path('api/test/', test_api),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
