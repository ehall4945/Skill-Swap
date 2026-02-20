from django.contrib import admin
from .models import Profile
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):

    list_display = ('user', 'headline', 'experience_level', 'location')
    search_fields = ('user__username', 'headline')


