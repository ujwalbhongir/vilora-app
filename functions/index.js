const functions = require('firebase-functions/v2');
const express = require('express');
const axios = require('axios');
const app = express();

require('dotenv').config();

const geminiKey = process.env.GEMINI_KEY;
const openWeatherKey = process.env.OPENWEATHER_API_KEY;
const newsKey = process.env.NEWS_KEY;

// Middleware to check authentication
const checkAuth = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'unauthenticated', message: 'Authentication required.' });
  }
  // Note: For 2nd Gen, you'll need to verify Firebase ID tokens manually
  // Use firebase-admin to verify tokens (example omitted for brevity)
  next();
};

// getGeminiResponse
app.post('/getGeminiResponse', checkAuth, async (req, res) => {
  if (!geminiKey) {
    return res.status(400).json({ error: 'failed-precondition', message: 'Missing Gemini API key.' });
  }
  const { chatHistory } = req.body;
  if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
    return res.status(400).json({ error: 'invalid-argument', message: 'chatHistory must be a non-empty array.' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`;
  const payload = {
    contents: chatHistory,
    systemInstruction: { parts: [{ text: 'Your name is Vilora. You are a helpful AI assistant.' }] },
  };

  try {
    const response = await axios.post(apiUrl, payload);
    const candidate = response.data?.candidates?.[0];
    if (candidate?.content?.parts?.[0]?.text) {
      res.json({ text: candidate.content.parts[0].text });
    } else {
      res.status(404).json({ error: 'not-found', message: 'Invalid response from Gemini.' });
    }
  } catch (error) {
    console.error('Gemini error:', error.message, error.response?.data);
    res.status(500).json({ error: 'internal', message: 'Gemini API call failed.' });
  }
});

// getWeather
app.post('/getWeather', checkAuth, async (req, res) => {
  if (!openWeatherKey) {
    return res.status(400).json({ error: 'failed-precondition', message: 'Missing OpenWeather API key.' });
  }
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'invalid-argument', message: 'latitude and longitude must be numbers.' });
  }

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherKey}&units=metric`;

  try {
    const response = await axios.get(apiUrl);
    res.json({
      weather: {
        temperature: response.data.main.temp,
        windspeed: response.data.wind.speed,
      },
    });
  } catch (error) {
    console.error('Weather API error:', error.message, error.response?.data);
    res.status(500).json({ error: 'internal', message: 'Weather API call failed.' });
  }
});

// getNews
app.post('/getNews', checkAuth, async (req, res) => {
  if (!newsKey) {
    return res.status(400).json({ error: 'failed-precondition', message: 'Missing News API key.' });
  }
  const { country } = req.body;
  if (typeof country !== 'string' || country.length !== 2) {
    return res.status(400).json({ error: 'invalid-argument', message: 'A 2-letter country code is required.' });
  }

  const apiUrl = `https://newsapi.org/v2/top-headlines?country=${country.toLowerCase()}&apiKey=${newsKey}`;

  try {
    const response = await axios.get(apiUrl);
    const articles = response.data.articles.slice(0, 5).map((article) => ({
      title: article.title,
      url: article.url,
    }));
    res.json({ articles });
  } catch (error) {
    console.error('News API error:', error.message, error.response?.data);
    res.status(500).json({ error: 'internal', message: 'News API call failed.' });
  }
});

// Export all as a single HTTP function
exports.api = functions.https.onRequest(app);

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}`));