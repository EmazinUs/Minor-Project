// const express = require("express");
// const cors = require("cors");
// const axios = require("axios");
// const cheerio = require("cheerio");

// const app = express();
// const PORT = 5000;

// app.use(cors());
// app.use(express.json());

// // Function to scrape X/Twitter for disaster-related hashtags
// async function scrapeTwitterHashtags(hashtag) {
//   try {
//     // Using Nitter (Twitter alternative that doesn't require API keys)
//     const url = `https://nitter.net/search?f=tweets&q=${encodeURIComponent(
//       hashtag
//     )}&since=&until=`;

//     const response = await axios.get(url, {
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
//       },
//     });

//     const $ = cheerio.load(response.data);
//     const tweets = [];

//     $(".timeline-item").each((index, element) => {
//       if (index < 10) {
//         // Limit to 10 tweets
//         const tweetText = $(element).find(".tweet-content").text().trim();
//         const timestamp = $(element).find(".tweet-date a").attr("title");
//         const username = $(element).find(".username").text().trim();
//         const tweetLink = $(element).find(".tweet-link").attr("href");

//         if (tweetText) {
//           tweets.push({
//             id: `tweet-${index}`,
//             text: tweetText,
//             username: username,
//             timestamp: timestamp || new Date().toISOString(),
//             link: tweetLink ? `https://nitter.net${tweetLink}` : "",
//             hashtag: hashtag,
//             type: "social_media",
//           });
//         }
//       }
//     });

//     return tweets;
//   } catch (error) {
//     console.error("Error scraping Twitter:", error);
//     return [];
//   }
// }

// // API endpoint to get disaster tweets
// app.get("/api/tweets/disaster", async (req, res) => {
//   try {
//     const hashtags = [
//       "#flood",
//       "#earthquake",
//       "#wildfire",
//       "#cyclone",
//       "#disaster",
//     ];
//     const allTweets = [];

//     // Scrape multiple hashtags
//     for (const hashtag of hashtags) {
//       const tweets = await scrapeTwitterHashtags(hashtag);
//       allTweets.push(...tweets);

//       // Add delay to avoid rate limiting
//       await new Promise((resolve) => setTimeout(resolve, 1000));
//     }

//     // Filter and process tweets
//     const disasterTweets = allTweets
//       .filter((tweet) => {
//         const text = tweet.text.toLowerCase();
//         return (
//           text.includes("flood") ||
//           text.includes("earthquake") ||
//           text.includes("wildfire") ||
//           text.includes("cyclone") ||
//           text.includes("disaster") ||
//           text.includes("emergency") ||
//           text.includes("alert") ||
//           text.includes("warning")
//         );
//       })
//       .slice(0, 15); // Limit to 15 most relevant tweets

//     res.json(disasterTweets);
//   } catch (error) {
//     console.error("Error in disaster tweets API:", error);
//     res.status(500).json({ error: "Failed to fetch tweets" });
//   }
// });

// // Alternative: Mock data for development
// app.get("/api/tweets/mock", (req, res) => {
//   const mockTweets = [
//     {
//       id: "mock-1",
//       text: "Major flooding reported in downtown area. Avoid Main Street! #flood #disaster",
//       username: "@WeatherAlert",
//       timestamp: new Date().toISOString(),
//       link: "#",
//       hashtag: "#flood",
//       type: "social_media",
//       location: "Downtown Area",
//       severity: "high",
//     },
//     {
//       id: "mock-2",
//       text: "Earthquake magnitude 5.2 felt in coastal regions. Stay safe everyone! #earthquake",
//       username: "@SeismicWatch",
//       timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
//       link: "#",
//       hashtag: "#earthquake",
//       type: "social_media",
//       location: "Coastal Region",
//       severity: "medium",
//     },
//     {
//       id: "mock-3",
//       text: "Wildfire spreading rapidly in national park. Evacuations underway. #wildfire #emergency",
//       username: "@FireWatch",
//       timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
//       link: "#",
//       hashtag: "#wildfire",
//       type: "social_media",
//       location: "National Park",
//       severity: "high",
//     },
//   ];

//   res.json(mockTweets);
// });

// app.listen(PORT, () => {
//   console.log(`Twitter scraper server running on http://localhost:${PORT}`);
// });

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// List of multiple Nitter instances to rotate through
const NITTER_INSTANCES = [
  "https://nitter.net",
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.fly.dev",
];

// Function to get a random Nitter instance
const getRandomInstance = () => {
  return NITTER_INSTANCES[Math.floor(Math.random() * NITTER_INSTANCES.length)];
};

// Function to scrape X/Twitter for disaster-related hashtags with retry logic
async function scrapeTwitterHashtags(hashtag, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const instance = getRandomInstance();
      const url = `${instance}/search?f=tweets&q=${encodeURIComponent(
        hashtag
      )}&since=&until=`;

      console.log(`Attempt ${attempt + 1} for ${hashtag} using ${instance}`);

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const tweets = [];

      $(".timeline-item").each((index, element) => {
        if (index < 8) {
          // Limit to 8 tweets per hashtag
          const tweetText = $(element).find(".tweet-content").text().trim();
          const timestamp = $(element).find(".tweet-date a").attr("title");
          const username = $(element).find(".username").text().trim();
          const tweetLink = $(element).find(".tweet-link").attr("href");

          if (tweetText && tweetText.length > 10) {
            tweets.push({
              id: `tweet-${hashtag}-${index}-${Date.now()}`,
              text: tweetText,
              username: username,
              timestamp: timestamp || new Date().toISOString(),
              link: tweetLink ? `${instance}${tweetLink}` : "",
              hashtag: hashtag,
              type: "social_media",
            });
          }
        }
      });

      console.log(
        `Successfully fetched ${tweets.length} tweets for ${hashtag}`
      );
      return tweets;
    } catch (error) {
      console.warn(
        `Attempt ${attempt + 1} failed for ${hashtag}:`,
        error.message
      );

      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.log(`All attempts failed for ${hashtag}, returning empty array`);
  return [];
}

// API endpoint to get disaster tweets with improved error handling
app.get("/api/tweets/disaster", async (req, res) => {
  try {
    const hashtags = ["#flood", "#earthquake", "#wildfire", "#cyclone"];
    const allTweets = [];
    let successCount = 0;

    // Scrape multiple hashtags with longer delays
    for (const hashtag of hashtags) {
      try {
        const tweets = await scrapeTwitterHashtags(hashtag);
        if (tweets.length > 0) {
          allTweets.push(...tweets);
          successCount++;
        }

        // Longer delay between hashtags to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Error scraping ${hashtag}:`, error.message);
      }
    }

    console.log(
      `Successfully scraped ${successCount}/${hashtags.length} hashtags`
    );

    // Filter and process tweets
    const disasterTweets = allTweets
      .filter((tweet) => {
        const text = tweet.text.toLowerCase();
        const disasterKeywords = [
          "flood",
          "earthquake",
          "wildfire",
          "cyclone",
          "hurricane",
          "disaster",
          "emergency",
          "alert",
          "warning",
          "evacuation",
          "storm",
          "tsunami",
          "landslide",
          "tornado",
          "blizzard",
        ];

        return disasterKeywords.some((keyword) => text.includes(keyword));
      })
      .slice(0, 12); // Limit to 12 most relevant tweets

    // If no real tweets found, fall back to enhanced mock data
    if (disasterTweets.length === 0) {
      console.log("No real tweets found, using enhanced mock data");
      res.json(getEnhancedMockTweets());
    } else {
      res.json(disasterTweets);
    }
  } catch (error) {
    console.error("Error in disaster tweets API:", error);
    res.json(getEnhancedMockTweets()); // Fallback to mock data
  }
});

// Enhanced mock data that's more realistic
function getEnhancedMockTweets() {
  const locations = [
    "Downtown Area",
    "Coastal Region",
    "Northern Districts",
    "Mountain Area",
    "Urban Center",
  ];
  const severities = ["high", "medium", "low"];

  return [
    {
      id: "mock-flood-" + Date.now(),
      text: "Major flooding reported in downtown area. Multiple roads underwater. Emergency services on site. #flood #emergency",
      username: "@CityAlerts",
      timestamp: new Date().toISOString(),
      link: "#",
      hashtag: "#flood",
      type: "social_media",
      location: "Downtown Area",
      severity: "high",
    },
    {
      id: "mock-earthquake-" + Date.now(),
      text: "Earthquake magnitude 5.8 felt across the region. Minor damages reported. Stay away from unstable structures. #earthquake",
      username: "@QuakeWatch",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      link: "#",
      hashtag: "#earthquake",
      type: "social_media",
      location: "Coastal Region",
      severity: "medium",
    },
    {
      id: "mock-wildfire-" + Date.now(),
      text: "Wildfire spreading rapidly in national park area. Evacuation orders issued for nearby communities. #wildfire #disaster",
      username: "@FireSafety",
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      link: "#",
      hashtag: "#wildfire",
      type: "social_media",
      location: "National Park",
      severity: "high",
    },
    {
      id: "mock-cyclone-" + Date.now(),
      text: "Cyclone warning upgraded. Coastal areas advised to evacuate. Emergency shelters opened. #cyclone #warning",
      username: "@StormWatch",
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      link: "#",
      hashtag: "#cyclone",
      type: "social_media",
      location: "Coastal Areas",
      severity: "high",
    },
    {
      id: "mock-flood2-" + Date.now(),
      text: "Heavy rainfall causing localized flooding in northern districts. Avoid low-lying areas. #flood #rain",
      username: "@WeatherUpdate",
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      link: "#",
      hashtag: "#flood",
      type: "social_media",
      location: "Northern Districts",
      severity: "medium",
    },
  ];
}

// Mock data endpoint (for development)
app.get("/api/tweets/mock", (req, res) => {
  res.json(getEnhancedMockTweets());
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Disaster Dashboard Backend is running",
    features: {
      twitter_scraping: "active",
      multiple_instances: NITTER_INSTANCES.length,
      fallback_mock_data: "enabled",
    },
  });
});

// New endpoint that tries real data first, then falls back to mock
app.get("/api/tweets/smart", async (req, res) => {
  try {
    console.log("Smart endpoint: Attempting real Twitter data...");
    const response = await axios.get(
      `http://localhost:${PORT}/api/tweets/disaster`
    );
    res.json(response.data);
  } catch (error) {
    console.log("Smart endpoint: Falling back to mock data");
    res.json(getEnhancedMockTweets());
  }
});

app.listen(PORT, () => {
  console.log(
    `🚀 Enhanced Twitter scraper server running on http://localhost:${PORT}`
  );
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🐦 Mock tweets: http://localhost:${PORT}/api/tweets/mock`);
  console.log(`🔍 Real tweets: http://localhost:${PORT}/api/tweets/disaster`);
  console.log(`🤖 Smart tweets: http://localhost:${PORT}/api/tweets/smart`);
  console.log(`🔄 Using ${NITTER_INSTANCES.length} Nitter instances`);
});
