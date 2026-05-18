export default function StepTransition({ stepKey, children }) {
    return (
        <div
            key={stepKey}
            style={{
                animation: 'stepEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {children}
        </div>
    )
}
