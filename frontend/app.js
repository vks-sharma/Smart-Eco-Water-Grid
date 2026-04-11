// frontend/app.js

// Function to fetch data from the backend
async function fetchData() {
    try {
        const response = await fetch('http://backend-url/api/data'); // Replace with actual backend URL
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
    } else if (data.status === 'warning') {
        statusElement.textContent = 'Warning';
        indicatorElement.style.backgroundColor = 'yellow';
    } else if (data.status === 'unsafe') {
        statusElement.textContent = 'Unsafe';
        indicatorElement.style.backgroundColor = 'red';
    }
}

// Call fetchData every 5 minutes
setInterval(fetchData, 5 * 60 * 1000);

// Initial data fetch
fetchData();