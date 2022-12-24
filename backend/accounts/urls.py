from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import CreateAccount, AccountRetrieveUpdate, SubscriptionView, ListPayments, ListSchedule, ListHistory, \
    ListOngoing

app_name = "accounts"

urlpatterns = [
    path("register/", CreateAccount.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("profile/", AccountRetrieveUpdate.as_view(), name="profile"),
    path("subscribe/", SubscriptionView.as_view(), name="subscribe"),
    path("payments/", ListPayments.as_view(), name="payments"),
    path("schedule/", ListSchedule.as_view(), name="schedule"),
    path("history/", ListHistory.as_view(), name="history"),
    path("ongoing/", ListOngoing.as_view(), name="ongoing"),
]
