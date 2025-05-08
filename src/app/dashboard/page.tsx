// app/dashboard/page.tsx
"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
interface GradeData {
  year: string;
  grade: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, profileComplete, loading } = useAuth();
  const [gradesData, setGradesData] = useState<GradeData[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!profileComplete) {
        router.push("/complete-profile");
      }
    }
  }, [loading, isAuthenticated, profileComplete, router]);

  useEffect(() => {
    const fetchGradesData = async () => {
      try {
        const { data, error } = await supabase
          .from("last_years_grades")
          .select("year,grade")
          .order("year", { ascending: true });
        if (error) throw error;
        setGradesData(data || []);
      } catch (err) {
        console.error("Error fetching grades data:", err);
      }
    };
    fetchGradesData();
  }, []);

  const minGrade = useMemo(() => {
    if (gradesData.length === 0) return 0;
    const minValue = Math.min(...gradesData.map((item) => item.grade));
    return Math.floor(minValue);
  }, [gradesData]);
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <p>Please log in...</p>;
  }

  if (!profileComplete) {
    return <p>Redirecting to complete your profile...</p>;
  }
  // Your actual dashboard content here
  return (
    <div className="flex flex-col  w-full items-center mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="flex flex-col items-center p-6 w-full rounded-lg shadow">
        {gradesData.length > 0 && (
          <div className="flex flex-col items-center mt-8 p-6 border w-full rounded-lg">
            <h2 className="text-xl font-bold mb-4">Grade Evolution</h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={gradesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis domain={[minGrade, 10]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="#8884d8"
                    activeDot={{ r: 2 }}
                    name="Grades"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
