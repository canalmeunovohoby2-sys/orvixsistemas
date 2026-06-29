/**
 * Política de senha forte da ORVIX SISTEMAS.
 * Fonte única de verdade — usada no Onboarding, no Primeiro Acesso,
 * no cadastro de Terminais e em qualquer outra tela de criação/alteração
 * de senha do sistema.
 */
export const PASSWORD_POLICY_TEXT =
  "A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial.";

export type PasswordCheck = {
  id: "length" | "upper" | "lower" | "digit" | "symbol";
  label: string;
  ok: boolean;
};

export function evaluatePassword(pwd: string): PasswordCheck[] {
  return [
    { id: "length", label: "Mínimo de 8 caracteres",        ok: pwd.length >= 8 },
    { id: "upper",  label: "1 letra maiúscula (A-Z)",       ok: /[A-Z]/.test(pwd) },
    { id: "lower",  label: "1 letra minúscula (a-z)",       ok: /[a-z]/.test(pwd) },
    { id: "digit",  label: "1 número (0-9)",                ok: /\d/.test(pwd) },
    { id: "symbol", label: "1 caractere especial (!@#$…)",  ok: /[^A-Za-z0-9]/.test(pwd) },
  ];
}

export function isStrongPassword(pwd: string): boolean {
  return evaluatePassword(pwd).every((r) => r.ok);
}