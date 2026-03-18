export function normalizeEventType(value: string | null | undefined) {
    if (!value) return ''
    return value.trim().toLowerCase().replace(/[_-]+/g, ' ')
}

export function isSimpleEntryEventType(value: string | null | undefined) {
    const normalized = normalizeEventType(value)
    return normalized === 'seminar' || normalized === 'test' || normalized === 'black belt test' || normalized === 'blackbelt test'
}

export function isEventTypeRequiringLevel(value: string | null | undefined) {
    return !isSimpleEntryEventType(value)
}