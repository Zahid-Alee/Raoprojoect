// Deterministic turnaround simulation for Multan heatwave operations.
// The same flight always produces the same result, while still modelling
// stochastic aviation events through a seeded pseudo-random generator.

const AIRCRAFT_PROFILES = {
  A320: { seats: 180, minimumTurnaround: 30, cleaningBase: 10, baggageBase: 18, fuelBase: 12, sizeFactor: 1 },
  B737: { seats: 189, minimumTurnaround: 30, cleaningBase: 10, baggageBase: 18, fuelBase: 12, sizeFactor: 1.03 },
  B777: { seats: 360, minimumTurnaround: 45, cleaningBase: 16, baggageBase: 27, fuelBase: 21, sizeFactor: 1.35 }
};

const FATIGUE_DELAY = {
  Low: 1,
  Medium: 1.12,
  High: 1.28
};

const FATIGUE_EFFICIENCY_PENALTY = {
  Low: 0,
  Medium: 10,
  High: 24
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hashSeed = (input) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createRng = (seedInput) => {
  let seed = hashSeed(seedInput) || 1;
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const triangular = (min, mode, max, rng) => {
  const u = rng();
  const c = (mode - min) / (max - min);
  if (u < c) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
};

const uniform = (min, max, rng) => min + (max - min) * rng();

export const parseClockToMinutes = (time) => {
  const [hours, minutes] = String(time).split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatMinutesAsClock = (minutes) => {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const calculateScheduledTurnaround = (sta, std) => {
  const start = parseClockToMinutes(sta);
  let end = parseClockToMinutes(std);
  if (end < start) end += 1440;
  return end - start;
};

export const calculateHeatIndex = (temp, humidity) => {
  if (temp < 27) return temp;

  const T = temp;
  const RH = humidity;
  const HI = -8.78469475556 +
    1.61139411 * T +
    2.33854883889 * RH -
    0.14611605 * T * RH -
    0.012308094 * T * T -
    0.0164248277778 * RH * RH +
    0.002211732 * T * T * RH +
    0.00072546 * T * RH * RH -
    0.000003582 * T * T * RH * RH;

  return Math.round(HI * 10) / 10;
};

export const calculateEfficiencyMultiplier = (temp, humidity, fatigueLevel = 'Low') => {
  let multiplier = 1;

  if (temp > 40) {
    multiplier += (temp - 40) * 0.04;
  }

  if (humidity > 70) {
    multiplier += 0.05;
  }

  multiplier *= FATIGUE_DELAY[fatigueLevel] || 1;
  return Number(multiplier.toFixed(3));
};

export const getMinimumTurnaroundTime = (aircraftType) => (
  AIRCRAFT_PROFILES[aircraftType]?.minimumTurnaround || AIRCRAFT_PROFILES.A320.minimumTurnaround
);

export const calculateStaffEfficiency = (temp, humidity, fatigueLevel = 'Low') => {
  const heatOnlyMultiplier = calculateEfficiencyMultiplier(temp, humidity, 'Low');
  const heatEfficiency = 100 / heatOnlyMultiplier;
  const fatiguePenalty = FATIGUE_EFFICIENCY_PENALTY[fatigueLevel] || 0;
  return Math.round(clamp(heatEfficiency - fatiguePenalty, 30, 100));
};

const getLoadFactor = (flightData) => clamp((flightData.Pax_Load_Factor_ || 0) / 100, 0.35, 1.05);

const getResourceQueueDelay = (flightData, nearbyFlightCount = 1) => {
  const congestionPressure = Math.max(0, nearbyFlightCount - 2);
  const heatPressure = Math.max(0, flightData.Ambient_Temp_C - 38) * 0.28;
  const reliabilityPressure = Math.max(0, 0.9 - flightData.GSE_Reliability_Score) * 28;
  return Math.round(congestionPressure * 2.2 + heatPressure + reliabilityPressure);
};

export const calculateFlightSimulation = (flightData, options = {}) => {
  const profile = AIRCRAFT_PROFILES[flightData.Aircraft_Type] || AIRCRAFT_PROFILES.A320;
  const rng = createRng(`${flightData.Flight_ID}-${options.seed || 'production'}`);
  const loadFactor = getLoadFactor(flightData);
  const fatigueLevel = flightData.Ground_Staff_Fatigue_Level || 'Low';
  const efficiencyMultiplier = calculateEfficiencyMultiplier(
    flightData.Ambient_Temp_C,
    flightData.Humidity_,
    fatigueLevel
  );

  const passengerScale = 0.75 + loadFactor * 0.35;
  const deboarding = triangular(10, 15, 25, rng) * passengerScale * profile.sizeFactor;
  const boarding = (triangular(20, 30, 45, rng) * passengerScale * profile.sizeFactor) +
    (flightData.PRM_Count || 0) * 4;
  const cleaning = profile.cleaningBase * (0.8 + loadFactor * 0.28) * efficiencyMultiplier;
  const baggageBase = profile.baggageBase * (0.65 + loadFactor * 0.45) * efficiencyMultiplier;
  const refuelingBase = profile.fuelBase * efficiencyMultiplier;
  const queueDelay = getResourceQueueDelay(flightData, options.nearbyFlightCount);

  const failureProbability = clamp(
    0.01 + Math.max(0, 0.9 - flightData.GSE_Reliability_Score) * 0.45 +
      Math.max(0, flightData.Ambient_Temp_C - 44) * 0.012,
    0.01,
    0.35
  );
  const gseFailure = rng() < failureProbability;
  const repairDelay = gseFailure ? uniform(10, 20, rng) : 0;

  const noShowProbability = clamp(0.02 + Math.max(0, loadFactor - 0.9) * 0.08, 0.02, 0.06);
  const noShowEvent = rng() < noShowProbability;
  const securityOffloadDelay = noShowEvent ? uniform(8, 18, rng) : 0;

  const baggage = baggageBase + queueDelay + repairDelay;
  const refueling = refuelingBase + Math.round(queueDelay * 0.35);
  const parallelRamp = Math.max(baggage, refueling);
  const actualTurnaround = Math.round(deboarding + cleaning + parallelRamp + boarding + securityOffloadDelay);
  const minimumTurnaround = profile.minimumTurnaround;
  const scheduledTurnaround = calculateScheduledTurnaround(flightData.STA, flightData.STD);
  const staticBuffer = flightData.Static_Buffer_Min || 15;

  const stressReserve =
    Math.max(0, flightData.Ambient_Temp_C - 40) * 1.15 +
    Math.max(0, flightData.Pax_Load_Factor_ - 88) * 0.35 +
    (flightData.PRM_Count || 0) * 2.5 +
    Math.max(0, 0.9 - flightData.GSE_Reliability_Score) * 65 +
    (fatigueLevel === 'High' ? 8 : fatigueLevel === 'Medium' ? 4 : 0) +
    (flightData.Aircraft_Type === 'B777' ? 7 : 0);

  const predictedOperationalBuffer = actualTurnaround - minimumTurnaround + 3 + queueDelay * 0.25;
  const dynamicBuffer = Math.round(clamp(
    Math.max(staticBuffer + stressReserve, predictedOperationalBuffer),
    staticBuffer,
    75
  ));
  const dynamicPlannedTurnaround = minimumTurnaround + dynamicBuffer;
  const dynamicProtectedTurnaround = Math.max(scheduledTurnaround, dynamicPlannedTurnaround);
  const staticDelay = Math.max(0, actualTurnaround - scheduledTurnaround);
  const dynamicDelay = Math.max(0, actualTurnaround - dynamicProtectedTurnaround);
  const targetOffBlock = formatMinutesAsClock(parseClockToMinutes(flightData.STA) + dynamicProtectedTurnaround);
  const scheduledOffBlock = flightData.STD;
  const recommendedScheduleChange = Math.max(0, dynamicPlannedTurnaround - scheduledTurnaround);
  const bufferUsed = Math.max(0, actualTurnaround - minimumTurnaround);
  const bufferUtilization = Math.round((bufferUsed / dynamicBuffer) * 100);
  const bufferStatus = bufferUtilization < 70 ? 'green' : bufferUtilization < 100 ? 'yellow' : 'red';

  return {
    ...flightData,
    heatIndex: calculateHeatIndex(flightData.Ambient_Temp_C, flightData.Humidity_),
    staffEfficiency: calculateStaffEfficiency(flightData.Ambient_Temp_C, flightData.Humidity_, fatigueLevel),
    efficiencyMultiplier,
    minimumTurnaround,
    scheduledTurnaround,
    staticBuffer,
    dynamicBuffer,
    dynamicPlannedTurnaround,
    dynamicProtectedTurnaround,
    actualTurnaround,
    staticDelay,
    dynamicDelay,
    delayMinutes: staticDelay,
    delayCost: staticDelay * 75,
    dynamicDelayCost: dynamicDelay * 75,
    recoveredDelay: Math.max(0, staticDelay - dynamicDelay),
    otpStatic: staticDelay <= 15,
    otpDynamic: dynamicDelay <= 15,
    bufferStatus,
    bufferUtilization,
    targetOffBlock,
    scheduledOffBlock,
    recommendedScheduleChange,
    riskScore: Math.round(clamp(bufferUtilization + failureProbability * 65 + queueDelay * 1.5, 0, 160)),
    events: {
      noShowEvent,
      securityOffloadDelay: Math.round(securityOffloadDelay),
      gseFailure,
      repairDelay: Math.round(repairDelay),
      queueDelay,
      failureProbability: Math.round(failureProbability * 100)
    },
    phaseTimings: {
      deboarding: Math.round(deboarding),
      cleaning: Math.round(cleaning),
      baggage: Math.round(baggage),
      refueling: Math.round(refueling),
      parallel: Math.round(parallelRamp),
      boarding: Math.round(boarding),
      security: Math.round(securityOffloadDelay)
    }
  };
};

export const buildFleetSimulation = (flights) => {
  const sorted = [...flights].sort((a, b) => parseClockToMinutes(a.STA) - parseClockToMinutes(b.STA));
  const simulated = sorted.map((flight) => {
    const sta = parseClockToMinutes(flight.STA);
    const nearbyFlightCount = sorted.filter((candidate) => {
      const candidateSta = parseClockToMinutes(candidate.STA);
      return Math.abs(candidateSta - sta) <= 45;
    }).length;
    return calculateFlightSimulation(flight, { nearbyFlightCount });
  });

  const totals = simulated.reduce((acc, flight) => {
    acc.staticDelay += flight.staticDelay;
    acc.dynamicDelay += flight.dynamicDelay;
    acc.delayCost += flight.delayCost;
    acc.dynamicDelayCost += flight.dynamicDelayCost;
    acc.recoveredDelay += flight.recoveredDelay;
    acc.staticOnTime += flight.otpStatic ? 1 : 0;
    acc.dynamicOnTime += flight.otpDynamic ? 1 : 0;
    acc.highRisk += flight.bufferStatus === 'red' ? 1 : 0;
    acc.scheduleChanges += flight.recommendedScheduleChange > 0 ? 1 : 0;
    return acc;
  }, {
    staticDelay: 0,
    dynamicDelay: 0,
    delayCost: 0,
    dynamicDelayCost: 0,
    recoveredDelay: 0,
    staticOnTime: 0,
    dynamicOnTime: 0,
    highRisk: 0,
    scheduleChanges: 0
  });

  const count = simulated.length || 1;
  return {
    flights: simulated,
    summary: {
      ...totals,
      staticOtpRate: Math.round((totals.staticOnTime / count) * 100),
      dynamicOtpRate: Math.round((totals.dynamicOnTime / count) * 100),
      averageDynamicBuffer: Math.round(simulated.reduce((sum, flight) => sum + flight.dynamicBuffer, 0) / count),
      peakTemperature: Math.max(...simulated.map((flight) => flight.Ambient_Temp_C)),
      costAvoided: totals.delayCost - totals.dynamicDelayCost
    }
  };
};

// Compatibility exports used by older components.
export const calculateDynamicBuffer = (flightData) => calculateFlightSimulation(flightData).dynamicBuffer;
export const calculateActualTurnaroundTime = (flightData) => calculateFlightSimulation(flightData).actualTurnaround;
export const calculateDelayCost = (actualTime, scheduledTime) => Math.max(0, actualTime - scheduledTime) * 75;
export const calculateOTP = (actualTime, scheduledTime) => actualTime - scheduledTime <= 15;
export const getBufferStatus = (actualTime, scheduledTime, buffer) => {
  const minimumEstimate = Math.max(0, scheduledTime - 15);
  const utilization = ((actualTime - minimumEstimate) / buffer) * 100;
  if (utilization < 70) return 'green';
  if (utilization < 100) return 'yellow';
  return 'red';
};
export const calculateBoardingTime = (loadFactor, prmCount, aircraftType) => {
  const rng = createRng(`${aircraftType}-${loadFactor}-${prmCount}-boarding`);
  return Math.round(triangular(20, 30, 45, rng) * (0.75 + (loadFactor / 100) * 0.35) + prmCount * 4);
};
export const calculateDeboardingTime = (loadFactor, aircraftType) => {
  const rng = createRng(`${aircraftType}-${loadFactor}-deboarding`);
  return Math.round(triangular(10, 15, 25, rng) * (0.75 + (loadFactor / 100) * 0.35));
};
export const calculateBaggageTime = (loadFactor, aircraftType, efficiencyMultiplier, gseReliability) => {
  const profile = AIRCRAFT_PROFILES[aircraftType] || AIRCRAFT_PROFILES.A320;
  return Math.round(profile.baggageBase * (0.65 + (loadFactor / 100) * 0.45) * efficiencyMultiplier * (gseReliability < 0.8 ? 1.2 : 1));
};
export const calculateRefuelingTime = (aircraftType, efficiencyMultiplier) => {
  const profile = AIRCRAFT_PROFILES[aircraftType] || AIRCRAFT_PROFILES.A320;
  return Math.round(profile.fuelBase * efficiencyMultiplier);
};
export const calculateCleaningTime = (aircraftType, efficiencyMultiplier) => {
  const profile = AIRCRAFT_PROFILES[aircraftType] || AIRCRAFT_PROFILES.A320;
  return Math.round(profile.cleaningBase * efficiencyMultiplier);
};
