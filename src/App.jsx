import React, { useEffect, useMemo, useState } from 'react';
import Scene3D from './components/Scene3D';
import Dashboard from './components/Dashboard';
import { flightData } from './data/flightData';
import { buildFleetSimulation } from './utils/bufferCalculations';
import './App.css';

function App() {
  const [currentFlightIndex, setCurrentFlightIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationProgress, setSimulationProgress] = useState(0);

  const fleetSimulation = useMemo(() => buildFleetSimulation(flightData), []);
  const simulatedFlights = fleetSimulation.flights;
  const currentFlight = simulatedFlights[currentFlightIndex];

  const getActivePhase = () => {
    const timings = currentFlight.phaseTimings;
    const totalTime = currentFlight.actualTurnaround;
    const currentTime = (simulationProgress / 100) * totalTime;
    let elapsed = 0;

    if (currentTime < (elapsed += timings.deboarding)) {
      return {
        phase: 'Deboarding',
        minute: Math.round(currentTime),
        gse: { baggage: false, fuel: false, boarding: false, cleaning: false }
      };
    }

    if (currentTime < (elapsed += timings.cleaning)) {
      return {
        phase: 'Cabin cleaning',
        minute: Math.round(currentTime),
        gse: { baggage: false, fuel: false, boarding: false, cleaning: true }
      };
    }

    if (currentTime < (elapsed += timings.parallel)) {
      return {
        phase: 'Baggage and refueling',
        minute: Math.round(currentTime),
        gse: { baggage: true, fuel: true, boarding: false, cleaning: false }
      };
    }

    if (timings.security > 0 && currentTime < totalTime - timings.boarding) {
      return {
        phase: 'Security offload',
        minute: Math.round(currentTime),
        gse: { baggage: true, fuel: false, boarding: false, cleaning: false }
      };
    }

    return {
      phase: 'Boarding',
      minute: Math.round(currentTime),
      gse: { baggage: false, fuel: false, boarding: true, cleaning: false }
    };
  };

  const activePhaseData = getActivePhase();

  const simulationMetrics = {
    ...currentFlight,
    activePhase: activePhaseData.phase,
    elapsedMinute: activePhaseData.minute
  };

  const simulationState = {
    temperature: currentFlight.Ambient_Temp_C,
    staffEfficiency: currentFlight.staffEfficiency,
    activePhase: activePhaseData.phase,
    gseStatus: activePhaseData.gse,
    bufferStatus: currentFlight.bufferStatus,
    progress: simulationProgress
  };

  useEffect(() => {
    if (!isPlaying) return undefined;

    const interval = setInterval(() => {
      setSimulationProgress((previousProgress) => {
        if (previousProgress >= 100) {
          if (currentFlightIndex < simulatedFlights.length - 1) {
            setCurrentFlightIndex((index) => index + 1);
            return 0;
          }
          setIsPlaying(false);
          return 100;
        }

        return Math.min(100, previousProgress + simulationSpeed);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, simulationSpeed, currentFlightIndex, simulatedFlights.length]);

  const handleFlightSelect = (index) => {
    setCurrentFlightIndex(index);
    setSimulationProgress(0);
    setIsPlaying(false);
  };

  return (
    <div className="app">
      <div className="scene-container">
        <Scene3D
          flightData={currentFlight}
          simulationState={simulationState}
        />
        <div className="simulation-strip" aria-label="Simulation progress">
          <div className="strip-meta">
            <span>{currentFlight.Flight_ID}</span>
            <span>{activePhaseData.phase}</span>
            <span>{activePhaseData.minute} / {currentFlight.actualTurnaround} min</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${currentFlight.bufferStatus}`}
              style={{ width: `${simulationProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        <Dashboard
          flightData={simulatedFlights}
          fleetSummary={fleetSimulation.summary}
          simulationMetrics={simulationMetrics}
          currentFlight={currentFlightIndex}
          onFlightSelect={handleFlightSelect}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying((playing) => !playing)}
          speed={simulationSpeed}
          onSpeedChange={setSimulationSpeed}
        />
      </div>
    </div>
  );
}

export default App;
