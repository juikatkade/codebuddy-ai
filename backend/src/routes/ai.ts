import { Router } from 'express';

const router = Router();

router.post('/hint', async (req, res) => {
  try {
    const { problemText, currentCode, hintLevel } = req.body;
    
    // In a real application, we would call OpenAI or Gemini API here
    // using the provided problem context.
    
    // Mock response for now
    let response = "";
    switch(hintLevel) {
      case 0:
        response = "Observation: Look closely at the array constraints. Can we do this in O(N)?";
        break;
      case 1:
        response = "Approach: Try using a Two-Pointer technique starting from both ends of the array.";
        break;
      default:
        response = "Keep trying! You are on the right track.";
    }

    res.json({ hint: response, level: hintLevel });
  } catch (error) {
    console.error("AI Hint Error:", error);
    res.status(500).json({ error: "Failed to generate hint" });
  }
});

export default router;
