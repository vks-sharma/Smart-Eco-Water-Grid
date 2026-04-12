// =========================
// GLOBALS
// =========================
let map;
let nodeLayer;
let linkLayer;
let currentNodes = [];

let turbidityChart, phChart;
let mapInitialized = false;

// =========================
// MAP INIT
// =========================
function initMap() {
    map = L.map('deploymentMap').setView([27.4924, 77.6737], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    nodeLayer = L.layerGroup().addTo(map);
    linkLayer = L.layerGroup().addTo(map);

    loadDeployment();

    setInterval(loadDeployment, 5000);
}

// =========================
// LOAD DEPLOYMENT
// =========================
function loadDeployment() {
    fetch('/deployment-status')
        .then(res => res.json())
        .then(data => {
            renderNodes(data.nodes);
            renderLinks(data.links);
            updateAI(data.ai);
            showAlerts(data.alerts);
        })
        .catch(err => console.error("Deployment error:", err));
}

// =========================
// NODES
// =========================
function renderNodes(nodes) {
    nodeLayer.clearLayers();
    currentNodes = nodes;

    nodes.forEach(node => {
        let color = node.type === 'wetland' ? 'green' : 'blue';

        if (node.quality < 0.65) color = 'red';

        L.circleMarker([node.lat, node.lng], {
            radius: 8,
            color: color
        })
        .addTo(nodeLayer)
        .bindPopup(`
            <b>${node.name}</b><br>
            Flow: ${node.flow.toFixed(2)}<br>
            Quality: ${node.quality.toFixed(2)}
        `);
    });
}

// =========================
// LINKS
// =========================
function renderLinks(links) {
    linkLayer.clearLayers();

    links.forEach(link => {
        const from = currentNodes.find(n => n.id === link.from);
        const to = currentNodes.find(n => n.id === link.to);

        if (from && to) {
            L.polyline([
                [from.lat, from.lng],
                [to.lat, to.lng]
            ], {
                color: link.status === 'closed' ? 'red' : 'gray',
                weight: 3
            }).addTo(linkLayer);
        }
    });
}

// =========================
// DASHBOARD UPDATE
// =========================
function updateDashboard() {
    fetch('/latest-data')
        .then(res => res.json())
        .then(data => {

            document.getElementById('phValue').innerText = data.ph.toFixed(2);
            document.getElementById('turbidityValue').innerText = data.turbidity.toFixed(2);

            document.getElementById('tempValue').innerText =
                data.temperature ? data.temperature.toFixed(1) + "°C" : "--";

            document.getElementById('doValue').innerText =
                data.dissolvedOxygen ? data.dissolvedOxygen.toFixed(2) : "--";

            document.getElementById('statusValue').innerText =
                data.status.toUpperCase();

            showDashboardAlerts(data);
            updateCharts(data);

        })
        .catch(() => console.log("No data yet"));
}

// =========================
// ALERTS (Dashboard)
// =========================
function showDashboardAlerts(data) {
    const panel = document.getElementById('dashboardAlerts');
    panel.innerHTML = "";

    if (data.turbidity > 10) createAlert(panel, "High turbidity!");
    if (data.ph < 6.5 || data.ph > 8.5) createAlert(panel, "Unsafe pH!");
    if (data.temperature && data.temperature > 30) createAlert(panel, "High temperature!");
    if (data.dissolvedOxygen && data.dissolvedOxygen < 5) createAlert(panel, "Low oxygen!");
}

function createAlert(panel, msg) {
    const div = document.createElement('div');
    div.className = "notification-banner danger";
    div.innerText = msg;
    panel.appendChild(div);
}

// =========================
// DEPLOYMENT ALERTS
// =========================
function showAlerts(alerts) {
    const panel = document.getElementById('notificationPanel');
    panel.innerHTML = "";

    alerts.forEach(alert => {
        const div = document.createElement('div');
        div.className = "notification-banner danger";
        div.innerText = alert.message;
        panel.appendChild(div);
    });
}

// =========================
// AI PANEL
// =========================
function updateAI(ai) {
    const list = document.getElementById('aiList');
    list.innerHTML = "";

    ai.recommendations.forEach(r => {
        const li = document.createElement('li');
        li.innerText = r;
        list.appendChild(li);
    });
}

// =========================
// CHARTS INIT
// =========================
function initCharts() {
    const ctx1 = document.getElementById('turbidityChart').getContext('2d');
    const ctx2 = document.getElementById('phChart').getContext('2d');

    turbidityChart = new Chart(ctx1, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Turbidity', data: [] }] },
        options: { animation: false }
    });

    phChart = new Chart(ctx2, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'pH', data: [] }] },
        options: { animation: false }
    });
}

// =========================
// CHART UPDATE
// =========================
function updateCharts(data) {
    const time = new Date().toLocaleTimeString();

    turbidityChart.data.labels.push(time);
    turbidityChart.data.datasets[0].data.push(data.turbidity);

    phChart.data.labels.push(time);
    phChart.data.datasets[0].data.push(data.ph);

    if (turbidityChart.data.labels.length > 10) {
        turbidityChart.data.labels.shift();
        turbidityChart.data.datasets[0].data.shift();
        phChart.data.labels.shift();
        phChart.data.datasets[0].data.shift();
    }

    turbidityChart.update();
    phChart.update();
}

// =========================
// AUTO REFRESH
// =========================
setInterval(updateDashboard, 5000);
