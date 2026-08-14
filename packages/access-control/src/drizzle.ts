import { ForbiddenError } from "@casl/ability";
import { rulesToAST } from "@casl/ability/extra";
import { CompoundCondition, type Condition, FieldCondition } from "@ucast/core";
import {
  and,
  eq,
  getTableColumns,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { PgTableWithColumns, TableConfig } from "drizzle-orm/pg-core";

import { getUserAbility, type Action, type SubjectName } from "./abac.ts";
import type { User } from "./types.ts";

export function drizzleWhere<T extends TableConfig>(
  action: Action,
  subject: SubjectName,
  user: User,
  table: PgTableWithColumns<T>,
): SQL | undefined {
  const ability = getUserAbility(user);
  const condition = rulesToAST(ability, action, subject);

  if (!condition) {
    const allowed = subject === "Post" ? ability.can(action, "Post") : ability.can(action, "Reply");
    if (allowed) {
      return undefined;
    }
    const error = ForbiddenError.from(ability);
    if (subject === "Post") {
      error.throwUnlessCan(action, "Post");
    } else {
      error.throwUnlessCan(action, "Reply");
    }
    throw new Error("CASL did not throw for a forbidden query");
  }

  return getConditionSql(condition, table);
}

function getConditionSql<T extends TableConfig>(
  condition: Condition,
  table: PgTableWithColumns<T>,
): SQL | undefined {
  if (condition instanceof CompoundCondition) {
    const conditions = condition.value.map((child) => getConditionSql(child, table));

    switch (condition.operator) {
      case "and":
        return and(...conditions);
      case "or":
        return conditions.includes(undefined) ? undefined : or(...conditions);
      case "not": {
        const inner = and(...conditions);
        return inner ? not(inner) : sql<boolean>`false`;
      }
      default:
        throw new Error(`Unsupported compound condition operator: ${condition.operator}`);
    }
  }

  if (condition instanceof FieldCondition) {
    return getFieldConditionSql(condition, table);
  }

  throw new Error(`Unsupported condition operator: ${condition.operator}`);
}

function getFieldConditionSql<T extends TableConfig>(
  condition: FieldCondition,
  table: PgTableWithColumns<T>,
): SQL {
  const column = getTableColumns(table)[condition.field];
  if (!column) {
    throw new Error(`Unknown column in permission condition: ${condition.field}`);
  }

  switch (condition.operator) {
    case "eq":
      return condition.value === null ? isNull(column) : eq(column, condition.value as never);
    case "ne":
      return condition.value === null ? isNotNull(column) : ne(column, condition.value as never);
    case "gt":
      return gt(column, condition.value as never);
    case "gte":
      return gte(column, condition.value as never);
    case "lt":
      return lt(column, condition.value as never);
    case "lte":
      return lte(column, condition.value as never);
    case "in": {
      const values = getArrayValue(condition);
      return values.length === 0 ? sql<boolean>`false` : inArray(column, values);
    }
    case "nin": {
      const values = getArrayValue(condition);
      return values.length === 0 ? sql<boolean>`true` : notInArray(column, values);
    }
    default:
      throw new Error(`Unsupported field condition operator: ${condition.operator}`);
  }
}

function getArrayValue(condition: FieldCondition): unknown[] {
  if (!Array.isArray(condition.value)) {
    throw new Error(`Permission condition "${condition.operator}" requires an array`);
  }

  return condition.value;
}
