import {
  sipFutureValue,
  lumpsumFutureValue,
  swpProjection,
  monthsUntilDepleted,
  rupees,
  rupeesShort,
  durationLabel,
} from './finance.mjs'

export const SITE = {
  origin: 'https://www.sipswpcalculator.online',
  name: 'SIP SWP Calculator',
  locale: 'en_IN',
  lang: 'en-IN',
}

export const NAV = [
  { href: '/', label: 'SIP + SWP' },
  { href: '/sip-calculator/', label: 'SIP' },
  { href: '/swp-calculator/', label: 'SWP' },
  { href: '/lumpsum-calculator/', label: 'Lumpsum' },
  { href: '/sip-vs-swp/', label: 'SIP vs SWP' },
]

const table = (caption, headings, rows, { prose = false } = {}) => `
<div class="table-wrap${prose ? ' table-wrap--prose' : ''}">
  <table>
    <caption>${caption}</caption>
    <thead><tr>${headings.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows
      .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`)
      .join('')}</tbody>
  </table>
</div>`

const disclaimer = `
<p class="disclaimer"><strong>Disclaimer:</strong> Every figure on this page is an illustration produced by a
compounding formula, not a forecast and not investment advice. Mutual fund returns are market-linked and are
neither guaranteed nor uniform year to year. Verify your own plan with a SEBI-registered investment adviser
before acting on it.</p>`

/* ---------------------------------------------------------------- home ---- */

const sipRows = [5000, 10000, 25000, 50000].flatMap((monthly) =>
  [10, 15, 20].map((years) => {
    const sip = sipFutureValue(monthly, 12, years)
    return [
      rupees(monthly),
      `${years} years`,
      rupeesShort(sip.invested),
      rupeesShort(sip.returns),
      `<strong>${rupeesShort(sip.total)}</strong>`,
    ]
  }),
)

const handoff = sipFutureValue(25000, 12, 20)
const handoffSwp = swpProjection(handoff.total, 150000, 9, 25)

const homeBody = `
<h2>One window for the whole journey: build the corpus, then spend it</h2>
<p>Most online calculators stop at the moment your investing ends. You work out that a
${rupees(25000)} monthly SIP at 12% for 20 years becomes <strong>${rupeesShort(handoff.total)}</strong>, and then
you have to copy that number, open a second tab, find a systematic withdrawal plan calculator, and retype it into a
&ldquo;total investment&rdquo; field. Get one digit wrong and the entire retirement picture is wrong.</p>
<p>This tool removes that step. The <strong>total value</strong> your SIP or lumpsum produces is passed straight into
the SWP calculator&rsquo;s total investment field, live, as you move the sliders. Change the return assumption from 12%
to 10% and the withdrawal projection underneath updates in the same breath. You never copy a number, and the two halves
of the plan can never drift apart.</p>

<h2>How the SIP to SWP handoff works</h2>
<ol class="steps">
  <li><strong>Pick your accumulation mode.</strong> SIP for a monthly contribution, Lumpsum for a one-time amount.</li>
  <li><strong>Set amount, expected return and time period.</strong> The results card shows invested amount, estimated
      returns and total value.</li>
  <li><strong>Look down at the SWP section.</strong> Total investment is already filled in with that total value &mdash;
      no copying, no retyping.</li>
  <li><strong>Enter your monthly withdrawal and the SWP period.</strong> You immediately see total withdrawals and the
      projected final value, so you can tell whether the corpus survives the plan or is exhausted by it.</li>
  <li><strong>Override it if you want.</strong> Type your own figure into total investment and the tool respects it
      &mdash; useful when you already hold a corpus and only need the withdrawal half. The
      <a href="/swp-calculator/">SWP only view</a> does the same thing.</li>
</ol>

<h2>A worked example</h2>
<p>Say you invest ${rupees(25000)} a month for 20 years and assume 12% a year. You contribute
${rupeesShort(handoff.invested)} of your own money; estimated returns add ${rupeesShort(handoff.returns)}, for a total
of <strong>${rupeesShort(handoff.total)}</strong>. That total drops into the SWP calculator by itself. Withdraw
${rupees(150000)} a month for the next 25 years at a more conservative 9% return and you take out
${rupeesShort(handoffSwp.totalWithdrawal)} in total, with a projected final value of
<strong>${rupeesShort(handoffSwp.finalValue)}</strong>. Two numbers, one screen, no spreadsheet.</p>

<h2>What a &#8377;5,000 to &#8377;50,000 monthly SIP builds at 12%</h2>
${table(
  'Estimated SIP value at a 12% annual return, contributions made at the start of each month.',
  ['Monthly SIP', 'Period', 'You invest', 'Est. returns', 'Total value'],
  sipRows,
)}

<h2>The formulas behind the numbers</h2>
<p>The SIP side uses the future value of an annuity due, because a SIP instalment is paid at the
<em>beginning</em> of each month and therefore earns a full month of growth:</p>
<p class="formula">FV = P &times; [ ((1 + i)<sup>n</sup> &minus; 1) &divide; i ] &times; (1 + i)</p>
<p>P is the monthly instalment, <em>i</em> is the annual rate divided by 12 and then by 100, and <em>n</em> is the
number of months. The SWP side compounds the corpus forward and subtracts each withdrawal as it happens:</p>
<p class="formula">FV = C &times; (1 + i)<sup>n</sup> &minus; W &times; [ ((1 + i)<sup>n</sup> &minus; 1) &divide; i ]</p>
<p>C is the starting corpus, W the fixed monthly withdrawal. A negative final value means the withdrawals outran the
corpus &mdash; reduce W, shorten the period, or go back and build a larger C.</p>
${disclaimer}`

const homeFaq = [
  [
    'Can I calculate SIP and SWP together in one calculator?',
    'Yes. That is exactly what this page does. The total value produced by the SIP or lumpsum calculator is fed automatically into the SWP calculator’s total investment field, so both phases of the plan sit in one window and update together. You never have to copy a figure between two tools.',
  ],
  [
    'Do I have to copy the SIP total into the SWP calculator myself?',
    'No. It is filled in for you and recalculates every time you change the monthly amount, the expected return or the time period. If you would rather use a different corpus, type over it and the tool keeps your value.',
  ],
  [
    'Is the SIP SWP calculator free to use?',
    'Yes, it is completely free, needs no sign-up and no personal or financial details. Everything is calculated in your browser, so nothing you enter is sent to a server.',
  ],
  [
    'What return rate should I assume?',
    'Long-run Indian equity index returns have historically fallen in the 10% to 14% band over multi-decade periods, but any single decade can be far higher or lower. Many people model the accumulation phase at 10% to 12% and the withdrawal phase at 7% to 9%, because portfolios are usually shifted towards debt near retirement. Run the numbers at several rates rather than trusting one.',
  ],
  [
    'What does a negative final value mean in the SWP result?',
    'It means the corpus ran out before the withdrawal period ended. Either the monthly withdrawal is too large for the corpus, the period is too long, or the assumed return is too low. Lower the withdrawal until the final value turns positive to find a sustainable figure.',
  ],
  [
    'Does the calculator account for tax, inflation or exit load?',
    'No. The figures are pre-tax and in today’s rupees. In India, equity mutual fund gains held over a year are taxed as long-term capital gains, and only the gain portion of each SWP withdrawal is taxable, not the whole withdrawal. Inflation also erodes what a fixed monthly withdrawal actually buys over 20 or 30 years. Treat the output as a gross illustration.',
  ],
]

/* ----------------------------------------------------------- sip page ---- */

const sipCompare = [10, 15, 20, 25, 30].map((years) => {
  const a = sipFutureValue(10000, 10, years)
  const b = sipFutureValue(10000, 12, years)
  const c = sipFutureValue(10000, 14, years)
  return [`${years} years`, rupeesShort(a.invested), rupeesShort(a.total), rupeesShort(b.total), rupeesShort(c.total)]
})

const sipBody = `
<h2>What a SIP calculator actually tells you</h2>
<p>A Systematic Investment Plan puts a fixed amount into a mutual fund on the same date every month. Because each
instalment is invested at whatever the NAV happens to be that day, you buy more units when markets are down and fewer
when they are up, and because every instalment then compounds for the rest of the term, the instalments you make in
year one do far more work than the ones you make in year fifteen.</p>
<p>This SIP calculator turns three inputs &mdash; monthly investment, expected annual return and time period &mdash;
into three outputs: the amount you actually contribute, the estimated returns on top, and the total value at the end.
Drag any slider and all three update instantly.</p>

<h2>Why time matters more than the amount</h2>
<p>Compounding is not linear, and the table below is the clearest way to see it. A ${rupees(10000)} SIP held for 30
years rather than 15 does not produce twice as much &mdash; at 12% it produces roughly six times as much, because the
extra fifteen years compound on a base that fifteen years of investing already built.</p>
${table(
  'Estimated total value of a ₹10,000 monthly SIP at three different return assumptions.',
  ['Period', 'You invest', 'At 10% p.a.', 'At 12% p.a.', 'At 14% p.a.'],
  sipCompare,
)}

<h2>How to use this SIP calculator</h2>
<ol class="steps">
  <li>Leave the mode on <strong>SIP</strong> and set your monthly investment with the slider or by typing the amount.</li>
  <li>Set the expected annual return. Use a range, not a single hopeful number &mdash; try 10%, then 12%, then 14%.</li>
  <li>Set the time period in years.</li>
  <li>Read off invested amount, estimated returns and total value.</li>
  <li>Scroll down: that total value is already sitting in the SWP calculator, ready for you to plan the withdrawal
      phase. See the <a href="/">combined SIP and SWP calculator</a> for how the two work together.</li>
</ol>

<h2>The SIP formula</h2>
<p class="formula">FV = P &times; [ ((1 + i)<sup>n</sup> &minus; 1) &divide; i ] &times; (1 + i)</p>
<p>P is the monthly instalment, <em>i</em> the monthly rate (annual rate &divide; 12 &divide; 100) and <em>n</em> the
number of months. The trailing (1 + i) is what makes this an annuity <em>due</em>: SIP money goes in at the start of the
month, so every instalment earns one extra month of growth. Calculators that omit it understate long-horizon SIPs by a
few percent.</p>

<h2>Investing a one-time amount instead?</h2>
<p>If you have a bonus or maturity proceeds to deploy in one go, switch the mode to Lumpsum, or use the dedicated
<a href="/lumpsum-calculator/">lumpsum calculator</a>, which compounds a single amount annually rather than a stream of
monthly instalments.</p>
${disclaimer}`

const sipFaq = [
  [
    'What is a SIP calculator?',
    'A SIP calculator estimates what a fixed monthly mutual fund investment could grow into. You supply the monthly amount, an assumed annual return and the number of years; it returns the total you will have contributed, the estimated returns on top, and the combined future value.',
  ],
  [
    'How is SIP return calculated?',
    'With the future value of an annuity due: FV = P × [((1 + i)^n − 1) ÷ i] × (1 + i), where P is the monthly instalment, i is the annual rate divided by 12 and by 100, and n is the number of months. Each instalment compounds for the months remaining after it is paid.',
  ],
  [
    'How much will a ₹10,000 monthly SIP be worth in 20 years?',
    `Assuming 12% a year, a ₹10,000 monthly SIP over 20 years means you contribute ${rupeesShort(
      sipFutureValue(10000, 12, 20).invested,
    )} and the estimated total value is about ${rupeesShort(
      sipFutureValue(10000, 12, 20).total,
    )}. At 10% it is closer to ${rupeesShort(
      sipFutureValue(10000, 10, 20).total,
    )}, and at 14% about ${rupeesShort(
      sipFutureValue(10000, 14, 20).total,
    )}. The spread between those three is a fair measure of how uncertain any single projection is.`,
  ],
  [
    'Are SIP calculator results guaranteed?',
    'No. A SIP calculator applies a constant return rate to every month, which no market delivers. Real returns arrive unevenly, and the order in which good and bad years fall changes the outcome. Use the result as a planning range, not a promise.',
  ],
  [
    'Is SIP better than a fixed deposit?',
    'They are different instruments. A fixed deposit gives a contracted rate with capital protection; an equity SIP has no guaranteed return and can fall in value, but has historically delivered more over long periods and is taxed more favourably on long-term gains. Which suits you depends on your time horizon and how much volatility you can hold through.',
  ],
  [
    'Can I increase my SIP amount every year?',
    'Yes, most fund houses offer a step-up or top-up SIP that raises the instalment annually. This calculator models a constant instalment, so to approximate a step-up, run it at your current amount and again at your expected future amount to bracket the outcome.',
  ],
]

/* ----------------------------------------------------------- swp page ---- */

const swpRows = [30000, 50000, 75000, 100000].map((w) => [
  rupees(w),
  durationLabel(monthsUntilDepleted(10000000, w, 7)),
  durationLabel(monthsUntilDepleted(10000000, w, 8)),
  durationLabel(monthsUntilDepleted(10000000, w, 10)),
])

const swpBody = `
<h2>What an SWP calculator tells you</h2>
<p>A Systematic Withdrawal Plan is the mirror image of a SIP. Instead of paying a fixed amount into a mutual fund each
month, you redeem a fixed amount out of it each month, while whatever remains stays invested and keeps growing. It is
the standard way Indian investors convert a retirement corpus into a monthly income without selling everything at
once.</p>
<p>The question an SWP calculator answers is the one that actually matters: <em>will the money last?</em> Enter your
corpus, the monthly withdrawal you want and the expected return, and you get the total you will have withdrawn over the
period and the projected value left at the end. If that final value is negative, the plan runs out of money before the
period does.</p>

<h2>How long does &#8377;1 crore last?</h2>
<p>This is the single most-asked question about SWPs, and the answer swings sharply on the return assumption. When the
monthly withdrawal is smaller than the growth the corpus generates, the corpus is never depleted at all &mdash; at 8% a
year, ${rupeesShort(10000000)} throws off roughly ${rupees((10000000 * 0.08) / 12)} a month in growth alone.</p>
${table(
  'How long a ₹1 crore corpus supports a fixed monthly withdrawal, before tax and inflation.',
  ['Monthly withdrawal', 'At 7% p.a.', 'At 8% p.a.', 'At 10% p.a.'],
  swpRows,
)}
<p>For a fuller treatment of this scenario, including what those withdrawals are worth after inflation, see
<a href="/swp-from-1-crore/">monthly income from &#8377;1 crore</a>.</p>

<h2>How to use this SWP calculator</h2>
<ol class="steps">
  <li>Enter your corpus in <strong>total investment</strong>. If you arrived from the
      <a href="/">combined SIP and SWP calculator</a>, your SIP total is already filled in.</li>
  <li>Set the monthly withdrawal you need.</li>
  <li>Set the expected annual return for the withdrawal years. Most people assume less here than during accumulation,
      because portfolios usually hold more debt near and after retirement.</li>
  <li>Set the SWP period.</li>
  <li>Check the final value. Positive means the corpus outlives the plan; negative means it does not.</li>
</ol>

<h2>The SWP formula</h2>
<p class="formula">FV = C &times; (1 + i)<sup>n</sup> &minus; W &times; [ ((1 + i)<sup>n</sup> &minus; 1) &divide; i ]</p>
<p>C is the opening corpus, W the fixed monthly withdrawal, <em>i</em> the monthly rate and <em>n</em> the number of
months. The first term grows the corpus; the second subtracts each withdrawal along with the growth it would otherwise
have earned.</p>

<h2>How SWP withdrawals are taxed in India</h2>
<p>An SWP redemption is treated as a mutual fund redemption, and only the <em>capital gain</em> portion of each
withdrawal is taxable &mdash; not the entire amount, which is what makes an SWP more tax-efficient than interest income
for many investors. For equity-oriented funds, units held longer than twelve months attract long-term capital gains
tax, with an annual exemption on gains up to a threshold; units sold sooner attract short-term rates. Debt-oriented
funds follow different rules. Tax law changes, thresholds move, and your own slab matters, so confirm the current
position with a qualified tax professional rather than relying on a calculator.</p>
${disclaimer}`

const swpFaq = [
  [
    'What is an SWP calculator?',
    'An SWP calculator estimates how a fixed monthly withdrawal from a mutual fund corpus plays out over time. It shows the total amount withdrawn across the period and the projected value remaining, given an assumed rate of return on the money that stays invested.',
  ],
  [
    'How is SWP calculated?',
    'The corpus is compounded forward at the monthly rate while each withdrawal is subtracted as it occurs: FV = C × (1 + i)^n − W × [((1 + i)^n − 1) ÷ i]. C is the corpus, W the monthly withdrawal, i the monthly rate and n the number of months.',
  ],
  [
    'How much monthly income can ₹1 crore generate?',
    `It depends on how long the income must last. At an assumed 8% a year, roughly ${rupees(
      (10000000 * 0.08) / 12,
    )} a month can be withdrawn indefinitely, because that is what the corpus earns. Withdrawing ₹75,000 a month at 8% exhausts ₹1 crore in about ${durationLabel(
      monthsUntilDepleted(10000000, 75000, 8),
    )}, and ₹1,00,000 a month in about ${durationLabel(monthsUntilDepleted(10000000, 100000, 8))}.`,
  ],
  [
    'Is SWP better than a fixed deposit for regular income?',
    'An SWP is often more tax-efficient, because only the gain portion of each withdrawal is taxed while the whole of an FD payout is interest income. An SWP also leaves the remaining corpus invested for growth. The trade-off is real: FD income is contractual, SWP income comes from an asset whose value moves, and withdrawing a fixed amount from a falling market sells more units at lower prices.',
  ],
  [
    'What is the 4% rule and does it apply in India?',
    'The 4% rule is a US-derived guideline suggesting a retiree can withdraw 4% of the starting corpus in year one, adjusted for inflation thereafter, without running out over roughly thirty years. Indian inflation has generally run higher than the US inflation the rule was built on, so many Indian planners work with a more cautious 3% to 3.5% starting rate. Test your own number in the calculator rather than adopting a rule of thumb.',
  ],
  [
    'Can I start an SWP and a SIP at the same time?',
    'Yes, though they usually belong to different life stages: a SIP builds the corpus, an SWP spends it. The point of a combined calculator is to see the handoff between the two in one place, so the corpus your SIP is on track to build is the same corpus your withdrawal plan draws down.',
  ],
]

/* ------------------------------------------------------- lumpsum page ---- */

const lumpRows = [100000, 500000, 1000000, 2500000].map((amt) => [
  rupeesShort(amt),
  rupeesShort(lumpsumFutureValue(amt, 12, 5).total),
  rupeesShort(lumpsumFutureValue(amt, 12, 10).total),
  rupeesShort(lumpsumFutureValue(amt, 12, 15).total),
  rupeesShort(lumpsumFutureValue(amt, 12, 20).total),
])

const lumpsumBody = `
<h2>Investing a single amount, not a monthly stream</h2>
<p>A lumpsum investment puts one amount to work on one day and leaves it there. There are no further instalments, so
there is no rupee-cost averaging to smooth your entry price &mdash; the whole amount is exposed to whatever the market
does next. In exchange, every rupee gets the maximum possible time in the market, which over long horizons is usually
the stronger force.</p>
<p>This lumpsum calculator compounds your amount annually at the rate you assume and shows the invested amount,
estimated returns and total value.</p>

<h2>What a lumpsum grows to at 12%</h2>
${table(
  'Estimated value of a one-time investment compounded at 12% a year.',
  ['Amount invested', 'After 5 yrs', 'After 10 yrs', 'After 15 yrs', 'After 20 yrs'],
  lumpRows,
)}

<h2>The lumpsum formula</h2>
<p class="formula">FV = P &times; (1 + r)<sup>t</sup></p>
<p>P is the amount invested, <em>r</em> the annual rate as a decimal and <em>t</em> the number of years. This is plain
annual compounding, which is why a lumpsum calculator and a compound interest calculator return the same figure for the
same inputs.</p>

<h2>Lumpsum or SIP?</h2>
<p>If you already hold the money, deploying it as a lumpsum gives it the longest possible runway and, on historical
averages, tends to finish ahead. If the amount is large relative to your net worth and a bad first year would shake you
out of the investment, staggering it over several months through a
<a href="/sip-calculator/">SIP</a> buys behavioural safety at some expected cost. Both are defensible; the wrong choice
is the one you abandon halfway.</p>
<p>Whichever you pick, the total value it produces flows straight into the
<a href="/swp-calculator/">SWP calculator</a> below, so you can plan the withdrawal phase in the same window.</p>
${disclaimer}`

const lumpsumFaq = [
  [
    'What is a lumpsum calculator?',
    'A lumpsum calculator estimates the future value of a single one-time investment compounded at an assumed annual rate over a chosen number of years, and separates that value into the amount you invested and the estimated returns on top.',
  ],
  [
    'How is lumpsum return calculated?',
    'With annual compounding: FV = P × (1 + r)^t, where P is the invested amount, r is the annual return expressed as a decimal, and t is the number of years.',
  ],
  [
    'Is lumpsum better than SIP?',
    'Historically, investing a lump sum immediately has beaten spreading it out more often than not, simply because money in the market longer compounds longer. But a lumpsum entered just before a sharp fall can take years to recover, so investors who would panic-sell often do better staggering the entry. The behavioural answer and the mathematical answer are not always the same.',
  ],
  [
    'How much will ₹10 lakh grow to in 15 years?',
    `At an assumed 12% a year, ₹10 lakh compounds to about ${rupeesShort(
      lumpsumFutureValue(1000000, 12, 15).total,
    )} in 15 years. At 10% it is roughly ${rupeesShort(
      lumpsumFutureValue(1000000, 10, 15).total,
    )} and at 14% about ${rupeesShort(lumpsumFutureValue(1000000, 14, 15).total)}.`,
  ],
]

/* ------------------------------------------------------ sip vs swp doc ---- */

const sipVsSwpBody = `
<h2>The same machine, running in opposite directions</h2>
<p>SIP and SWP are frequently confused because the acronyms differ by one letter, but they sit at opposite ends of an
investing life. A <strong>Systematic Investment Plan</strong> moves money from your bank account into a mutual fund on a
fixed date each month. A <strong>Systematic Withdrawal Plan</strong> moves money the other way &mdash; out of the fund
and into your bank account, on a fixed date each month. One accumulates, the other distributes.</p>

${table(
  'SIP and SWP compared across the dimensions that change how you plan.',
  ['', 'SIP', 'SWP'],
  [
    ['Direction of money', 'Bank &rarr; mutual fund', 'Mutual fund &rarr; bank'],
    ['Life stage', 'Earning and accumulating', 'Retired or drawing an income'],
    ['What you fix', 'The monthly instalment', 'The monthly withdrawal'],
    ['Units', 'Bought each month', 'Redeemed each month'],
    ['Effect of a market fall', 'Helpful &mdash; instalments buy more units', 'Harmful &mdash; more units sold for the same rupees'],
    ['What you ask the calculator', 'What will my corpus become?', 'How long will my corpus last?'],
    ['Tax event', 'None on investing', 'Capital gains on the gain portion of each withdrawal'],
  ],
  { prose: true },
)}

<h2>Why a falling market flips from friend to enemy</h2>
<p>This is the asymmetry most people miss. During a SIP, a market decline is quietly good news: your fixed
${rupees(10000)} buys more units at the lower NAV, and those extra units are what makes the recovery so profitable.
During an SWP, a decline is the reverse &mdash; you must redeem <em>more</em> units to raise the same fixed rupee
amount, and those units are gone before the recovery arrives. Sequence-of-returns risk, as it is known, is the reason a
withdrawal plan deserves a more conservative return assumption than the accumulation plan that preceded it.</p>

<h2>How the two connect</h2>
<p>The link between them is a single number: the corpus. Your SIP&rsquo;s total value at the end of the accumulation
phase <em>is</em> your SWP&rsquo;s opening balance. Treating them as two unrelated calculations is how people end up
planning a withdrawal against a corpus their contributions were never going to produce.</p>
<p>That is precisely what the <a href="/">combined SIP and SWP calculator</a> is built to prevent. The total value from
the SIP side is written directly into the SWP side&rsquo;s total investment field and stays synchronised as you adjust
assumptions, so the two halves of the plan cannot drift apart.</p>

<h2>Can you run both at once?</h2>
<p>Mechanically, nothing stops you &mdash; they are separate instructions and can even apply to the same fund.
Financially it is usually incoherent: you would be buying and selling the same asset in the same month, paying costs and
possibly tax for no net exposure change. The exception is a deliberate transition, where an existing SWP funds living
expenses while a SIP continues in a different fund for a separate goal.</p>
${disclaimer}`

const sipVsSwpFaq = [
  [
    'What is the difference between SIP and SWP?',
    'A SIP invests a fixed amount into a mutual fund every month to build a corpus. An SWP withdraws a fixed amount from a mutual fund every month to convert that corpus into income. SIP is the accumulation phase, SWP is the distribution phase.',
  ],
  [
    'Which comes first, SIP or SWP?',
    'SIP comes first. It builds the corpus over your earning years. The SWP starts when you need that corpus to pay you an income, and its opening balance is whatever the SIP finished with.',
  ],
  [
    'Is SWP the opposite of SIP?',
    'Directionally yes, but not symmetrically. Market falls help a SIP by buying more units cheaply and hurt an SWP by forcing more units to be sold cheaply. That asymmetry, called sequence-of-returns risk, is why withdrawal plans are usually modelled at a lower assumed return than accumulation plans.',
  ],
  [
    'Can I convert my SIP into an SWP?',
    'Yes. When the accumulation phase ends you stop the SIP and register an SWP against the accumulated units in the same or another fund. Many investors first move the corpus into a lower-volatility fund so that the withdrawal years are less exposed to sharp falls.',
  ],
]

/* ----------------------------------------------------- 1 crore article ---- */

const croreRows = [7, 8, 9, 10, 11, 12].map((rate) => [
  `${rate}% p.a.`,
  rupees((10000000 * rate) / 100 / 12),
  durationLabel(monthsUntilDepleted(10000000, 60000, rate)),
  durationLabel(monthsUntilDepleted(10000000, 80000, rate)),
  durationLabel(monthsUntilDepleted(10000000, 100000, rate)),
])

const sipFor15 = Math.round(10000000 / sipFutureValue(1, 12, 15).total)
const sipFor20 = Math.round(10000000 / sipFutureValue(1, 12, 20).total)

const croreBody = `
<h2>The short answer</h2>
<p>&#8377;1 crore invested at an assumed 8% a year generates about
<strong>${rupees((10000000 * 0.08) / 12)} a month</strong> in growth. Withdraw less than that and the corpus keeps
rising indefinitely. Withdraw more and you are eating into capital, and the only question left is how many years it
takes to finish.</p>

<h2>Monthly income from &#8377;1 crore at different return rates</h2>
<p>The second column is the withdrawal a &#8377;1 crore corpus can sustain forever at that return. The remaining columns
show how long the corpus survives three common withdrawal targets.</p>
${table(
  'Sustainable monthly withdrawal and corpus longevity for a ₹1 crore SWP, before tax and inflation.',
  ['Assumed return', 'Sustainable / month', '₹60,000 / month lasts', '₹80,000 / month lasts', '₹1,00,000 / month lasts'],
  croreRows,
)}

<h2>Why the &ldquo;never runs out&rdquo; rows are more fragile than they look</h2>
<p>A row that says the corpus is never depleted assumes the return arrives smoothly, every month, forever. Real markets
do not oblige. A portfolio averaging 10% over twenty years might deliver &minus;18% in year three, and a retiree
withdrawing a fixed &#8377;80,000 through that year redeems far more units than planned, permanently shrinking the base
that has to recover. This is why a plan that looks perpetual on paper can still fail in practice, and why keeping two or
three years of withdrawals in a low-volatility holding is common advice.</p>

<h2>What inflation does to a fixed withdrawal</h2>
<p>&#8377;80,000 a month buys considerably less after twenty years than it does today. At 6% inflation, its purchasing
power roughly halves in twelve years and falls to about a third in twenty. A withdrawal plan that is comfortable at the
start and never rises can become inadequate long before the corpus runs out. If you expect to raise the withdrawal over
time, model the higher future amount now and see whether the corpus still holds.</p>

<h2>Building the &#8377;1 crore in the first place</h2>
<p>Running the arithmetic backwards: at an assumed 12% a year, a monthly SIP of about ${rupees(sipFor15)} for 15 years,
or roughly ${rupees(sipFor20)} for 20 years, reaches &#8377;1 crore. Use the
<a href="/">combined SIP and SWP calculator</a> to set the accumulation target and the withdrawal plan side by side
&mdash; the corpus your SIP produces flows straight into the withdrawal projection, so you can see immediately whether
the income you want is the income your contributions will actually support.</p>
${disclaimer}`

const croreFaq = [
  [
    'How much monthly income can ₹1 crore generate?',
    `At an assumed 8% annual return, about ${rupees(
      (10000000 * 0.08) / 12,
    )} a month can be withdrawn without touching capital. At 10% it is roughly ${rupees(
      (10000000 * 0.1) / 12,
    )} a month. Withdrawing more than the corpus earns means drawing down capital, which is sustainable only for a limited number of years.`,
  ],
  [
    'How long will ₹1 crore last at ₹1 lakh per month?',
    `At an assumed 8% return, ₹1 crore supports a ₹1,00,000 monthly withdrawal for about ${durationLabel(
      monthsUntilDepleted(10000000, 100000, 8),
    )}. At 10% it stretches to roughly ${durationLabel(
      monthsUntilDepleted(10000000, 100000, 10),
    )}. Both figures are before tax and assume returns arrive evenly, which they do not.`,
  ],
  [
    'Is ₹1 crore enough to retire on in India?',
    'It depends entirely on your monthly expenses, your age at retirement and your other income. ₹1 crore comfortably supports a ₹40,000 to ₹50,000 monthly withdrawal almost indefinitely at reasonable return assumptions, but the same corpus supporting ₹1,00,000 a month is drawing down capital and has a finite life. Model your actual expense figure rather than the round number.',
  ],
  [
    'How much SIP is needed to build ₹1 crore?',
    `At an assumed 12% annual return, roughly ${rupees(sipFor15)} a month for 15 years, or about ${rupees(
      sipFor20,
    )} a month for 20 years. Lower the return assumption and both figures rise sharply.`,
  ],
]

/* ---------------------------------------------------------------- pages ---- */

export const PAGES = [
  {
    path: '/',
    file: 'index.html',
    app: { view: 'investment', mode: 'sip' },
    title: 'SIP & SWP Calculator Together — Free Combined Calculator',
    description:
      'Free SIP and SWP calculator in one window. Your SIP or lumpsum total flows straight into the SWP calculator — no copying the corpus between two tools.',
    h1: 'SIP &amp; SWP Calculator, Together in One Window',
    intro:
      'Your SIP or lumpsum total flows straight into the SWP calculator — no copying between two tools.',
    eyebrow: 'Free mutual fund planning tool',
    body: homeBody,
    faq: homeFaq,
    schema: 'app',
    priority: '1.0',
  },
  {
    path: '/sip-calculator/',
    file: 'sip-calculator/index.html',
    app: { view: 'investment', mode: 'sip' },
    title: 'SIP Calculator — Calculate Mutual Fund SIP Returns Online',
    description:
      'Free SIP calculator for mutual fund returns. Enter your monthly amount, expected return and years to see invested amount, returns and total value.',
    h1: 'SIP Calculator',
    intro:
      'Set your monthly amount, expected return and time period to see invested amount, returns and total value.',
    eyebrow: 'Systematic Investment Plan',
    body: sipBody,
    faq: sipFaq,
    schema: 'app',
    priority: '0.9',
  },
  {
    path: '/swp-calculator/',
    file: 'swp-calculator/index.html',
    app: { view: 'swp', mode: 'sip' },
    title: 'SWP Calculator — Systematic Withdrawal Plan Calculator',
    description:
      'Free SWP calculator. Enter your corpus, monthly withdrawal and expected return to see total withdrawals, final value and how long your money lasts.',
    h1: 'SWP Calculator',
    intro:
      'Enter your corpus, monthly withdrawal and expected return to see how long the money lasts.',
    eyebrow: 'Systematic Withdrawal Plan',
    body: swpBody,
    faq: swpFaq,
    schema: 'app',
    priority: '0.9',
  },
  {
    path: '/lumpsum-calculator/',
    file: 'lumpsum-calculator/index.html',
    app: { view: 'investment', mode: 'lumpsum' },
    title: 'Lumpsum Calculator — One-Time Mutual Fund Investment Returns',
    description:
      'Free lumpsum calculator for a one-time mutual fund investment. See invested amount, estimated returns and total value at your expected annual return.',
    h1: 'Lumpsum Calculator',
    intro:
      'See what a single one-time investment compounds to over your chosen holding period.',
    eyebrow: 'One-time investment',
    body: lumpsumBody,
    faq: lumpsumFaq,
    schema: 'app',
    priority: '0.8',
  },
  {
    path: '/sip-vs-swp/',
    file: 'sip-vs-swp/index.html',
    app: null,
    title: 'SIP vs SWP — Difference Between SIP and SWP Explained',
    description:
      'SIP invests a fixed amount monthly, SWP withdraws one. How they differ, why market falls help a SIP but hurt an SWP, and the number that links them.',
    h1: 'SIP vs SWP: What Is the Difference?',
    intro:
      'One letter apart, opposite in every practical sense — and linked by a single number.',
    eyebrow: 'Guide',
    body: sipVsSwpBody,
    faq: sipVsSwpFaq,
    schema: 'article',
    datePublished: '2026-09-10',
    priority: '0.7',
  },
  {
    path: '/swp-from-1-crore/',
    file: 'swp-from-1-crore/index.html',
    app: null,
    title: 'Monthly Income From ₹1 Crore — SWP Calculator Guide',
    description:
      'How much monthly income can ₹1 crore generate via SWP, and how long does it last at ₹60,000, ₹80,000 or ₹1 lakh a month? Tables at 7–12% returns.',
    h1: 'How Much Monthly Income Can &#8377;1 Crore Generate?',
    intro:
      'What a ₹1 crore corpus sustains, and how long it lasts at common monthly withdrawal targets.',
    eyebrow: 'Guide',
    body: croreBody,
    faq: croreFaq,
    schema: 'article',
    datePublished: '2026-09-10',
    priority: '0.7',
  },
  {
    path: '/about/',
    file: 'about/index.html',
    app: null,
    title: 'About SIP SWP Calculator',
    description:
      'Who built this SIP and SWP calculator, what formulas it uses, how your data is handled, and the limits of what any compounding calculator can tell you.',
    h1: 'About This Calculator',
    intro: 'What this tool does, what it does not do, and the arithmetic underneath it.',
    eyebrow: 'About',
    body: `
<h2>Why this exists</h2>
<p>Indian investors planning retirement routinely juggle two browser tabs: one calculator to work out what a SIP will
build, another to work out how long that corpus will last under monthly withdrawals. The number has to be carried by
hand from the first to the second, and it goes stale the moment any assumption changes.</p>
<p>This site collapses that into one screen. The total value produced by the SIP or lumpsum calculator is written
directly into the SWP calculator&rsquo;s total investment field and stays synchronised as you adjust the inputs.</p>

<h2>How the numbers are produced</h2>
<p>Three standard formulas, applied exactly as published, with no hidden fees, no assumed fund expense ratio and no tax
deduction:</p>
<ul>
  <li><strong>SIP</strong> &mdash; future value of an annuity due:
      FV = P &times; [((1 + i)<sup>n</sup> &minus; 1) &divide; i] &times; (1 + i)</li>
  <li><strong>Lumpsum</strong> &mdash; annual compounding: FV = P &times; (1 + r)<sup>t</sup></li>
  <li><strong>SWP</strong> &mdash; corpus compounded forward less each withdrawal:
      FV = C &times; (1 + i)<sup>n</sup> &minus; W &times; [((1 + i)<sup>n</sup> &minus; 1) &divide; i]</li>
</ul>

<h2>What it cannot tell you</h2>
<p>Every projection here applies one constant rate to every single month. No market behaves that way. Real returns
arrive unevenly, and for a withdrawal plan the <em>order</em> in which good and bad years fall materially changes the
outcome &mdash; a sharp fall early in retirement does lasting damage that the same fall later would not. Figures are
also pre-tax, pre-expense-ratio and unadjusted for inflation. Treat the output as a planning range, never a forecast.</p>

<h2>Your data</h2>
<p>Every calculation runs in your browser. Nothing you type is transmitted, stored or logged by this site. There is no
sign-up, no account and no email capture. See the <a href="/privacy/">privacy policy</a> for details on the third-party
advertising scripts the site loads.</p>

<h2>Contact</h2>
<p>Corrections, bug reports and feature requests are welcome &mdash; particularly if you find a figure you believe is
wrong. Reach out at <a href="mailto:hello@sipswpcalculator.online">hello@sipswpcalculator.online</a>.</p>
${disclaimer}`,
    faq: [],
    schema: 'page',
    priority: '0.4',
  },
  {
    path: '/privacy/',
    file: 'privacy/index.html',
    app: null,
    title: 'Privacy Policy — SIP SWP Calculator',
    description:
      'How this SIP and SWP calculator handles your data: calculations run entirely in your browser and nothing you enter is transmitted or stored.',
    h1: 'Privacy Policy',
    intro: 'Last updated 10 September 2026.',
    eyebrow: 'Legal',
    body: `
<h2>What we collect from you: nothing</h2>
<p>Every figure you enter into the calculators &mdash; investment amounts, return assumptions, time periods, withdrawal
amounts &mdash; is processed entirely within your own browser using JavaScript. None of it is sent to our servers,
because the calculators do not communicate with a server at all. We operate no account system, no login and no
newsletter, and we do not ask for your name, email address, phone number or any financial details.</p>

<h2>Third-party services</h2>
<p>The site is served as static files from Microsoft Azure Static Web Apps, whose infrastructure logs standard request
data such as IP address, user agent and requested URL for security and operational purposes.</p>
<p>We display advertising through Google AdSense. Google and its partners may use cookies or similar technologies to
serve ads based on your prior visits to this and other websites. You can opt out of personalised advertising through
<a href="https://www.google.com/settings/ads" rel="nofollow noopener" target="_blank">Google Ads Settings</a>, and
review how Google uses data from sites that use its services at
<a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">policies.google.com/technologies/partner-sites</a>.
Third-party vendors, including Google, use cookies to serve ads based on a user&rsquo;s prior visits to this
website.</p>

<h2>Cookies</h2>
<p>This site sets no cookies of its own. Any cookies present in your browser from this domain originate from the
third-party advertising scripts described above. Most browsers allow you to block or delete cookies through their
settings; doing so does not affect the calculators, which work with cookies fully disabled.</p>

<h2>Children</h2>
<p>This site is not directed at children under 13 and we knowingly collect no information from them.</p>

<h2>Changes to this policy</h2>
<p>Material changes will be reflected here with an updated revision date at the top of the page.</p>

<h2>Contact</h2>
<p>Questions about this policy can be sent to
<a href="mailto:hello@sipswpcalculator.online">hello@sipswpcalculator.online</a>.</p>`,
    faq: [],
    schema: 'page',
    priority: '0.3',
  },
]

export const NOT_FOUND = {
  path: '/404.html',
  file: '404.html',
  app: null,
  noindex: true,
  title: 'Page Not Found — SIP SWP Calculator',
  description: 'The page you were looking for does not exist.',
  h1: 'Page Not Found',
  intro: 'That page does not exist. The calculators below are probably what you were after.',
  eyebrow: '404',
  body: `
<h2>Try one of these</h2>
<ul>
  <li><a href="/">Combined SIP and SWP calculator</a></li>
  <li><a href="/sip-calculator/">SIP calculator</a></li>
  <li><a href="/swp-calculator/">SWP calculator</a></li>
  <li><a href="/lumpsum-calculator/">Lumpsum calculator</a></li>
  <li><a href="/sip-vs-swp/">SIP vs SWP explained</a></li>
</ul>`,
  faq: [],
  schema: 'page',
}
