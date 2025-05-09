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

  // Authentication redirects
  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
    if (!loading && isAuthenticated && !profileComplete)
      router.push("/complete-profile");
  }, [loading, isAuthenticated, profileComplete, router]);

  // Fetch grades data
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

  // Calculate min grade for YAxis
  const minGrade = useMemo(() => {
    if (gradesData.length === 0) return 0;
    return Math.floor(Math.min(...gradesData.map((item) => item.grade)));
  }, [gradesData]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Auth states
  if (!isAuthenticated) return null; // Redirect handled by useEffect
  if (!profileComplete) return null; // Redirect handled by useEffect

  // Main dashboard content
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center sm:text-left">
        Grade Dashboard
      </h1>

      <div className="bg-background rounded-lg shadow p-4 sm:p-6">
        {gradesData.length > 0 ? (
          <div className="border rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
              Grade Evolution
            </h2>
            <div className="w-full h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={gradesData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis
                    domain={[minGrade, 10]}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    name="Grade"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No grade data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
