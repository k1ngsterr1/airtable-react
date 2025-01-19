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

// Определение основного столбца из "Configuration"
const selectMainColumn = async (
  tableName: string,
  baseID: string,
  configurationColumn: string
): Promise<string | null> => {
  console.log(`Определение основного столбца для таблицы: ${tableName}`);
  const base = new Airtable({ apiKey: import.meta.env.VITE_API_KEY }).base(
    baseID
  );

  try {
    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();

    if (records.length === 0) {
      console.error(`Записи не найдены в таблице: ${tableName}`);
      return null;
    }

    const configurationValue = records[0].fields[configurationColumn];

    console.log(`Основная колонка определена как: "${configurationValue}"`);
    return configurationValue as any; // Возвращаем первую колонку из "Configuration"
  } catch (error) {
    console.error(
      `Ошибка при определении основной колонки таблицы ${tableName}:`,
      error
    );
    return null;
  }
};

const generateFilterFormula = (
  filters: Filter[],
  columnNameMap: Record<string, string>,
  primaryColumn: string,
  records: Array<Record<string, any>> // Records to check for Rule 1
): string => {
  console.log("Генерация формулы фильтрации началась...");
  console.log("Переданные фильтры:", filters);
  console.log("Карта названий колонок:", columnNameMap);
  console.log("Переданные записи:", records);

  // Step 1: Find the primary filter
  const primaryFilter = filters.find(
    (filter) => getColumnName(filter.column, columnNameMap) === primaryColumn
  );

  if (
    !primaryFilter ||
    !primaryFilter.values ||
    primaryFilter.values.length === 0
  ) {
    console.error(
      "Правило 3: Основной фильтр отсутствует или пуст. Формула не будет сгенерирована."
    );
    console.log("Текущие фильтры:", filters);
    console.log("Основная колонка:", primaryColumn);
    return ""; // Rule 3: If the primary filter is missing, return empty
  }

  console.log("Основной фильтр найден:", primaryFilter);
  console.log("Значения основного фильтра:", primaryFilter.values);

  // Step 2: Check records for compliance with Rule 1
  const allowedFields = ["Configuration", "Name", primaryColumn]; // Allowed columns

  const isValidForRule1 = (record: Record<string, any>) => {
    const fieldKeys = Object.keys(record.fields || {});
    console.log("Поля текущей записи:", fieldKeys);
    return fieldKeys.every((key) => allowedFields.includes(key));
  };

  const validRecords = records.filter(isValidForRule1);
  const invalidRecords = records.filter((record) => !isValidForRule1(record));

  console.log(
    "Число записей, соответствующих требованиям Правила 1:",
    validRecords.length
  );

  console.log(
    "Число записей, НЕ соответствующих требованиям Правила 1:",
    invalidRecords.length
  );

  if (validRecords.length === 0) {
    console.log(
      "Правило 1: Ни одна запись не соответствует требованиям (только разрешённые столбцы)."
    );
    console.log(
      "Записи, которые не соответствуют требованиям:",
      invalidRecords
    );
    return ""; // If no records match Rule 1, return empty
  }

  console.log(
    "Записи, соответствующие Правилу 1:",
    validRecords.map((record) => ({ id: record.id, fields: record.fields }))
  );

  // Step 3: Generate conditions for the primary filter
  const primaryConditions = primaryFilter.values
    .map((value) => {
      const sanitizedValue = truncateValue(
        escapeSpecialCharacters(value.trim())
      );
      console.log(
        `Экранированное значение для ${primaryColumn}:`,
        sanitizedValue
      );
      return `{${primaryColumn}} = '${sanitizedValue}'`;
    })
    .join(" OR ");

  console.log("Условия основного фильтра:", primaryConditions);

  // Step 4: Process secondary filters
  const secondaryFilters = filters.filter(
    (filter) => getColumnName(filter.column, columnNameMap) !== primaryColumn
  );

  console.log("Второстепенные фильтры:", secondaryFilters);

  const secondaryConditions = secondaryFilters
    .map((filter) => {
      const columnName = getColumnName(filter.column, columnNameMap);
      console.log(`Обработка второстепенной колонки: ${columnName}`);
      const conditions = filter.values
        .map((value) => {
          const sanitizedValue = truncateValue(
            escapeSpecialCharacters(value.trim())
          );
          console.log(
            `Экранированное значение для ${columnName}:`,
            sanitizedValue
          );
          return `{${columnName}} = '${sanitizedValue}'`;
        })
        .join(" OR ");
      console.log(
        `Условия для второстепенной колонки ${columnName}:`,
        conditions
      );
      return conditions ? `(${conditions})` : "";
    })
    .filter(Boolean)
    .join(" AND ");

  console.log("Условия второстепенных фильтров:", secondaryConditions);

  // Step 5: Combine conditions based on the rules
  if (secondaryFilters.length > 0 && !secondaryConditions) {
    console.log(
      "Правило 4: Основной фильтр подходит, но ни один из второстепенных фильтров не подходит. Формула не будет сгенерирована."
    );
    return ""; // Rule 4
  }

  if (secondaryConditions) {
    console.log(
      "Правило 2: Основной фильтр подходит, и второстепенные фильтры заданы и подходят. Создаем объединённую формулу."
    );
    const formula = `AND(${primaryConditions}, ${secondaryConditions})`;
    console.log("Сгенерированная формула:", formula);
    return formula;
  } else {
    console.log(
      "Правило 1: Второстепенные фильтры отсутствуют. Используем только условия основного фильтра."
    );
    console.log("Сгенерированная формула:", primaryConditions);
    return primaryConditions;
  }
};

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
    let allRecords: { id: string; fields: any; tableName: string }[] = [];

    for (const { tableName, filters } of tableFilters) {
      console.log(`Обработка таблицы: ${tableName}`);

      const configRecords = await base(tableName)
        .select({ maxRecords: 1 })
        .firstPage();

      const configurationValue = configRecords[0].fields["Configuration"];

      var allowedFields = ["Name", configurationValue, "Configuration"];

      const columnNameMap = await loadColumnNames(tableName, baseID);
      console.log("Названия колонок:", columnNameMap);

      // Автоматически используем столбец "Configuration" как основной
      const primaryColumn = await selectMainColumn(
        tableName,
        baseID,
        "Configuration"
      );

      if (!primaryColumn) {
        console.error(
          `Основная колонка не определена для таблицы ${tableName}`
        );
        continue;
      }

      console.log("Основная колонка:", primaryColumn);

      // Получаем записи для обработки
      const records = await base(tableName).select({}).all();
      console.log("Все записи, полученные из таблицы:", records);

      // Применяем filterByFormula
      const filterByFormula = generateFilterFormula(
        filters,
        columnNameMap,
        primaryColumn,
        records as any // Передаём оригинальные записи
      );

      if (!filterByFormula) {
        console.error(
          `Сгенерированная формула фильтрации пуста для таблицы ${tableName}`
        );
        continue;
      }

      try {
        const filteredResults = await base(tableName)
          .select({ filterByFormula })
          .all();

        console.log(
          `Получено записей из таблицы ${tableName} после применения filterByFormula: ${filteredResults.length}`
        );

        // Добавляем оставшиеся записи
        allRecords.push(
          ...filteredResults.map((record) => ({
            id: record.id,
            fields: record.fields,
            tableName,
          }))
        );
      } catch (tableError) {
        console.error(
          `Ошибка при запросе записей из таблицы ${tableName}:`,
          tableError
        );
      }
    }

    console.log("Все записи перед проверкой на лишние поля:", allRecords);

    // Удаляем записи с лишними полями
    allRecords = allRecords.filter((record) => {
      const fieldKeys = Object.keys(record.fields || {});

      // Проверяем, есть ли лишние поля
      const hasExtraFields = fieldKeys.some(
        (key) => !allowedFields.includes(key)
      );

      if (hasExtraFields) {
        console.log(
          `Запись с ID ${record.id} удалена из-за лишних полей:`,
          fieldKeys.filter((key) => !allowedFields.includes(key))
        );
      }

      return !hasExtraFields; // Убираем запись, если найдены лишние поля
    });

    console.log(
      "Итоговые записи после удаления записей с лишними полями:",
      allRecords
    );
    return allRecords;
  } catch (error) {
    console.error("Ошибка при создании отчёта:", error);
    return [];
  }
};
