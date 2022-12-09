import django.db.utils
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Handle "making" transactions
        print("-" * 40)
        print("Making subscription transactions...")
        import datetime
        from accounts.models import Account, Payment
        completed = 0
        expired = 0
        try:
            for account in Account.objects.all():
                payment = account.next_payment
                if payment is not None and payment.date < datetime.datetime.now(datetime.timezone.utc):
                    if payment.cancelled:
                        # If the payment is cancelled, that means they are not renewing their
                        # subscription, so we will remove the current subscription and clear next_payment
                        account.subscription = None
                        account.next_payment = None
                        # Without a subscription, user cannot be enrolled in classes
                        account.enrolled_instances.clear()
                        account.classes.clear()
                        account.save()
                        expired += 1
                    else:
                        # Otherwise, we renew the subscription by completing the payment and creating a
                        # new future payment.
                        account.next_payment.completed = True
                        account.next_payment.save()
                        total = round(float(account.subscription.charge) * 1.13 * 100) / 100
                        payment_future = Payment(amount=total,
                                                 # Use the same payment info as the last payment
                                                 payment_info=payment.payment_info,
                                                 # Next payment date depends on current subscription billing cycle
                                                 date=datetime.datetime.now() + datetime.timedelta(
                                                     days=(30 if account.subscription.billing_cycle == "MONTHLY"
                                                           else 365)
                                                 ),
                                                 completed=False,
                                                 account=account
                                                 )
                        payment_future.save()
                        account.next_payment = payment_future
                        account.save()
                        completed += 1
        except django.db.utils.OperationalError:
            # Database hasn't been created yet
            print("ERROR: Database has not been created yet.")
            print("-" * 40)
            return
        print("{} transaction(s) completed.".format(completed))
        print("{} subscription(s) expired.".format(expired))
        print("-" * 40)
