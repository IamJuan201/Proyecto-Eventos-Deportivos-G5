/**
 * Identity document of a client (Usuario.cedula). It is asked once, at sign-up, and reused for
 * every reservation and payment receipt, so the same person never types two different values.
 * Dots, spaces and dashes are dropped ("1.234.567-8" → "12345678") and letters are uppercased
 * so a passport number and a cédula compare the same way.
 */
export const normalizeDocument = (value: string) => value.replace(/[\s.-]/g, "").toUpperCase();

export const isValidDocument = (normalized: string) => /^[A-Z0-9]{5,20}$/.test(normalized);

export const INVALID_DOCUMENT = "Escribe un número de documento válido (5 a 20 letras o números).";
export const DOCUMENT_TAKEN = "Ese documento ya está registrado en otra cuenta.";
