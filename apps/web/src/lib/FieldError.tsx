import type { AnyFieldApi } from "@tanstack/react-form";

interface FieldErrorProps {
  field: AnyFieldApi;
}

// Standard-schema validators (e.g. Zod) produce issue objects, not strings,
// so joining the raw errors would render "[object Object]".
function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export function FieldError({ field }: FieldErrorProps) {
  if (!field.state.meta.isTouched || field.state.meta.isValid) return null;
  return (
    <p className="text-destructive text-sm">
      {field.state.meta.errors.map(errorMessage).join(", ")}
    </p>
  );
}
