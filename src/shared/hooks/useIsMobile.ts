import { useEffect, useState } from 'react'

// Mismo breakpoint en el que el AppShell cambia el sidebar por la bottom-nav
// (Tailwind `md`). Por debajo de esto consideramos "mobile".
const MOBILE_BREAKPOINT = 768

/**
 * `true` cuando el viewport está por debajo de `md` (768px).
 *
 * Arranca en `false` para que el render inicial (y el SSR) coincidan con la
 * vista de escritorio; recién en el efecto, ya en cliente, se ajusta al ancho
 * real. Esto mantiene la hidratación estable y evita un mismatch.
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}
