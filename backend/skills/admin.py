from django.contrib import admin
from .models import Skill, SwapRequest

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'skill_type', 'category', 'created_at')
    list_filter = ('skill_type', 'category')
    search_fields = ('title', 'description')

@admin.register(SwapRequest)
class SwapRequestAdmin(admin.ModelAdmin):
    # This makes the admin list much more readable
    list_display = ('skill', 'sender', 'receiver', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('skill__title', 'sender__username', 'receiver__username')