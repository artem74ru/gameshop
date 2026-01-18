export const getGameImage = (game: any): string => {
  if (!game) return ''

  // Prefer already-mapped `backgroundImage` (server-side mapping)
  // Сервер уже выбрал лучшее изображение: официальная обложка > background_image > скриншот
  if (game.backgroundImage) return game.backgroundImage

  // Fallback для случаев, когда backgroundImage не установлен
  // Проверяем официальную обложку (short_screenshots)
  if (game.short_screenshots && Array.isArray(game.short_screenshots) && game.short_screenshots.length > 0) {
    return game.short_screenshots[0]?.image || ''
  }

  // RAWG raw fields fallback
  if (game.background_image) return game.background_image
  if (game.background_image_additional) return game.background_image_additional

  // Screenshots (array of urls)
  if (Array.isArray((game as any).screenshots) && (game as any).screenshots.length > 0) {
    return (game as any).screenshots[0]
  }

  return ''
}
