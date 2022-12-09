import datetime

from django.db.models import ObjectDoesNotExist
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from utils.pagination import LimitPageNumberPagination
from utils.instance_helpers import get_all_instances, get_exact_instances, ClassInstancePaginator
from .models import Account, Subscription, PaymentInfo, Payment
from .serializers import AccountSerializer, ChangePasswordSerializer, SubscriptionSerializer, PaymentInfoSerializer, \
    PaymentSerializer


# Create your views here.
class CreateAccount(generics.CreateAPIView):
    serializer_class = AccountSerializer
    permission_classes = []


class AccountRetrieveUpdate(generics.RetrieveUpdateAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = (IsAuthenticated,)

    def retrieve(self, request, *args, **kwargs):
        try:
            user = self.queryset.get(pk=request.user.pk)
        except ObjectDoesNotExist:
            return Response(data={"detail": "User does not exist."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.serializer_class(user)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        try:
            user = self.queryset.get(pk=request.user.pk)
        except ObjectDoesNotExist:
            return Response(data={"detail": "User does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        if "new_password" in request.data:
            pw_serializer = ChangePasswordSerializer(data={"old_password": request.data.get("old_password", ""),
                                                           "new_password": request.data.get("new_password", "")})
            if pw_serializer.is_valid():
                if not user.check_password(pw_serializer.data.get("old_password")):
                    return Response({"old_password": "Password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(pw_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if "payment_info" in request.data:
            info_serializer = PaymentInfoSerializer(data=request.data.get("payment_info"))

            if info_serializer.is_valid():
                # Make sure no existing info is tied to the account
                existing = PaymentInfo.objects.filter(account=request.user)
                existing.delete()
                # Add new payment info
                info_obj = PaymentInfo(card_num=info_serializer.data.get("card_num"),
                                       expiry=info_serializer.data.get("expiry"),
                                       cvv=info_serializer.data.get("cvv"),
                                       account=request.user
                                       )
                info_obj.save()
                # Update future transactions to use this info
                request.user.payments.filter(date__gt=datetime.datetime.now()).update(
                    payment_info=info_obj.card_num)
            else:
                return Response(info_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user_serializer = self.serializer_class(user, data=request.data, partial=True)
        if user_serializer.is_valid():
            self.perform_update(user_serializer)
            return Response(user_serializer.data)
        else:
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubscriptionView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated,)

    def retrieve(self, request, *args, **kwargs):
        """Get available subscription plans.
        """
        current_plan = request.user.subscription
        data = []
        for subscription in Subscription.objects.all():
            data.append({
                "billing_cycle": subscription.billing_cycle,
                "charge": subscription.charge,
                "currently_subscribed": True if subscription == current_plan else False,
                "cancelled_payment": True if request.user.next_payment is not None
                and request.user.next_payment.cancelled
                and subscription == current_plan else False
            })
        return Response(data)

    def update(self, request, *args, **kwargs):
        """Update user subscription plan."""
        user = request.user

        # Validate subscription in request body
        subscription = request.data.get("subscription", None)
        serializer = SubscriptionSerializer(data=subscription)
        if serializer.is_valid():
            try:
                subscription_obj = Subscription.objects.get(billing_cycle=serializer.data.get("billing_cycle"),
                                                            charge=serializer.data.get("charge"))
            except Subscription.DoesNotExist:
                return Response({"detail": "No matching subscription found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check for payment info
        payment_info = request.data.get("payment_info", None)
        if payment_info is None:
            # User didn't provide payment info, so check if it's on file
            try:
                info_obj = PaymentInfo.objects.get(account=request.user)
            except PaymentInfo.DoesNotExist:
                return Response({"detail": "User does not have payment info on file, "
                                           "and no payment info was provided."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # User did provide payment info, check if it's valid
            serializer = PaymentInfoSerializer(data=payment_info)
            if serializer.is_valid():
                # Make sure no existing info is tied to the account
                existing = PaymentInfo.objects.filter(account=request.user)
                existing.delete()
                info_obj = PaymentInfo(card_num=serializer.data.get("card_num"),
                                       expiry=serializer.data.get("expiry"),
                                       cvv=serializer.data.get("cvv"),
                                       account=request.user
                                       )
                info_obj.save()
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # At this point, we can start handling the subscription logic
        if user.subscription is None or user.next_payment is None:
            # User is not currently subscribed, so make transaction and subscribe them
            total = round(float(subscription_obj.charge) * 1.13 * 100) / 100
            payment_now = Payment(amount=total,
                                  payment_info=info_obj.card_num,
                                  date=datetime.datetime.now(),
                                  completed=True,
                                  account=request.user
                                  )
            payment_now.save()
            payment_future = Payment(amount=total,
                                     payment_info=info_obj.card_num,
                                     date=datetime.datetime.now() + datetime.timedelta(
                                         days=(30 if subscription_obj.billing_cycle == "MONTHLY" else 365)
                                     ),
                                     completed=False,
                                     account=request.user
                                     )
            payment_future.save()
            user.subscription = subscription_obj
            user.next_payment = payment_future
            user.save()
            return Response({"detail": "User has subscribed to {} plan.".format(subscription_obj.billing_cycle),
                             "total": total, "next_payment": payment_future.date})
        elif user.subscription == subscription_obj:
            # User is already on this plan
            if not user.next_payment.cancelled:
                # They still have an active subscription
                return Response({"detail": "User is already subscribed to this plan."},
                                status=status.HTTP_400_BAD_REQUEST)
            else:
                # Their subscription has been cancelled, allow them to resubscribe
                user.next_payment.cancelled = False
                user.next_payment.save()
                return Response({"detail": "User has resubscribed."})
        else:
            # User is changing plans, so modify their next payment and current subscription
            total = round(float(subscription_obj.charge) * 1.13 * 100) / 100
            user.next_payment.amount = total
            user.next_payment.payment_info = info_obj.card_num
            user.next_payment.cancelled = False
            user.next_payment.save()
            user.subscription = subscription_obj
            user.save()
            return Response({"detail": "User has switched to {} plan.".format(subscription_obj.billing_cycle),
                             "total": total, "next_payment": user.next_payment.date})

    def destroy(self, request, *args, **kwargs):
        """Cancel user subscription.
        """
        if request.user.subscription is None:
            return Response({"detail": "User has no subscription to cancel."}, status=status.HTTP_400_BAD_REQUEST)

        next_payment = request.user.next_payment
        if next_payment.cancelled:
            return Response({"detail": "User has already cancelled current subscription."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Cancel next payment
        next_payment.cancelled = True
        next_payment.save()

        # Unenroll user from any classes that occur after billing period
        # TODO: This isn't quite right - enrollments in recurring classes aren't being properly considered
        # Potential solution: unenroll from class, but enroll in all the instances before the end of the cycle
        request.user.enrolled_instances.set(
            request.user.enrolled_instances.filter(date__lte=next_payment.date.date())
        )

        return Response({"detail": "Subscription cancelled.",
                         "days_remaining": (next_payment.date - datetime.datetime.now(datetime.timezone.utc)).days})


class ListPayments(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer
    pagination_class = LimitPageNumberPagination

    def get_queryset(self):
        return self.request.user.payments.order_by("-date")


class ListSchedule(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, **kwargs):
        all_instances = []
        # Get instances for classes that user has enrolled in
        enrolled_classes = request.user.classes.all()
        dropped_instances = request.user.dropped_instances.all()

        for class_obj in enrolled_classes:
            special_exceptions = dropped_instances.filter(parent=class_obj, special=True)
            nonspecial_exceptions = dropped_instances.filter(parent=class_obj, special=False)
            all_instances.extend(
                get_all_instances(class_obj.studio, class_obj, request,
                                  special_exceptions, nonspecial_exceptions, when=1)
            )

        # Get specific instances that user has enrolled in
        enrolled_instances = request.user.enrolled_instances.all()
        all_instances.extend(get_exact_instances(enrolled_instances, request, when=1))

        # Paginate and return
        data = sorted(all_instances, key=lambda i: (i["date"], i["start_time"]))
        paginator = ClassInstancePaginator(request)
        return paginator.paginate_list(data)


class ListHistory(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, **kwargs):
        all_instances = []
        # Get instances for classes that user has enrolled in
        enrolled_classes = request.user.classes.all()
        dropped_instances = request.user.dropped_instances.all()

        for class_obj in enrolled_classes:
            special_exceptions = dropped_instances.filter(parent=class_obj, special=True)
            nonspecial_exceptions = dropped_instances.filter(parent=class_obj, special=False)
            all_instances.extend(
                get_all_instances(class_obj.studio, class_obj, request,
                                  special_exceptions, nonspecial_exceptions, when=-1)
            )

        # Get specific instances that user has enrolled in
        enrolled_instances = request.user.enrolled_instances.all()
        all_instances.extend(get_exact_instances(enrolled_instances, request, when=-1))

        # Paginate and return
        data = sorted(all_instances, key=lambda i: (i["date"], i["end_time"]), reverse=True)
        paginator = ClassInstancePaginator(request)
        return paginator.paginate_list(data)


class ListOngoing(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, **kwargs):
        all_instances = []
        # Get instances for classes that user has enrolled in
        enrolled_classes = request.user.classes.all()
        dropped_instances = request.user.dropped_instances.all()

        for class_obj in enrolled_classes:
            special_exceptions = dropped_instances.filter(parent=class_obj, special=True)
            nonspecial_exceptions = dropped_instances.filter(parent=class_obj, special=False)
            all_instances.extend(
                get_all_instances(class_obj.studio, class_obj, request,
                                  special_exceptions, nonspecial_exceptions, when=0)
            )

        # Get specific instances that user has enrolled in
        enrolled_instances = request.user.enrolled_instances.all()
        all_instances.extend(get_exact_instances(enrolled_instances, request, when=0))

        # Paginate and return
        data = sorted(all_instances, key=lambda i: (i["date"], i["start_time"]))
        paginator = ClassInstancePaginator(request)
        return paginator.paginate_list(data)
