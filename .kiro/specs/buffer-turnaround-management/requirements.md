# Requirements Document

## Introduction

The Buffer Turnaround Management System is a web-based simulation application that models aircraft ground operations at Multan Airport under extreme heat conditions. The system dynamically manages buffer time (the elastic time between minimum turnaround time and scheduled turnaround time) based on environmental factors, operational resources, and stochastic events. The application provides a 3D visualization of aircraft turnaround operations, real-time metrics dashboards, and comparative analysis between normal and heat-impacted conditions.

## Glossary

- **System**: The Buffer Turnaround Management System web application
- **Buffer_Time**: The difference between Scheduled Turnaround Time and Minimum Turnaround Time (STT - MTT)
- **MTT**: Minimum Turnaround Time - the fastest possible time to service an aircraft
- **STT**: Scheduled Turnaround Time - the publicly scheduled time for aircraft turnaround
- **Turnaround**: The period an aircraft spends on the ground between landing and taking off again
- **GSE**: Ground Support Equipment including Tug, Baggage Belt Loader, Fuel Truck, and Passenger Stairs
- **Heat_Index**: A calculated value combining ambient temperature and humidity
- **Efficiency_Score**: A percentage value (0-100%) representing staff and equipment productivity
- **OTP**: On-Time Performance - the percentage of flights departing within 15 minutes of schedule
- **PRM**: Passengers with Reduced Mobility requiring special assistance
- **Apron**: The airport area where aircraft are parked for loading and unloading
- **Scene**: A 3D visualization viewport showing aircraft and GSE
- **Dataset**: The CSV file containing 50 flights with environmental and operational data
- **Dashboard**: The metrics display showing real-time KPIs and status indicators
- **Delay_Clock**: A timer showing minutes behind scheduled departure time
- **Buffer_Status_Indicator**: A visual indicator showing buffer health (Green/Yellow/Red)

## Requirements

### Requirement 1: CSV Dataset Parsing and Loading

**User Story:** As a user, I want the system to load flight data from a CSV file, so that I can simulate realistic turnaround operations with actual environmental and operational parameters.

#### Acceptance Criteria

1. WHEN the application initializes, THE System SHALL parse the Multan_Heatwave_Turnaround_Dataset.csv file
2. THE System SHALL extract all 50 flight records with their associated parameters (Flight_ID, Aircraft_Type, STA, STD, Ambient_Temp_C, Humidity_%, Pax_Load_Factor_%, PRM_Count, GSE_Reliability_Score, Static_Buffer_Min, Ground_Staff_Fatigue_Level)
3. IF the CSV file is malformed or missing required columns, THEN THE System SHALL display a descriptive error message
4. THE System SHALL store parsed flight data in a structured format accessible to simulation components

### Requirement 2: Dynamic Buffer Calculation

**User Story:** As an operations manager, I want the system to calculate buffer time dynamically based on real-time conditions, so that I can optimize turnaround scheduling and prevent delay propagation.

#### Acceptance Criteria

1. THE System SHALL calculate Dynamic_Buffer_Time using ambient temperature, humidity, passenger load factor, PRM count, GSE reliability score, and staff fatigue level
2. WHEN ambient temperature exceeds 40°C, THE System SHALL increase buffer time by 4% for each degree above 40°C
3. WHEN humidity exceeds 70%, THE System SHALL add 5% additional buffer time
4. WHEN wind speed exceeds 35 knots, THE System SHALL add safety slowdown buffer time
5. THE System SHALL recalculate Dynamic_Buffer_Time for each flight in the dataset
6. THE System SHALL compare Dynamic_Buffer_Time against Static_Buffer_Min (15 minutes baseline)

### Requirement 3: 3D Aircraft Visualization

**User Story:** As a user, I want to see a 3D representation of an aircraft on the apron, so that I can visually understand the turnaround operation layout.

#### Acceptance Criteria

1. THE System SHALL render a 3D aircraft model corresponding to the aircraft type (A320, B737, or B777)
2. THE System SHALL position the aircraft on a ground plane representing the airport apron
3. THE System SHALL provide camera controls allowing rotation, zoom, and pan of the 3D scene
4. THE System SHALL display the aircraft with realistic proportions and orientation
5. WHEN a different flight is selected, THE System SHALL update the 3D scene with the corresponding aircraft type

### Requirement 4: Ground Support Equipment Visualization

**User Story:** As a user, I want to see GSE positioned around the aircraft, so that I can understand the spatial arrangement of turnaround operations.

#### Acceptance Criteria

1. THE System SHALL render 3D models for Tug, Baggage Belt Loader, Fuel Truck, and Passenger Stairs
2. THE System SHALL position GSE at appropriate locations relative to the aircraft (Tug at nose, Baggage Belt Loader at cargo hold, Fuel Truck at wing, Passenger Stairs at door)
3. THE System SHALL scale GSE models proportionally to the aircraft size
4. THE System SHALL display all four GSE types simultaneously in the scene

### Requirement 5: Turnaround Operation Animation

**User Story:** As a user, I want to see animated GSE movements during turnaround operations, so that I can visualize the sequence and timing of ground activities.

#### Acceptance Criteria

1. WHEN a turnaround simulation starts, THE System SHALL animate the Tug moving to the aircraft nose
2. WHEN baggage loading begins, THE System SHALL animate the Baggage Belt Loader extending to the cargo hold
3. WHEN refueling begins, THE System SHALL animate the Fuel Truck connecting to the aircraft wing
4. WHEN boarding begins, THE System SHALL animate the Passenger Stairs positioning at the aircraft door
5. THE System SHALL sequence animations according to standard turnaround procedure timing
6. WHEN a turnaround simulation completes, THE System SHALL animate GSE returning to parking positions

### Requirement 6: Heat Impact Visualization

**User Story:** As a user, I want to see visual indicators of heat stress on operations, so that I can understand how temperature affects turnaround efficiency.

#### Acceptance Criteria

1. WHEN ambient temperature exceeds 38°C, THE System SHALL change the color of GSE or ground indicators to yellow
2. WHEN ambient temperature exceeds 45°C, THE System SHALL change the color of GSE or ground indicators to red
3. THE System SHALL display the current ambient temperature as a text overlay in the 3D scene
4. THE System SHALL display the current Efficiency_Score as a visual meter in the 3D scene
5. WHEN efficiency drops below 80%, THE System SHALL display a visual warning indicator

### Requirement 7: Side-by-Side Comparison View

**User Story:** As a user, I want to compare normal conditions versus heat-impacted conditions side-by-side, so that I can analyze the impact of extreme heat on turnaround operations.

#### Acceptance Criteria

1. THE System SHALL provide a split-screen view with two 3D scenes
2. THE System SHALL display a normal condition scenario (temperature 25-30°C) in the left scene
3. THE System SHALL display a heat-impacted scenario (temperature 45-50°C) in the right scene
4. THE System SHALL synchronize the turnaround timeline between both scenes
5. THE System SHALL visually differentiate efficiency and timing differences between the two scenes
6. WHEN animations play, THE System SHALL show slower GSE movements in the heat-impacted scene

### Requirement 8: Efficiency Meter Dashboard Component

**User Story:** As an operations manager, I want to see real-time staff and equipment efficiency, so that I can monitor productivity during turnaround operations.

#### Acceptance Criteria

1. THE System SHALL display an Efficiency_Score meter ranging from 0% to 100%
2. THE System SHALL calculate Efficiency_Score based on ambient temperature, humidity, and staff fatigue level
3. WHEN temperature is below 38°C, THE System SHALL set base Efficiency_Score to 100%
4. WHEN temperature exceeds 38°C, THE System SHALL reduce Efficiency_Score according to the heat-efficiency formula
5. THE System SHALL update the Efficiency_Score meter in real-time during simulation
6. THE System SHALL use color coding (Green: >80%, Yellow: 60-80%, Red: <60%)

### Requirement 9: Delay Clock Dashboard Component

**User Story:** As an operations manager, I want to see how many minutes behind schedule a flight is, so that I can assess delay severity and take corrective action.

#### Acceptance Criteria

1. THE System SHALL display a Delay_Clock showing minutes behind scheduled departure time
2. WHEN actual turnaround time exceeds STT, THE System SHALL calculate delay as (Actual_Time - STD)
3. WHEN a flight is on schedule or early, THE System SHALL display zero delay
4. THE System SHALL update the Delay_Clock in real-time during simulation
5. THE System SHALL display the Delay_Clock in red when delay exceeds 5 minutes

### Requirement 10: Buffer Status Indicator

**User Story:** As an operations manager, I want to see the health status of the buffer time, so that I can predict whether a delay is imminent.

#### Acceptance Criteria

1. THE System SHALL display a Buffer_Status_Indicator with three states: Green, Yellow, Red
2. WHEN buffer consumption is below 60%, THE System SHALL display Green status
3. WHEN buffer consumption is between 60% and 90%, THE System SHALL display Yellow status
4. WHEN buffer consumption exceeds 90%, THE System SHALL display Red status
5. THE System SHALL calculate buffer consumption as (Elapsed_Time - MTT) / Buffer_Time
6. THE System SHALL update the Buffer_Status_Indicator in real-time during simulation

### Requirement 11: Aviation KPI Dashboard

**User Story:** As an operations manager, I want to see key aviation performance indicators, so that I can evaluate overall operational performance.

#### Acceptance Criteria

1. THE System SHALL display On-Time Performance (OTP) as a percentage
2. THE System SHALL calculate OTP as the percentage of flights departing within 15 minutes of STD
3. THE System SHALL display Ground Occupancy Cost calculated as delay minutes multiplied by $75 per minute
4. THE System SHALL display Aircraft Utilization Rate as the percentage of time aircraft are flying versus on ground
5. THE System SHALL update all KPIs based on the current simulation state
6. THE System SHALL aggregate KPIs across all 50 flights in the dataset

### Requirement 12: Flight Selection and Navigation

**User Story:** As a user, I want to select and navigate between different flights in the dataset, so that I can analyze individual turnaround operations.

#### Acceptance Criteria

1. THE System SHALL display a list or dropdown of all 50 flights from the dataset
2. WHEN a flight is selected, THE System SHALL load that flight's parameters into the simulation
3. THE System SHALL display the selected flight's Flight_ID, Aircraft_Type, STA, and STD
4. THE System SHALL provide next and previous navigation controls to move through flights sequentially
5. THE System SHALL update the 3D scene, dashboard, and metrics when a new flight is selected

### Requirement 13: Temperature Range Simulation

**User Story:** As a user, I want to simulate the 24-hour temperature cycle from 30°C to 50°C and back to 32°C, so that I can observe how changing heat conditions affect operations throughout the day.

#### Acceptance Criteria

1. THE System SHALL support temperature values ranging from 25°C to 55°C
2. THE System SHALL display the current ambient temperature for the selected flight
3. WHEN flights are navigated sequentially, THE System SHALL reflect the temperature progression from the dataset
4. THE System SHALL apply temperature-based efficiency calculations for each flight's temperature value
5. THE System SHALL visually indicate temperature zones (Cool: <38°C, Warm: 38-45°C, Hot: >45°C)

### Requirement 14: Humidity and Wind Speed Environmental Factors

**User Story:** As a user, I want to see how humidity and wind speed affect turnaround operations, so that I can understand the full environmental impact beyond temperature alone.

#### Acceptance Criteria

1. THE System SHALL support humidity values ranging from 10% to 90%
2. THE System SHALL support wind speed values ranging from 0 to 45 knots
3. THE System SHALL display current humidity and wind speed values in the dashboard
4. WHEN humidity exceeds 70%, THE System SHALL apply the 5% additional delay factor to efficiency calculations
5. WHEN wind speed exceeds 35 knots, THE System SHALL apply safety slowdown factors to GSE operations

### Requirement 15: Passenger Load Factor Impact

**User Story:** As an operations manager, I want to see how passenger load affects turnaround time, so that I can plan for fuller flights during peak periods.

#### Acceptance Criteria

1. THE System SHALL use Pax_Load_Factor_% from the dataset for each flight
2. THE System SHALL increase boarding and de-boarding time proportionally to passenger load factor
3. WHEN load factor is 100%, THE System SHALL apply maximum boarding time
4. WHEN load factor is below 60%, THE System SHALL reduce boarding time accordingly
5. THE System SHALL display the current passenger load factor in the dashboard

### Requirement 16: PRM Handling Impact

**User Story:** As an operations manager, I want to account for passengers with reduced mobility, so that I can accurately estimate turnaround time for flights with special assistance needs.

#### Acceptance Criteria

1. THE System SHALL use PRM_Count from the dataset for each flight
2. THE System SHALL add 4 minutes to boarding time for each PRM passenger
3. WHEN PRM_Count is greater than zero, THE System SHALL display a PRM indicator in the dashboard
4. THE System SHALL include PRM handling time in total turnaround time calculations

### Requirement 17: GSE Reliability Modeling

**User Story:** As an operations manager, I want to model equipment reliability, so that I can understand the impact of equipment failures on turnaround delays.

#### Acceptance Criteria

1. THE System SHALL use GSE_Reliability_Score from the dataset for each flight
2. THE System SHALL model equipment failure probability as (1 - GSE_Reliability_Score)
3. WHEN GSE_Reliability_Score is below 0.80, THE System SHALL display a warning indicator
4. THE System SHALL simulate equipment failure events based on reliability scores
5. IF equipment failure occurs, THEN THE System SHALL add repair time (10-20 minutes) to turnaround time

### Requirement 18: Staff Fatigue Level Impact

**User Story:** As an operations manager, I want to see how staff fatigue affects turnaround efficiency, so that I can plan crew rotations during extreme heat periods.

#### Acceptance Criteria

1. THE System SHALL use Ground_Staff_Fatigue_Level from the dataset for each flight
2. THE System SHALL support three fatigue levels: Low, Medium, High
3. WHEN fatigue level is Medium, THE System SHALL reduce Efficiency_Score by 5%
4. WHEN fatigue level is High, THE System SHALL reduce Efficiency_Score by 15%
5. THE System SHALL display the current staff fatigue level in the dashboard

### Requirement 19: Turnaround Time Calculation

**User Story:** As a user, I want the system to calculate actual turnaround time based on all factors, so that I can compare it against scheduled time and identify delays.

#### Acceptance Criteria

1. THE System SHALL calculate Base_Turnaround_Time using aircraft type and passenger load
2. THE System SHALL apply efficiency multipliers based on temperature, humidity, and fatigue
3. THE System SHALL add PRM handling time to the total turnaround time
4. THE System SHALL add equipment failure time if reliability check fails
5. THE System SHALL calculate Actual_Turnaround_Time as the sum of all time components
6. THE System SHALL compare Actual_Turnaround_Time against STT to determine delay

### Requirement 20: Data Visualization Charts

**User Story:** As a user, I want to see charts visualizing turnaround performance across all flights, so that I can identify patterns and trends in the data.

#### Acceptance Criteria

1. THE System SHALL display a line chart showing temperature progression across the 24-hour cycle
2. THE System SHALL display a bar chart comparing actual turnaround time versus scheduled time for all flights
3. THE System SHALL display a scatter plot showing the relationship between temperature and delay
4. THE System SHALL display a chart showing efficiency scores across all flights
5. THE System SHALL allow users to toggle between different chart views

### Requirement 21: Simulation Playback Controls

**User Story:** As a user, I want to control simulation playback, so that I can pause, resume, and adjust the speed of the turnaround animation.

#### Acceptance Criteria

1. THE System SHALL provide a Play button to start the turnaround simulation
2. THE System SHALL provide a Pause button to pause the simulation
3. THE System SHALL provide a Reset button to restart the simulation from the beginning
4. THE System SHALL provide a speed control slider to adjust animation speed (0.5x, 1x, 2x, 4x)
5. WHEN simulation completes, THE System SHALL display final metrics and allow replay

### Requirement 22: Responsive Web Interface

**User Story:** As a user, I want the application to work on different screen sizes, so that I can access it from desktop computers and tablets.

#### Acceptance Criteria

1. THE System SHALL render correctly on screen widths from 1024px to 2560px
2. THE System SHALL adjust 3D scene viewport size based on available screen space
3. THE System SHALL stack dashboard components vertically on smaller screens
4. THE System SHALL maintain readable text sizes across different screen resolutions
5. THE System SHALL preserve 3D scene aspect ratio during window resizing

### Requirement 23: Application Initialization and State Management

**User Story:** As a user, I want the application to initialize properly and maintain consistent state, so that I have a reliable and predictable user experience.

#### Acceptance Criteria

1. WHEN the application loads, THE System SHALL initialize with the first flight from the dataset
2. THE System SHALL load all required 3D models and assets before displaying the scene
3. THE System SHALL display a loading indicator while initializing
4. THE System SHALL maintain simulation state when switching between flights
5. IF initialization fails, THEN THE System SHALL display an error message with troubleshooting guidance
