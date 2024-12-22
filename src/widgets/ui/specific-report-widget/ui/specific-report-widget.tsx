"use client";

import { useParams, Link } from "react-router-dom";
import { LoadingScreen } from "@/shared/ui/loading";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useGetSpecificReport } from "@/entities/reports/api/use-get-specific-report";

export function SpecificReportWidget() {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading, isError, error } = useGetSpecificReport(id);

  if (isLoading) return <LoadingScreen fullScreen />;
  if (isError) return <p>Error: {error.message}</p>;

  console.log("result:", report?.results);

  if (!report) return <p>Report not found.</p>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Отчет: {report.tableName}
      </h1>
      <div>
        <h2 className="text-xl font-semibold mb-2">Использованные фильтры:</h2>
        <div className="flex flex-wrap gap-2">
          {report?.filters.map((filter: any, index: number) => (
            <Badge key={index} variant="secondary">
              {filter.column}: {filter.values.join(", ")}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Применимые требования:</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Требование</TableHead>
              <TableHead>Высота здания, м.</TableHead>
              <TableHead>в Кишиневе</TableHead>
              <TableHead>Группа помещения</TableHead>
              <TableHead>Вид ОТВ.</TableHead>
              <TableHead>Фильтр</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.results.map((result, index) => {
              // Match the filter for the current result
              const matchedFilter = report.filters.find(
                (filter) =>
                  filter.column ===
                  Object.keys(result.fields || {}).find(
                    (key) => filter.column === key
                  )
              );

              return (
                <TableRow key={index}>
                  <TableCell>
                    {/* Render the "Name" field */}
                    {result.fields?.Name || "No Name"}
                  </TableCell>
                  <TableCell>
                    {/* Render "Высота здания, м." */}
                    {result.fields?.["Высота здания, м."] || "No Height"}
                  </TableCell>
                  <TableCell>
                    {/* Render "в Кишиневе" with true/false logic */}
                    {result.fields?.["в Кишиневе"]
                      ? "В Кишиневе (True)"
                      : "В Кишиневе (False)"}
                  </TableCell>
                  <TableCell>
                    {/* Render array fields like "Группа помещения" */}
                    {result.fields?.["Группа помещения"]?.join(", ") ||
                      "No Group"}
                  </TableCell>
                  <TableCell>
                    {/* Render additional field like "Вид ОТВ." */}
                    {result.fields?.["Вид ОТВ."]?.join(", ") || "No Вид ОТВ."}
                  </TableCell>
                  <TableCell>
                    {/* Render the matched filter name */}
                    {matchedFilter ? matchedFilter.column : "No Filter Name"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex w-full items-center justify-center">
        <Link to="/reports" className="mt-8">
          <Button variant="outline">Вернуться к списку отчетов</Button>
        </Link>
      </div>
    </div>
  );
}
