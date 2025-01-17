import Airtable from "airtable";
import { Filter } from "./types";

// Экранирование специальных символов в значениях
const escapeSpecialCharacters = (value: string): string => {
  console.log("Экранирование значения:", value);
  return value.replace(/'/g, "\\'").replace(/"/g, '\\"');
};

// Обрезка длинных строк
const truncateValue = (value: string, maxLength = 255): string => {
  if (value.length > maxLength) {
    console.log(`Обрезка значения до длины ${maxLength}:`, value);
    return value.slice(0, maxLength);
  }
  return value;
};

// Функция для разбивки диапазонов
const splitRangeValues = (value: string): string[] => {
  console.log("Разбивка значения на диапазоны:", value);
  return value.includes(",")
    ? value.split(",").map((range) => range.trim())
    : [value];
};

// Маппинг названий колонок
const loadColumnNames = async (
  tableName: string,
  baseID: string
): Promise<Record<string, string>> => {
  console.log(`Загрузка названий колонок для таблицы: ${tableName}`);
  const base = new Airtable({ apiKey: import.meta.env.VITE_API_KEY }).base(
    baseID
  );

  try {
    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
    if (records.length === 0) {
      throw new Error(`Записи не найдены в таблице: ${tableName}`);
    }

    const fieldNames = Object.keys(records[0].fields);
    const columnNameMap = fieldNames.reduce((map, fieldName) => {
      map[fieldName.toLowerCase()] = fieldName;
      return map;
    }, {} as Record<string, string>);
    console.log("Названия колонок загружены:", columnNameMap);
    return columnNameMap;
  } catch (error) {
    console.error(
      `Ошибка при загрузке названий колонок таблицы ${tableName}:`,
      error
    );
    return {};
  }
};

// Преобразование названия колонки
const getColumnName = (
  column: string,
  columnNameMap: Record<string, string>
): string => {
  const mappedName = columnNameMap[column.toLowerCase()] || column;
  console.log(`Преобразование названия колонки "${column}" в "${mappedName}"`);
  return mappedName;
};

// Определение основного столбца
const selectMainColumn = async (
  tableName: string,
  baseID: string
): Promise<string | null> => {
  console.log(`Определение основного столбца для таблицы: ${tableName}`);
  const base = new Airtable({ apiKey: import.meta.env.VITE_API_KEY }).base(
    baseID
  );

  try {
    console.log("Запрос записей с лимитом в 1 запись...");
    const records = await base(tableName).select({ maxRecords: 1 }).all();

    if (records.length === 0) {
      console.error(`Записи не найдены в таблице: ${tableName}`);
      return null;
    }

    console.log("Пример записи:", records[0].fields);

    // Извлекаем список столбцов из первой записи
    const fields = Object.keys(records[0].fields);
    console.log("Все доступные столбцы:", fields);

    if (fields.length === 0) {
      console.error("В таблице нет столбцов.");
      return null;
    }

    // Выбираем первый столбец

    const mainColumn = fields[3];
    console.log(`Первый столбец "${mainColumn}" выбран как основной.`);
    return mainColumn;
  } catch (error) {
    console.error(
      `Ошибка при определении основного столбца таблицы ${tableName}:`,
      error
    );
    return null;
  }
};

// Генерация формулы для фильтров
const generateFilterFormula = (
  filters: Filter[],
  columnNameMap: Record<string, string>,
  primaryColumn: string
): string => {
  console.log("Генерация формулы фильтрации...");
  const primaryFilter = filters.find(
    (filter) => getColumnName(filter.column, columnNameMap) === primaryColumn
  );

  console.log("Основной фильтр:", primaryColumn);

  if (
    !primaryFilter ||
    !primaryFilter.values ||
    primaryFilter.values.length === 0
  ) {
    console.error("Основной фильтр отсутствует или пустой.");
    return "";
  }

  const primaryConditions = primaryFilter.values
    .map((value) => {
      const sanitizedValue = truncateValue(
        escapeSpecialCharacters(value.trim())
      );
      return `{${primaryColumn}} = '${sanitizedValue}'`;
    })
    .join(" OR ");

  const secondaryFilters = filters.filter(
    (filter) => getColumnName(filter.column, columnNameMap) !== primaryColumn
  );

  const secondaryConditions = secondaryFilters
    .map((filter) => {
      const columnName = getColumnName(filter.column, columnNameMap);
      const conditions = filter.values
        .map((value) => {
          const sanitizedValue = truncateValue(
            escapeSpecialCharacters(value.trim())
          );
          return `{${columnName}} = '${sanitizedValue}'`;
        })
        .join(" OR ");
      return `OR(${conditions})`;
    })
    .filter(Boolean)
    .join(" AND ");

  const formula = secondaryConditions
    ? `AND(${primaryConditions}, ${secondaryConditions})`
    : `AND(${primaryConditions})`;

  console.log("Сгенерированная формула фильтрации:", formula);
  return formula;
};

// Получение отфильтрованных записей
export const handleCreateReport = async (
  tableFilters: { tableName: string; filters: Filter[] }[],
  baseID: string
): Promise<{ id: string; fields: any; tableName: string }[]> => {
  console.log("Начало создания отчёта...");
  const base = new Airtable({ apiKey: import.meta.env.VITE_API_KEY }).base(
    baseID
  );

  if (!tableFilters || tableFilters.length === 0) {
    console.error("Фильтры или названия таблиц отсутствуют.");
    return [];
  }

  try {
    const allRecords: { id: string; fields: any; tableName: string }[] = [];

    for (const { tableName, filters } of tableFilters) {
      console.log(`Обработка таблицы: ${tableName}`);
      const columnNameMap = await loadColumnNames(tableName, baseID);
      const primaryColumn =
        (await selectMainColumn(tableName, baseID)) || "FirstColumn";

      const filterByFormula = generateFilterFormula(
        filters,
        columnNameMap,
        primaryColumn
      );

      if (!filterByFormula) {
        console.error(
          `Сгенерированная формула фильтрации пуста для таблицы ${tableName}`
        );
        continue;
      }

      console.log("Сгенерированная формула фильтрации:", filterByFormula);

      try {
        const records = await base(tableName).select({ filterByFormula }).all();
        console.log(
          `Получено записей из таблицы ${tableName}: ${records.length}`
        );

        const mappedRecords = records.map((record) => ({
          id: record.id,
          fields: record.fields,
          tableName,
        }));

        console.log("Маппинг записей завершён:", mappedRecords);
        allRecords.push(...mappedRecords);
      } catch (tableError) {
        console.error(
          `Ошибка при запросе записей из таблицы ${tableName}:`,
          tableError
        );
      }
    }

    console.log("Все полученные записи:", allRecords);
    return allRecords;
  } catch (error) {
    console.error("Ошибка при создании отчёта:", error);
    return [];
  }
};
