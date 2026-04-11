PROJECT: Smart Eco-Water Grid
// GOAL: Build a backend API for an AI-powered decentralized water management system

// REQUIREMENTS:
// 1. Create an Express server running on port 3000
// 2. Enable CORS and JSON parsing
// 3. Create a POST endpoint `/sensor-data`
//    - Accept JSON input with fields: ph (number), turbidity (number)
//    - Validate inputs (ph: 0–14, turbidity >= 0)
// 4. Create a GET endpoint `/latest-data`
//    - Return the latest processed water data
// 5. Integrate AI decision logic:
//    - If ph < 6.5 OR ph > 8.5 OR turbidity > 10 → status = "unsafe", action = "re-treat"
//    - If turbidity between 5–10 → status = "moderate", action = "irrigation"
//    - Else → status = "safe", action = "reuse"
// 6. Store latest data in memory (no database needed)
// 7. Return response with:
//    {
//      ph,
//      turbidity,
//      status,
//      action
//    }

// IMPORTANT:
// - Write clean, modular, readable code
// - Handle errors properly
// - Do not use any database
// - Keep everything simple and beginner-friendly

// TASK:
// Generate full working Express server code based on above requirements
