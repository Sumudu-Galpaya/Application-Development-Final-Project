from django.db import models
# Create your models here.

class Nationalschools(models.Model):
  schoolname= models.CharField(max_length=255)
  schooladdress = models.CharField(max_length=255)
