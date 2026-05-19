import { useEffect, useState } from 'react'

export default function useIsMobile(breakpoint = 900) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
    )

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
        const update = () => setIsMobile(mql.matches)
        update()
        mql.addEventListener('change', update)
        return () => mql.removeEventListener('change', update)
    }, [breakpoint])

    return isMobile
}
