// Shared money math. These are the exact formulas the on-page calculator uses,
// so every number printed into the static content matches the tool's output.

export const sipFutureValue = (monthly, ratePct, years) => {
  const r = ratePct / 12 / 100
  const n = years * 12
  const invested = monthly * n
  const total = r === 0 ? invested : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
  return { invested, returns: total - invested, total }
}

export const lumpsumFutureValue = (amount, ratePct, years) => {
  const total = amount * Math.pow(1 + ratePct / 100, years)
  return { invested: amount, returns: total - amount, total }
}

export const swpProjection = (principal, monthlyWithdrawal, ratePct, years) => {
  const r = ratePct / 12 / 100
  const n = years * 12
  const factor = Math.pow(1 + r, n)
  const finalValue = r === 0
    ? principal - monthlyWithdrawal * n
    : principal * factor - monthlyWithdrawal * ((factor - 1) / r)
  return { totalWithdrawal: monthlyWithdrawal * n, finalValue }
}

// Months a corpus survives a fixed monthly withdrawal. Returns null when the
// growth covers the withdrawal outright, i.e. the corpus never runs out.
export const monthsUntilDepleted = (principal, monthlyWithdrawal, ratePct) => {
  const r = ratePct / 12 / 100
  if (monthlyWithdrawal <= 0) return null
  if (r === 0) return Math.floor(principal / monthlyWithdrawal)
  if (monthlyWithdrawal <= principal * r) return null
  const months = Math.log(monthlyWithdrawal / (monthlyWithdrawal - principal * r)) / Math.log(1 + r)
  return Math.floor(months)
}

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export const rupees = (value) => `₹${inr.format(Math.round(value))}`

// 4520000 -> "₹45.2 Lakh", 13400000 -> "₹1.34 Crore"
export const rupeesShort = (value) => {
  const v = Math.round(value)
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2).replace(/\.?0+$/, '')} Crore`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2).replace(/\.?0+$/, '')} Lakh`
  return rupees(v)
}

export const durationLabel = (months) => {
  if (months === null) return 'Never runs out'
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m} month${m === 1 ? '' : 's'}`
  if (m === 0) return `${y} year${y === 1 ? '' : 's'}`
  return `${y} yr ${m} mo`
}

// Standard reducing-balance EMI: P × i × (1 + i)^n ÷ ((1 + i)^n − 1).
export const loanEmi = (principal, ratePct, months) => {
  const r = ratePct / 12 / 100
  if (months <= 0) return 0
  if (r === 0) return principal / months
  const factor = Math.pow(1 + r, months)
  return (principal * r * factor) / (factor - 1)
}

/**
 * Month-by-month repayment of a loan, rolled up into loan years. Prepayments
 * go straight to principal and keep the EMI unchanged, so they shorten the
 * tenure — the default most Indian lenders apply.
 *
 * prepayment: { type: 'none' | 'once' | 'yearly', amount, year }
 *   once   — a single payment at the end of loan year `year`
 *   yearly — the same payment at the end of every loan year
 */
export const loanSchedule = (principal, ratePct, months, prepayment = { type: 'none' }) => {
  const r = ratePct / 12 / 100
  const emi = loanEmi(principal, ratePct, months)
  const prepayAmount = prepayment.type === 'none' ? 0 : Math.max(0, prepayment.amount || 0)

  const years = []
  let balance = principal
  let month = 0
  let totalInterest = 0
  let totalPrepaid = 0

  while (balance > 0.005 && month < months) {
    month += 1
    const interest = balance * r
    const principalPart = Math.min(emi - interest, balance)
    balance -= principalPart
    totalInterest += interest

    const yearIndex = Math.ceil(month / 12) - 1
    if (!years[yearIndex]) years[yearIndex] = { year: yearIndex + 1, principal: 0, interest: 0, prepayment: 0, balance: 0, months: 0 }
    const row = years[yearIndex]
    row.principal += principalPart
    row.interest += interest
    row.months += 1

    const yearEnd = month % 12 === 0
    const prepayDue = prepayAmount > 0 && yearEnd && balance > 0.005 && (
      prepayment.type === 'yearly' || (prepayment.type === 'once' && month / 12 === prepayment.year)
    )
    if (prepayDue) {
      const paid = Math.min(prepayAmount, balance)
      balance -= paid
      row.prepayment += paid
      totalPrepaid += paid
    }
    row.balance = Math.max(balance, 0)
  }

  return {
    emi,
    months: month,
    totalInterest,
    totalPrepaid,
    totalPaid: principal + totalInterest,
    years,
  }
}
