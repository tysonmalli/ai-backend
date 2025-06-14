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
        version: "7702fd907cf82c9483f83e61403f77d085e020b063e7e496e90eef64dc92979bdc", // ✅ Updated version ID
        input: {
          prompt: prompt,
          width: 768,
          height: 768,
          refine: "expert_ensemble_refiner",
          apply_watermark: false,
          num_inference_steps: 25
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
  console.log("✅ Backend server started on port 5000!");
});
