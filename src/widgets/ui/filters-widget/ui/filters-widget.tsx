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
import { Input } from "@/components/ui/input";
import { removeFilter } from "@/shared/utils/removeFilter";

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
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [columnData, setColumnData] = useState<any>({});
  const [tableData, setTableData] = useState<
    Record<string, { columns: string[]; columnData: Record<string, any[]> }>
  >({});

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

  useEffect(() => {
    if (!selectedTableNames || selectedTableNames.length === 0) return;

    const updateFiltersForSelectedTable = async () => {
      try {
        const tableName = selectedTableNames[selectedTableNames.length - 1]; // Последняя выбранная таблица
        const fetchedColumns = await fetchColumnNames(
          tableName,
          data!.databaseID
        );
        // setColumns(fetchedColumns);

        const tableData = await fetchTableData(tableName, data!.databaseID);

        const updatedColumnData = fetchedColumns?.reduce(
          (acc: any, column: any) => {
            acc[column] = tableData
              .map((row) => {
                const value = row[column];
                if (typeof value === "boolean") return value;
                if (typeof value === "string" || typeof value === "number")
                  return value.toString();
                if (Array.isArray(value)) return value.join(", ");
                return null;
              })
              .filter((value) => value !== null);
            return acc;
          },
          {}
        );

        setColumnData(updatedColumnData);
      } catch (error) {
        console.error("Error updating filters for selected table:", error);
      }
    };

    updateFiltersForSelectedTable();
  }, [selectedTableNames, data]);

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

      setSelectedTableNames((prev: any) => {
        if (prev.includes(tableName)) {
          // Удалить таблицу из выбранных
          return prev.filter((name: string) => name !== tableName);
        }
        // Добавить таблицу в выбранные
        return [...prev, tableName];
      });

      // Если данные таблицы уже загружены, пропустите
      if (tableData[tableName]) {
        setIsLoading(false);
        return;
      }

      // Фетч колонок
      const fetchedColumns = await fetchColumnNames(
        tableName,
        data!.databaseID
      );

      // Фетч данных таблицы
      const tableRows = await fetchTableData(tableName, data!.databaseID);

      // Обработка данных таблицы
      const columnData = fetchedColumns?.reduce((acc: any, column: any) => {
        acc[column] = tableRows
          .map((row) => row[column])
          .filter((value) => value !== null && value !== undefined);
        return acc;
      }, {});

      // Обновление состояния
      setTableData((prev: any) => ({
        ...prev,
        [tableName]: {
          columns: fetchedColumns,
          columnData,
        },
      }));
    } catch (error) {
      console.error(
        "Ошибка при загрузке данных для таблицы:",
        tableName,
        error
      );
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

                      {/* Проверка: если фильтры отсутствуют */}
                      {!filtersByTable[tableName]?.length && (
                        <p className="text-red-500 text-sm mt-2">
                          Пожалуйста, добавьте хотя бы один фильтр.
                        </p>
                      )}

                      {/* Отображение фильтров */}
                      {filtersByTable[tableName]?.map((filter: any) => (
                        <div
                          key={filter.id}
                          className="mb-4 p-4 border rounded-lg"
                        >
                          {/* Выбор столбца для фильтрации */}
                          <Select
                            value={filter.column}
                            onValueChange={(value) => {
                              setFiltersByTable((prev) => ({
                                ...prev,
                                [tableName]: prev[tableName].map((f) =>
                                  f.id === filter.id
                                    ? { ...f, column: value, values: [] } // Очистить значения при изменении столбца
                                    : f
                                ),
                              }));
                            }}
                          >
                            <SelectTrigger className="w-[300px]">
                              <SelectValue placeholder="Выберите фильтр" />
                            </SelectTrigger>
                            <SelectContent>
                              {tableData[tableName]?.columns.map(
                                (column: string) => (
                                  <SelectItem key={column} value={column}>
                                    {column}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>

                          {/* Логика для числовых фильтров */}
                          {filter.column && (
                            <>
                              {tableData[tableName]?.columnData[
                                filter.column
                              ]?.some(
                                (value: string) =>
                                  /^\d+\+\s*$/.test(value) ||
                                  /^\d+-\d+$/.test(value)
                              ) ? (
                                <div className="flex flex-col gap-2 mt-4">
                                  <Input
                                    type="number"
                                    placeholder={`Введите значение для ${filter.column} и нажмите Enter`}
                                    value={filter.inputValue || ""}
                                    onChange={(e) => {
                                      const userValue = e.target.value.trim();
                                      setFiltersByTable((prev) => ({
                                        ...prev,
                                        [tableName]: prev[tableName].map((f) =>
                                          f.id === filter.id
                                            ? { ...f, inputValue: userValue }
                                            : f
                                        ),
                                      }));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const userValue = parseFloat(
                                          filter.inputValue || ""
                                        );
                                        if (!isNaN(userValue)) {
                                          // Найти подходящий диапазон
                                          const matchingRows = tableData[
                                            tableName
                                          ]?.columnData[filter.column]?.filter(
                                            (value: string) => {
                                              // Формат диапазона: "300-600"
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

                                              // Формат порога: "600+"
                                              const thresholdMatch =
                                                value.match(/^(\d+)\+$/);
                                              if (thresholdMatch) {
                                                const min = parseFloat(
                                                  thresholdMatch[1]
                                                );
                                                return userValue >= min;
                                              }

                                              return false; // Если значение не соответствует форматам
                                            }
                                          );

                                          // Если есть подходящие диапазоны, обновить фильтр
                                          if (matchingRows?.length > 0) {
                                            setFiltersByTable((prev) => ({
                                              ...prev,
                                              [tableName]: prev[tableName].map(
                                                (f) =>
                                                  f.id === filter.id
                                                    ? {
                                                        ...f,
                                                        values: [
                                                          ...new Set([
                                                            ...f.values,
                                                            ...matchingRows,
                                                          ]),
                                                        ], // Исключить дубли
                                                        inputValue: "", // Очистить поле ввода
                                                      }
                                                    : f
                                              ),
                                            }));
                                          } else {
                                            alert(
                                              "Значение не соответствует ни одному диапазону!"
                                            );
                                          }
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeFilter(
                                        setFiltersByTable,
                                        tableName,
                                        filter.id
                                      )
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <Select
                                    onValueChange={(value) => {
                                      setFiltersByTable((prev) => ({
                                        ...prev,
                                        [tableName]: prev[tableName].map((f) =>
                                          f.id === filter.id
                                            ? {
                                                ...f,
                                                values: [...f.values, value],
                                              }
                                            : f
                                        ),
                                      }));
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mt-4"
                                    onClick={() =>
                                      removeFilter(
                                        setFiltersByTable,
                                        tableName,
                                        filter.id
                                      )
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}

                          {/* Отображение выбранных значений фильтра */}
                          <div className="mt-4">
                            <h5 className="font-semibold">
                              Выбранные значения:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {filter.values.map(
                                (value: any, index: number) => (
                                  <span
                                    key={index}
                                    className="bg-gray-200 px-2 py-1 rounded"
                                  >
                                    {value}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Кнопка "Добавить фильтр" */}
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
