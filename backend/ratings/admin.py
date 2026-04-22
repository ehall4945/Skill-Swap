from django.contrib import admin
from .models import Rating

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('user', 'rating', 'name', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__email', 'name')