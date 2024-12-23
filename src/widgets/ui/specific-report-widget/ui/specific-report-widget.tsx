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
  const headers = report?.results.length
    ? Object.keys(report.results[0].fields || {})
    : [];

  console.log("headers:", headers);

  if (isLoading) return <LoadingScreen fullScreen />;
  if (isError) return <p>Error: {error.message}</p>;

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
              {report?.results.map((result, index) => {
                // Match the filter for the current result
                const matchedFilter = report.filters.find((filter) =>
                  Object.keys(result.fields || {}).includes(filter.column)
                );

                return (
                  <TableRow key={index}>
                    {headers.map((header, index) => (
                      <TableCell key={index}>
                        {Array.isArray(result.fields[header])
                          ? result.fields[header]?.join(", ") || "No Data"
                          : result.fields[header] || "No Data"}
                      </TableCell>
                    ))}
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
      </div>
      <div className="flex w-full items-center justify-center">
        <Link to="/reports" className="mt-8">
          <Button variant="outline">Вернуться к списку отчетов</Button>
        </Link>
      </div>
    </div>
  );
}
