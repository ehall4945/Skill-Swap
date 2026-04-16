from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "actor", "target_type", "verb", "is_read", "created_at")
    list_filter = ("target_type", "is_read", "created_at")
    search_fields = ("recipient__email", "actor__email", "verb")
