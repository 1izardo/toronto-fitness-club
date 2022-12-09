import phonenumbers
from django.core.exceptions import ValidationError


def validate_card_num(value: str):
    # TODO: Implement card number validation
    pass


def validate_cvv(value: str):
    # TODO: Implement CVV validation
    pass


def validate_expiry(value: str):
    # TODO: Implement expiry date validation
    pass


def validate_postal_code(value: str):
    postal_code = value.replace(" ", "").upper()
    if len(postal_code) == 6:
        for i in range(6):
            if i % 2 == 0:
                if not (postal_code[i].isalpha()):
                    raise ValidationError("Postal code contains a letter in unexpected position (expected: 'A0A 0A0')")
            else:
                if not (postal_code[i].isdigit()):
                    raise ValidationError("Postal code contains a number in unexpected position (expected: 'A0A 0A0')")
    else:
        raise ValidationError("Postal code contains too many characters (expected: 'A0A 0A0')")


def validate_lat(value):
    if value > 90 or value < -90:
        raise ValidationError("Latitude is not between -90 and 90 degrees")


def validate_long(value):
    if value > 180 or value < -180:
        raise ValidationError("Longitude is not between -180 and 180 degrees")


def validate_phone_number(value: str):
    number = phonenumbers.parse(value, region="CA")
    if not phonenumbers.is_valid_number(number):
        raise ValidationError("Phone number is not a valid Canadian number")
