import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function authErrorMessage(message: string) {
  if (message === 'Invalid login credentials') return 'E-mail ou senha incorretos.'
  if (message === 'Email not confirmed') return 'E-mail ainda não confirmado. Verifique sua caixa de entrada (e a pasta de spam).'
  if (message === 'User already registered') return 'Já existe uma conta com esse e-mail.'
  return message
}
