# In your national_schools/views.py file

from django.shortcuts import render
from django.conf import settings
import os
import csv
import logging # Import the logging module

# Get an instance of a logger
logger = logging.getLogger(__name__)

def map_view(request):
    # Construct the file path using os.path.join for platform independence
    csv_file_path = os.path.join(settings.BASE_DIR, 'national_schools','static', 'data', 'geocoded_schools_national.csv')
    data = []
    
    try:
        # Use 'utf-8-sig' for more robust CSV file reading
        with open(csv_file_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                data.append(row)
    except FileNotFoundError:
        # Use Django's logging framework for production environments
        logger.error(f"Error: The file at {csv_file_path} was not found.")
        data = []

    context = {
        'map_data': data
    }
    return render(request, 'national_schools/national_schools_sri_lanka.html', context)