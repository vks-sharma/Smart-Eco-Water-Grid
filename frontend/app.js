// Append Deployment Map and Notification System Logic

// Function to inject Leaflet if not loaded
(function() {
    if (typeof L === 'undefined') {
        var leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(leafletCSS);

        var leafletJS = document.createElement('script');
        leafletJS.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
        document.body.appendChild(leafletJS);
    }
})();

// Initialize the map inside #deploymentMap
var map = L.map('deploymentMap').setView([51.505, -0.09], 13);

// Load tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Poll for deployment status
setInterval(function() {
    fetch('/deployment-status')
        .then(response => response.json())
        .then(data => {
            renderNodes(data.nodes);
            renderPipes(data.pipes);
        });
}, 5000);

// Render nodes as markers
function renderNodes(nodes) {
    nodes.forEach(node => {
        L.marker([node.lat, node.lng]).addTo(map);
    });
}

// Render pipes as polylines
function renderPipes(pipes) {
    pipes.forEach(pipe => {
        var latLngs = pipe.path.map(coord => [coord.lat, coord.lng]);
        L.polyline(latLngs, { color: 'blue' }).addTo(map);
    });
}

// Display alerts in #notificationPanel
function showAlert(message) {
    var notificationPanel = document.getElementById('notificationPanel');
    var alert = document.createElement('div');
    alert.className = 'alert alert-warning';
    alert.innerText = message;
    notificationPanel.appendChild(alert);
}

// Sidebar nav event to show/hide deployment section
document.getElementById('sidebarNav').addEventListener('click', function() {
    var deploymentSection = document.getElementById('deploymentSection');
    deploymentSection.style.display = deploymentSection.style.display === 'none' ? 'block' : 'none';
});

// Existing settings panel code untouched  

