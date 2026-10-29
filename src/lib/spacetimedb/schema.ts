import { normalizeHost } from "./client";

export type TypeCategory =
  | "primitive"
  | "identity"
  | "timestamp"
  | "option"
  | "enum"
  | "struct"
  | "array"
  | "other";

export interface ColumnMeta {
  name: string;
  typeDisplay: string;
  category: TypeCategory;
  isPrimaryKey: boolean;
  nullable: boolean;
  rawType: unknown;
  description?: string;
}

export interface TableMeta {
  id: number | string;
  name: string;
  isSystemTable: boolean;
  columns: ColumnMeta[];
  primaryKeyName: string | null;
  accessibility: string;
  raw: unknown;
}

export interface ReducerParamMeta {
  name: string;
  typeDisplay: string;
  category: TypeCategory;
  nullable: boolean;
  rawType: unknown;
}

export interface ReducerMeta {
  name: string;
  isSystem: boolean;
  params: ReducerParamMeta[];
}

export interface ParsedModuleSchema {
  tables: TableMeta[];
  userTables: TableMeta[];
  systemTables: TableMeta[];
  reducers: ReducerMeta[];
  userReducers: ReducerMeta[];
  systemReducers: ReducerMeta[];
  types: unknown[];
  raw: unknown;
}

/**
 * Resolves a SATS (Spacetime Algebraic Type System) type node into a human-readable display string
 * and categorizes it for visual badging.
 */
export function resolveAlgebraicType(
  typeNode: unknown,
  typespace: unknown[] = [],
): { display: string; category: TypeCategory; nullable: boolean } {
  if (!typeNode) {
    return { display: "Unknown", category: "other", nullable: false };
  }

  // Direct string primitives, e.g. "String", "U64"
  if (typeof typeNode === "string") {
    return formatPrimitive(typeNode);
  }

  if (typeof typeNode === "object" && typeNode !== null) {
    const keys = Object.keys(typeNode);
    if (keys.length === 0) {
      return { display: "Unit", category: "primitive", nullable: false };
    }

    const firstKey = keys[0];
    const val = (typeNode as Record<string, unknown>)[firstKey];

    // Builtin wrapper
    if (firstKey === "Builtin" && typeof val === "string") {
      return formatPrimitive(val);
    }

    // Primitives wrapped in objects, e.g. { "String": {} }, { "U64": {} }, { "Identity": {} }
    if (
      [
        "String",
        "Bool",
        "U8",
        "U16",
        "U32",
        "U64",
        "U128",
        "U256",
        "I8",
        "I16",
        "I32",
        "I64",
        "I128",
        "I256",
        "F32",
        "F64",
        "Identity",
        "ConnectionId",
        "Timestamp",
        "TimeDuration",
      ].includes(firstKey)
    ) {
      return formatPrimitive(firstKey);
    }

    // Option wrapper
    if (firstKey === "Option") {
      const inner = resolveAlgebraicType(val, typespace);
      return {
        display: `Option<${inner.display}>`,
        category: "option",
        nullable: true,
      };
    }

    // Array wrapper
    if (firstKey === "Array") {
      const elemType =
        typeof val === "object" && val !== null && "element_type" in val
          ? (val as { element_type: unknown }).element_type
          : val;
      const inner = resolveAlgebraicType(elemType, typespace);
      return {
        display: `Array<${inner.display}>`,
        category: "array",
        nullable: false,
      };
    }

    // Ref wrapper (reference to typespace)
    if (firstKey === "Ref") {
      const refIdx = typeof val === "number" ? val : Number(val);
      if (!Number.isNaN(refIdx) && typespace && typespace[refIdx]) {
        const resolved = typespace[refIdx] as Record<string, unknown>;
        const typeName =
          (resolved?.name as string) || (resolved?.type_name as string) || `Type#${refIdx}`;
        return { display: typeName, category: "struct", nullable: false };
      }
      return { display: `Ref(${val})`, category: "other", nullable: false };
    }

    // Sum Type (Enums or SATS Option)
    if (firstKey === "Sum" && typeof val === "object" && val !== null) {
      const variants = ((val as Record<string, unknown>).variants || []) as Array<{
        name?: string;
        algebraic_type?: unknown;
      }>;

      // Check if it's the SATS representation of Option (variants: none / some)
      const variantNames = variants.map((v) => (v.name || "").toLowerCase());
      if (
        variantNames.length === 2 &&
        variantNames.includes("none") &&
        variantNames.includes("some")
      ) {
        const someVariant = variants.find((v) => (v.name || "").toLowerCase() === "some");
        const inner = someVariant
          ? resolveAlgebraicType(someVariant.algebraic_type, typespace)
          : { display: "Any" };
        return {
          display: `Option<${inner.display}>`,
          category: "option",
          nullable: true,
        };
      }

      // Standard Enum
      const enumNames = variants.map((v) => v.name || "Variant").slice(0, 4);
      const suffix = variants.length > 4 ? ", ..." : "";
      return {
        display: `Enum(${enumNames.join(" | ")}${suffix})`,
        category: "enum",
        nullable: false,
      };
    }

    // Product Type (Struct / Tuple)
    if (firstKey === "Product" && typeof val === "object" && val !== null) {
      const elements = ((val as Record<string, unknown>).elements || []) as Array<{
        name?: string;
        algebraic_type?: unknown;
      }>;
      if (elements.length === 0) {
        return { display: "Unit", category: "primitive", nullable: false };
      }
      const isTuple = elements.every((e) => !e.name);
      if (isTuple) {
        const elemDisplays = elements
          .slice(0, 3)
          .map((e) => resolveAlgebraicType(e.algebraic_type, typespace).display);
        return {
          display: `(${elemDisplays.join(", ")}${elements.length > 3 ? ", ..." : ""})`,
          category: "struct",
          nullable: false,
        };
      }
      return {
        display: `Struct(${elements.length} fields)`,
        category: "struct",
        nullable: false,
      };
    }
  }

  return { display: String(typeNode), category: "other", nullable: false };
}

function formatPrimitive(name: string): {
  display: string;
  category: TypeCategory;
  nullable: boolean;
} {
  const lower = name.toLowerCase();
  if (lower === "identity") {
    return { display: "Identity", category: "identity", nullable: false };
  }
  if (lower === "timestamp") {
    return { display: "Timestamp", category: "timestamp", nullable: false };
  }
  if (lower === "connectionid") {
    return { display: "ConnectionId", category: "identity", nullable: false };
  }
  return { display: name, category: "primitive", nullable: false };
}

/**
 * Fetch and introspect the dynamic SpacetimeDB 2.x schema over HTTP
 */
export async function introspectModuleSchema(
  host: string,
  database: string,
  token?: string | null,
): Promise<ParsedModuleSchema> {
  const normHost = normalizeHost(host);
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${normHost}/v1/database/${encodeURIComponent(database)}/schema`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to fetch schema (HTTP ${res.status}): ${errorText || res.statusText}`);
  }

  const rawSchema = (await res.json()) as {
    tables?: Array<Record<string, unknown>>;
    reducers?: Array<Record<string, unknown>>;
    types?: unknown[];
  };

  const typespace = rawSchema.types || [];
  const rawTables = rawSchema.tables || [];
  const rawReducers = rawSchema.reducers || [];

  const parsedTables: TableMeta[] = rawTables.map((t, index) => {
    const tableName = (t.name as string) || `table_${index}`;
    const isSystemTable = tableName.startsWith("st_") || tableName.startsWith("__st_");

    // Extract product type elements
    const productType = t.product_type as Record<string, unknown> | undefined;
    const elements = (productType?.elements as Array<Record<string, unknown>>) || [];

    // Extract primary key indices if available
    const indexes = (t.indexes as Array<Record<string, unknown>>) || [];
    const pkIndices = new Set<number>();
    for (const idx of indexes) {
      const isPk =
        (idx.name as string)?.includes("primary") ||
        (idx.algorithm as Record<string, unknown>)?.BTree !== undefined;
      const cols = (idx.columns as number[]) || [];
      if (isPk && cols.length === 1) {
        pkIndices.add(cols[0]);
      }
    }

    let primaryKeyName: string | null = null;

    const columns: ColumnMeta[] = elements.map((elem, colIdx) => {
      const colName = (elem.name as string) || `col_${colIdx}`;
      const algebraicType = elem.algebraic_type;
      const resolved = resolveAlgebraicType(algebraicType, typespace);

      const isPrimaryKey =
        pkIndices.has(colIdx) ||
        colName.toLowerCase() === "id" ||
        colName.toLowerCase() === `${tableName.toLowerCase()}_id`;

      if (isPrimaryKey && !primaryKeyName) {
        primaryKeyName = colName;
      }

      return {
        name: colName,
        typeDisplay: resolved.display,
        category: resolved.category,
        isPrimaryKey,
        nullable: resolved.nullable,
        rawType: algebraicType,
      };
    });

    return {
      id: (t.id as number) ?? index,
      name: tableName,
      isSystemTable,
      columns,
      primaryKeyName,
      accessibility: (t.accessibility as string) || "Public",
      raw: t,
    };
  });

  const userTables = parsedTables.filter((t) => !t.isSystemTable);
  const systemTables = parsedTables.filter((t) => t.isSystemTable);

  const parsedReducers: ReducerMeta[] = rawReducers.map((r) => {
    const reducerName = (r.name as string) || "unnamed";
    const paramsObj = r.params as Record<string, unknown> | undefined;
    const elements = (paramsObj?.elements as Array<Record<string, unknown>>) || [];

    const params: ReducerParamMeta[] = elements.map((p, pIdx) => {
      const pName = (p.name as string) || `param_${pIdx}`;
      const pType = resolveAlgebraicType(p.algebraic_type, typespace);
      return {
        name: pName,
        typeDisplay: pType.display,
        category: pType.category,
        nullable: pType.nullable,
        rawType: p.algebraic_type,
      };
    });

    const isSystem = reducerName.startsWith("__") || reducerName.startsWith("st_");

    return {
      name: reducerName,
      isSystem,
      params,
    };
  });

  const userReducers = parsedReducers.filter((r) => !r.isSystem);
  const systemReducers = parsedReducers.filter((r) => r.isSystem);

  return {
    tables: parsedTables,
    userTables,
    systemTables,
    reducers: parsedReducers,
    userReducers,
    systemReducers,
    types: typespace,
    raw: rawSchema,
  };
}
