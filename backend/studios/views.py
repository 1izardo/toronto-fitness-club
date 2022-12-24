import datetime

from django.db.models import F
from django.db.models.expressions import RawSQL
from django.shortcuts import get_object_or_404
from geopy import MapBox
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied, ParseError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from classes.models import Class, ClassInstance
from utils.instance_helpers import get_all_instances, ClassInstancePaginator
from utils.pagination import LimitPageNumberPagination
from .models import Studio
from .serializers import StudioSerializer, LocationSerializer, ClassSerializer, ClassInstanceSerializer


# Create your views here.


class ListStudios(generics.ListAPIView):
    serializer_class = StudioSerializer
    pagination_class = LimitPageNumberPagination

    def get_serializer_context(self):
        context = super(ListStudios, self).get_serializer_context()
        context["exclude_fields"] = ["images", "phone_num", "classes", "amenities"]
        return context

    def get_queryset(self):
        request = self.request
        if request.query_params.get("lat") and request.query_params.get("long"):
            location = LocationSerializer(data={
                "lat": request.query_params.get("lat"),
                "long": request.query_params.get("long")
            })
            if location.is_valid():
                lat = location.data["lat"]
                long = location.data["long"]
            else:
                return Response(location.errors, status=status.HTTP_400_BAD_REQUEST)
        elif request.query_params.get("postal_code"):
            location = LocationSerializer(data={
                "postal_code": request.query_params.get("postal_code")
            })
            if location.is_valid():
                # TODO: Use environment variables so this doesn't get exposed in the git repo
                geolocator = MapBox(
                    api_key="pk.eyJ1IjoiMWl6YXJkbyIsImEiOiJjbGFoOHFtZ2owNzV6M3ZuNTkyamVkeWozIn0.2LLzH1LNQYbi-O1upIKLGQ"
                )
                try:
                    loc = geolocator.geocode(query="{}, Canada".format(location.data["postal_code"]), exactly_one=True)
                    if loc is None:
                        return Response({"detail": "No matching location found."}, status=status.HTTP_404_NOT_FOUND)
                    lat = loc.latitude
                    long = loc.longitude
                except Exception as err:
                    return Response(err, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(location.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            location = LocationSerializer(data={})
            if not location.is_valid():
                return Response(location.errors, status=status.HTTP_400_BAD_REQUEST)

        # If we are here, we have a lat and long value
        # Calculate distances using great circle distance formula
        # (https://stackoverflow.com/a/26219292)
        gcd_formula = "6371 * acos(min(max(\
                            cos(radians(%s)) * cos(radians(lat)) \
                            * cos(radians(long) - radians(%s)) + \
                            sin(radians(%s)) * sin(radians(lat)) \
                            , -1), 1))"
        distance_raw_sql = RawSQL(
            gcd_formula,
            (lat, long, lat)
        )
        qs = Studio.objects.all() \
            .annotate(distance=distance_raw_sql) \
            .order_by("distance")
        return qs


class StudioDetails(generics.RetrieveAPIView):
    serializer_class = StudioSerializer
    lookup_field = "pk"
    queryset = Studio.objects.all()


class ListInstances(generics.RetrieveAPIView):
    def retrieve(self, request, **kwargs):
        studio_obj = get_object_or_404(Studio, pk=kwargs["pk"])
        try:
            class_obj = studio_obj.classes.get(pk=kwargs["class_id"])
        except Class.DoesNotExist as err:
            return Response({"detail": "No Class with id {} exists for Studio {}".format(kwargs["class_id"],
                                                                                         kwargs["pk"])},
                            status=status.HTTP_404_NOT_FOUND)
        data = get_all_instances(studio_obj, class_obj, request)
        data = sorted(data, key=lambda i: (i["date"], i["start_time"]))
        paginator = ClassInstancePaginator(request)
        return paginator.paginate_list(data)


class StudioSchedule(generics.RetrieveAPIView):
    """View for retrieving future class instances across ALL classes at a studio.
    """

    def retrieve(self, request, *args, **kwargs):
        studio_obj = get_object_or_404(Studio, pk=kwargs["pk"])
        classes = studio_obj.classes.all()
        data = []
        for class_obj in classes:
            data.extend(get_all_instances(studio_obj, class_obj, request))
        data = sorted(data, key=lambda i: (i["date"], i["start_time"]))
        paginator = ClassInstancePaginator(request)
        return paginator.paginate_list(data)


class ClassDetails(generics.RetrieveUpdateAPIView):
    """View for a single class. Allows viewing details and enrolling (all future instances).
    """
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.studio_obj = None
        self.class_obj = None

    def initial(self, request, *args, **kwargs):
        """Get studio and class objects for future use.
        """
        super().initial(request, *args, **kwargs)
        self.studio_obj = get_object_or_404(Studio, pk=kwargs["pk"])
        try:
            self.class_obj = self.studio_obj.classes.get(pk=kwargs["class_id"])
        except Class.DoesNotExist:
            raise NotFound(detail="No Class with id {} exists for Studio {}".format(kwargs["class_id"],
                                                                                    kwargs["pk"]))

    def get_object(self):
        return self.class_obj

    def retrieve(self, request, *args, **kwargs):
        """Get instance details.
        """
        return Response(ClassSerializer(
            self.class_obj,
            context={"user_enrolled": self.request.user.classes.filter(pk=self.class_obj.id).exists()}
        ).data)

    def partial_update(self, request, *args, **kwargs):
        """Toggle user enrollment in class (all future instances).
        """
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."},
                            status=status.HTTP_401_UNAUTHORIZED)
        if request.user.subscription is None:
            return Response({"detail": "User is not subscribed."},
                            status=status.HTTP_401_UNAUTHORIZED)
        try:
            # Try to retrieve this class from their enrolled classes (if it fails, we go to except branch)
            request.user.classes.get(pk=self.class_obj.pk)
            # Unenroll from class
            request.user.classes.remove(self.class_obj)
            self.class_obj.enrolled -= 1
            self.class_obj.save()
            # All related instances must also have their enrollment number decreased,
            # EXCEPT those that the user has dropped
            self.class_obj.instances \
                .exclude(pk__in=request.user.dropped_instances.all().values("pk")) \
                .update(enrolled=F("enrolled") - 1)
            # Remove user's dropped instances that have this parent (avoid duplicates)
            for instance in request.user.dropped_instances.filter(parent=self.class_obj).iterator():
                request.user.dropped_instances.remove(instance)
        except Class.DoesNotExist:
            # Retrieving class failed (because they were not enrolled), so we enroll them
            request.user.classes.add(self.class_obj)
            self.class_obj.enrolled += 1
            self.class_obj.save()
            # All future related instances must also have their enrollment number increased,
            # EXCEPT those that the user is already enrolled in
            self.class_obj.instances \
                .exclude(pk__in=request.user.enrolled_instances.all().values("pk")) \
                .update(enrolled=F("enrolled") + 1)
            # Remove user's enrolled instances that have this parent (avoid duplicates)
            for instance in request.user.enrolled_instances.filter(parent=self.class_obj).iterator():
                request.user.enrolled_instances.remove(instance)
        return Response(ClassSerializer(
            self.class_obj,
            context={"user_enrolled": self.request.user.classes.filter(pk=self.class_obj.id).exists()}
        ).data)


class InstanceDetails(generics.RetrieveUpdateAPIView):
    """View for a single class instance. Allows viewing details and enrolling.
    """
    serializer_class = ClassInstanceSerializer
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super(InstanceDetails, self).__init__(**kwargs)
        self.studio_obj = None
        self.class_obj = None
        self.instance = None

    def initial(self, request, *args, **kwargs):
        """Get class and instance objects for later use.
        """
        super(InstanceDetails, self).initial(request, *args, **kwargs)
        self.studio_obj = get_object_or_404(Studio, pk=kwargs["pk"])
        try:
            self.class_obj = self.studio_obj.classes.get(pk=kwargs["class_id"])
        except Class.DoesNotExist:
            raise NotFound(detail="No Class with id {} exists for Studio {}".format(kwargs["class_id"],
                                                                                    kwargs["pk"]))
        try:
            self.instance = self.class_obj.instances.get(pk=kwargs["instance_id"])
        except ClassInstance.DoesNotExist:
            raise NotFound(detail="No ClassInstance with id {} exists for Class {}".format(kwargs["instance_id"],
                                                                                           kwargs["class_id"]))

    def retrieve(self, request, *args, **kwargs):
        """Get instance details.
        """
        return Response(ClassInstanceSerializer(
            self.instance,
            context={"user_enrolled": self.request.user.classes.filter(pk=self.class_obj.id).exists()
                                      and not self.request.user.dropped_instances.filter(pk=self.instance.id).exists()
                                      or self.request.user.enrolled_instances.filter(pk=self.instance.id).exists()}
        ).data)

    def partial_update(self, request, *args, **kwargs):
        """Toggle user enrollment in class instance.
        """
        if request.user.subscription is None:
            raise PermissionDenied(detail="User is not subscribed.")
        try:
            request.user.classes.get(pk=self.class_obj.pk)
            # If we get to this point, then user must be enrolled in the parent course
            try:
                # Try to retrieve this instance from their dropped instances (if it fails, we go to except branch)
                request.user.dropped_instances.get(pk=self.instance.pk)
                if self.instance.enrolled >= self.instance.parent.capacity:
                    # Instance is already at capacity
                    raise PermissionDenied(detail="Instance is already at capacity ({}/{}).".format(
                        self.instance.enrolled, self.instance.parent.capacity
                    ))
                # If we get here, then it's not at capacity, and we can un-drop (re-enroll)
                request.user.dropped_instances.remove(self.instance)
                self.instance.enrolled += 1
                self.instance.save()
            except ClassInstance.DoesNotExist:
                # Retrieving instance failed (because they have not dropped), so we drop it
                request.user.dropped_instances.add(self.instance)
                self.instance.enrolled -= 1
                self.instance.save()
        except Class.DoesNotExist:
            try:
                # Try to retrieve this instance from their enrolled instances (if it fails, we go to except branch)
                request.user.enrolled_instances.get(pk=self.instance.pk)
                # Unenroll from instance
                request.user.enrolled_instances.remove(self.instance)
                self.instance.enrolled -= 1
                self.instance.save()
            except ClassInstance.DoesNotExist:
                # Retrieving instance failed (because they were not enrolled), so we enroll them
                if self.instance.enrolled >= self.instance.parent.capacity:
                    # Instance is already at capacity
                    raise PermissionDenied(detail="Instance is already at capacity ({}/{}).".format(
                        self.instance.enrolled, self.instance.parent.capacity
                    ))
                request.user.enrolled_instances.add(self.instance)
                self.instance.enrolled += 1
                self.instance.save()

        return Response(ClassInstanceSerializer(
            self.instance,
            context={"user_enrolled": self.request.user.classes.filter(pk=self.class_obj.id).exists()
                                      and not self.request.user.dropped_instances.filter(pk=self.instance.id).exists()
                                      or self.request.user.enrolled_instances.filter(pk=self.instance.id).exists()}
        ).data)


class HandleNonSpecial(generics.RetrieveUpdateAPIView):
    """Handles redirecting to appropriate view after creating instance (if necessary).
    """
    serializer_class = ClassInstanceSerializer

    def __init__(self, **kwargs):
        super(HandleNonSpecial, self).__init__(**kwargs)
        self.instance = None

    def initial(self, request, *args, **kwargs):
        studio_obj = get_object_or_404(Studio, pk=kwargs["pk"])
        try:
            class_obj = studio_obj.classes.get(pk=kwargs["class_id"])
        except Class.DoesNotExist:
            raise NotFound(detail="No Class with id {} exists for Studio {}".format(kwargs["class_id"], kwargs["pk"]))
        try:
            date = datetime.datetime.strptime(kwargs["date"], "%Y-%m-%d").date()
        except ValueError:
            raise ParseError(detail="Date is badly formatted (expected YYYY-MM-DD).")
        try:
            self.instance = class_obj.instances.get(date=date, special=False, cancelled=False)
        except ClassInstance.DoesNotExist:
            # The instance doesn't exist, so we'll make it (as long as it matches the parent schedule)
            # Check if the instance matches occurrence rules
            occurrences = list(class_obj.schedule.between(
                datetime.datetime.combine(date, datetime.time(0)),
                datetime.datetime.combine(date, datetime.time(23, 59, 59)),
                inc=True
            ))
            if len(occurrences) == 0:
                # Does not fall on scheduled day
                raise ParseError(detail="Date {} does not match class schedule.".format(date))
            self.instance = ClassInstance(
                date=date,
                start_time=class_obj.start_time,
                end_time=class_obj.end_time,
                special=False,
                parent=class_obj
            )
            self.instance.save()

    def retrieve(self, request, *args, **kwargs):
        kwargs["instance_id"] = self.instance.id
        return InstanceDetails.as_view()(request._request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs["instance_id"] = self.instance.id
        return InstanceDetails.as_view()(request._request, *args, **kwargs)


class SearchStudios(generics.ListAPIView):
    serializer_class = StudioSerializer
    pagination_class = LimitPageNumberPagination

    def get_serializer_context(self):
        context = super(SearchStudios, self).get_serializer_context()
        context["exclude_fields"] = ["images", "directions", "lat", "long"]
        return context

    def get_queryset(self):
        qs = Studio.objects.all()
        if "name" in self.request.query_params:
            qs = qs.filter(name__icontains=self.request.query_params.get("name"))
        if "amenities" in self.request.query_params:
            qs = qs.filter(amenities__type__iin=self.request.query_params.getlist("amenities"))
        if "classes" in self.request.query_params:
            qs = qs.filter(classes__name__iin=self.request.query_params.getlist("classes"))
        if "coaches" in self.request.query_params:
            qs = qs.filter(classes__coach__iin=self.request.query_params.getlist("coaches"))
        return qs.order_by("name")


# TODO: Search class instances instead of classes? (it will be much harder)
class SearchClasses(generics.ListAPIView):
    serializer_class = ClassSerializer
    pagination_class = LimitPageNumberPagination

    def get_queryset(self):
        qs = Class.objects.filter(studio=self.kwargs.get("pk"))
        if "name" in self.request.query_params:
            qs = qs.filter(name__icontains=self.request.query_params.get("name"))
        if "coach" in self.request.query_params:
            qs = qs.filter(coach__icontains=self.request.query_params.get("coach"))
        if "after" in self.request.query_params:
            try:
                date = datetime.datetime.strptime(self.request.query_params.get("after"), "%H:%M")
            except ValueError as err:
                date = datetime.datetime.strptime("00:00", "%H:%M")
            qs = qs.filter(start_time__gte=date.time())
        if "before" in self.request.query_params:
            try:
                date = datetime.datetime.strptime(self.request.query_params.get("before"), "%H:%M")
            except ValueError as err:
                date = datetime.datetime.strptime("23:59", "%H:%M")
            qs = qs.filter(end_time__lte=date.time())
        return qs.order_by("name")
