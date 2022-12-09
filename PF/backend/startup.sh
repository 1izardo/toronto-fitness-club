python3 -m venv venv
source ./venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate

# NOTE TO TA: You can change the admin user credentials by specifying
# different values for DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD
DJANGO_SUPERUSER_EMAIL=admin@email.com DJANGO_SUPERUSER_PASSWORD=123 python manage.py createsuperuser --noinput

chmod +x run.sh