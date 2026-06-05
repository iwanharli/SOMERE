import { ZodError } from "zod";

const translations: Record<string, string> = {
  "Required":                          "Wajib diisi",
  "String must contain at least":      "Minimal",
  "character(s)":                      "karakter",
  "String must contain at most":       "Maksimal",
  "Invalid email":                     "Format email tidak valid",
  "Expected string, received":         "Harus berupa teks",
  "Expected number, received":         "Harus berupa angka",
  "Value must be greater than":        "Nilai harus lebih dari",
  "Number must be greater than or equal to": "Minimal bernilai",
  "Number must be less than or equal to":    "Maksimal bernilai",
  "Invalid enum value":                "Pilihan tidak valid",
  "Invalid type":                      "Tipe data tidak valid",
};

function translate(msg: string): string {
  let result = msg;
  for (const [en, id] of Object.entries(translations)) {
    result = result.replace(en, id);
  }
  return result;
}

export function formatZodError(error: ZodError): string {
  const flat = error.flatten();

  // Ambil error field pertama
  const fieldErrors = flat.fieldErrors;
  for (const [field, msgs] of Object.entries(fieldErrors)) {
    if (msgs && msgs.length > 0) {
      const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
      return `${fieldLabel}: ${translate(msgs[0])}`;
    }
  }

  // Fallback ke form errors
  if (flat.formErrors.length > 0) return translate(flat.formErrors[0]);

  return "Data tidak valid";
}
