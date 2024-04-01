import express from 'express';

const app = express();

// Function to generate random integer within a range
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Initialize variables to track the current state
let currentInning = 1;
let currentBatterNumber = 1;

// Route to handle GET requests to the root endpoint
app.get('/', (req, res) => {
  // Generate random data
  const jsonData = [{
    "Home": getRandomInt(0, 10),
    "Away": getRandomInt(0, 10),
    "HomeErrors": getRandomInt(0, 3),
    "AwayErrors": getRandomInt(0, 3),
    "HomeHits": getRandomInt(0, 15),
    "AwayHits": getRandomInt(0, 15),
    "Ball": getRandomInt(0, 4),
    "Strike": getRandomInt(0, 2),
    "Out": getRandomInt(0, 2),
    // Include Inning field only when updateInning query parameter is true
    ...(req.query.updateInning === 'true' ? { "Inning": currentInning } : {}),
    // Include BatterNumber field only when updateBatter query parameter is true
    ...(req.query.updateBatter === 'true' ? { "BatterNumber": currentBatterNumber } : {}),
    // Include Score fields conditionally
    ...(req.query.showScores === 'true' ? {
      "HomeScore1": "",
      "AwayScore1": "",
      "HomeScore2": "",
      "AwayScore2": "",
      "HomeScore3": "",
      "AwayScore3": "",
      "HomeScore4": "",
      "AwayScore4": "",
      "HomeScore5": "",
      "AwayScore5": "",
      "HomeScore6": "",
      "AwayScore6": "",
      "HomeScore7": "",
      "AwayScore7": "",
      "HomeScore8": "",
      "AwayScore8": "",
      "HomeScore9": "",
      "AwayScore9": "",
      "HomeScore10": "",
      "AwayScore10": ""
    } : {})
  }];

  // Update inning when it's changed (for demonstration, change inning every 3 requests)
  if (req.query.updateInning && req.query.updateInning === 'true') {
    currentInning++;
  }

  // Update batter number when a new batter is up (for demonstration, change batter every 5 requests)
  if (req.query.updateBatter && req.query.updateBatter === 'true') {
    currentBatterNumber++;
    if (currentBatterNumber > 9) {
      currentBatterNumber = 1;
    }
  }

  res.json(jsonData); // Respond with the JSON data
});

// Start the server
const PORT = process.env.PORT || 8088;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
