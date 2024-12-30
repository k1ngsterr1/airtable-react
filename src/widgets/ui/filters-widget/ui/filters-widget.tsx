import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpecificDatabaseData } from "@/entities/databases/api/use-get-specific-database";
import { fetchTableNames } from "@/entities/tables/api/fetch-tables-name";
// import { removeFilter } from "@/shared/utils/removeFilter";
import { addFilter } from "@/shared/utils/addFilter";
import { fetchColumnNames } from "@/entities/tables/api/fetch-column-names";
import { fetchTableData } from "@/entities/tables/api/fetch-air-table-data";
import { LoadingScreen } from "@/shared/ui/loading";
import { Link, useNavigate } from "react-router-dom";
import { useCreateReport } from "@/entities/reports/api/use-create-report";
import { handleCreateReport } from "@/shared/utils/createReport";
import { addValueToFilter } from "@/shared/utils/addValueToFilter";
import { Input } from "@/components/ui/input";

interface Filter {
  id: string;
  column: string;
  values: string[];
  table: string;
  booleanValue?: boolean;
  range?: { min: number; max: number };
}

interface FiltersWidgetProps {
  id: number;
}

export default function FiltersWidget({ id }: FiltersWidgetProps) {
  const [filtersByTable, setFiltersByTable] = useState<
    Record<string, Filter[]>
  >({});
  const { data } = useSpecificDatabaseData(id);
  const [currentValue, setCurrentValue] = useState("");
  const [columns, setColumns] = useState<any>([]);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [columnData, setColumnData] = useState<any>({});
  const [selectedTableNames, setSelectedTableNames] = useState<string[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { mutate: createReport, isPending: isReportLoading } =
    useCreateReport();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTableAndColumnNames = async () => {
      try {
        setIsLoading(true);
        // Fetch table names
        const fetchedTableNames = await fetchTableNames(data?.databaseID);
        setTableNames(fetchedTableNames);

        if (fetchedTableNames.length > 0) {
          setSelectedTableNames([fetchedTableNames[0]]); // Default to the first table
          const fetchedColumns = await fetchColumnNames(
            fetchedTableNames[0],
            data!.databaseID
          );
          setColumns(fetchedColumns);
        }
      } catch (error) {
        console.error("Error fetching table or column names:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTableAndColumnNames();
  }, [data]);

  useEffect(() => {
    if (tableNames.length > 0) {
      handleTableSelect(tableNames[0]);
    }
  }, [tableNames]);

  const processAndCreateReport = async () => {
    try {
      const tableFilters = Object.keys(filtersByTable).map((tableName) => ({
        tableName,
        filters: filtersByTable[tableName] || [],
      }));

      const rawResults = await handleCreateReport(
        tableFilters,
        data!.databaseID
      );

      const results = rawResults.map((result) => ({
        id: result.id,
        fields: result.fields,
        tableName: result.tableName,
      }));

      const reportData = {
        tableNames: Object.keys(filtersByTable),
        filters: tableFilters,
        results,
        author: "currentUser",
        createdAt: new Date(),
      };

      createReport(reportData as any, {
        onSuccess: (createdReport) => {
          console.log("Created report is here:", createdReport);
          navigate(`/reports/${createdReport.id}`);
        },
        onError: (error) => {
          console.error("Error creating report:", error);
        },
      });
    } catch (error) {
      console.error("Error creating report:", error);
    }
  };

  const handleTableSelect = async (tableName: string) => {
    try {
      setIsLoading(true);

      // Toggle table selection
      setSelectedTableNames((prev: any) => {
        if (prev.includes(tableName)) {
          // Remove the table if already selected
          return prev.filter((name: string) => name !== tableName);
        }
        // Add the table to the selection
        return [...prev, tableName];
      });

      // Fetch columns and data for the selected table
      const fetchedColumns = await fetchColumnNames(
        tableName,
        data!.databaseID
      );
      if (!fetchedColumns || fetchedColumns.length === 0) {
        console.error("No columns found for the table:", tableName);
        setColumns([]);
        setColumnData({});
        return;
      }
      setColumns(fetchedColumns);

      const tableData = await fetchTableData(tableName, data!.databaseID);

      const columnData = fetchedColumns.reduce((acc: any, column: any) => {
        acc[column] = tableData
          .map((row) => {
            const value = row[column];
            if (typeof value === "boolean") {
              // Add boolean values directly
              return value;
            } else if (typeof value === "string" || typeof value === "number") {
              return value.toString();
            } else if (Array.isArray(value)) {
              return value.join(", ");
            }
            return null;
          })
          .filter((value) => value !== null); // Skip null or unsupported types
        return acc;
      }, {} as Record<string, (string | boolean)[]>);

      setColumnData(columnData);
    } catch (error) {
      console.error(
        "Error fetching columns or data for the selected table:",
        error
      );
      setColumns([]);
      setColumnData({});
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = (obj: Object) => Object.keys(obj).length === 0;

  if (isLoading) {
    return <LoadingScreen fullScreen />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Фильтр по базе &quot;{data?.name}&quot;
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLoading ? (
              <p>Загрузка таблиц...</p>
            ) : (
              <div className="flex flex-wrap gap-4 mb-4">
                {tableNames.map((tableName) => (
                  <Button
                    key={tableName}
                    variant={
                      selectedTableNames?.includes(tableName)
                        ? "default"
                        : "ghost"
                    } // Check if tableName is in the selectedTableNames array
                    onClick={() => handleTableSelect(tableName)}
                  >
                    {tableName}
                  </Button>
                ))}
              </div>
            )}
            {isEmpty(columnData) == true ? (
              <>В данной таблице нет данных</>
            ) : (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  {selectedTableNames?.map((tableName) => (
                    <div key={tableName}>
                      <h3 className="text-lg font-semibold">{tableName}</h3>

                      {/* Render each filter */}
                      {filtersByTable[tableName]?.map((filter) => (
                        <div
                          key={filter.id}
                          className="mb-4 p-4 border rounded-lg"
                        >
                          <Select
                            value={filter.column}
                            onValueChange={(value) => {
                              setFiltersByTable((prev) => ({
                                ...prev,
                                [tableName]: prev[tableName].map((f) =>
                                  f.id === filter.id
                                    ? { ...f, column: value }
                                    : f
                                ),
                              }));
                            }}
                          >
                            <SelectTrigger className="w-[300px]">
                              <SelectValue placeholder="Выберите фильтр" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map((column: string) => (
                                <SelectItem key={column} value={column}>
                                  {column}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Additional Logic for Numerical/Dropdown Filters */}
                          {filter.column && (
                            <>
                              {columnData[filter.column]?.some(
                                (value: string) =>
                                  /^\d+\+\s*$/.test(value) ||
                                  /^\d+-\d+$/.test(value)
                              ) ? (
                                <div className="flex gap-2 mt-4">
                                  <Input
                                    type="number"
                                    placeholder={`Введите ${filter.column}`}
                                    value={currentValue || ""}
                                    onChange={(e) =>
                                      setCurrentValue(e.target.value)
                                    }
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      const userValue =
                                        parseFloat(currentValue);
                                      if (!isNaN(userValue)) {
                                        // Filter rows based on range or threshold
                                        const matchingRows = columnData[
                                          filter.column
                                        ]?.filter((value: string) => {
                                          // Range format: "300-600"
                                          const rangeMatch =
                                            value.match(/^(\d+)-(\d+)$/);
                                          if (rangeMatch) {
                                            const min = parseFloat(
                                              rangeMatch[1]
                                            );
                                            const max = parseFloat(
                                              rangeMatch[2]
                                            );
                                            return (
                                              userValue >= min &&
                                              userValue <= max
                                            );
                                          }

                                          // Threshold format: "600+"
                                          const thresholdMatch =
                                            value.match(/^(\d+)\+$/);
                                          if (thresholdMatch) {
                                            const min = parseFloat(
                                              thresholdMatch[1]
                                            );
                                            return userValue >= min;
                                          }

                                          return false; // If value doesn't match formats
                                        });

                                        // Add matching rows to the filter
                                        addValueToFilter(
                                          setFiltersByTable,
                                          filtersByTable,
                                          tableName,
                                          filter.id,
                                          matchingRows.join(", "),
                                          setCurrentValue,
                                          filter.column
                                        );
                                      }
                                    }}
                                  >
                                    Применить
                                  </Button>
                                </div>
                              ) : (
                                // Dropdown for non-numerical values
                                <Select
                                  onValueChange={(value) => {
                                    console.log("Selected value:", value);
                                    addValueToFilter(
                                      setFiltersByTable,
                                      filtersByTable,
                                      tableName,
                                      filter.id,
                                      value,
                                      setCurrentValue
                                    );
                                  }}
                                >
                                  <SelectTrigger className="mt-4">
                                    <SelectValue placeholder="Выберите значение" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from(
                                      new Set(
                                        columnData[filter.column]?.flatMap(
                                          (value: string) =>
                                            value
                                              .split(/, (?![^(]*\))/)
                                              .map((v) => v.trim())
                                        )
                                      ) || []
                                    )
                                      .sort((a: any, b: any) => {
                                        if (
                                          !isNaN(Number(a)) &&
                                          !isNaN(Number(b))
                                        ) {
                                          return Number(a) - Number(b);
                                        }
                                        return a.localeCompare(b, undefined, {
                                          numeric: true,
                                        });
                                      })
                                      .map(
                                        (uniqueValue: any, index: number) => (
                                          <SelectItem
                                            key={index}
                                            value={uniqueValue}
                                          >
                                            {uniqueValue}
                                          </SelectItem>
                                        )
                                      )}
                                  </SelectContent>
                                </Select>
                              )}
                            </>
                          )}

                          {/* Display Filter Values */}
                          <div className="mt-4">
                            <h5 className="font-semibold">
                              Выбранные значения:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {filter.values.map((value, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-200 px-2 py-1 rounded"
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Remove Filter Button */}
                          {/* <Button
                            variant="ghost"
                            size="icon"
                            className="mt-4"
                            onClick={() =>
                              removeFilter(
                                setFiltersByTable,
                                filtersByTable,
                                tableName,
                                filter.id
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button> */}
                        </div>
                      ))}
                      {/* Add Filter Button */}
                      <Button
                        variant="outline"
                        onClick={() =>
                          addFilter(
                            setFiltersByTable,
                            filtersByTable,
                            tableName
                          )
                        }
                        className="w-full mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить фильтр
                      </Button>
                    </div>
                  ))}
                </ScrollArea>

                <div className="flex flex-col gap-4">
                  <Link
                    to="/reports"
                    className="text-center cursor-pointer mt-8 transition-colors hover:text-gray-500"
                  >
                    Посмотреть отчеты
                  </Link>
                  {/* <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedTableNames!.length === 1) {
                        const tableName = selectedTableNames![0];
                        addFilter(setFiltersByTable, filtersByTable, tableName); // Add filter to the specific table
                      } else {
                        console.error(
                          "You must select exactly one table to add a filter."
                        );
                      }
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить фильтр
                  </Button> */}

                  <Button
                    onClick={processAndCreateReport} // No arguments needed
                    className="w-full"
                    disabled={isReportLoading}
                  >
                    {isReportLoading ? "Загрузка..." : "Создать Отчёт"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="w-full flex flex-col items-center justify-center">
        <Link
          to="/databases"
          className="text-center cursor-pointer mt-4 transition-colors hover:text-gray-500"
        >
          Вернуться назад к Базам Данных
        </Link>
      </div>
    </div>
  );
}
