"use client";

import { useGetReports } from "@/entities/reports/api/use-get-reports";
import { useDeleteReport } from "@/entities/reports/api/use-delete-report";
import { LoadingScreen } from "@/shared/ui/loading";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function ReportsWidget() {
  const { data: reports, isLoading, isError, error } = useGetReports();
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();

  if (isLoading) return <LoadingScreen fullScreen />;
  if (isError) return <p>Error: {error.message}</p>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="w-full flex items-center justify-center">
        <Link to="/databases" className="mt-8">
          <Button variant="outline">Вернуться к базам данных</Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-center mb-6">Список отчетов</h1>
      <div className="space-y-4">
        {reports?.map((report) => (
          <div
            key={report.id}
            className="p-4 border rounded-lg shadow-sm flex flex-col gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{report.tableName}</h2>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                onClick={() => deleteReport(report.id)}
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-gray-600">
                Создано: {new Date(report.createdAt).toLocaleDateString()}
              </span>
              <Badge variant="secondary">
                Фильтров: {report.filters.length}
              </Badge>
              <Badge variant="secondary">
                Результатов: {report.results.length}
              </Badge>
            </div>
            <Link to={`/reports/${report.id}`} className="text-blue-500">
              Подробнее
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
