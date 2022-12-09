from django.contrib import admin
from django.contrib.auth.models import Group

from .models import Account, Subscription, Payment, PaymentInfo

# Register your models here.
admin.site.unregister(Group)


class PaymentInfoInline(admin.TabularInline):
    model = PaymentInfo
    extra = 1


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    inlines = [PaymentInfoInline]


admin.site.register(Subscription)
admin.site.register(Payment)
