from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import SwapRequest


class IsRequestParticipant(BasePermission):
    message = "Only the sender or receiver can access this swap request."

    def has_object_permission(self, request, view, obj):
        user = request.user
        is_sender = obj.sender_id == user.id
        is_receiver = obj.receiver_id == user.id

        if not (is_sender or is_receiver):
            self.message = "Only the sender or receiver can access this swap request."
            return False

        if request.method in SAFE_METHODS:
            return True

        if request.method == "DELETE":
            if is_sender:
                return True
            self.message = "Only the sender can withdraw or delete this request."
            return False

        if request.method in {"PUT", "PATCH"}:
            requested_status = request.data.get("status")

            if requested_status in {
                SwapRequest.STATUS_ACCEPTED,
                SwapRequest.STATUS_REJECTED,
            }:
                if is_receiver:
                    return True
                self.message = "Only the receiver can accept or reject this request."
                return False

            if requested_status == SwapRequest.STATUS_WITHDRAWN:
                if is_sender:
                    return True
                self.message = "Only the sender can withdraw or delete this request."
                return False

            return True

        return False
