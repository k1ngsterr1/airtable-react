import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
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
import { removeFilter } from "@/shared/utils/removeFilter";
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
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [columnData, setColumnData] = useState<any>({});
  const [reportName, setReportName] = useState("");
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
      const hasUnfilledFilters =
        Object.keys(filtersByTable).length === 0 || // Нет таблиц с фильтрами
        Object.values(filtersByTable).some((filters) =>
          filters.some((filter) => !filter.column || filter.values.length === 0)
        );

      if (hasUnfilledFilters) {
        alert("Добавьте и заполните все фильтры перед созданием отчета!");
        return;
      }

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
        name: reportName,
        tableNames: Object.keys(filtersByTable),
        filters: tableFilters,
        results,
        author: "currentUser",
        createdAt: new Date(),
      };

      console.log("report data:", reportData);

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
    <div className="w-full flex items-center justify-center flex-col mx-auto p-6 max-w-4xl">
      <Card className="xl:w-[1300px] xl:max-w-[1300px] w-full">
        <CardHeader>
          <CardTitle className="text-xl text-center font-semibold">
            Фильтр по базе &quot;{data?.name}&quot;
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="mb-4">
              <label
                htmlFor="report-name"
                className="block text-sm font-medium"
              >
                Название отчёта
              </label>
              <Input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Введите название отчёта"
                className="mt-2 w-full"
              />
            </div>
            {isLoading ? (
              <p>Загрузка таблиц...</p>
            ) : (
              <div className="overflow-x-auto">
                <span>Выберите норматив</span>
                <div className="flex gap-4 mb-4 flex-nowrap mt-4">
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
              </div>
            )}
            {isEmpty(columnData) == true ? (
              <>В данной таблице нет данных</>
            ) : (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  {selectedTableNames?.map((tableName) => (
                    <div
                      key={tableName}
                      className="border-b border-gray-500 pb-4 pt-4"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-lg font-semibold">{tableName}</h3>
                        <Button
                          variant="outline"
                          onClick={() =>
                            addFilter(
                              setFiltersByTable,
                              filtersByTable,
                              tableName
                            )
                          }
                          className="w-[250px]"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Добавить фильтр
                        </Button>
                      </div>
                      {/* Отображение фильтров */}
                      {filtersByTable[tableName]?.map((filter: any) => (
                        <div
                          key={filter.id}
                          className="mb-4 p-4 border rounded-lg relative"
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
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
                                    placeholder={`Введите значение для ${filter.column} `}
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
                                  <div
                                    key={index}
                                    className="flex items-center bg-gray-200 px-2 py-1 rounded"
                                  >
                                    <span className="mr-2">{value}</span>
                                    <button
                                      className="text-red-500 hover:text-red-700 focus:outline-none"
                                      onClick={() => {
                                        // Update the state to remove the selected filter value
                                        setFiltersByTable((prev) => ({
                                          ...prev,
                                          [filter.table]: prev[
                                            filter.table
                                          ].map((f) =>
                                            f.id === filter.id
                                              ? {
                                                  ...f,
                                                  values: f.values.filter(
                                                    (v: any) => v !== value
                                                  ),
                                                }
                                              : f
                                          ),
                                        }));
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
                <div className="flex flex-col gap-4">
                  <Button
                    onClick={processAndCreateReport}
                    className="w-full"
                    disabled={
                      isReportLoading || // Проверка загрузки отчета
                      Object.keys(filtersByTable).length === 0 || // Если filtersByTable пуст (нет добавленных фильтров)
                      !Object.values(filtersByTable).some(
                        (filters) =>
                          filters.length > 0 && // Если есть хотя бы один фильтр
                          filters.every(
                            (filter) =>
                              filter.column && filter.values.length > 0
                          ) // И все фильтры заполнены
                      )
                    }
                  >
                    {isReportLoading ? "Загрузка..." : "Создать Отчёт"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="w-full flex items-center justify-between">
        <Link
          to="/databases"
          className="text-center flex gap-2 cursor-pointer mt-4 transition-colors hover:text-gray-500"
        >
          <ChevronLeft /> Вернуться к базам данных
        </Link>
        <Link
          to="/reports"
          className="text-center flex gap-2 cursor-pointer mt-8 transition-colors hover:text-gray-500"
        >
          Посмотреть отчеты <ChevronRight />
        </Link>
      </div>
    </div>
  );
}
