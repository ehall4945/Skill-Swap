from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Rating(models.Model):
    # user = the person being rated
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ratings_received",
    )

    # reviewer = the logged-in user giving the rating
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ratings_given",
        null=True,
        blank=True,
    )

    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ]
    )

    # Reusing the old "name" column as review text to avoid unnecessary DB churn.
    name = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rating"
        verbose_name_plural = "Ratings"
        unique_together = ("user", "reviewer")
        ordering = ["-updated_at"]

    def __str__(self):
        reviewer_label = getattr(self.reviewer, "email", "Unknown reviewer")
        rated_label = getattr(self.user, "email", "Unknown user")
        return f"{reviewer_label} rated {rated_label}: {self.rating}/5"