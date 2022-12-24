from django.contrib import admin

from classes.models import Class
from .models import Studio, Amenity, StudioImage


# Register your models here.
class AmenityInline(admin.TabularInline):
    model = Amenity
    extra = 0


class StudioImageInline(admin.TabularInline):
    model = StudioImage
    extra = 0


class ClassInline(admin.StackedInline):
    model = Class
    extra = 0
    fields = ("name", "description", "capacity", "enrolled", "start_time", "end_time", "schedule", "coach")
    readonly_fields = ("enrolled",)
    show_change_link = True


class StudioAdmin(admin.ModelAdmin):
    fields = ["name", "phone_num", "address", "postal_code", "lat", "long"]
    inlines = [StudioImageInline, AmenityInline, ClassInline]
    save_as = True

admin.site.register(Studio, StudioAdmin)