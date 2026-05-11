import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import './Dashboard.css';

const statusLabel = {
  green: 'Buffer absorbing',
  yellow: 'Buffer nearly full',
  red: 'Delay inevitable'
};

const getStatusColor = (status) => {
  if (status === 'green') return '#22c55e';
  if (status === 'yellow') return '#f59e0b';
  return '#ef4444';
};

const getEfficiencyColor = (efficiency) => {
  if (efficiency >= 80) return '#22c55e';
  if (efficiency >= 60) return '#f59e0b';
  return '#ef4444';
};

const formatCurrency = (value) => `$${value.toLocaleString()}`;

function MetricCard({ label, value, detail, tone }) {
  return (
    <div className={`metric-card ${tone || ''}`}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export default function Dashboard({
  flightData,
  fleetSummary,
  simulationMetrics,
  currentFlight,
  onFlightSelect,
  isPlaying,
  onPlayPause,
  speed,
  onSpeedChange
}) {
  const chartData = flightData.map((flight) => ({
    flight: flight.Flight_ID,
    time: flight.STA,
    temp: flight.Ambient_Temp_C,
    staticDelay: flight.staticDelay,
    dynamicDelay: flight.dynamicDelay,
    dynamicBuffer: flight.dynamicBuffer,
    actual: flight.actualTurnaround,
    risk: flight.riskScore
  }));

  const phaseRows = [
    ['Deboarding', simulationMetrics.phaseTimings.deboarding],
    ['Cabin cleaning', simulationMetrics.phaseTimings.cleaning],
    ['Baggage', simulationMetrics.phaseTimings.baggage],
    ['Refueling', simulationMetrics.phaseTimings.refueling],
    ['Boarding', simulationMetrics.phaseTimings.boarding],
    ['Security offload', simulationMetrics.phaseTimings.security]
  ].filter(([, minutes]) => minutes > 0);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Multan Heatwave Turnaround Control</h1>
          <p>Dynamic buffer simulation for 50 flights across a 24-hour extreme-heat cycle.</p>
        </div>
        <div className={`header-status ${simulationMetrics.bufferStatus}`}>
          <span />
          {statusLabel[simulationMetrics.bufferStatus]}
        </div>
      </header>

      <section className="control-panel">
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={onPlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <label className="flight-selector">
          <span>Flight</span>
          <select value={currentFlight} onChange={(event) => onFlightSelect(Number(event.target.value))}>
            {flightData.map((flight, index) => (
              <option key={flight.Flight_ID} value={index}>
                {flight.Flight_ID} · {flight.Aircraft_Type} · STA {flight.STA}
              </option>
            ))}
          </select>
        </label>

        <label className="speed-control">
          <span>Speed</span>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
          />
          <strong>{speed}x</strong>
        </label>
      </section>

      <section className="summary-grid">
        <MetricCard
          label="Static OTP"
          value={`${fleetSummary.staticOtpRate}%`}
          detail={`${fleetSummary.staticOnTime}/${flightData.length} flights within 15 min`}
          tone="danger"
        />
        <MetricCard
          label="Dynamic OTP"
          value={`${fleetSummary.dynamicOtpRate}%`}
          detail={`${fleetSummary.dynamicOnTime}/${flightData.length} flights within 15 min`}
          tone="success"
        />
        <MetricCard
          label="Delay Avoided"
          value={`${fleetSummary.recoveredDelay} min`}
          detail={`${formatCurrency(fleetSummary.costAvoided)} avoided at $75/min`}
        />
        <MetricCard
          label="Avg Dynamic Buffer"
          value={`${fleetSummary.averageDynamicBuffer} min`}
          detail={`${fleetSummary.scheduleChanges} flights need schedule retiming`}
        />
      </section>

      <section className="live-grid">
        <div className="live-card weather-card">
          <span className="section-label">Environmental stress</span>
          <div className="temperature-readout">
            <strong>{simulationMetrics.Ambient_Temp_C}°C</strong>
            <span>Heat index {simulationMetrics.heatIndex}°C</span>
          </div>
          <div className="efficiency-meter">
            <div className="efficiency-track">
              <div
                style={{
                  width: `${simulationMetrics.staffEfficiency}%`,
                  backgroundColor: getEfficiencyColor(simulationMetrics.staffEfficiency)
                }}
              />
            </div>
            <span>Staff productivity {simulationMetrics.staffEfficiency}%</span>
          </div>
        </div>

        <div className="live-card">
          <span className="section-label">Current flight</span>
          <div className="flight-title">
            <strong>{simulationMetrics.Flight_ID}</strong>
            <span>{simulationMetrics.Aircraft_Type} · {simulationMetrics.Pax_Load_Factor_}% load · {simulationMetrics.PRM_Count} PRM</span>
          </div>
          <dl className="compact-list">
            <div><dt>STA / STD</dt><dd>{simulationMetrics.STA} / {simulationMetrics.STD}</dd></div>
            <div><dt>Target off-block</dt><dd>{simulationMetrics.targetOffBlock}</dd></div>
            <div><dt>GSE reliability</dt><dd>{Math.round(simulationMetrics.GSE_Reliability_Score * 100)}%</dd></div>
            <div><dt>Fatigue</dt><dd>{simulationMetrics.Ground_Staff_Fatigue_Level}</dd></div>
          </dl>
        </div>

        <div className="live-card delay-card">
          <span className="section-label">Delay clock</span>
          <strong className={simulationMetrics.staticDelay > 0 ? 'late' : 'on-time'}>
            +{simulationMetrics.staticDelay} min
          </strong>
          <span>Dynamic plan leaves +{simulationMetrics.dynamicDelay} min exposed</span>
          <span>{formatCurrency(simulationMetrics.delayCost)} static cost · {formatCurrency(simulationMetrics.dynamicDelayCost)} dynamic cost</span>
        </div>
      </section>

      <section className="buffer-section">
        <div className="buffer-comparison">
          <div>
            <span className="section-label">Static buffer</span>
            <strong>{simulationMetrics.staticBuffer} min</strong>
            <p>Fixed airline allowance against a {simulationMetrics.scheduledTurnaround} min published turnaround.</p>
          </div>
          <div className="buffer-rail">
            <span style={{ width: `${Math.min(100, (simulationMetrics.staticBuffer / 60) * 100)}%` }} />
          </div>
        </div>

        <div className="buffer-comparison dynamic">
          <div>
            <span className="section-label">Dynamic buffer</span>
            <strong>{simulationMetrics.dynamicBuffer} min</strong>
            <p>Calculated from heat, load, PRM, GSE reliability, fatigue, queue risk, and aircraft type.</p>
          </div>
          <div className="buffer-rail">
            <span style={{ width: `${Math.min(100, (simulationMetrics.dynamicBuffer / 60) * 100)}%` }} />
          </div>
        </div>
      </section>

      <section className="timeline-section">
        <div className="section-heading">
          <div>
            <span className="section-label">Turnaround process</span>
            <h2>{simulationMetrics.activePhase}</h2>
          </div>
          <strong>{simulationMetrics.actualTurnaround} min actual</strong>
        </div>
        <div className="timeline">
          {phaseRows.map(([phase, minutes]) => (
            <div
              key={phase}
              className={`timeline-phase ${simulationMetrics.activePhase === phase ? 'active' : ''}`}
              style={{ flexGrow: Math.max(minutes, 8) }}
            >
              <span>{phase}</span>
              <strong>{minutes}m</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="risk-grid">
        <div className="risk-card">
          <span className="section-label">Stochastic events</span>
          <dl className="compact-list">
            <div><dt>No-show offload</dt><dd>{simulationMetrics.events.noShowEvent ? `${simulationMetrics.events.securityOffloadDelay} min` : 'No event'}</dd></div>
            <div><dt>GSE failure</dt><dd>{simulationMetrics.events.gseFailure ? `${simulationMetrics.events.repairDelay} min MTTR` : 'No failure'}</dd></div>
            <div><dt>Resource queue</dt><dd>{simulationMetrics.events.queueDelay} min</dd></div>
            <div><dt>Failure probability</dt><dd>{simulationMetrics.events.failureProbability}%</dd></div>
          </dl>
        </div>

        <div className="risk-card">
          <span className="section-label">Flight risk score</span>
          <div className="risk-meter">
            <span style={{ width: `${Math.min(100, simulationMetrics.riskScore)}%`, backgroundColor: getStatusColor(simulationMetrics.bufferStatus) }} />
          </div>
          <strong>{simulationMetrics.riskScore}</strong>
          <p>{statusLabel[simulationMetrics.bufferStatus]} at {simulationMetrics.bufferUtilization}% dynamic-buffer utilization.</p>
        </div>
      </section>

      <section className="chart-section">
        <div className="section-heading">
          <div>
            <span className="section-label">24-hour heatwave cycle</span>
            <h2>Temperature, buffer, and delay exposure</h2>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={5} />
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #334155', borderRadius: 8 }} />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="temp" name="Temp C" stroke="#f97316" fill="rgba(249, 115, 22, 0.18)" />
            <Line yAxisId="left" type="monotone" dataKey="dynamicBuffer" name="Dynamic buffer" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Bar yAxisId="right" dataKey="staticDelay" name="Static delay" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="dynamicDelay" name="Dynamic delay" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section className="chart-section">
        <div className="section-heading">
          <div>
            <span className="section-label">Risk ranking</span>
            <h2>Highest operational-risk flights</h2>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[...chartData].sort((a, b) => b.risk - a.risk).slice(0, 10)}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
            <XAxis dataKey="flight" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #334155', borderRadius: 8 }} />
            <Bar dataKey="risk" name="Risk score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
