from django.contrib import admin
from .models import Skill

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'skill_type', 'category', 'created_at')
    list_filter = ('skill_type', 'category')
    search_fields = ('title', 'description')
