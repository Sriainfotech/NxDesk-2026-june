from rest_framework import serializers
from .models import Role, Permission, RolePermission,UserRole
from django.contrib.auth.models import Permission
from .models import RolePermission


class RoleSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(
        read_only=True, slug_field='username'
    )
    modified_by = serializers.SlugRelatedField(
        read_only=True, slug_field='username'
    )
    class Meta:
        model = Role
        fields = ['role_id', 'name', 'is_active', 'created_at', 'modified_at', 'created_by', 'modified_by']
    def validate_name(self, value):

        normalized_name = value.strip().lower()

        if Role.objects.filter(name__iexact=normalized_name).exists():

            raise serializers.ValidationError("A role with this name already exists.")

        return normalized_name
 

class PermissionSerializer(serializers.ModelSerializer):
    # NOTE: `Permission` here resolves to django.contrib.auth.models.Permission
    # (the "from django.contrib.auth.models import Permission" import above
    # shadows the earlier "from .models import ... Permission" import), not
    # this app's own roles_creation.models.Permission that HasRolePermission
    # actually checks against. Django's built-in Permission model also has
    # no created_by/modified_by fields, so those two declared fields below
    # crash with AttributeError the moment this serializer is actually used.
    # Pre-existing bug, kept as-is (not something the __all__ -> explicit
    # fields change below should silently paper over) - worth a real fix to
    # confirm which Permission model this endpoint is supposed to manage.
    created_by = serializers.SlugRelatedField(
        read_only=True, slug_field='username'
    )
    modified_by = serializers.SlugRelatedField(
        read_only=True, slug_field='username'
    )
    class Meta:
        model = Permission
        fields = ['id', 'name', 'content_type', 'codename', 'created_by', 'modified_by']



class RolePermissionSerializer(serializers.ModelSerializer):
    permission = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(), many=True, required=False
    )

    class Meta:
        model = RolePermission
        fields = ["role", "permission"]

    def validate_permission(self, value):
        """
        Handle the 'all' keyword in the request and ensure proper IDs.
        """
        request = self.context.get("request")
        if request:
            raw_permission_data = request.data.get("permission", [])

            if isinstance(raw_permission_data, list) and "all" in raw_permission_data:
                return Permission.objects.all()

        return value

    def create(self, validated_data):
        # Pop permission data
        permission_data = validated_data.pop("permission", [])

        # Extract IDs from Permission instances if needed
        permission_ids = [
            perm.pk if isinstance(perm, Permission) else int(perm)
            for perm in permission_data
        ]

        # Create the RolePermission instance
        instance = RolePermission.objects.create(**validated_data)

        # Set permissions using IDs
        instance.permission.set(permission_ids)

        return instance

    def to_representation(self, instance):
        """
        Display role name and permission names in response.
        """
        rep = super().to_representation(instance)
        rep["role"] = instance.role.name
        rep["permission"] = list(instance.permission.values_list("name", flat=True))
        return rep




class UserRoleSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(
        read_only=True, slug_field='username'
    )
    modified_by = serializers.SlugRelatedField(
        read_only=True, slug_field='username'
    )
    class Meta:
        model = UserRole
        fields = [
            'user_role_id', 'user', 'role', 'is_active', 'assigned_at',
            'created_at', 'modified_at', 'created_by', 'modified_by',
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["user"] = instance.user.username
        representation["role"] = instance.role.name
        return representation
