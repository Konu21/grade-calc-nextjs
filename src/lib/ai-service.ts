interface GradeAnalysis {
  name: string;
  credits: number;
  difficulty: string;
  grade: number;
  completed: boolean;
}

const FALLBACK_MESSAGE =
  "AI analysis is temporarily unavailable. Please try again later.";

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
  
  🧠 Provide recommendations ONLY for *IN PROGRESS* subjects.
  Prioritize by: 1) Lower grades, 2) Fewer credits, 3) Higher difficulty.
  Give maximum 5 concise recommendations.`;
};

export const getAIAnalysis = async (
  average: number,
  subjects: GradeAnalysis[]
): Promise<string> => {
  console.log("[AI Service] Starting Groq AI analysis...");

  if (!process.env.GROQ_API_KEY) {
    console.error("Groq API key not configured");
    return FALLBACK_MESSAGE;
  }

  const prompt = generatePrompt(average, subjects);
  console.log("Generated prompt:", prompt);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192", // Sau "mixtral-8x7b-32768" pentru Mixtral
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 250,
          top_p: 0.9,
        }),
      }
    );

    if (!response.ok) {
      console.error("Groq API error:", await response.text());
      return FALLBACK_MESSAGE;
    }

    const data = await response.json();
    const advice =
      data.choices[0]?.message?.content?.trim() || FALLBACK_MESSAGE;

    console.log("AI Advice:", advice);
    return advice;
  } catch (error) {
    console.error("Groq request failed:", error);
    return FALLBACK_MESSAGE;
  }
};
