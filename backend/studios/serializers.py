from rest_framework import serializers

from classes.models import Class, ClassInstance
from utils.validators import validate_postal_code, validate_lat, validate_long
from .models import Studio, StudioImage, Amenity


class ClassInstanceSerializer(serializers.ModelSerializer):
    user_enrolled = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    capacity = serializers.SerializerMethodField()

    def get_user_enrolled(self, obj):
        return self.context.get("user_enrolled")

    def get_class_name(self, obj):
        return obj.parent.name

    def get_capacity(self, obj):
        return obj.parent.capacity

    class Meta:
        model = ClassInstance
        fields = "__all__"


class StudioImageSerializer(serializers.ModelSerializer):
    path = serializers.SerializerMethodField()

    class Meta:
        model = StudioImage
        fields = ["path"]

    def get_path(self, obj):
        return obj.image.url


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ["type", "quantity"]


class ClassSerializer(serializers.ModelSerializer):
    user_enrolled = serializers.SerializerMethodField()
    schedule = serializers.SerializerMethodField()
    studio = serializers.SerializerMethodField()
    keywords = serializers.SerializerMethodField()

    def get_user_enrolled(self, obj):
        return self.context.get("user_enrolled")

    def get_schedule(self, obj):
        return [rule.to_text() for rule in obj.schedule.rrules]

    def get_studio(self, obj):
        return obj.studio.name

    def get_keywords(self, obj):
        return [keyword.name for keyword in obj.keywords.all()]

    class Meta:
        model = Class
        fields = "__all__"


class StudioSerializer(serializers.ModelSerializer):
    images = StudioImageSerializer(many=True)
    classes = ClassSerializer(many=True, )
    directions = serializers.SerializerMethodField()
    amenities = AmenitySerializer(many=True)

    class Meta:
        model = Studio
        fields = ["id", "name", "address", "postal_code", "lat", "long", "phone_num",
                  "images", "directions", "classes", "amenities"]

    def get_directions(self, obj):
        return "https://www.google.com/maps/place/{},{}/".format(obj.lat, obj.long)

    def get_fields(self):
        fields = super().get_fields()

        exclude_fields = self.context.get("exclude_fields", [])
        for field in exclude_fields:
            fields.pop(field, default=None)

        return fields


class LocationSerializer(serializers.Serializer):
    lat = serializers.DecimalField(max_digits=9, decimal_places=6, required=False,
                                   allow_null=True, validators=[validate_lat])
    long = serializers.DecimalField(max_digits=9, decimal_places=6, required=False,
                                    allow_null=True, validators=[validate_long])
    postal_code = serializers.CharField(max_length=7, required=False,
                                        allow_blank=True, validators=[validate_postal_code])

    def validate(self, data):
        if ("lat" in data and "long" in data) or "postal_code" in data:
            pass
        else:
            raise serializers.ValidationError("At least one location format is required (lat/long, or postal code)")
        return data

    def create(self, validated_data):
        pass

    def update(self, instance, validated_data):
        pass
