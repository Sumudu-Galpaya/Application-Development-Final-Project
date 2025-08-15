from django.urls import path
from . import views

urlpatterns = [
    path('', views.map_view, name='national_schools_sri_lanka'),
]
