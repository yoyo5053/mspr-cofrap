export default function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-sm)', style }) {
    return (
        <div style={{
            width, height,
            borderRadius: radius,
            background: 'linear-gradient(90deg, var(--bg-3) 0%, var(--border) 50%, var(--bg-3) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s linear infinite',
            ...style,
        }}/>
    )
}
