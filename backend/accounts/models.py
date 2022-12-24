# References:
# - https://dev.to/joshwizzy/customizing-django-authentication-using-abstractbaseuser-llg

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from utils.validators import validate_phone_number, validate_card_num, validate_expiry, validate_cvv


class AccountManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class Account(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=255, unique=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)
    phone_num = models.CharField("Phone number", max_length=15, blank=True, validators=[validate_phone_number])
    subscription = models.ForeignKey("Subscription", on_delete=models.SET_NULL, null=True, blank=True)
    next_payment = models.ForeignKey("Payment", related_name="+", on_delete=models.SET_NULL, null=True, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Classes that user has enrolled in for all future occurrences
    classes = models.ManyToManyField("classes.Class", related_name="enrolled_users")
    # Classes that user has enrolled in for only specific occurrences
    enrolled_instances = models.ManyToManyField("classes.ClassInstance", related_name="enrolled_users")
    # Specific instances of classes in the "classes" field that user has dropped
    dropped_instances = models.ManyToManyField("classes.ClassInstance", related_name="dropped_users")

    objects = AccountManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # Note: email and password are still required

    class Meta:
        verbose_name = "User"

    def get_full_name(self):
        return "{}".format(self.email)

    def __str__(self):
        return self.email


class Subscription(models.Model):
    billing_cycle = models.CharField(max_length=7, choices=(
        ("YEARLY", "yearly"),
        ("MONTHLY", "monthly"),
    ), default="monthly")
    charge = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return "${}, {}".format(self.charge, self.get_billing_cycle_display())


class PaymentInfo(models.Model):
    card_num = models.CharField("Card number", max_length=16, validators=[validate_card_num])
    expiry = models.CharField(max_length=5, validators=[validate_expiry])
    cvv = models.CharField("CVV", max_length=3, validators=[validate_cvv])
    account = models.OneToOneField("Account", related_name="payment_info", on_delete=models.CASCADE)

    def __str__(self):
        return "X" * 8 + self.card_num[:4]


class Payment(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    # We don't use ForeignKey to PaymentInfo, since that would prevent deletion of a payment method
    payment_info = models.CharField(max_length=16)
    date = models.DateTimeField()
    completed = models.BooleanField(default=False)
    cancelled = models.BooleanField(default=False)
    account = models.ForeignKey("Account", related_name="payments", on_delete=models.CASCADE)

    def __str__(self):
        return "${} - {} - {}".format(self.amount, self.account, self.date)
