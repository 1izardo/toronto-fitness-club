from rest_framework import serializers

from .models import Account, Subscription, PaymentInfo, Payment


class PaymentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInfo
        fields = ["card_num", "expiry", "cvv"]

    def update(self, instance, validated_data):
        pass

    def create(self, validated_data):
        pass


class AccountSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(required=False)
    card_num = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = ["id", "email", "password", "first_name", "last_name", "avatar",
                  "phone_num", "new_password", "card_num"]

    def get_card_num(self, instance):
        try:
            PaymentInfo.objects.get(account=instance)
            return "X" * 8 + PaymentInfo.objects.get(account=instance).card_num[:4]
        except PaymentInfo.DoesNotExist:
            return ""

    def create(self, validated_data):
        user = super(AccountSerializer, self).create(validated_data)
        user.set_password(validated_data.get("password"))
        user.save()
        return user

    def update(self, instance, validated_data):
        instance.email = validated_data.get("email", instance.email)
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.avatar = validated_data.get("avatar", instance.avatar)
        instance.phone_num = validated_data.get("phone_num", instance.phone_num)
        if "new_password" in validated_data:
            instance.set_password(validated_data.get("new_password"))
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    model = Account
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def update(self, instance, validated_data):
        pass

    def create(self, validated_data):
        pass


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["id", "billing_cycle", "charge"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["amount", "date", "payment_info", "completed", "cancelled"]
