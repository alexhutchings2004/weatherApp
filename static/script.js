// API KEY = AIzaSyDhO1ckR2bcSzShKjofF3ULUPoToTxZdlU

const x = document.getElementById("demo");
const y = document.getElementById("weather");

// Define the highlight function outside of document ready
function highlightCurrentHourBox() {
    const d = new Date();
    const hour = d.getHours(); // Get the current hour (0-23)
    const min = d.getMinutes();
    // const time = d.get()

    document.getElementById('time').innerHTML = hour + ':' + min

    // Remove existing current-hour class from all boxes
    $('.forecast-box').removeClass('current-hour');

    let currentHourBox = null; // Variable to hold the current hour box

    // Loop through each forecast box
    $('.forecast-box').each(function() {
        const timeText = $(this).find('.time').text(); // Get the time text
        const forecastHour = parseInt(timeText.split(':')[0]); // Extract the hour part

        // If this box's hour matches the current hour, add the class
        if (forecastHour === hour) {
            $(this).addClass('current-hour'); // Add the class to highlight
            currentHourBox = this; // Store the current hour box element
        }
    });

    // Scroll the current hour box into view if it exists
    if (currentHourBox) {
        currentHourBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

$(document).ready(function() {
    // Highlight current hour box on page load
    highlightCurrentHourBox();

    // Update every minute (to account for changes during the hour)
    setInterval(highlightCurrentHourBox, 60000);
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Update the 'demo' element with the coordinates
    document.getElementById('demo').innerHTML = "Latitude: " + latitude + 
    "<br>Longitude: " + longitude;


    fetch('/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude })
    })
    .then(response => response.json())
    .then(data => {
        // Display weekly average temperatures
        const weeklyList = document.getElementById("weekly-list");
        weeklyList.innerHTML = '';  // Clear previous items

        for (const [day, avgTemp] of Object.entries(data.week_temps)) {
            const listItem = document.createElement("li");
            listItem.textContent = `Day ${parseInt(day) + 1}: ${avgTemp}°`;
            weeklyList.appendChild(listItem);
        }
    })
    .catch(error => console.log('Error:', error));


    // Send data via AJAX
    $.ajax({
        url: '/process',
        type: 'POST',
        data: JSON.stringify({
            latitude: latitude,
            longitude: longitude
        }),


        contentType: 'application/json', // Set the content type to JSON
        success: function(response) {
            const temperature = parseInt(response.message); // Convert the temperature string to an integer
            document.getElementById('data').innerHTML = response.message;
            console.log(response.message);

            // Set the weather image based on temperature for the main box
            if (temperature >= 14) {
                document.getElementById("weather").src = '../static/sun.png';
            } else if (temperature < 14 && temperature >= 10) {
                document.getElementById("weather").src = '../static/cloud.png';
            } else {
                document.getElementById("weather").src = '../static/rain.webp'; // Use rain image for below 10
            }

            // Create forecast boxes for each hour
            const temperatures = response.temperatures; // Get the list of temperatures
            const forecastContainer = document.querySelector('.forecast-container');

            // Clear previous boxes
            forecastContainer.innerHTML = '';

            // Create forecast boxes for each hour
            temperatures.forEach((temp, index) => {
                const box = document.createElement('div');
                box.className = 'forecast-box';

                // Create temperature element
                const tempSpan = document.createElement('span');
                tempSpan.className = 'temperature';
                tempSpan.textContent = `${temp}°`; // Display temperature with degree symbol

                // Create time element
                const timeParagraph = document.createElement('p');
                timeParagraph.className = 'time';
                timeParagraph.textContent = `${String(index).padStart(2, '0')}:00`; // Format time

                // Create image element based on temperature
                const weatherImage = document.createElement('img');
                if (temp >= 14) {
                    weatherImage.src = '../static/sun.png'; // Image for warm weather
                } else if (temp < 14 && temp >= 10) {
                    weatherImage.src = '../static/cloud.png'; // Image for moderate weather
                } else {
                    weatherImage.src = '../static/rain.webp'; // Image for cold weather
                }
                weatherImage.alt = `Weather image for ${temp}°`; // Alt text for accessibility
                weatherImage.style.maxWidth = '50px'; // Adjust size as needed
                weatherImage.style.height = 'auto'; // Maintain aspect ratio

                // Append temperature, time, and image to the box
                box.appendChild(tempSpan);
                box.appendChild(timeParagraph);
                box.appendChild(weatherImage); // Append weather image

                // Append box to the container
                forecastContainer.appendChild(box);
            });

            // Highlight the current hour box after creating the forecast boxes
            highlightCurrentHourBox();
        },
        error: function(error) {
            console.log(error);
        }
    });
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            x.innerHTML = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            x.innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            x.innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            x.innerHTML = "An unknown error occurred.";
            break;
    }
}
