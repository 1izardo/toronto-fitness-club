import datetime

from django.contrib import admin
from django.db.models import Q, TextField
from django.forms import BaseInlineFormSet, Textarea, ValidationError, ModelForm

from classes.models import Class, ClassInstance, Keyword


# Register your models here.

# NEW CLASS CREATION

# Empty formset, so we don't display existing class instances when creating a new one
class ClassInstanceFormSet(BaseInlineFormSet):
    model = ClassInstance

    def get_queryset(self):
        return ClassInstance.objects.none()


# Custom class instance form for field validation
class ClassInstanceForm(ModelForm):
    class Meta:
        model = ClassInstance
        fields = ("date", "start_time", "end_time", "special")

    def clean(self):
        for field in self.fields.keys():
            if field not in self.cleaned_data:
                return

        # Check if end time is after start time
        if self.cleaned_data["start_time"] >= self.cleaned_data["end_time"]:
            raise ValidationError({"end_time": "End time is not after start time"})

        # Check if class is in the past
        if datetime.datetime.combine(self.cleaned_data["date"], self.cleaned_data["end_time"]) < \
                datetime.datetime.now():
            raise ValidationError("Instance cannot occur in the past.")

        # Validation only for non-special instances
        if not self.cleaned_data["special"]:
            # Check if there is already an existing non-special class on this date
            if self.cleaned_data["parent"].instances.filter(
                    date=self.cleaned_data["date"], cancelled=False, special=False).exists():
                raise ValidationError({"date": "A non-special class instance already exists on this date. "
                                               "Duplicate classes must be marked as special."})

            # Check if the instance matches occurrence rules
            occurrences = list(self.cleaned_data["parent"].schedule.between(
                datetime.datetime.combine(self.cleaned_data["date"], datetime.time(0)),
                datetime.datetime.combine(self.cleaned_data["date"], datetime.time(23, 59, 59)),
                inc=True
            ))
            if len(occurrences) == 0:
                # Does not fall on scheduled day
                raise ValidationError(
                    {"date": "Instance does not match the schedule of the parent class. "
                             "Mark the instance as special to proceed with this date."})

            # Check if start and end time match parent's
            if self.cleaned_data["start_time"] != self.cleaned_data["parent"].start_time:
                raise ValidationError({"start_time": "Start time does not match that of the parent class. "
                                                     "Mark the instance as special to proceed with this start time."})
            if self.cleaned_data["end_time"] != self.cleaned_data["parent"].end_time:
                raise ValidationError({"end_time": "End time does not match that of the parent class. "
                                                   "Mark the instance as special to proceed with this end time."})


# Form for creating a new class instance
class ClassInstanceInline(admin.StackedInline):
    model = ClassInstance
    extra = 0
    formset = ClassInstanceFormSet
    form = ClassInstanceForm
    verbose_name_plural = "Manually create class instances"
    template = "admin/create_class_instance_inline.html"


# LIST ALREADY CREATED CLASSES

# Queryset for special instances
class SpecialInstanceFormSet(BaseInlineFormSet):

    def get_queryset(self):
        qs = super(SpecialInstanceFormSet, self).get_queryset()
        return qs.filter(
            Q(
                Q(date=datetime.date.today()) & Q(end_time__gte=datetime.datetime.now().time()) |
                Q(date__gt=datetime.date.today())
            ) & Q(special=True) & Q(cancelled=False)
        ).order_by("date", "start_time")


class SpecialInstanceInline(admin.StackedInline):
    fields = ("date", "start_time", "end_time", "cancelled")
    model = ClassInstance
    extra = 0
    max_num = 0
    formset = SpecialInstanceFormSet
    verbose_name_plural = "Special instances"
    classes = ("collapse",)


# Queryset for non-special instances
class NonSpecialInstanceFormSet(BaseInlineFormSet):

    def get_queryset(self):
        qs = super(NonSpecialInstanceFormSet, self).get_queryset()
        return qs.filter(
            Q(
                Q(date=datetime.date.today()) & Q(end_time__gte=datetime.datetime.now().time()) |
                Q(date__gt=datetime.date.today())
            ) & Q(special=False) & Q(cancelled=False)
        ).order_by("date", "start_time")


class NonSpecialInstanceInline(admin.StackedInline):
    fieldsets = (
        (None, {
            "fields": ("date", "start_time", "end_time", "cancelled"),
            "description": "Note: Editing a non-special instance will make it special, and an exception may be added "
                           "in the parent to prevent duplicate dates. This will allow you to reschedule an existing "
                           "instance."
        }),
    )
    model = ClassInstance
    extra = 0
    max_num = 0
    formset = NonSpecialInstanceFormSet
    verbose_name_plural = "Non-special instances"
    classes = ("collapse",)


# Queryset for past and cancelled instances
class CancelledPastInstanceFormSet(BaseInlineFormSet):

    def get_queryset(self):
        qs = super(CancelledPastInstanceFormSet, self).get_queryset()
        return qs.filter(
            Q(date=datetime.date.today()) & Q(end_time__lt=datetime.datetime.now().time()) |
            Q(date__lt=datetime.date.today()) |
            Q(cancelled=True)
        ).order_by("-date", "-end_time")


class CancelledPastInstanceInline(admin.TabularInline):
    fieldsets = (
        (None, {
            "fields": ("date", "start_time", "end_time", "special", "cancelled")
        }),
    )
    model = ClassInstance
    extra = 0
    max_num = 0
    formset = CancelledPastInstanceFormSet
    readonly_fields = ("date", "start_time", "end_time", "special", "cancelled")
    verbose_name_plural = "Past and cancelled instances"
    classes = ("collapse",)


class KeywordInline(admin.TabularInline):
    model = Keyword
    extra = 0


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    inlines = [KeywordInline, ClassInstanceInline, SpecialInstanceInline, NonSpecialInstanceInline,
               CancelledPastInstanceInline]
    formfield_overrides = {
        TextField: {"widget": Textarea(attrs={"rows": 5, "cols": 38})}
    }
    readonly_fields = ("enrolled",)
    save_as = True
