import datetime
from collections import OrderedDict

from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework.response import Response

from classes.models import ClassInstance


def query_date_filter(days, when):
    if when == -1:
        # Past instances
        return Q(
            Q(date=datetime.date.today()) & Q(end_time__lt=datetime.datetime.now().time()) |
            Q(date__lt=datetime.date.today())
        ) & (
           Q(date__gte=datetime.date.today() - datetime.timedelta(days=days))
           if days is not None
           else Q()
        )
    elif when == 0:
        # Current instances (in progress)
        return Q(date=datetime.date.today()) & \
               Q(start_time__lte=datetime.datetime.now().time()) & \
               Q(end_time__gte=datetime.datetime.now().time())
    else:
        # Future instances
        return Q(
            Q(date=datetime.date.today()) & Q(start_time__gt=datetime.datetime.now().time()) |
            Q(date__gt=datetime.date.today())
        ) & (
            Q(date__lte=datetime.date.today() + datetime.timedelta(days=days))
            if days is not None
            else Q()
        )


def recurrence_date_filter(class_obj, days, when):
    if when == -1:
        # Past instances
        return class_obj.schedule.between(
            # `days` days ago
            datetime.datetime.now() - datetime.timedelta(days=days),
            # Now (note: if/else ensures that an instance w/ today's date is only included if
            # it has already past)
            datetime.datetime.combine(datetime.date.today(), datetime.time(0)) - datetime.timedelta(days=1)
            if datetime.datetime.now().time() <= class_obj.end_time
            else datetime.datetime.now(),
            inc=True
        )
    elif when == 0:
        # Current instances (in progress)
        return class_obj.schedule.between(
            datetime.datetime.combine(datetime.date.today(), datetime.time(0)),
            datetime.datetime.combine(datetime.date.today(), datetime.time(23, 59, 59))
            # If in progress, then include occurrence on today's date
            if class_obj.start_time <= datetime.datetime.now().time() <= class_obj.end_time
            # Else, empty range (end date before start date)
            else datetime.datetime.now() - datetime.timedelta(days=1),
            inc=True
        )
    else:
        return class_obj.schedule.between(
            # Now (note: if/else ensures that an instance w/ today's date is only included if
            # it has not yet started)
            datetime.datetime.combine(datetime.date.today(), datetime.time(0))
            if datetime.datetime.now().time() < class_obj.start_time
            else datetime.datetime.now(),
            # `days` days from now
            datetime.datetime.now() + datetime.timedelta(days=days),
            inc=True
        )


def get_non_special_instances(studio_obj, class_obj, request, exceptions=ClassInstance.objects.none(), when=1):
    non_special_instances = [
        {
            "studio_id": class_obj.studio.id,
            "class_id": class_obj.id,
            "class_name": class_obj.name,
            "coach": class_obj.coach,
            "date": instance.date(),
            "start_time": class_obj.start_time,
            "end_time": class_obj.end_time,
            "special": False,
            "details": '/studios/{studio_id}/classes/{class_id}/ns/{date}/'.format(
                studio_id=studio_obj.id,
                class_id=class_obj.id,
                date=instance.date()
            )
        }
        for instance in recurrence_date_filter(class_obj, int(request.query_params.get("range", 14)), when)
        # Include instance only if it is not in `exceptions`
        if not exceptions.filter(date=instance.date()).exists()
    ]
    return non_special_instances


def get_special_instances(studio_obj, class_obj, request, exceptions=ClassInstance.objects.none(), when=1):
    special_instances = [
        {
            "studio_id": class_obj.studio.id,
            "class_id": class_obj.id,
            "class_name": class_obj.name,
            "coach": class_obj.coach,
            "date": instance.date,
            "start_time": instance.start_time,
            "end_time": instance.end_time,
            "special": True,
            "details": '/studios/{studio_id}/classes/{class_id}/{instance_id}/'.format(
                studio_id=studio_obj.id,
                class_id=class_obj.id,
                instance_id=instance.id
            )
        }
        for instance in class_obj.instances.filter(
            query_date_filter(int(request.query_params.get("range", 14)), when)
            & Q(cancelled=False) & Q(special=True)
        )
        # Include instance only if it is not in `exceptions`
        if not exceptions.filter(pk=instance.pk).exists()
    ]
    return special_instances


def get_all_instances(studio_obj, class_obj, request, special_exceptions=ClassInstance.objects.none(),
                      nonspecial_exceptions=ClassInstance.objects.none(), when=1):
    special_instances = get_special_instances(studio_obj, class_obj, request, special_exceptions, when)
    non_special_instances = get_non_special_instances(studio_obj, class_obj, request, nonspecial_exceptions, when)
    return special_instances + non_special_instances


def get_exact_instances(instances, request, when=1):
    instances = [
        {
            "studio_id": instance.parent.studio.id,
            "class_id": instance.parent.id,
            "class_name": instance.parent.name,
            "coach": instance.parent.coach,
            "date": instance.date,
            "start_time": instance.start_time,
            "end_time": instance.end_time,
            "special": instance.special,
            "details": '/studios/{studio_id}/classes/{class_id}/{instance_id}/'.format(
                studio_id=instance.parent.studio.id,
                class_id=instance.parent.id,
                instance_id=instance.id
            )
        }
        for instance in instances.filter(
            query_date_filter(int(request.query_params.get("range", 14)), when)
            & Q(cancelled=False)
        )
    ]
    return instances


class ClassInstancePaginator:
    def __init__(self, request):
        self.url_scheme = request.scheme
        self.host = request.get_host()
        self.path_info = request.path_info
        self.limit = request.query_params.get("limit", 20)
        self.page = request.query_params.get("page", 1)
        self.range = request.query_params.get("range", 14)

    def paginate_list(self, data):
        paginator = Paginator(data, self.limit)
        page = paginator.page(self.page)

        previous_url = None
        next_url = None
        if self.host and self.path_info:
            if page.has_previous():
                previous_url = '{}://{}{}?range={}&limit={}&page={}'.format(
                    self.url_scheme, self.host, self.path_info, self.range, self.limit, page.previous_page_number()
                )
            if page.has_next():
                next_url = '{}://{}{}?range={}&limit={}&page={}'.format(
                    self.url_scheme, self.host, self.path_info, self.range, self.limit, page.next_page_number()
                )

        response_dict = OrderedDict([
            ('count', len(data)),
            ('next', next_url),
            ('previous', previous_url),
            ('results', page.object_list)
        ])
        return Response(response_dict)
