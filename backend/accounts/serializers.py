from rest_framework import serializers
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField()
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ("full_name", "email", "password")

    def create(self, validated_data):
        data = {}
        full_name = validated_data.pop("full_name")
        if len(full_name.split()) > 0:
            data["first_name"] = full_name.split()[0]
            data["last_name"] = full_name.split()[-1]
        data = {**validated_data, **data}
        user = CustomUser.objects.create_user(**data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class BasicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("full_name", "email")
