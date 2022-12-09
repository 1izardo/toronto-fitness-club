from django.urls import path

from .views import ListStudios, StudioDetails, ListInstances, InstanceDetails, \
    HandleNonSpecial, StudioSchedule, ClassDetails, SearchStudios, SearchClasses

app_name = "studios"

urlpatterns = [
    path("nearby", ListStudios.as_view(), name="nearby"),
    path("search", SearchStudios.as_view(), name="search_studios"),
    path("<int:pk>/details/", StudioDetails.as_view(), name="studio_details"),
    path("<int:pk>/classes/search", SearchClasses.as_view(), name="search_classes"),
    path("<int:pk>/classes/<int:class_id>/", ClassDetails.as_view(), name="class_details"),
    path("<int:pk>/classes/<int:class_id>/list", ListInstances.as_view(), name="list_instances"),
    path("<int:pk>/classes/<int:class_id>/<int:instance_id>/", InstanceDetails.as_view(), name="instance_details"),
    path("<int:pk>/classes/<int:class_id>/ns/<str:date>/", HandleNonSpecial.as_view(), name="handle_non_special"),
    path("<int:pk>/schedule", StudioSchedule.as_view(), name="schedule")
]
