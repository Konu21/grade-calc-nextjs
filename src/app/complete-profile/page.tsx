"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type definitions for our data structures
interface AcademicYear {
  id: number;
  year_name: string;
}

interface Semester {
  id: number;
  semester_name: string;
}

interface StudyCycle {
  id: number;
  academic_year_id: number;
  semester_id: number;
}

export default function CompleteProfile() {
  // Form state management
  const [formData, setFormData] = useState({
    year: "",
    semester: "",
    rotation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state for dropdown options
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [, setStudyCycles] = useState<StudyCycle[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

  const router = useRouter();

  /**
   * Fetches initial data needed for the form (academic years, semesters, study cycles)
   * Uses Promise.all to fetch data in parallel for better performance
   */
  const fetchInitialData = useCallback(async () => {
    try {
      setFetchingData(true);
      setError(null);

      // Fetch all required data in parallel
      const [
        { data: yearsData, error: yearsError },
        { data: semestersData, error: semestersError },
        { data: studyCycleData, error: studyCycleError },
      ] = await Promise.all([
        supabase
          .from("academic_years")
          .select("id, year_name")
          .order("id", { ascending: true }),
        supabase
          .from("semesters")
          .select("id, semester_name")
          .order("id", { ascending: true }),
        supabase
          .from("study_cycles")
          .select("id, academic_year_id, semester_id")
          .order("id", { ascending: true }),
      ]);

      // Handle any errors from Supabase queries
      if (yearsError) throw yearsError;
      if (semestersError) throw semestersError;
      if (studyCycleError) throw studyCycleError;

      // Update state with fetched data
      setAcademicYears(yearsData || []);
      setSemesters(semestersData || []);
      setStudyCycles(studyCycleData || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load academic data"
      );
      console.error("Data loading error:", err);
    } finally {
      setFetchingData(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  /**
   * Handles form submission
   * 1. Validates user authentication
   * 2. Finds matching study cycle
   * 3. Updates user's study configuration in database
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || fetchingData || !isFormValid) return;

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user)
        throw userError || new Error("User not authenticated");

      const yearNum = parseInt(formData.year);

      // For years 4+, we don't need semester matching
      if (yearNum > 3) {
        // Find any study cycle for the selected year
        const { data: matchingCycles, error: cycleError } = await supabase
          .from("study_cycles")
          .select("id")
          .eq("academic_year_id", yearNum)
          .limit(1);

        if (cycleError || !matchingCycles?.[0]?.id) {
          throw (
            cycleError || new Error("No study cycle found for selected year")
          );
        }

        const { error: upsertError } = await supabase
          .from("user_study_config")
          .upsert(
            {
              user_id: user.id,
              study_cycle_id: matchingCycles[0].id,
            },
            {
              onConflict: "user_id",
            }
          );

        if (upsertError) throw upsertError;
        router.push("/dashboard");
        return;
      }

      // Original logic for years 1-3
      const semesterNum = parseInt(formData.semester);
      const { data: matchingCycles, error: cycleError } = await supabase
        .from("study_cycles")
        .select("id")
        .eq("academic_year_id", yearNum)
        .eq("semester_id", semesterNum);

      if (cycleError || !matchingCycles?.[0]?.id) {
        throw cycleError || new Error("Invalid academic selection");
      }

      const { error: upsertError } = await supabase
        .from("user_study_config")
        .upsert(
          {
            user_id: user.id,
            study_cycle_id: matchingCycles[0].id,
          },
          {
            onConflict: "user_id",
          }
        );

      if (upsertError) throw upsertError;
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Profile completion error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generic handler for select field changes
   * Resets dependent fields when year changes
   */
  const handleSelectChange =
    (field: keyof typeof formData) => (value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        ...(field === "year" ? { semester: "", rotation: "" } : {}), // Reset semester/rotation when year changes
      }));
    };

  // Form validation - requires year and (semester for years 1-3)
  const isFormValid =
    formData.year && (parseInt(formData.year) <= 3 ? formData.semester : true);

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md p-6 space-y-6 border rounded-lg bg-card shadow-md">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Complete Your Academic Profile</h1>
          <p className="text-muted-foreground">
            Please select your current academic information
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {/* Loading state */}
        {fetchingData ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Academic Year Select */}
            <div className="space-y-2 flex flex-col items-center">
              <Label htmlFor="year">Academic Year</Label>
              <Select
                value={formData.year}
                onValueChange={handleSelectChange("year")}
                required
                disabled={fetchingData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.year_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester Select (only shown for years 1-3) */}
            {formData.year && parseInt(formData.year) <= 3 && (
              <div className="space-y-2 flex flex-col items-center">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={handleSelectChange("semester")}
                  required
                  disabled={fetchingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem
                        key={semester.id}
                        value={semester.id.toString()}
                      >
                        {semester.semester_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || loading || fetchingData}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
