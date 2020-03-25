import BigNumber from "big.js"
import { formatBalance } from "~Generic/lib/balances"

const isCommonAbbreviation = (str: string) => ["bic", "iban", "sepa", "swift"].indexOf(str) > -1

const minBig = (a: BigNumber, b: BigNumber) => (a.lt(b) ? a : b)

const uppercaseIfCommonAbbreviation = (str: string) => (isCommonAbbreviation(str) ? str.toUpperCase() : str)
const uppercaseFirstLetter = (str: string) => str[0].toUpperCase() + str.slice(1)

export function formatBalanceRange(
  balance: BigNumber,
  minAmount: BigNumber | undefined,
  maxAmount: BigNumber | undefined
): string {
  const min = minAmount && minAmount.gt(0) ? minAmount : null
  const max = maxAmount ? minBig(balance, maxAmount) : balance

  if (min && max && min.gt(max)) {
    return `Not possible - Minimum ${formatBalance(min)}`
  }

  if (min && max) {
    return `${formatBalance(min)} - ${formatBalance(max)}`
  } else if (min) {
    return `Min. ${formatBalance(min)}`
  } else if (max) {
    return `Max. ${formatBalance(max)}`
  } else {
    return ""
  }
}

export function formatDescriptionText(description: string) {
  if (description === description.toLowerCase() || description === description.toUpperCase()) {
    description = description.replace(/\. ([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`)
    description = description.replace(/\b([A-Za-z]+)\b/g, match => uppercaseIfCommonAbbreviation(match))
  }
  return uppercaseFirstLetter(description)
}

export function formatDuration(seconds: number) {
  if (seconds < 0 || seconds > 365 * 24 * 60 * 60) {
    return "<illegal value>"
  } else if (seconds < 90) {
    return `${Math.round(seconds)} seconds`
  } else if (seconds < 90 * 60) {
    return `${Math.round(seconds / 60)} minutes`
  } else if (seconds < 48 * 60 * 60) {
    return `${Math.round(seconds / 60 / 60)} hours`
  } else {
    return `${Math.round(seconds / 24 / 60 / 60)} days`
  }
}

export function formatIdentifier(identifier: string) {
  return identifier
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word, index) => (index === 0 ? uppercaseFirstLetter(word) : word))
    .map(word => uppercaseIfCommonAbbreviation(word))
    .join(" ")
}
