import { useEffect, useMemo, useState } from 'react'
import './App.css'

const formatNumber = (value) => Number(value).toLocaleString('en-IN')
const formatCurrency = (value) => `₹${formatNumber(Number(value).toFixed(0))}`

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const sliderBackground = (value, min, max) => {
  const percent = min === max ? 0 : ((value - min) / (max - min)) * 100
  return `linear-gradient(90deg, #22c55e ${percent}%, #dbeafe ${percent}%)`
}

const calcSip = (monthly, rate, years) => {
  const monthlyRate = rate / 12 / 100
  const months = years * 12
  const invested = monthly * months
  const futureValue = monthlyRate === 0
    ? invested
    : monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)

  return {
    invested,
    returns: futureValue - invested,
    total: futureValue,
  }
}

const calcLumpsum = (amount, rate, years) => {
  const annualRate = rate / 100
  const futureValue = amount * Math.pow(1 + annualRate, years)

  return {
    invested: amount,
    returns: futureValue - amount,
    total: futureValue,
  }
}

const calcSwp = (principal, withdrawalMonthly, rate, years) => {
  const monthlyRate = rate / 12 / 100
  const months = years * 12
  const totalWithdrawal = withdrawalMonthly * months

  let finalValue
  if (monthlyRate === 0) {
    finalValue = principal - totalWithdrawal
  } else {
    const factor = Math.pow(1 + monthlyRate, months)
    finalValue = principal * factor - withdrawalMonthly * ((factor - 1) / monthlyRate)
  }

  return {
    totalWithdrawal,
    finalValue,
  }
}

function App() {
  const [mode, setMode] = useState('sip')
  const [monthly, setMonthly] = useState(25000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)
  const [lumpsum, setLumpsum] = useState(3000000)
  const [swpWithdrawal, setSwpWithdrawal] = useState(10000)
  const [swpYears, setSwpYears] = useState(5)
  const [swpPrincipal, setSwpPrincipal] = useState(0)
  const [swpPrincipalEdited, setSwpPrincipalEdited] = useState(false)

  const sipResult = useMemo(() => calcSip(monthly, rate, years), [monthly, rate, years])
  const lumpsumResult = useMemo(() => calcLumpsum(lumpsum, rate, years), [lumpsum, rate, years])
  const result = mode === 'sip' ? sipResult : lumpsumResult

  useEffect(() => {
    if (!swpPrincipalEdited) {
      setSwpPrincipal(result.total)
    }
  }, [result.total, swpPrincipalEdited])

  const swpResult = useMemo(() => calcSwp(swpPrincipal, swpWithdrawal, rate, swpYears), [swpPrincipal, swpWithdrawal, rate, swpYears])

  return (
    <main className="app-shell">
      <section className="card">
        <div className="tab-bar">
          <button className={`tab ${mode === 'sip' ? 'active' : ''}`} onClick={() => setMode('sip')}>
            SIP
          </button>
          <button className={`tab ${mode === 'lumpsum' ? 'active' : ''}`} onClick={() => setMode('lumpsum')}>
            Lumpsum
          </button>
          
        </div>

        <div className="panel">
          {/* <div className="panel-header">
            <p className="panel-label">{mode === 'sip' ? 'Monthly investment' : 'Lumpsum amount'}</p>
            <p className="panel-value">{mode === 'sip' ? formatCurrency(monthly) : formatCurrency(lumpsum)}</p>
          </div> */}

            <>
              <div className="slider-group">
                <div className="slider-row">
                  <p className="slider-title">{mode === 'sip' ? 'Monthly investment' : 'Lumpsum amount'}</p>
                  <div className="slider-value-group">
                    <input
                      className="slider-number-input"
                      type="number"
                      min={mode === 'sip' ? 1000 : 50000}
                      max={mode === 'sip' ? 100000 : 10000000}
                      step={mode === 'sip' ? 500 : 50000}
                      value={mode === 'sip' ? monthly : lumpsum}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        if (!Number.isNaN(value)) {
                          if (mode === 'sip') setMonthly(value)
                          else setLumpsum(value)
                        }
                      }}
                      onBlur={(event) => {
                        const value = Number(event.target.value)
                        if (mode === 'sip') setMonthly(clamp(value, 1000, 100000))
                        else setLumpsum(clamp(value, 50000, 10000000))
                      }}
                    />
                  </div>
                </div>
                {mode === 'sip' ? (
                  <input
                    id="monthly-slider"
                    type="range"
                    min="1000"
                    max="100000"
                    step="500"
                    value={monthly}
                    onChange={(event) => setMonthly(Number(event.target.value))}
                    style={{ background: sliderBackground(monthly, 1000, 100000) }}
                  />
                ) : (
                  <input
                    id="lumpsum-slider"
                    type="range"
                    min="50000"
                    max="10000000"
                    step="50000"
                    value={lumpsum}
                    onChange={(event) => setLumpsum(Number(event.target.value))}
                    style={{ background: sliderBackground(lumpsum, 50000, 10000000) }}
                  />
                )}
                <div className="slider-meta-row">
                  <span>{mode === 'sip' ? '₹1k' : '₹50k'}</span>
                  <span>{mode === 'sip' ? '₹1L' : '₹1Cr'}</span>
                </div>
              </div>

              <div className="slider-group">
                <div className="slider-row">
                  <p className="slider-title">Expected return rate (p.a.)</p>
                  <div className="slider-value-group">
                    <input
                      className="slider-number-input"
                      type="number"
                      min={1}
                      max={25}
                      step={0.5}
                      value={rate}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        if (!Number.isNaN(value)) setRate(value)
                      }}
                      onBlur={() => setRate(clamp(rate, 1, 25))}
                    />
                  </div>
                </div>
                <input
                  id="rate-slider"
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={rate}
                  onChange={(event) => setRate(Number(event.target.value))}
                  style={{ background: sliderBackground(rate, 1, 25) }}
                />
                <div className="slider-meta-row">
                  <span>1%</span>
                  <span>25%</span>
                </div>
              </div>

              <div className="slider-group">
                <div className="slider-row">
                  <p className="slider-title">Time period</p>
                  <div className="slider-value-group">
                    <input
                      className="slider-number-input"
                      type="number"
                      min={1}
                      max={30}
                      step={1}
                      value={years}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        if (!Number.isNaN(value)) setYears(value)
                      }}
                      onBlur={() => setYears(clamp(years, 1, 30))}
                    />
                  </div>
                </div>
                <input
                  id="years-slider"
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={years}
                  onChange={(event) => setYears(Number(event.target.value))}
                  style={{ background: sliderBackground(years, 1, 30) }}
                />
                <div className="slider-meta-row">
                  <span>1 Yr</span>
                  <span>30 Yr</span>
                </div>
              </div>

        <div className="results-card">
          <div className="result-row">
            <p className="result-label">{mode === 'sip' ? 'Invested amount' : 'Initial investment'}</p>
            <p className="result-value">{formatCurrency(result.invested)}</p>
          </div>
          <div className="result-row">
            <p className="result-label">Est. returns</p>
            <p className="result-value highlight">{formatCurrency(result.returns)}</p>
          </div>
          <div className="divider" />
          <div className="result-row total-row">
            <p className="result-label">Total value</p>
            <p className="result-value">{formatCurrency(result.total)}</p>
          </div>
        </div>

              {(mode === 'sip' || mode === 'lumpsum') && (
                <>
                  <div className="swp-section">
                    <h3>Systematic Withdrawal Plan (SWP)</h3>
                    <div className="slider-group">
                      <div className="slider-row">
                        <p className="slider-title">Total investment</p>
                        <div className="slider-value-group">
                          <input
                            className="slider-number-input"
                            type="number"
                            min={0}
                            max={100000000}
                            step={1000}
                            value={Math.round(swpPrincipal)}
                            onChange={(event) => {
                              const value = Number(event.target.value)
                              if (!Number.isNaN(value)) {
                                setSwpPrincipal(value)
                                setSwpPrincipalEdited(true)
                              }
                            }}
                            onBlur={() => setSwpPrincipal(clamp(Math.round(swpPrincipal), 0, 100000000))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="slider-group">
                      <div className="slider-row">
                        <p className="slider-title">Withdrawal per month</p>
                        <div className="slider-value-group">
                          <input
                            className="slider-number-input"
                            type="number"
                            min={0}
                            max={1000000}
                            step={1000}
                            value={swpWithdrawal}
                            onChange={(e) => setSwpWithdrawal(Number(e.target.value))}
                            onBlur={() => setSwpWithdrawal(clamp(swpWithdrawal, 0, 1000000))}
                          />
                        </div>
                      </div>
                      <input
                        id="swp-withdrawal-slider"
                        type="range"
                        min="0"
                        max="1000000"
                        step="1000"
                        value={swpWithdrawal}
                        onChange={(event) => setSwpWithdrawal(Number(event.target.value))}
                        style={{ background: sliderBackground(swpWithdrawal, 0, 1000000) }}
                      />
                      <div className="slider-meta-row">
                        <span>₹0</span>
                        <span>₹10L</span>
                      </div>
                    </div>

                    <div className="slider-group">
                      <div className="slider-row">
                        <p className="slider-title">SWP period</p>
                        <div className="slider-value-group">
                          <input
                            className="slider-number-input"
                            type="number"
                            min={1}
                            max={30}
                            step={1}
                            value={swpYears}
                            onChange={(event) => {
                              const value = Number(event.target.value)
                              if (!Number.isNaN(value)) setSwpYears(value)
                            }}
                            onBlur={() => setSwpYears(clamp(swpYears, 1, 30))}
                          />
                        </div>
                      </div>
                      <input
                        id="swp-years-slider"
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={swpYears}
                        onChange={(event) => setSwpYears(Number(event.target.value))}
                        style={{ background: sliderBackground(swpYears, 1, 30) }}
                      />
                      <div className="slider-meta-row">
                        <span>1 Yr</span>
                        <span>30 Yr</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
        </div>

        {(mode === 'sip' || mode === 'lumpsum') && (
          <div className="results-card swp-results">
            <div className="result-row">
              <p className="result-label">Total investment</p>
              <p className="result-value">{formatCurrency(result.total)}</p>
            </div>
            <div className="result-row">
              <p className="result-label">Total withdrawal</p>
              <p className="result-value highlight">{formatCurrency(swpResult.totalWithdrawal)}</p>
            </div>
            <div className="divider" />
            <div className="result-row total-row">
              <p className="result-label">Final value</p>
              <p className="result-value">{formatCurrency(swpResult.finalValue)}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
