from django.core.exceptions import ValidationError
from django.db import models
from geopy import MapBox

from utils.validators import validate_postal_code, validate_phone_number

from django.db.models import Field
from django.db.models.lookups import In


@Field.register_lookup
class IIn(In):
    lookup_name = 'iin'

    def process_lhs(self, *args, **kwargs):
        sql, params = super().process_lhs(*args, **kwargs)

        # Convert LHS to lowercase
        sql = f'LOWER({sql})'

        return sql, params

    def process_rhs(self, qn, connection):
        rhs, params = super().process_rhs(qn, connection)

        # Convert RHS to lowercase
        params = tuple(p.lower() for p in params)

        return rhs, params


class Studio(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    lat = models.DecimalField("Latitude", max_digits=9, decimal_places=6, blank=True)
    long = models.DecimalField("Longitude", max_digits=9, decimal_places=6, blank=True)
    postal_code = models.CharField(max_length=7, validators=[validate_postal_code])
    phone_num = models.CharField("Phone number", max_length=16, validators=[validate_phone_number])

    def __str__(self):
        return str(self.name) + " ({} classes)".format(self.classes.all().count())

    def clean(self):
        if not self.lat or not self.long:
            # Either lat or long is missing
            geolocator = MapBox(
                api_key="pk.eyJ1IjoiMWl6YXJkbyIsImEiOiJjbGFoOHFtZ2owNzV6M3ZuNTkyamVkeWozIn0.2LLzH1LNQYbi-O1upIKLGQ"
            )
            try:
                loc = geolocator.geocode(query="{}, Canada".format(self.postal_code), exactly_one=True)
                if loc is None:
                    raise ValidationError("No matching location found. Please enter a valid postal code, "
                                          "or manually enter values for latitude and longitude.")
                self.lat = loc.latitude
                self.long = loc.longitude
            except Exception as err:
                raise ValidationError("Location services are unavailable. Please manually enter values for latitude "
                                      "and longitude.")


class Amenity(models.Model):
    type = models.CharField(max_length=255)
    quantity = models.PositiveSmallIntegerField()
    studio = models.ForeignKey("Studio", on_delete=models.CASCADE, related_name="amenities")

    class Meta:
        verbose_name_plural = "amenities"


class StudioImage(models.Model):
    image = models.ImageField(upload_to="studios/")
    studio = models.ForeignKey("Studio", on_delete=models.CASCADE, related_name="images")
