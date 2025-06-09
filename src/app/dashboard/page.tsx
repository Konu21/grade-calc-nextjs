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

interface DatabaseGrade {
  year: string;
  year_I_to_II: number;
  year_II_to_III: number;
  year_III_to_IV: number;
  year_IV_to_V: number;
  year_V_to_VI: number;
}

interface GradeData {
  year: string;
  grades: Record<string, number>;
}

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, profileComplete, loading } = useAuth();
  const [gradesData, setGradesData] = useState<GradeData[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("year_I_to_II");
  const [gradeType, setGradeType] = useState<"budget" | "scholarship">(
    "budget"
  );

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
        const tableName =
          gradeType === "budget"
            ? "last_years_budget_grades"
            : "last_years_scholarship_grades"; // Fix typo in table name

        const { data, error } = await supabase
          .from(tableName)
          .select(
            "year, year_I_to_II, year_II_to_III, year_III_to_IV, year_IV_to_V, year_V_to_VI"
          )
          .order("year", { ascending: true });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        const transformedData = (data || []).map((row) => ({
          year: row.year,
          grades: {
            year_I_to_II: row.year_I_to_II,
            year_II_to_III: row.year_II_to_III,
            year_III_to_IV: row.year_III_to_IV,
            year_IV_to_V: row.year_IV_to_V,
            year_V_to_VI: row.year_V_to_VI,
          },
        }));

        setGradesData(transformedData);
      } catch (err) {
        console.error("Error fetching grades data:", err);
        setGradesData([]); // Reset data on error
      }
    };

    fetchGradesData();
  }, [gradeType]); // Make sure gradeType is in dependencies

  // Calculate min grade for YAxis
  const minGrade = useMemo(() => {
    if (gradesData.length === 0) return 0;
    let min = Infinity;
    let hasValidGrade = false;

    gradesData.forEach((item) => {
      const value = item.grades[selectedYear];
      if (value !== null && value !== undefined && !isNaN(value)) {
        hasValidGrade = true;
        if (value < min) min = value;
      }
    });

    return hasValidGrade ? Math.floor(min) : 0;
  }, [gradesData, selectedYear]);

  const yearOptions = [
    { value: "year_I_to_II", label: "Year I to II" },
    { value: "year_II_to_III", label: "Year II to III" },
    { value: "year_III_to_IV", label: "Year III to IV" },
    { value: "year_IV_to_V", label: "Year IV to V" },
    { value: "year_V_to_VI", label: "Year V to VI" },
  ];

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
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
          Grade Dashboard
        </h1>
      </div>

      <div className="bg-background rounded-lg shadow p-3 sm:p-4 md:p-6">
        {gradesData.length > 0 ? (
          <div className="border rounded-lg p-2 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center sm:text-left">
                Grade Evolution
              </h2>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Grade Type:</label>
                  <select
                    value={gradeType}
                    onChange={(e) =>
                      setGradeType(e.target.value as "budget" | "scholarship")
                    }
                    className="appearance-none border border-gray-300 rounded-md px-3 py-1 sm:px-4 sm:py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm sm:text-base"
                  >
                    <option
                      className="bg-background text-gray-700"
                      value="budget"
                    >
                      Budget
                    </option>
                    <option
                      className="bg-background text-gray-700"
                      value="scholarship"
                    >
                      Scholarship
                    </option>
                  </select>
                </div>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="appearance-none border border-gray-300 rounded-md px-3 py-1 sm:px-4 sm:py-2 pr-8 w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm sm:text-base"
                  >
                    {yearOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-background text-gray-700"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="fill-current h-3 w-3 sm:h-4 sm:w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={gradesData.map((item) => ({
                    year: item.year,
                    [selectedYear]: item.grades[selectedYear],
                  }))}
                  margin={{
                    top: 10,
                    right: 15,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickMargin={5}
                    interval={
                      gradesData.length > 8
                        ? Math.ceil(gradesData.length / 8)
                        : 0
                    }
                  />
                  <YAxis
                    domain={[minGrade, 10]}
                    tick={{ fontSize: 10 }}
                    tickMargin={5}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={selectedYear}
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    name={
                      yearOptions.find((y) => y.value === selectedYear)
                        ?.label || selectedYear
                    }
                    connectNulls={true}
                    strokeDasharray="5 5"
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
