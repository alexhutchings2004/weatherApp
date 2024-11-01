# googleAPIKEY = AIzaSyDhO1ckR2bcSzShKjofF3ULUPoToTxZdlU

import openmeteo_requests
import requests_cache
import pandas as pd
from retry_requests import retry
from flask import Flask, render_template, request, jsonify
from datetime import datetime

time = datetime.now()

app = Flask(__name__)

lat = 0
long = 0

@app.route('/')
def main():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_location():
    # Get the JSON data sent from the frontend
    data = request.get_json()

    # Extract latitude and longitude
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    # Setup the Open-Meteo API client with cache and retry on error
    cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    openmeteo = openmeteo_requests.Client(session=retry_session)

    # Make sure all required weather variables are listed here
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": ["temperature_2m", "relative_humidity_2m", "precipitation", "rain", "visibility", "wind_speed_80m"]
    }
    responses = openmeteo.weather_api(url, params=params)

    # Process the first location
    response = responses[0]

    # Process hourly data
    hourly = response.Hourly()
    hourly_temperature_2m = hourly.Variables(0).ValuesAsNumpy()

    # Create a list of temperatures for the next 24 hours
    temperatures = [round(temp) for temp in hourly_temperature_2m[:24]]
    week_average_temperatures = [round(temp) for temp in hourly_temperature_2m]

    means = {}

    for day in range(7):
        day_start = day * 24         # Start index for each day
        day_end = day_start + 24     # End index for each day

        # Calculate the average temperature for the day
        day_temps = week_average_temperatures[day_start:day_end]
        daily_avg = sum(day_temps) / len(day_temps)

        # Store the daily average in the means dictionary with day as key
        means[day] = round(daily_avg)

    for day, temp in means.items():
        print((day+1), temp)



    # Return all hourly temperatures
    return jsonify({
        'temperatures': temperatures,
        'message': f'{temperatures[time.hour]}°',
        'week_temps': f'{means.items()}'
    })





if __name__ == '__main__':
    app.run(debug=True)
