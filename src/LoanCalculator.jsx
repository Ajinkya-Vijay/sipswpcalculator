import { useMemo, useState } from 'react'
import { loanSchedule } from '../scripts/finance.mjs'
import './App.css'

const formatNumber = (value) => Number(value).toLocaleString('en-IN')
const formatCurrency = (value) => `₹${formatNumber(Number(value).toFixed(0))}`

// Axis-sized money: 240000 -> "₹2.4L", 13400000 -> "₹1.34Cr".
const formatCompact = (value) => {
  const trim = (n) => n.toFixed(2).replace(/\.?0+$/, '')
  if (value >= 1e7) return `₹${trim(value / 1e7)}Cr`
  if (value >= 1e5) return `₹${trim(value / 1e5)}L`
  if (value >= 1e3) return `₹${trim(value / 1e3)}k`
  return `₹${Math.round(value)}`
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const sliderBackground = (value, min, max) => {
  const percent = min === max ? 0 : ((value - min) / (max - min)) * 100
  return `linear-gradient(90deg, #22c55e ${percent}%, #dbeafe ${percent}%)`
}

// Each loan type has its own page, so its defaults and ranges match what a
// lender in India actually offers for that product.
const LOAN_TYPES = {
  home: {
    label: 'Home loan',
    href: '/home-loan-emi-calculator/',
    amount: { min: 500000, max: 50000000, step: 100000, initial: 5000000, minLabel: '₹5L', maxLabel: '₹5Cr' },
    rate: { min: 6, max: 15, initial: 8.5 },
    years: { min: 1, max: 30, initial: 20 },
  },
  car: {
    label: 'Car loan',
    href: '/car-loan-emi-calculator/',
    amount: { min: 100000, max: 5000000, step: 10000, initial: 800000, minLabel: '₹1L', maxLabel: '₹50L' },
    rate: { min: 6, max: 18, initial: 9 },
    years: { min: 1, max: 8, initial: 5 },
  },
  personal: {
    label: 'Personal loan',
    href: '/personal-loan-emi-calculator/',
    amount: { min: 50000, max: 4000000, step: 10000, initial: 500000, minLabel: '₹50k', maxLabel: '₹40L' },
    rate: { min: 9, max: 30, initial: 12.5 },
    years: { min: 1, max: 7, initial: 3 },
  },
}

const NumberField = ({ id, value, min, max, step, inputMode = 'numeric', onChange, onCommit }) => (
  <input
    id={id}
    className="slider-number-input"
    type="number"
    inputMode={inputMode}
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(event) => {
      const next = Number(event.target.value)
      if (!Number.isNaN(next)) onChange(next)
    }}
    onBlur={(event) => onCommit(clamp(Number(event.target.value), min, max))}
  />
)

const Slider = ({ id, label, value, min, max, step, onChange, minLabel, maxLabel }) => (
  <>
    <input
      id={id}
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      style={{ background: sliderBackground(value, min, max) }}
    />
    <div className="slider-meta-row">
      <span>{minLabel}</span>
      <span>{maxLabel}</span>
    </div>
  </>
)

// Rounds an axis maximum up to 1, 2, 2.5 or 5 × a power of ten, so the
// gridlines land on numbers a person would write down.
const niceCeil = (value) => {
  if (value <= 0) return 1
  const power = Math.pow(10, Math.floor(Math.log10(value)))
  const step = [1, 2, 2.5, 5, 10].find((m) => m * power >= value)
  return step * power
}

function YearlyChart({ years }) {
  const [active, setActive] = useState(null)
  const totals = years.map((y) => y.principal + y.prepayment + y.interest)
  const max = niceCeil(Math.max(...totals))
  const ticks = [max, max / 2, 0]
  const labelEvery = years.length > 20 ? 5 : years.length > 10 ? 2 : 1
  const activeYear = active === null ? null : years[active]

  return (
    <figure className="loan-chart">
      <figcaption className="loan-chart-head">
        <span className="loan-chart-title">What each year&rsquo;s payments go to</span>
        <span className="loan-legend" aria-hidden="true">
          <span><i className="swatch swatch-principal" />Principal</span>
          <span><i className="swatch swatch-interest" />Interest</span>
        </span>
      </figcaption>

      <div
        className="loan-chart-plot"
        role="img"
        aria-label={`Yearly principal and interest over ${years.length} years. Interest is ${formatCurrency(
          years[0].interest,
        )} in year 1 and ${formatCurrency(years[years.length - 1].interest)} in the final year. The repayment schedule below lists every year.`}
        onPointerLeave={() => setActive(null)}
      >
        <div className="loan-chart-grid" aria-hidden="true">
          {ticks.map((tick) => (
            <div key={tick} className="loan-chart-gridline">
              <span>{formatCompact(tick)}</span>
            </div>
          ))}
        </div>

        <div className="loan-chart-bars">
          {years.map((y, index) => {
            const principal = y.principal + y.prepayment
            return (
              <div
                key={y.year}
                className={`loan-chart-col ${active === index ? 'is-active' : ''}`}
                onPointerEnter={() => setActive(index)}
                onClick={() => setActive(index)}
              >
                <div className="loan-chart-stack" style={{ height: `${(totals[index] / max) * 100}%` }}>
                  <div className="seg seg-interest" style={{ flexGrow: y.interest }} />
                  <div className="seg seg-principal" style={{ flexGrow: principal }} />
                </div>
                <span className="loan-chart-x" aria-hidden="true">
                  {y.year % labelEvery === 0 || (y.year === 1 && labelEvery > 2) ? y.year : ''}
                </span>
              </div>
            )
          })}
        </div>

        {activeYear && (
          <div
            className="loan-tooltip"
            // The plot reserves a 48px gutter for the y-axis labels.
            style={{ left: `calc(48px + (100% - 48px) * ${(active + 0.5) / years.length})` }}
            data-edge={active < years.length / 4 ? 'start' : active > (years.length * 3) / 4 ? 'end' : 'mid'}
          >
            <strong>Year {activeYear.year}</strong>
            <span><i className="swatch swatch-principal" />Principal {formatCurrency(activeYear.principal)}</span>
            {activeYear.prepayment > 0 && (
              <span><i className="swatch swatch-principal" />Prepaid {formatCurrency(activeYear.prepayment)}</span>
            )}
            <span><i className="swatch swatch-interest" />Interest {formatCurrency(activeYear.interest)}</span>
            <span className="loan-tooltip-muted">Balance after: {formatCurrency(activeYear.balance)}</span>
          </div>
        )}
      </div>
      <p className="loan-chart-xlabel" aria-hidden="true">Loan year</p>
    </figure>
  )
}

function LoanCalculator({ loanType = 'home' }) {
  const config = LOAN_TYPES[loanType] ?? LOAN_TYPES.home
  const [amount, setAmount] = useState(config.amount.initial)
  const [rate, setRate] = useState(config.rate.initial)
  const [tenureUnit, setTenureUnit] = useState('years')
  const [tenureMonths, setTenureMonths] = useState(config.years.initial * 12)
  const [prepayType, setPrepayType] = useState('none')
  const [prepayAmount, setPrepayAmount] = useState(Math.round(config.amount.initial / 50 / 10000) * 10000)
  const [prepayYear, setPrepayYear] = useState(1)

  const tenure = tenureUnit === 'years'
    ? { min: config.years.min, max: config.years.max, value: Math.round(tenureMonths / 12), unit: 'Yr' }
    : { min: 6, max: config.years.max * 12, value: tenureMonths, unit: 'Mo' }
  const setTenure = (value) => setTenureMonths(tenureUnit === 'years' ? value * 12 : value)

  const switchUnit = (unit) => {
    if (unit === tenureUnit) return
    // Going back to years drops any odd months rather than showing a fraction.
    if (unit === 'years') setTenureMonths(clamp(Math.round(tenureMonths / 12), config.years.min, config.years.max) * 12)
    setTenureUnit(unit)
  }

  const loanYears = Math.ceil(clamp(tenureMonths, 1, config.years.max * 12) / 12)
  const effectivePrepayYear = clamp(prepayYear, 1, Math.max(loanYears - 1, 1))
  const prepayment = { type: prepayType, amount: prepayAmount, year: effectivePrepayYear }

  // A field can hold a half-typed value (blank, 0) until it blurs; the maths
  // always runs on the nearest valid input so the results never go empty.
  const loanAmount = clamp(amount, config.amount.min, config.amount.max)
  const loanRate = clamp(rate, config.rate.min, config.rate.max)
  const loanMonths = clamp(tenureMonths, 1, config.years.max * 12)

  const base = useMemo(() => loanSchedule(loanAmount, loanRate, loanMonths), [loanAmount, loanRate, loanMonths])
  const plan = useMemo(
    () => loanSchedule(loanAmount, loanRate, loanMonths, prepayment),
    // prepayment is rebuilt each render; its fields are the real dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loanAmount, loanRate, loanMonths, prepayType, prepayAmount, effectivePrepayYear],
  )
  const hasPrepayment = prepayType !== 'none' && plan.totalPrepaid > 0
  const interestSaved = base.totalInterest - plan.totalInterest
  const monthsSaved = base.months - plan.months
  const interestShare = plan.totalPaid > 0 ? (plan.totalInterest / plan.totalPaid) * 100 : 0

  const durationText = (months) => {
    const y = Math.floor(months / 12)
    const m = months % 12
    return [y && `${y} yr`, m && `${m} mo`].filter(Boolean).join(' ') || '0 mo'
  }

  return (
    <section className="card loan-card">
      <nav className="view-toggle view-toggle--three" aria-label="Loan type">
        {Object.entries(LOAN_TYPES).map(([key, type]) => (
          <a
            key={key}
            href={type.href}
            className={`view-toggle-option ${key === loanType ? 'active' : ''}`}
            aria-current={key === loanType ? 'page' : undefined}
          >
            {type.label}
          </a>
        ))}
      </nav>

      <div className="calc-grid is-split">
        <div className="panel">
          <h2 className="swp-heading">{config.label} details</h2>

          <div className="slider-group">
            <div className="slider-row">
              <label className="slider-title" htmlFor="loan-amount-input">Loan amount</label>
              <div className="slider-value-group">
                <NumberField
                  id="loan-amount-input"
                  value={amount}
                  min={config.amount.min}
                  max={config.amount.max}
                  step={config.amount.step}
                  onChange={setAmount}
                  onCommit={setAmount}
                />
              </div>
            </div>
            <Slider
              id="loan-amount-slider"
              label="Loan amount"
              value={amount}
              min={config.amount.min}
              max={config.amount.max}
              step={config.amount.step}
              onChange={setAmount}
              minLabel={config.amount.minLabel}
              maxLabel={config.amount.maxLabel}
            />
          </div>

          <div className="slider-group">
            <div className="slider-row">
              <label className="slider-title" htmlFor="loan-rate-input">Interest rate (p.a.)</label>
              <div className="slider-value-group">
                <NumberField
                  id="loan-rate-input"
                  inputMode="decimal"
                  value={rate}
                  min={config.rate.min}
                  max={config.rate.max}
                  step={0.05}
                  onChange={setRate}
                  onCommit={setRate}
                />
              </div>
            </div>
            <Slider
              id="loan-rate-slider"
              label="Interest rate per annum"
              value={rate}
              min={config.rate.min}
              max={config.rate.max}
              step={0.05}
              onChange={setRate}
              minLabel={`${config.rate.min}%`}
              maxLabel={`${config.rate.max}%`}
            />
          </div>

          <div className="slider-group">
            <div className="slider-row">
              <span className="slider-title" id="loan-tenure-label">
                Loan tenure
                <span className="unit-toggle" role="group" aria-label="Tenure unit">
                  {['years', 'months'].map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      className={tenureUnit === unit ? 'active' : ''}
                      aria-pressed={tenureUnit === unit}
                      onClick={() => switchUnit(unit)}
                    >
                      {unit === 'years' ? 'Years' : 'Months'}
                    </button>
                  ))}
                </span>
              </span>
              <div className="slider-value-group">
                <NumberField
                  id="loan-tenure-input"
                  value={tenure.value}
                  min={tenure.min}
                  max={tenure.max}
                  step={1}
                  onChange={setTenure}
                  onCommit={setTenure}
                />
              </div>
            </div>
            <Slider
              id="loan-tenure-slider"
              label={`Loan tenure in ${tenureUnit}`}
              value={tenure.value}
              min={tenure.min}
              max={tenure.max}
              step={1}
              onChange={setTenure}
              minLabel={`${tenure.min} ${tenure.unit}`}
              maxLabel={`${tenure.max} ${tenure.unit}`}
            />
          </div>

          <fieldset className="prepay">
            <legend className="slider-title">Prepayment</legend>
            <div className="tab-bar tab-bar--three">
              {[
                ['none', 'None'],
                ['once', 'One-time'],
                ['yearly', 'Every year'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`tab ${prepayType === value ? 'active' : ''}`}
                  aria-pressed={prepayType === value}
                  onClick={() => setPrepayType(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {prepayType !== 'none' && (
              <>
                <div className="slider-group">
                  <div className="slider-row">
                    <label className="slider-title" htmlFor="prepay-amount-input">
                      {prepayType === 'once' ? 'Prepayment amount' : 'Prepayment each year'}
                    </label>
                    <div className="slider-value-group">
                      <NumberField
                        id="prepay-amount-input"
                        value={prepayAmount}
                        min={0}
                        max={config.amount.max}
                        step={config.amount.step}
                        onChange={setPrepayAmount}
                        onCommit={setPrepayAmount}
                      />
                    </div>
                  </div>
                </div>
                {prepayType === 'once' && (
                  <div className="slider-group">
                    <div className="slider-row">
                      <label className="slider-title" htmlFor="prepay-year-input">Paid at the end of year</label>
                      <div className="slider-value-group">
                        <NumberField
                          id="prepay-year-input"
                          value={effectivePrepayYear}
                          min={1}
                          max={Math.max(loanYears - 1, 1)}
                          step={1}
                          onChange={setPrepayYear}
                          onCommit={setPrepayYear}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <p className="carry-note">
                  {prepayType === 'once'
                    ? 'Paid once, straight to principal.'
                    : 'Paid at the end of every loan year, straight to principal.'}{' '}
                  Your EMI stays the same and the loan closes sooner.
                </p>
              </>
            )}
          </fieldset>
        </div>

        <div className="panel">
          <div className="results-card emi-hero">
            <p className="result-label">Monthly EMI</p>
            <p className="emi-value">{formatCurrency(plan.emi)}</p>
          </div>

          <div className="results-card">
            <div className="result-row">
              <p className="result-label">Principal amount</p>
              <p className="result-value">{formatCurrency(loanAmount)}</p>
            </div>
            <div className="result-row">
              <p className="result-label">Total interest</p>
              <p className="result-value">{formatCurrency(plan.totalInterest)}</p>
            </div>
            <div className="divider" />
            <div className="result-row total-row">
              <p className="result-label">Total amount payable</p>
              <p className="result-value">{formatCurrency(plan.totalPaid)}</p>
            </div>

            <div className="share-bar" aria-hidden="true">
              <div className="seg seg-principal" style={{ flexGrow: loanAmount }} />
              <div className="seg seg-interest" style={{ flexGrow: plan.totalInterest }} />
            </div>
            <div className="share-legend">
              <span><i className="swatch swatch-principal" />Principal {(100 - interestShare).toFixed(0)}%</span>
              <span><i className="swatch swatch-interest" />Interest {interestShare.toFixed(0)}%</span>
            </div>

            {hasPrepayment && (
              <div className="prepay-result" role="status">
                <div className="result-row">
                  <p className="result-label">Interest saved by prepaying</p>
                  <p className="result-value highlight">{formatCurrency(interestSaved)}</p>
                </div>
                <div className="result-row">
                  <p className="result-label">Loan closes</p>
                  <p className="result-value highlight">
                    {monthsSaved > 0 ? `${durationText(monthsSaved)} earlier` : 'on schedule'}
                  </p>
                </div>
                <p className="carry-note">
                  New tenure {durationText(plan.months)} instead of {durationText(base.months)}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <YearlyChart years={plan.years} />

      <details className="schedule">
        <summary>Year-by-year repayment schedule</summary>
        <div className="table-wrap">
          <table>
            <caption>
              Loan years count from your first EMI.
              {plan.years[plan.years.length - 1].months < 12 && ' The final year is part of a year.'}
            </caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Principal</th>
                <th scope="col">Interest</th>
                {hasPrepayment && <th scope="col">Prepaid</th>}
                <th scope="col">Total paid</th>
                <th scope="col">Balance</th>
              </tr>
            </thead>
            <tbody>
              {plan.years.map((y) => (
                <tr key={y.year}>
                  <th scope="row">{y.year}</th>
                  <td>{formatCurrency(y.principal)}</td>
                  <td>{formatCurrency(y.interest)}</td>
                  {hasPrepayment && <td>{y.prepayment ? formatCurrency(y.prepayment) : '—'}</td>}
                  <td>{formatCurrency(y.principal + y.interest + y.prepayment)}</td>
                  <td>{formatCurrency(y.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}

export default LoanCalculator
