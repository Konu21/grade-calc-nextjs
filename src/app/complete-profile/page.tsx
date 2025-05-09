//app/complete-profile/page.tsx
"use client";
import { useState, useEffect } from "react";
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

interface AcademicYear {
  id: number;
  year_name: string;
}

interface Semester {
  id: number;
  semester_name: string;
}

interface Rotation {
  id: number;
  rotation_name: string;
}

interface StudyCycle {
  id: number;
  academic_year_id: number;
  semester_id: number;
  rotation_id: number;
}

export default function CompleteProfile() {
  const [year, setYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [rotation, setRotation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [study_cycles, setStudy_Cycles] = useState<StudyCycle[]>([]);
  const [fetchingData, setFetchingData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setFetchingData(true);

        // Fetch academic years
        const { data: yearsData, error: yearsError } = await supabase
          .from("academic_years")
          .select("id, year_name")
          .order("id", { ascending: true });

        if (yearsError) throw yearsError;
        setAcademicYears(yearsData || []);

        // Fetch semesters
        const { data: semestersData, error: semestersError } = await supabase
          .from("semesters")
          .select("id, semester_name")
          .order("id", { ascending: true });

        if (semestersError) throw semestersError;
        setSemesters(semestersData || []);

        // Fetch rotations
        const { data: rotationsData, error: rotationsError } = await supabase
          .from("rotations")
          .select("id, rotation_name")
          .order("id", { ascending: true });

        if (rotationsError) throw rotationsError;
        setRotations(rotationsData || []);

        // Fetch study cycles
        const { data: studyCycleData, error: studyCycleError } = await supabase
          .from("study_cycles")
          .select("id, academic_year_id, semester_id, rotation_id")
          .order("id", { ascending: true });

        if (studyCycleError) throw studyCycleError;
        setStudy_Cycles(studyCycleData || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load academic data";
        console.error("Data loading error:", err);
        setError(message);
      } finally {
        setFetchingData(false);
      }
    };

    fetchInitialData();
  }, []);

  const getAvailableRotations = (selectedYear: string): Rotation[] => {
    if (!selectedYear || parseInt(selectedYear) <= 3) return [];

    // Găsește toate study_cycles pentru anul selectat
    const cyclesForYear = study_cycles.filter(
      (cycle) => cycle.academic_year_id === parseInt(selectedYear)
    );

    // Extrage rotation_ids unice din aceste study_cycles
    const availableRotationIds = [
      ...new Set(cyclesForYear.map((cycle) => cycle.rotation_id)),
    ];

    // Returnează rotațiile care au id-urile găsite
    return rotations.filter((rotation) =>
      availableRotationIds.includes(rotation.id)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user)
        throw userError || new Error("User not authenticated");

      // Find matching study cycle
      const { data: studyCycles, error: cycleError } = await supabase
        .from("study_cycles")
        .select("id")
        .eq("academic_year_id", parseInt(year))
        .eq(
          parseInt(year) <= 3 ? "semester_id" : "rotation_id",
          parseInt(year) <= 3 ? parseInt(semester) : parseInt(rotation)
        );

      if (cycleError || !studyCycles?.[0]?.id) {
        throw cycleError || new Error("Invalid academic selection");
      }

      // Try to insert first (this might fail if the record already exists)
      const { error: insertError } = await supabase
        .from("user_study_config")
        .insert({
          user_id: user.id,
          study_cycle_id: studyCycles[0].id,
        });

      // If insert fails (likely because record exists), try updating
      if (insertError) {
        console.log("Insert failed, attempting update:", insertError);
        const { error: updateError } = await supabase
          .from("user_study_config")
          .update({
            study_cycle_id: studyCycles[0].id,
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      console.error("Profile completion error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md p-6 space-y-6 border rounded-lg bg-card shadow-md">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Complete Your Academic Profile</h1>
          <p className="text-muted-foreground">
            Please select your current academic information
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {fetchingData ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <Select
                value={year}
                onValueChange={(value: string) => {
                  setYear(value);
                  setSemester("");
                  setRotation("");
                }}
                required
                disabled={fetchingData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year: AcademicYear) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.year_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {year && parseInt(year) <= 3 ? (
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={semester}
                  onValueChange={setSemester}
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
            ) : year && parseInt(year) > 3 ? (
              <div className="space-y-2">
                <Label htmlFor="rotation">Internship</Label>
                <Select
                  value={rotation}
                  onValueChange={setRotation}
                  required
                  disabled={
                    fetchingData || getAvailableRotations(year).length === 0
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        getAvailableRotations(year).length === 0
                          ? "No rotations available"
                          : "Select rotation"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRotations(year).map((rotation) => (
                      <SelectItem
                        key={rotation.id}
                        value={rotation.id.toString()}
                      >
                        {rotation.rotation_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={
                fetchingData ||
                loading ||
                !year ||
                (parseInt(year) <= 3 ? !semester : !rotation)
              }
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
