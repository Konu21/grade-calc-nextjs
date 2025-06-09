interface GradeAnalysis {
  name: string;
  credits: number;
  difficulty: string;
  grade: number;
  completed: boolean;
}

const FALLBACK_MESSAGE =
  "AI analysis is temporarily unavailable. Please try again later.";

const SELECTED_MODEL = "HuggingFaceH4/zephyr-7b-beta";

const generatePrompt = (average: number, subjects: GradeAnalysis[]) => {
  const pendingSubjects = subjects.filter((s) => !s.completed);
  const completedSubjects = subjects.filter((s) => s.completed);

  const formatSubject = (s: GradeAnalysis, status: string) =>
    `- ${s.name}: Grade ${s.grade || "not graded"} (${
      s.credits
    } credits, difficulty ${s.difficulty}) - ${status}`;

  const allSubjectsText = [
    ...completedSubjects.map((s) => formatSubject(s, "COMPLETED")),
    ...pendingSubjects.map((s) => formatSubject(s, "IN PROGRESS")),
  ].join("\n");

  return `Analyze academic performance and provide specific advice in English:
  
  Academic Status:
  - Overall Average: ${average.toFixed(2)}
  - Remaining Subjects (incomplete): ${pendingSubjects.length}
  - Completed Subjects: ${completedSubjects.length}
  
  📚 All Subjects:
  ${allSubjectsText}
  
  🧠 Provide recommendations ONLY for * IN PROGRESS * subjects
  
  Prioritize incomplete subjects based on:
  1. Lower grades
  2. Fewer credit points
  3. Higher difficulty
  
  Limit to maximum 5 recommendations.`;
};

export const getAIAnalysis = async (
  average: number,
  subjects: GradeAnalysis[]
): Promise<string> => {
  console.log("[AI Service] Starting AI analysis...");
  console.log("[AI Service] Input data:", { average, subjects });

  if (!process.env.NEXT_PUBLIC_HF_TOKEN) {
    console.error("[AI Service] Error: Hugging Face token not configured");
    return FALLBACK_MESSAGE;
  }

  const prompt = generatePrompt(average, subjects);
  console.log("[AI Service] Generated prompt:", prompt);
  console.log("[AI Service] Using model:", SELECTED_MODEL);

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${SELECTED_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false,
          },
        }),
      }
    );

    console.log("[AI Service] API Response status:", response.status);

    if (!response.ok) {
      console.error("[AI Service] API Error response:", await response.text());
      return FALLBACK_MESSAGE;
    }

    const result = await response.json();
    console.log("[AI Service] Raw API response:", result);

    let advice = "";

    if (Array.isArray(result) && result.length > 0) {
      advice = result[0]?.generated_text || "";
    } else if (typeof result === "object") {
      advice = result.generated_text || "";
    }

    if (!advice) {
      console.log("[AI Service] No valid response from model");
      return FALLBACK_MESSAGE;
    }

    const formattedAdvice = advice
      .trim()
      .split("\n")
      .filter(Boolean)
      .join("\n");

    console.log("[AI Service] Final formatted advice:", formattedAdvice);
    return formattedAdvice;
  } catch (error) {
    console.error("[AI Service] Error in AI analysis:", error);
    return FALLBACK_MESSAGE;
  }
};
