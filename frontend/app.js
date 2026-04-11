// frontend/app.js

const BACKEND_URL = 'http://localhost:3000/latest-data';

// Function to fetch data from the backend
async function fetchData() {
    try {
        const response = await fetch(BACKEND_URL);
        const data = await response.json();
        updateUI(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Function to update UI dynamically
function updateUI(data) {
    const statusElement = document.getElementById('status');
    const indicatorElement = document.getElementById('indicator');

    if (data.status === 'safe') {
        statusElement.textContent = 'Safe';
        indicatorElement.style.backgroundColor = 'green';
    } else if (data.status === 'moderate') {
        statusElement.textContent = 'Moderate';
        indicatorElement.style.backgroundColor = 'yellow';
    } else if (data.status === 'unsafe') {
        statusElement.textContent = 'Unsafe';
        indicatorElement.style.backgroundColor = 'red';
    }
}

// Call fetchData every 5 seconds
setInterval(fetchData, 5000);

// Initial data fetch
fetchData();