"use client";
import { useParams, Link } from "react-router-dom";
import { LoadingScreen } from "@/shared/ui/loading";
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
import { ChevronDown } from "lucide-react";

export function SpecificReportWidget() {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading, isError, error } = useGetSpecificReport(id);

  const desiredOrder = [
    "NCM E.03.02-2014",
    "NCM C.01.12:2018",
    "NCM E.03.03:2018",
    "NCM E.03.03:2018 copy 2",
    "NCM E.03.03:2018 copy 2 copy",
    "NCM E.03.03:2018 copy 2 copy copy",
  ];

  if (isLoading) return <LoadingScreen fullScreen />;
  if (isError) return <p>Error: {error.message}</p>;

  if (!report) return <p>Report not found.</p>;

  const sortedTableNames = [...report.tableNames].sort(
    (a, b) => desiredOrder.indexOf(a) - desiredOrder.indexOf(b)
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Отчет: {report.name}
      </h1>
      {sortedTableNames.map((tableName: string) => {
        const tableResults = report.results.filter(
          (result: any) => result.tableName === tableName
        );

        return (
          <div key={tableName} className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold">{tableName}</h2>
              <div className="overflow-x-auto">
                <Table className="2xl:w-[1500px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Требования:</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableResults.map((result: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          {Array.isArray(result.fields.Name)
                            ? result.fields.Name.join(", ") || "No Data"
                            : result.fields.Name || "No Data"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-8">
        <details className="border rounded-lg">
          <summary className="cursor-pointer p-4 bg-gray-100 flex items-center justify-between">
            <span className="font-semibold text-lg">
              Использованные фильтры
            </span>
            <ChevronDown className="w-4 h-4" />
          </summary>
          <div className="p-4">
            {report.filters.map((filterGroup: any, index: number) => (
              <div key={index} className="mb-4">
                <h3 className="text-md font-medium mb-2">
                  Таблица: {filterGroup.tableName}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filterGroup.filters.map(
                    (filter: any, filterIndex: number) => (
                      <span
                        key={filterIndex}
                        className="bg-gray-200 px-2 py-1 rounded"
                      >
                        {filter.column}:{" "}
                        {Array.isArray(filter.values)
                          ? filter.values.join(", ")
                          : "No values"}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
      <div className="flex w-full items-center justify-center">
        <Link to="/1/filters" className="mt-8">
          <Button variant="outline">Вернуться к фильтрам</Button>
        </Link>
      </div>
    </div>
  );
}
