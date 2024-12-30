import Airtable from "airtable";
import { Filter } from "./types";

// Экранирование специальных символов в значениях
const escapeSpecialCharacters = (value: string): string => {
  console.log("Escaping value:", value);
  return value
    .replace(/'/g, "\\'") // Экранирование одинарных кавычек
    .replace(/"/g, '\\"'); // Экранирование двойных кавычек
};

// Обрезка длинных строк
const truncateValue = (value: string, maxLength = 255): string =>
  value.length > maxLength ? value.slice(0, maxLength) : value;

// Функция для разбивки диапазонов
const splitRangeValues = (value: string): string[] => {
  console.log("Splitting range values:", value);

  // Если запятых нет, возвращаем значение как есть
  if (!value.includes(",")) {
    return [value];
  }

  // Разбиваем значения по запятой и убираем пробелы
  return value.split(",").map((range) => range.trim());
};

// Маппинг названий колонок (может быть динамическим)
const loadColumnNames = async (
  tableName: string,
  baseID: string
): Promise<Record<string, string>> => {
  console.log(`Loading column names for table: ${tableName}`);
  const base = new Airtable({
    apiKey: import.meta.env.VITE_API_KEY,
  }).base(baseID);

  try {
    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
    if (records.length === 0) {
      throw new Error(`No records found in table: ${tableName}`);
    }

    const fieldNames = Object.keys(records[0].fields);
    const columnNameMap = fieldNames.reduce((map, fieldName) => {
      map[fieldName.toLowerCase()] = fieldName; // Сохраняем маппинг в нижнем регистре
      return map;
    }, {} as Record<string, string>);

    console.log("Loaded columnNameMap:", columnNameMap);
    return columnNameMap;
  } catch (error) {
    console.error(`Error loading column names for table: ${tableName}`, error);
    return {};
  }
};

// Преобразование названия колонки к корректному формату
const getColumnName = (
  column: string,
  columnNameMap: Record<string, string>
): string => {
  const mappedName = columnNameMap[column.toLowerCase()] || column;
  console.log("Mapped column name:", mappedName);
  return mappedName;
};

// Генерация формулы для фильтров
const generateFilterFormula = (
  filters: Filter[],
  columnNameMap: Record<string, string>
): string => {
  return (
    "AND(" +
    filters
      .map((filter) => {
        const columnName = getColumnName(filter.column, columnNameMap);
        if (!filter.values || filter.values.length === 0) return "";

        const conditions = filter.values
          .flatMap((value) => {
            // Разделение значений диапазона, если применимо
            const ranges = splitRangeValues(value);
            return ranges.map((range) => {
              const sanitizedValue = truncateValue(
                escapeSpecialCharacters(range.trim())
              );
              // Используем точное соответствие или SEARCH в зависимости от требований
              return `SEARCH('${sanitizedValue}', {${columnName}}) > 0`;
            });
          })
          .join(", ");

        return `OR(${conditions})`;
      })
      .filter(Boolean)
      .join(", ") +
    ")"
  );
};

// Функция для получения отфильтрованных записей из Airtable
export const handleCreateReport = async (
  tableFilters: { tableName: string; filters: Filter[] }[], // Фильтры, сгруппированные по таблицам
  baseID: string
): Promise<{ id: string; fields: any; tableName: string }[]> => {
  console.log("Starting to create report with tableFilters:", tableFilters);
  console.log("Using baseID:", baseID);

  const base = new Airtable({
    apiKey: import.meta.env.VITE_API_KEY,
  }).base(baseID);

  if (!tableFilters || tableFilters.length === 0) {
    console.error("No filters or table names provided.");
    return [];
  }

  try {
    const allRecords: { id: string; fields: any; tableName: string }[] = [];

    for (const { tableName, filters } of tableFilters) {
      console.log(`Processing table: ${tableName}`);
      console.log("Filters for the table:", filters);

      const columnNameMap = await loadColumnNames(tableName, baseID);
      const filterByFormula = generateFilterFormula(filters, columnNameMap);

      if (!filterByFormula) {
        console.error(
          `Generated filterByFormula is empty for table ${tableName}`
        );
        continue;
      }

      console.log("Generated filterByFormula:", filterByFormula);

      try {
        // Выполняем запрос к таблице
        const records = await base(tableName)
          .select({
            filterByFormula,
          })
          .all();

        console.log(
          `Fetched ${records.length} records from table ${tableName}`
        );

        // Маппинг записей для возврата
        const mappedRecords = records.map((record) => ({
          id: record.id,
          fields: record.fields,
          tableName,
        }));

        console.log("Mapped records for table:", tableName, mappedRecords);

        allRecords.push(...mappedRecords);
      } catch (tableError) {
        console.error(
          `Error fetching records from table ${tableName}:`,
          tableError
        );
      }
    }

    console.log("All fetched records:", allRecords);
    return allRecords;
  } catch (error) {
    console.error("Error fetching filtered records:", error);
    return [];
  }
};
