// Format number with commas
export function formatNumber(num: string | number) {
  let toFormat = num
  if (typeof num === "string") {
    toFormat = Number.parseFloat(num)
  }
  const parts = toFormat.toString().split(".")
  return (
    parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (parts.length > 1 ? "." + parts[1].substring(0, 2) : "")
  )
}
