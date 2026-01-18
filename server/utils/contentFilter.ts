/**
 * Утилита для фильтрации игр с сексуальным контентом
 */

interface Tag {
    slug?: string
    name?: string
}

/**
 * Проверяет, содержит ли игра сексуальный контент по тегам
 */
export const hasSexualContent = (tags?: Tag[]): boolean => {
    if (!tags || tags.length === 0) {
        return false
    }

    // Список тегов, связанных с сексуальным контентом
    const sexualContentKeywords = [
        'sexual-content',
        'sexual',
        'nudity',
        'nude',
        'adult',
        'sex',
        'erotic',
        'erotica',
        'pornographic',
        'pornography',
        'explicit-sexual',
        'explicit-sexual-content',
        'mature-sexual',
        'sexual-themes',
        'sexual-violence',
        'sexual-situations'
    ]

    return tags.some(tag => {
        const tagSlug = (tag.slug || '').toLowerCase()
        const tagName = (tag.name || '').toLowerCase()
        
        return sexualContentKeywords.some(keyword => 
            tagSlug.includes(keyword) || 
            tagName.includes(keyword) ||
            tagSlug === keyword ||
            tagName === keyword
        )
    })
}

/**
 * Фильтрует массив игр, исключая игры с сексуальным контентом
 */
export const filterSexualContent = <T extends { tags?: Tag[] }>(games: T[]): T[] => {
    return games.filter(game => !hasSexualContent(game.tags))
}
