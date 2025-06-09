"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAIAnalysis } from "@/lib/ai-service";
import { Subject } from "@/types/subjects";

type Difficulty = "easy" | "medium" | "hard";

interface GradeData {
  subjectId: string;
  grade: number;
  completed: boolean;
}

interface AIAnalysis {
  advice: string;
  loading: boolean;
}

const TOTAL_CREDITS = 60;
const DIFFICULTY_COLORS = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

export function GradeCalculator() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Record<string, GradeData>>({});
  const [isSimulation, setIsSimulation] = useState(true);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis>({
    advice: "",
    loading: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUserSubjects();
    // Load saved grades from localStorage if in simulation mode
    const savedGrades = localStorage.getItem("simulatedGrades");
    if (savedGrades && isSimulation) {
      setGrades(JSON.parse(savedGrades));
    }
  }, []);

  const fetchUserSubjects = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userConfig } = await supabase
        .from("user_study_config")
        .select("study_cycle_id")
        .eq("user_id", user.id)
        .single();

      if (!userConfig) return;

      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .eq("study_cycle_id", userConfig.study_cycle_id);

      if (subjectsData) {
        setSubjects(subjectsData);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subjects. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGradeChange = (subjectId: string, value: string) => {
    // Allow empty value for deletion
    if (value === "") {
      const newGrades = {
        ...grades,
        [subjectId]: {
          ...grades[subjectId],
          subjectId,
          grade: 0,
          completed: false, // Reset completed status when grade is deleted
        },
      };
      setGrades(newGrades);

      if (isSimulation) {
        localStorage.setItem("simulatedGrades", JSON.stringify(newGrades));
      } else {
        handleSaveGrade(subjectId, 0, false);
      }
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 10) return;

    const newGrades = {
      ...grades,
      [subjectId]: {
        ...grades[subjectId],
        subjectId,
        grade: numericValue,
        completed: grades[subjectId]?.completed || false,
      },
    };
    setGrades(newGrades);

    if (isSimulation) {
      localStorage.setItem("simulatedGrades", JSON.stringify(newGrades));
    } else {
      handleSaveGrade(subjectId, numericValue, newGrades[subjectId].completed);
    }
  };

  const handleSaveGrade = async (
    subjectId: string,
    grade: number,
    completed: boolean
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("grades").upsert({
        user_id: user.id,
        subject_id: subjectId,
        grade: grade,
        completed: completed,
      });

      toast({
        title: "Success",
        description: "Grade saved automatically!",
      });
    } catch (error) {
      console.error("Error saving grade:", error);
      toast({
        title: "Error",
        description: "Failed to save grade. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompletedChange = async (subjectId: string, checked: boolean) => {
    const newGrades = {
      ...grades,
      [subjectId]: {
        ...grades[subjectId],
        subjectId,
        completed: checked,
      },
    };
    setGrades(newGrades);

    if (isSimulation) {
      localStorage.setItem("simulatedGrades", JSON.stringify(newGrades));
    } else {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("grades").upsert({
          user_id: user.id,
          subject_id: subjectId,
          grade: grades[subjectId]?.grade || 0,
          completed: checked,
        });

        toast({
          title: "Success",
          description: "Grade saved successfully!",
        });
      } catch (error) {
        console.error("Error saving grade:", error);
        toast({
          title: "Error",
          description: "Failed to save grade. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const calculateAverage = () => {
    let weightedSum = 0;
    let totalCredits = 0;
    let completedCredits = 0;
    let totalPossibleCredits = 0;

    subjects.forEach((subject) => {
      totalPossibleCredits += subject.credits;
      const gradeData = grades[subject.id];

      if (gradeData?.grade !== undefined && gradeData.completed) {
        // Only count completed subjects
        completedCredits += subject.credits;
        weightedSum += gradeData.grade * subject.credits;
        totalCredits += subject.credits;
      }
    });

    return {
      currentAverage: totalCredits === 0 ? 0 : weightedSum / totalCredits,
      projectedAverage: totalCredits === 0 ? 0 : weightedSum / TOTAL_CREDITS,
      completedCredits,
      totalPossibleCredits,
      remainingCredits: TOTAL_CREDITS - completedCredits,
    };
  };

  const averageStats = calculateAverage();

  const getAIAdvice = async () => {
    if (!process.env.NEXT_PUBLIC_HF_TOKEN) return;

    setAIAnalysis((prev) => ({ ...prev, loading: true }));

    try {
      const subjectsAnalysis = subjects.map((subject) => ({
        name: subject.subject_name,
        credits: subject.credits,
        difficulty: subject.difficulty || "medium",
        grade: grades[subject.id]?.grade || 0,
        completed: grades[subject.id]?.completed || false,
      }));

      const advice = await getAIAnalysis(
        averageStats.currentAverage,
        subjectsAnalysis
      );

      setAIAnalysis({
        advice,
        loading: false,
      });
    } catch (error) {
      console.error("Error getting AI analysis:", error);
      setAIAnalysis({
        advice: "Failed to get AI analysis. Please try again later.",
        loading: false,
      });
      toast({
        title: "AI Analysis Error",
        description:
          "Could not get AI recommendations. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getDefaultDifficulty = (credits: number): Difficulty => {
    if (credits <= 4) return "easy";
    if (credits <= 8) return "medium";
    return "hard";
  };

  const handleDifficultyChange = (
    subjectId: string,
    difficulty: Difficulty
  ) => {
    // Update the subject's difficulty in the database
    if (!isSimulation) {
      updateSubjectDifficulty(subjectId, difficulty);
    }
  };

  const updateSubjectDifficulty = async (
    subjectId: string,
    difficulty: Difficulty
  ) => {
    try {
      const { error } = await supabase
        .from("subjects")
        .update({ difficulty })
        .eq("id", subjectId);

      if (error) throw error;

      // Update local subjects state
      setSubjects(
        subjects.map((subject) =>
          subject.id === subjectId ? { ...subject, difficulty } : subject
        )
      );

      toast({
        title: "Success",
        description: "Subject difficulty updated successfully!",
      });
    } catch (error) {
      console.error("Error updating difficulty:", error);
      toast({
        title: "Error",
        description: "Failed to update difficulty. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      {/* Header Section */}
      <h1 className="text-3xl font-bold text-center mb-8">Grade Calculator</h1>
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 mb-8">
        <Card className="p-4 md:p-6">
          <h2 className="text-2xl font-bold mb-4">Current Progress</h2>
          <div className="space-y-2">
            <div>
              <span className="text-4xl font-bold text-primary">
                {averageStats.currentAverage.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                Current Average
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p>Completed: {averageStats.completedCredits} credits</p>
              <p>Remaining: {averageStats.remainingCredits} credits</p>
              <p>
                Total Available: {averageStats.totalPossibleCredits} credits
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <h2 className="text-2xl font-bold mb-4">AI Analysis</h2>
          {aiAnalysis.loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing your performance...</span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {aiAnalysis.advice ? (
                aiAnalysis.advice.split("\n").map((line, index) => {
                  if (line.startsWith("Priority")) {
                    const [priority, rest] = line.split(":");
                    return (
                      <div key={index} className="mb-4">
                        <h3 className="text-lg font-semibold text-primary">
                          {priority}:
                        </h3>
                        <p className="text-primary mt-1">{rest}</p>
                      </div>
                    );
                  }
                  return (
                    line.trim() && (
                      <p key={index} className="text-primary">
                        {line}
                      </p>
                    )
                  );
                })
              ) : (
                <p className="text-sm text-primary">
                  Complete some subjects to get AI analysis
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <Button
            variant={isSimulation ? "default" : "outline"}
            onClick={() => setIsSimulation(true)}
            className="flex-1 md:flex-none"
          >
            Simulation Mode
          </Button>
          <Button
            variant={!isSimulation ? "default" : "outline"}
            onClick={() => setIsSimulation(false)}
            className="flex-1 md:flex-none"
          >
            Real Mode
          </Button>
        </div>

        <div>
          <Button
            variant="secondary"
            onClick={getAIAdvice}
            className="flex-1 md:flex-none"
            disabled={aiAnalysis.loading || averageStats.currentAverage === 0}
          >
            {aiAnalysis.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid gap-4 pb-10 md:grid-cols-2 mb-8">
        {subjects.map((subject) => (
          <Card
            key={subject.id}
            className={cn("p-4 ", {
              "border-green-500 border-2": grades[subject.id]?.grade >= 5,
              "border-red-500 border-2":
                grades[subject.id]?.grade > 0 && grades[subject.id]?.grade < 5,
            })}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-4 flex-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium break-words line-clamp-2">
                      {subject.subject_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Credits: {subject.credits}
                    </p>
                  </div>
                  <Select
                    defaultValue={
                      subject.difficulty ||
                      getDefaultDifficulty(subject.credits)
                    }
                    onValueChange={(value: Difficulty) =>
                      handleDifficultyChange(subject.id, value)
                    }
                  >
                    <SelectTrigger className="w-[100px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs",
                            DIFFICULTY_COLORS.easy
                          )}
                        >
                          Easy
                        </span>
                      </SelectItem>
                      <SelectItem value="medium">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs",
                            DIFFICULTY_COLORS.medium
                          )}
                        >
                          Medium
                        </span>
                      </SelectItem>
                      <SelectItem value="hard">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs",
                            DIFFICULTY_COLORS.hard
                          )}
                        >
                          Hard
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  className={cn("w-24 shrink-0", {
                    "border-green-500": grades[subject.id]?.grade >= 5,
                    "border-red-500":
                      grades[subject.id]?.grade > 0 &&
                      grades[subject.id]?.grade < 5,
                  })}
                  value={grades[subject.id]?.grade || ""}
                  onChange={(e) =>
                    handleGradeChange(subject.id, e.target.value)
                  }
                  placeholder="Grade"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={grades[subject.id]?.completed || false}
                    onCheckedChange={(checked) =>
                      handleCompletedChange(subject.id, checked as boolean)
                    }
                    disabled={!grades[subject.id]?.grade}
                  />
                  <span className="text-sm whitespace-nowrap">Completed</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
