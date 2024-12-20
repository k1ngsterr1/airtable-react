"use client";

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
import { fetchColumnNames } from "@/entities/tables/api/fetch-air-table-data";
import { useSpecificDatabaseData } from "@/entities/databases/api/use-get-specific-database";
import { fetchTableNames } from "@/entities/tables/api/fetch-tables-name";

interface Filter {
  id: string;
  column: string;
  values: string[];
}

interface FiltersWidgetProps {
  id: number;
}

export default function FiltersWidget({ id }: FiltersWidgetProps) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const { data } = useSpecificDatabaseData(id);
  const [currentValue, setCurrentValue] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tableName = "СП 241";

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        setIsLoading(true);
        const fetchedColumns = await fetchColumnNames(tableName);

        setColumns(fetchedColumns);
      } catch (error) {
        console.error("Error fetching column names:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const tableNames = fetchTableNames(data?.databaseID);

    console.log("table names:", tableNames);
    fetchColumns();
  }, [tableName]);

  const addFilter = () => {
    const newFilter: Filter = {
      id: Math.random().toString(36).substr(2, 9),
      column: "",
      values: [],
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((filter) => filter.id !== id));
  };

  const updateFilterColumn = (id: string, column: string) => {
    setFilters(
      filters.map((filter) =>
        filter.id === id ? { ...filter, column } : filter
      )
    );
  };

  const addValueToFilter = (id: string) => {
    if (!currentValue.trim()) return;

    setFilters(
      filters.map((filter) => {
        if (filter.id === id) {
          return {
            ...filter,
            values: [...filter.values, currentValue.trim()],
          };
        }
        return filter;
      })
    );
    setCurrentValue("");
  };

  const removeValueFromFilter = (filterId: string, valueIndex: number) => {
    setFilters(
      filters.map((filter) => {
        if (filter.id === filterId) {
          const newValues = [...filter.values];
          newValues.splice(valueIndex, 1);
          return { ...filter, values: newValues };
        }
        return filter;
      })
    );
  };

  const handleCreateReport = () => {
    console.log("Sending filters to Airtable:", filters);
  };

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
              <p>Загрузка столбцов...</p>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                {filters.map((filter) => (
                  <div key={filter.id} className="mb-4 p-4 border rounded-lg">
                    <div className="flex gap-4 mb-4">
                      <Select
                        value={filter.column}
                        onValueChange={(value) =>
                          updateFilterColumn(filter.id, value)
                        }
                      >
                        <SelectTrigger className="w-[300px]">
                          <SelectValue placeholder="Название столбца из Airtable" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilter(filter.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Значение"
                          value={currentValue}
                          onChange={(e) => setCurrentValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addValueToFilter(filter.id);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => addValueToFilter(filter.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {filter.values.map((value, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
                          >
                            <span>{value}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={() =>
                                removeValueFromFilter(filter.id, index)
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
            )}

            <div className="flex flex-col gap-4">
              <Button variant="outline" onClick={addFilter} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Добавить фильтр
              </Button>

              <Button
                onClick={handleCreateReport}
                className="w-full"
                disabled={filters.length === 0}
              >
                Создать Отчёт
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
