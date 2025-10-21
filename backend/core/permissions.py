from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    """
    Custom permission to only allow staff users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff
        )


class IsStaffOrReadOnly(BasePermission):
    """
    Custom permission to allow staff users to perform any action,
    but allow read-only access for non-staff users.
    """
    def has_permission(self, request, view):
        # Allow read-only access for all users
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Allow full access for staff users
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff
        )
