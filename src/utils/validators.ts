// src/utils/validators.ts
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function isStrongPassword(pw: string) {
  // at least 8 chars, one uppercase, one lowercase, one digit
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw);
}
export function isValidPhone(phone: string) {
  // basic numeric check (international numbers should be validated properly)
  return /^[0-9]{7,15}$/.test(phone);
}
