import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpecificDatabaseData } from "@/entities/databases/api/use-get-specific-database";
import { fetchTableNames } from "@/entities/tables/api/fetch-tables-name";
import { updateFilterColumn } from "@/shared/utils/updateFilterColumn";
import { removeFilter } from "@/shared/utils/removeFilter";
import { addValueToFilter } from "@/shared/utils/addValueToFilter";
import { removeValueFromFilter } from "@/shared/utils/removeValueFromFilter";
import { addFilter } from "@/shared/utils/addFilter";
import { fetchColumnNames } from "@/entities/tables/api/fetch-column-names";
import { fetchTableData } from "@/entities/tables/api/fetch-air-table-data";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingScreen } from "@/shared/ui/loading";
import { Link, useNavigate } from "react-router-dom";
import { useCreateReport } from "@/entities/reports/api/use-create-report";
import { handleCreateReport } from "@/shared/utils/createReport";

interface Filter {
  id: string;
  column: string;
  values: string[];
  booleanValue?: boolean;
  range?: { min: number; max: number };
}

interface FiltersWidgetProps {
  id: number;
}

export default function FiltersWidget({ id }: FiltersWidgetProps) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const { data } = useSpecificDatabaseData(id);
  const [currentValue, setCurrentValue] = useState("");
  const [columns, setColumns] = useState<string[] | undefined>([]);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [columnData, setColumnData] = useState<any>({});
  const [selectedTableName, setSelectedTableName] = useState<string | null>(
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

        // Optionally fetch columns for the first table
        if (fetchedTableNames.length > 0) {
          setSelectedTableName(fetchedTableNames[0]);
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

  const processAndCreateReport = async (
    filters: Filter[],
    selectedTableName: string | null
  ): Promise<void> => {
    try {
      if (!selectedTableName) {
        throw new Error("Selected table name is required.");
      }

      const rawResults = await handleCreateReport(filters, selectedTableName);

      const results = rawResults.map((result) => ({
        id: result.id,
        fields: result.fields,
      }));

      // Prepare the report data
      const reportData = {
        tableName: selectedTableName,
        filters: filters.map((filter) => ({
          column: filter.column,
          values: filter.values,
          booleanValue: filter.booleanValue,
          range: filter.range,
        })),
        results,
        author: "currentUser",
        createdAt: new Date(),
      };

      createReport(reportData, {
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
      setSelectedTableName(tableName);

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

      const columnData = fetchedColumns.reduce((acc, column) => {
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
                      selectedTableName === tableName ? "default" : "ghost"
                    }
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
                  {filters.map((filter) => (
                    <div key={filter.id} className="mb-4 p-4 border rounded-lg">
                      <div className="flex gap-4 mb-4">
                        <Select
                          value={filter.column}
                          onValueChange={(value) =>
                            updateFilterColumn(
                              setFilters,
                              filters,
                              filter.id,
                              value
                            )
                          }
                        >
                          <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Выберите фильтр" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns?.map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeFilter(setFilters, filters, filter.id)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center ">
                          {filter.column && (
                            <>
                              {typeof columnData[filter.column]?.[0] ===
                              "boolean" ? (
                                <Checkbox
                                  checked={filter.booleanValue}
                                  onCheckedChange={(checked) =>
                                    addValueToFilter(
                                      setFilters,
                                      filters,
                                      filter.id,
                                      checked,
                                      setCurrentValue,
                                      filter.column
                                    )
                                  }
                                >
                                  Checkbox
                                </Checkbox>
                              ) : typeof columnData[filter.column]?.[0] ===
                                "number" ? (
                                // Number (range)
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Min"
                                    value={filter?.range?.min || ""}
                                    // onChange={(e) =>
                                    //   updateFilterRange(
                                    //     filter.id,
                                    //     "min",
                                    //     e.target.value
                                    //   )
                                    // }
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Max"
                                    value={filter?.range?.max || ""}
                                    // onChange={(e) =>
                                    //   updateFilterRange(
                                    //     filter.id,
                                    //     "max",
                                    //     e.target.value
                                    //   )
                                    // }
                                  />
                                </div>
                              ) : (
                                // String (with dropdown for available values)
                                <Select
                                  onValueChange={(value) =>
                                    addValueToFilter(
                                      setFilters,
                                      filters,
                                      filter.id,
                                      value,
                                      setCurrentValue
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите значение" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {columnData[filter.column]?.map(
                                      (value: string, index: number) => (
                                        <SelectItem key={index} value={value}>
                                          {value}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              )}
                            </>
                          )}
                          {/* Кнопка добавления значения */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              addValueToFilter(
                                setFilters,
                                filters,
                                filter.id,
                                currentValue,
                                setCurrentValue
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Отображение добавленных фильтров */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {filter.values.map((value, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
                            >
                              <span>{value.toString()}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() =>
                                  removeValueFromFilter(
                                    setFilters,
                                    filters,
                                    filter.id,
                                    index
                                  )
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
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
                  <Button
                    variant="outline"
                    onClick={() => addFilter(setFilters, filters)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить фильтр
                  </Button>
                  <Button
                    onClick={() =>
                      processAndCreateReport(filters, selectedTableName)
                    }
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
