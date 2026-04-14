# 🌊 Smart Eco-Water Grid
### AI-Powered Decentralized Water Management System

> Transforming wastewater into a sustainable resource using AI, IoT, and nature-based systems.

---

## 📌 Overview

Smart Eco-Water Grid is an intelligent, decentralized water management system designed to address the global challenge of unsafe water and inefficient wastewater treatment.

Instead of relying on expensive centralized sewage treatment plants, this system creates a **network of constructed wetlands (nodes)** connected both physically and digitally. Each node monitors water quality and collaborates with others to optimize treatment and reuse.

The system integrates:
- 🌿 Nature-based filtration (constructed wetlands)
- 📡 IoT-based real-time monitoring
- 🧠 AI-driven decision-making
- 🌐 Smart routing across a grid network

---

## ❗ Problem Statement

Access to clean and safe water remains a major global issue.

### Key challenges:
- 🚫 High cost of centralized treatment plants  
- 📉 Lack of real-time monitoring systems  
- 🦠 Waterborne diseases due to unsafe water  
- 🌍 Environmental damage from untreated wastewater  

Traditional systems are:
- Energy-intensive  
- Difficult to scale  
- Not suitable for rural or decentralized regions  

---

## 💡 Solution

Smart Eco-Water Grid introduces a **cluster-based wetland network** where:

- Each **node (wetland)** treats wastewater naturally  
- IoT sensors continuously monitor water quality  
- An AI engine classifies water and decides its usage  
- Water is intelligently routed across nodes  

### 🧠 Decision Logic:
- ✅ Safe → Storage / Reuse  
- ⚠️ Moderate → Irrigation  
- ❌ Unsafe → Re-treatment  

---

## ⚙️ How It Works

1. 📡 Sensors collect data (pH, turbidity, etc.)
2. 🔗 Data is sent to backend APIs
3. 🧠 AI analyzes water quality
4. 🔄 System determines routing
5. 📊 Dashboard displays real-time updates

---

## 🏗️ System Architecture

### 🔹 Core Components

- **IoT Layer**
  - Sensors: pH, turbidity
  - Simulated data generation (for prototype)

- **Backend**
  - Node.js (Express)
  - API endpoints:
    - `/sensor-data`
    - `/latest-data`

- **AI Module**
  - Rule-based classification
  - Expandable to ML models

- **Frontend Dashboard**
  - Real-time monitoring
  - Displays status & decisions

- **Grid Network**
  - Cluster-based node design
  - Mesh routing capability

---

## 🚀 Features

- 📊 Real-time water monitoring  
- 🧠 AI-based classification system  
- 🔄 Intelligent water routing  
- 🌿 Nature-based treatment system  
- ⚡ Low-cost and energy-efficient  
- 🔁 Self-healing decentralized grid  

---

## 🧪 Prototype & Demo

The project includes a working prototype with:

- Live IoT data simulation  
- Functional backend APIs  
- AI-based water classification  
- Interactive dashboard  

### Demo Scenarios:
- ✅ Normal operation  
- 🚨 Pollution spike detection  
- 🔄 Automatic rerouting  

---

## 🌍 Impact

### 🏥 Health Impact
- Reduces waterborne diseases  
- Improves sanitation  

### 🌱 Environmental Impact
- Reduces pollution  
- Promotes water reuse  
- Low energy consumption  

### 💰 Economic Impact
- Low setup cost  
- Scalable deployment  
- Reduced maintenance  

---

## 🎯 Alignment with Global Goals

- 🌊 Clean Water & Sanitation (SDG 6)  
- 🏥 Good Health & Well-being (SDG 3)  
- 🌱 Sustainable Infrastructure  

---

## 📈 Scalability

- Modular node expansion  
- Works for villages → cities  
- Supports smart city integration  
- Future-ready for AI upgrades  

---

## 🔮 Future Scope

- 🤖 Machine learning for prediction  
- 📱 Mobile app for alerts  
- ☀️ Solar-powered nodes  
- 🗺️ GIS-based smart routing  
- 🏙️ Smart city deployment  

---

## ⚙️ Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy the example env file:
```bash
cp .env.example .env
```
The default values in `.env.example` work for local development.

### 3. Start the server
```bash
npm start
```

### 4. (Optional) Run IoT simulator in a second terminal
```bash
node iot/simulate.js
```

Open `http://localhost:3000` in your browser.

---

## 🛠️ Tech Stack

- **Backend:** Node.js (Express)  
- **Frontend:** HTML, CSS, JavaScript  
- **AI Logic:** Rule-based system  
- **IoT:** Simulated data (expandable to ESP32)  

---

## 📂 Project Structure
smart-eco-water-grid/
│
├── backend/ # API server
├── ai/ # Decision logic
├── iot/ # Sensor simulation
├── frontend/ # Dashboard UI
├── confg/ # Constants and configs

---

## 🚧 Current Status

✅ Backend API complete and running
✅ AI classification and auto-routing active
✅ IoT sensor simulation running
✅ Frontend dashboard live

---

## 🧑‍💻 Author

**Name:** VKS  
**Role:** Developer / Researcher  

---

## 📽️ Demo Video

👉 Demo video coming soon


---

## 🏆 Hackathon Submission

This project is designed as a real-world scalable solution aligned with sustainability, AI, and decentralized infrastructure themes.

---

## ⚡ Inspiration

The idea is inspired by the need for:
- Affordable water solutions  
- Sustainable infrastructure  
- Smart and adaptive systems  
