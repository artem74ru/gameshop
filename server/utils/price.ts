export const generatePriceFromId = (id: number) => {
    const base = id % 5000
    const price = 9.99 + base / 120
    return Math.round(price * 100) / 100
}
