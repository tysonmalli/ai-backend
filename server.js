const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "db21e45c3703cae770116b29a778de5d8f46a1f7711e1e77b892b8c6b512c29e",
        input: {
          prompt: prompt,
          width: 512,
          height: 512
        }
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    let prediction = response.data;

    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise((r) => setTimeout(r, 2000));
      const result = await axios.get(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`
          }
        }
      );
      prediction = result.data;
    }

    if (prediction.status === "succeeded") {
      res.json({ image: prediction.output[0] });
    } else {
      res.status(500).json({ error: "Image generation failed" });
    }
  } catch (e) {
    console.error("Generation error:", e.response?.data || e.message);
    res.status(500).json({ error: "Error generating image", details: e.message });
  }
});

app.listen(5000, () => {
  console.log("Backend server started!");
});
