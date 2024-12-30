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

  console.log("Report data:", report);

  if (isLoading) return <LoadingScreen fullScreen />;
  if (isError) return <p>Error: {error.message}</p>;

  if (!report) return <p>Report not found.</p>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Отчет: {report.tableName}
      </h1>

      {report.tableNames.map((tableName: string) => {
        const tableFilters =
          report.filters.find(
            (filterGroup: any) => filterGroup.tableName === tableName
          )?.filters || [];
        const tableResults = report.results.filter(
          (result: any) => result.tableName === tableName
        );

        // Ensure "Name" is the first header
        const headers = tableResults.length
          ? Object.keys(tableResults[0].fields || {}).sort((a, b) =>
              a === "Name" ? -1 : b === "Name" ? 1 : 0
            )
          : [];

        return (
          <div key={tableName} className="space-y-8">
            {/* Filters for the Table */}
            <div>
              <h2 className="text-xl font-semibold">{tableName}: Фильтры</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {tableFilters.map((filter: any, index: number) => (
                  <Badge key={index} variant="secondary">
                    {filter.column}:{" "}
                    {Array.isArray(filter.values)
                      ? filter.values.join(", ")
                      : "No values"}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Results for the Table */}
            <div>
              <h2 className="text-xl font-semibold">{tableName}: Результаты</h2>
              <div className="overflow-x-auto">
                <Table className="w-[1500px]">
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableResults.map((result: any, index: number) => (
                      <TableRow key={index}>
                        {headers.map((header, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {Array.isArray(result.fields[header])
                              ? result.fields[header]?.join(", ") || "No Data"
                              : result.fields[header] || "No Data"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );
      })}

      {/* Back Button */}
      <div className="flex w-full items-center justify-center">
        <Link to="/reports" className="mt-8">
          <Button variant="outline">Вернуться к списку отчетов</Button>
        </Link>
      </div>
    </div>
  );
}
