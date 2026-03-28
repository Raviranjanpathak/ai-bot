exports.analyzeImage = async (req, res) => {
    try {
    const fileName = req.file.originalname;

    res.json({
      reply: `📸 Image received (${fileName}). Image AI is currently limited, but feature will be upgraded soon 🚀`
    });

  } catch (err) {
    res.json({ reply: "Image upload failed" });
  }
};
