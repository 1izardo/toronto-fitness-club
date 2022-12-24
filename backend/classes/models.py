import datetime

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Max, Q
from recurrence.fields import RecurrenceField


# Create your models here.
class Class(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    studio = models.ForeignKey("studios.Studio", related_name="classes", on_delete=models.CASCADE)
    coach = models.CharField(max_length=255)  # TODO: Consider linking this to account
    capacity = models.PositiveIntegerField()
    enrolled = models.PositiveIntegerField(default=0)
    start_time = models.TimeField(help_text="""
        <details>
        <summary>Specify when the class will <em>start</em> on scheduled days. Format: 'HH:mm:ss'</summary>
        <br>
        <p>This starting time applies to all scheduled days, and must be before the end time.</p>
        <p>If you would like to specify an additional recurring timeslot, you must create another class for this studio.</p>
        </details>
    """)
    end_time = models.TimeField(help_text="""
        <details>
        <summary>Specify when the class will <em>end</em> on scheduled days. Format: 'HH:mm:ss'</summary>
        <br>
        <p>This ending time applies to all scheduled days, and must be after the start time.</p>
        <p>If you would like to specify an additional recurring timeslot, you must create another class for this studio.</p>
        </details>
    """)
    schedule = RecurrenceField(help_text="""
        <details>
        <summary>Specify which day(s) this class will occur on.</summary>
        <p>You can add a rule for reoccurrences as well as exceptions to those rules by clicking "Add rule".</p>
        <p>You can also schedule or skip individual dates by clicking "Add date".</p>
        </details>
    """)

    class Meta:
        verbose_name_plural = "classes"

    def clean(self):
        if self.start_time is not None and self.end_time is not None:
            if self.start_time >= self.end_time:
                raise ValidationError({"end_time": "End time is not after start time"})

    def save(self, *args, **kwargs):
        if self.pk is None:
            # Class is being created, not updated, so we don't have to worry about field changes
            super(Class, self).save(*args, **kwargs)
            return

        obj = Class.objects.get(pk=self.pk)
        if self.schedule == obj.schedule and self.start_time == obj.start_time and self.end_time == obj.end_time:
            # Class hasn't had its scheduling changed, so no need to check recurrence rules
            super(Class, self).save(*args, **kwargs)
            return

        # RECURRENCE RULE VALIDATION
        if furthest_date := self.instances.aggregate(Max("date"))["date__max"]:
            # There are existing instances, and we need to make sure they all match the new recurrence rule
            # Get a list of possible occurrences according to the recurrence rule
            occurrences = self.schedule.between(
                datetime.datetime.now(),
                datetime.datetime.combine(furthest_date, datetime.time(0)) + datetime.timedelta(days=1)
            )
            # All instances that are not "special", haven't been cancelled, and haven't started yet, MUST
            # have a date that is found in occurrences
            instances = self.instances.filter(
                Q(
                    Q(date=datetime.date.today()) & Q(start_time__gt=datetime.datetime.now().time()) |
                    Q(date__gt=datetime.date.today())
                )
                & Q(special=False) & Q(cancelled=False)
            )
            for instance in instances:
                if datetime.datetime.combine(instance.date, datetime.time(0)) not in occurrences:
                    # Instance date is no longer valid according to recurrence rules
                    print("WARNING: Instance `{}` cancelled, since its date does not match the new parent schedule."
                          .format(instance))
                    instance.cancelled = True
                else:
                    # The date is valid, but we need to make sure the times match as well
                    if instance.start_time != self.start_time:
                        print("WARNING: Instance `{}` start time adjusted to match the new parent start time."
                              .format(instance))
                        instance.start_time = self.start_time
                    if instance.end_time != self.end_time:
                        print("WARNING: Instance `{}` end time adjusted to match the new parent end time."
                              .format(instance))
                        instance.end_time = self.end_time
                instance.save()
            super(Class, self).save(*args, **kwargs)

    def __str__(self):
        return "{} (at {})".format(self.name, self.studio.name)


class ClassInstance(models.Model):
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    # An instance will be "cancelled" if recurrence rules have changed
    # so that this date/time is no longer valid
    cancelled = models.BooleanField(default=False)
    # A "special" instance will not be modified or cancelled
    # when the date/time/recurrence rules of the parent are changed
    special = models.BooleanField(default=True)

    # Note: we can calculate the number of students enrolled in this instance as follows:
    #   enrolled = parent.enrolled_users - self.dropped_users + self.enrolled_users
    # This equality will be maintained as people enroll and drop this instance and the parent class
    enrolled = models.PositiveIntegerField(default=0)
    parent = models.ForeignKey("Class", related_name="instances", on_delete=models.CASCADE)

    # RELATED FIELDS IN OTHER MODELS
    # enrolled_users = set of users that have enrolled in this particular instance
    # dropped_users = set of users that were enrolled (through parent), but have dropped this particular instance

    def save(self, *args, **kwargs):
        if self.pk and not self.special:
            # We know self.pk is not none (so we are saving an existing instance),
            # and the instance being saved is not "special"
            # Editing a non-special instance should make it special, and also add an
            # exception to the recurrence rule
            obj = ClassInstance.objects.get(pk=self.pk)

            # First, check if date or times have been edited
            if (self.date != obj.date) \
                    or (self.start_time != obj.start_time and self.start_time != self.parent.start_time) \
                    or (self.end_time != obj.end_time and self.end_time != self.parent.end_time):
                # Set instance to special
                print("WARNING: User is rescheduling a non-special class instance. "
                      "The instance will be set to special.")
                self.special = True
            if self.date != obj.date or self.cancelled != obj.cancelled:
                # We need to make an exception for the previous date of the instance, since we have
                # rescheduled this instance
                print("WARNING: The instance date has changed or the instance is being cancelled, so an exception "
                      "will be added to the parent schedule.")
                self.parent.schedule.exdates.append(datetime.datetime.combine(
                    self.date, datetime.time(0)
                ))
        super(ClassInstance, self).save(*args, **kwargs)
        self.parent.save()

    def __str__(self):
        return "{}, from {} to {}".format(self.date,
                                          self.start_time.strftime("%H:%M"),
                                          self.end_time.strftime("%H:%M")
                                          )


class Keyword(models.Model):
    name = models.CharField(max_length=255)
    related_class = models.ForeignKey("Class", on_delete=models.CASCADE, related_name="keywords")
