// Smart Greenhouse Web Application
class GreenhouseApp {
    constructor() {
        this.isDay = true;
        this.voiceRecognitionActive = false;
        this.updateInterval = null;
        this.currentZone = 'A';
        this.init();
    }


    init() {
        this.setupEventListeners();
        this.startDataUpdates();
        this.setupVoiceRecognition();
        // Apply initial night mode based on current settings
        this.updateSensorData();
    }

    setupEventListeners() {
        // Day/Night toggle
        const dayNightToggle = document.getElementById('dayNightToggle');
        if (dayNightToggle) {
            dayNightToggle.addEventListener('click', () => this.toggleDayNight());
        }

        // Voice control
        const voiceControl = document.getElementById('voiceControl');
        if (voiceControl) {
            voiceControl.addEventListener('click', () => this.toggleVoiceRecognition());
        }
        
        // Water zone button
        const waterZoneBtn = document.getElementById('waterZoneBtn');
        if (waterZoneBtn) {
            waterZoneBtn.addEventListener('click', () => {
                this.waterZone(this.currentZone);
            });
        }
        
        // Manure zone button
        const manureZoneBtn = document.getElementById('manureZoneBtn');
        if (manureZoneBtn) {
            manureZoneBtn.addEventListener('click', () => {
                this.applyManureToZone(this.currentZone);
            });
        }
        
        // Fertilize zone button
        const fertilizeZoneBtn = document.getElementById('fertilizeZoneBtn');
        if (fertilizeZoneBtn) {
            fertilizeZoneBtn.addEventListener('click', () => {
                this.applyFertilizerToZone(this.currentZone);
            });
        }

    }

    startDataUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateSensorData();
            this.updateActuatorControls();
            this.updateRobotStatus();
        }, 2000); // Update every 2 seconds
    }

    async updateSensorData() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            
            if (data.error) {
                console.error('Error fetching data:', data.error);
                return;
            }

            // Update day/night status
            this.isDay = data.settings.is_day;
            this.updateDayNightIcon();
            this.applyNightMode();

            // Update sensor values
            this.updateSensors(data.sensors);
            
            // Update zone-specific data
            this.updateZoneSensors(data.zone_sensors, data.robot.current_position);
        } catch (error) {
            console.error('Error updating sensor data:', error);
        }
    }

    updateSensors(sensors) {
        const sensorContainer = document.getElementById('sensorValues');
        if (!sensorContainer) return;

        sensorContainer.innerHTML = `
            <div class="sensor-card">
                <div class="sensor-icon"><i class="fas fa-thermometer-half"></i></div>
                <div class="sensor-details">
                    <div class="sensor-name">Temperature</div>
                    <div class="sensor-value">${sensors.temperature}°C</div>
                </div>
            </div>
            <div class="sensor-card">
                <div class="sensor-icon"><i class="fas fa-tint"></i></div>
                <div class="sensor-details">
                    <div class="sensor-name">Humidity</div>
                    <div class="sensor-value">${sensors.humidity}%</div>
                </div>
            </div>
            <div class="sensor-card">
                <div class="sensor-icon"><i class="fas fa-ruler-vertical"></i></div>
                <div class="sensor-details">
                    <div class="sensor-name">Soil Moisture</div>
                    <div class="sensor-value">${sensors.soil_moisture}%</div>
                </div>
            </div>
            <div class="sensor-card">
                <div class="sensor-icon"><i class="fas fa-sun"></i></div>
                <div class="sensor-details">
                    <div class="sensor-name">Light Intensity</div>
                    <div class="sensor-value">${sensors.light_intensity}</div>
                </div>
            </div>
            <div class="sensor-card">
                <div class="sensor-icon"><i class="fas fa-wind"></i></div>
                <div class="sensor-details">
                    <div class="sensor-name">CO2 Level</div>
                    <div class="sensor-value">${sensors.co2_level} ppm</div>
                </div>
            </div>
            <div class="sensor-card">
                <div class="sensor-icon"><i class="fas fa-flask"></i></div>
                <div class="sensor-details">
                    <div class="sensor-name">pH Level</div>
                    <div class="sensor-value">${sensors.ph_level}</div>
                </div>
            </div>
            <div class="sensor-card">
                <div class="sensor-icon"><i class="fas fa-seedling"></i></div>
                <div class="sensor-details">
                    <div class="sensor-name">Nutrient Level</div>
                    <div class.style.display='none'="sensor-value">${sensors.nutrient_level}%</div>
                </div>
            </div>
        `;
    }


    updateZoneSensors(zoneSensors, currentZone) {
        // Highlight the current zone in the UI
        Object.keys(zoneSensors).forEach(zone => {
            const zoneElement = document.getElementById(`zone-${zone}`);
            if (zoneElement) {
                if (zone === currentZone) {
                    zoneElement.classList.add('current-zone');
                } else {
                    zoneElement.classList.remove('current-zone');
                }
            }
        });
    }

    async updateActuatorControls() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            
            if (data.error) {
                console.error('Error fetching actuator data:', data.error);
                return;
            }

            this.renderActuatorControls(data.actuators);
        } catch (error) {
            console.error('Error updating actuator controls:', error);
        }
    }

    renderActuatorControls(actuators) {
        const actuatorContainer = document.getElementById('actuatorControls');
        if (!actuatorContainer) return;

        actuatorContainer.innerHTML = `
            <div class="actuator-card ${actuators.heater.is_on ? 'on' : 'off'}" data-actuator="heater">
                <div class="actuator-icon"><i class="fas fa-fire"></i></div>
                <div class="actuator-name">Heater</div>
            </div>
            <div class="actuator-card ${actuators.cooling_fan.is_on ? 'on' : 'off'}" data-actuator="cooling_fan">
                <div class="actuator-icon"><i class="fas fa-fan"></i></div>
                <div class="actuator-name">Cooling Fan</div>
            </div>
            <div class="actuator-card ${actuators.humidifier.is_on ? 'on' : 'off'}" data-actuator="humidifier">
                <div class="actuator-icon"><i class="fas fa-cloud-rain"></i></div>
                <div class="actuator-name">Humidifier</div>
            </div>
            <div class="actuator-card ${actuators.dehumidifier.is_on ? 'on' : 'off'}" data-actuator="dehumidifier">
                <div class="actuator-icon"><i class="fas fa-compress-alt"></i></div>
                <div class="actuator-name">Dehumidifier</div>
            </div>
            <div class="actuator-card ${actuators.irrigation.is_on ? 'on' : 'off'}" data-actuator="irrigation">
                <div class="actuator-icon"><i class="fas fa-shower"></i></div>
                <div class="actuator-name">Irrigation</div>
            </div>
            <div class="actuator-card ${actuators.lights.is_on ? 'on' : 'off'}" data-actuator="lights">
                <div class="actuator-icon"><i class="fas fa-lightbulb"></i></div>
                <div class="actuator-name">Grow Lights</div>
            </div>
            <div class="actuator-card ${actuators.co2_injector.is_on ? 'on' : 'off'}" data-actuator="co2_injector">
                <div class="actuator-icon"><i class="fas fa-smog"></i></div>
                <div class="actuator-name">CO2 Injector</div>
            </div>
            <div class="actuator-card ${actuators.nutrient_pump.is_on ? 'on' : 'off'}" data-actuator="nutrient_pump">
                <div class="actuator-icon"><i class="fas fa-vial"></i></div>
                <div class="actuator-name">Nutrient Pump</div>
            </div>
        `;

        // Add event listeners to actuator cards
        document.querySelectorAll('.actuator-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const actuator = e.currentTarget.dataset.actuator;
                if (actuator) {
                    this.toggleActuator(actuator);
                }
            });
        });
    }


    async updateRobotStatus() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            
            if (data.error) {
                console.error('Error fetching robot data:', data.error);
                return;
            }

            this.currentZone = data.robot.current_position;

            // Update robot position in UI
            const robotPosition = document.getElementById('robotPosition');

            if (robotPosition) {
                robotPosition.textContent = `Zone ${data.robot.current_position}`;
            }

            // Update robot state
            const robotState = document.getElementById('robotState');
            if (robotState) {
                robotState.textContent = data.robot.state;
            }
            
            // Update robot position indicator on greenhouse layout
            this.updateRobotPositionIndicator(data.robot.current_position);
        } catch (error) {
            console.error('Error updating robot status:', error);
        }
    }
    
    updateRobotPositionIndicator(zone) {
        // Get the robot indicator element
        const robotIndicator = document.getElementById('robot-indicator');
        if (!robotIndicator) return;

        // Define positions for each zone
        const zonePositions = {
            'A': { top: '20%', left: '20%' },
            'B': { top: '20%', left: '80%' },
            'C': { top: '80%', left: '20%' },
            'D': { top: '80%', left: '80%' }
        };

        // Update position with animation if zone is valid
        if (zonePositions[zone]) {
            // Add transition for smooth movement
            robotIndicator.style.transition = 'top 1s ease, left 1s ease';
            robotIndicator.style.top = zonePositions[zone].top;
            robotIndicator.style.left = zonePositions[zone].left;

            // Add tractor animation effect
            robotIndicator.innerHTML = '<i class="fas fa-tractor"></i>';
        }
    }


    updateDayNightIcon() {
        const dayNightIcon = document.getElementById('dayNightIcon');
        if (dayNightIcon) {
            dayNightIcon.innerHTML = this.isDay ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }

    async toggleDayNight() {
        try {
            const response = await fetch('/api/toggle_day_night', {
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.success) {
                this.isDay = result.is_day;
                this.updateDayNightIcon();
                this.applyNightMode();
            } else {
                console.error('Error toggling day/night:', result.error);
            }
        } catch (error) {
            console.error('Error toggling day/night:', error);
        }
    }

    applyNightMode() {
        // Toggle night mode class on body
        document.body.classList.toggle('night-mode', !this.isDay);
        
        // Toggle night mode class on all cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on card headers
        document.querySelectorAll('.card-header').forEach(header => {
            header.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on sensor cards
        document.querySelectorAll('.sensor-card').forEach(card => {
            card.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on actuator buttons
        document.querySelectorAll('.actuator-btn').forEach(button => {
            button.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on zone labels
        document.querySelectorAll('.zone-label').forEach(label => {
            label.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on current zones
        document.querySelectorAll('.current-zone').forEach(zone => {
            zone.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on alerts
        document.querySelectorAll('.alert').forEach(alert => {
            alert.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on outline buttons
        document.querySelectorAll('.btn-outline-primary').forEach(button => {
            button.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on zone views
        document.querySelectorAll('.zone-view').forEach(view => {
            view.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on greenhouse view
        document.querySelectorAll('.greenhouse-view').forEach(view => {
            view.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on voice feedback
        const voiceFeedback = document.getElementById('voiceFeedback');
        if (voiceFeedback) {
            voiceFeedback.classList.toggle('night-mode', !this.isDay);
        }
        
        // Toggle night mode class on operation buttons
        document.querySelectorAll('.btn-info, .btn-warning, .btn-success').forEach(button => {
            button.classList.toggle('night-mode', !this.isDay);
        });
        
        // Toggle night mode class on zone effects
        document.querySelectorAll('.zone-effect').forEach(effect => {
            effect.classList.toggle('night-mode', !this.isDay);
        });
    }

    async toggleActuator(actuator) {
        try {
            const response = await fetch('/api/toggle_actuator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ actuator: actuator })
            });
            const result = await response.json();
            
            if (result.success) {
                // Update the UI to reflect the new state
                await this.updateActuatorControls();
            } else {
                console.error('Error toggling actuator:', result.error);
            }
        } catch (error) {
            console.error('Error toggling actuator:', error);
        }
    }

    async moveRobotToZone(zone) {
        try {
            const response = await fetch('/api/move_robot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ zone: zone })
            });
            const result = await response.json();
            
            if (result.success) {
                console.log(result.message);
                // Update UI
                await this.updateRobotStatus();
            } else {
                console.error('Error moving robot:', result.error);
            }
        } catch (error) {
            console.error('Error moving robot:', error);
        }
    }

    async waterZone(zone) {
        try {
            const response = await fetch('/api/water_zone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ zone: zone })
            });
            const result = await response.json();
            
            if (result.success) {
                console.log(result.message);
                // Show watering effect
                this.showZoneEffect(zone, 'water');
            } else {
                console.error('Error watering zone:', result.error);
            }
        } catch (error) {
            console.error('Error watering zone:', error);
        }
    }

    async applyManureToZone(zone) {
        try {
            const response = await fetch('/api/manure_zone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ zone: zone })
            });
            const result = await response.json();
            
            if (result.success) {
                console.log(result.message);
                // Show manure effect
                this.showZoneEffect(zone, 'manure');
            } else {
                console.error('Error applying manure:', result.error);
            }
        } catch (error) {
            console.error('Error applying manure:', error);
        }
    }

    async applyFertilizerToZone(zone) {
        try {
            const response = await fetch('/api/fertilize_zone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ zone: zone })
            });
            const result = await response.json();
            
            if (result.success) {
                console.log(result.message);
                // Show fertilizer effect
                this.showZoneEffect(zone, 'fertilizer');
            } else {
                console.error('Error applying fertilizer:', result.error);
            }
        } catch (error) {
            console.error('Error applying fertilizer:', error);
        }
    }

    showZoneEffect(zone, effectType) {
        // Show visual effect for operations
        const greenhouseView = document.querySelector('.greenhouse-view .position-relative');
        if (!greenhouseView) return;
        
        // Get zone position
        const zonePositions = {
            'A': { top: '20%', left: '20%' },
            'B': { top: '20%', left: '80%' },
            'C': { top: '80%', left: '20%' },
            'D': { top: '80%', left: '80%' }
        };
        
        if (!zonePositions[zone]) return;
        
        // Create effect element
        const effectElement = document.createElement('div');
        effectElement.className = `zone-effect zone-${effectType}`;
        
        // Add night mode class if needed
        if (!this.isDay) {
            effectElement.classList.add('night-mode');
        }
        
        // Set effect symbol based on type
        switch(effectType) {
            case 'water':
                effectElement.innerHTML = '💧'; // Water droplet symbol
                break;
            case 'manure':
                effectElement.innerHTML = '🌱'; // Seedling symbol
                break;
            case 'fertilizer':
                effectElement.innerHTML = '🌿'; // Fertilizer symbol
                break;
            default:
                effectElement.innerHTML = '●';
        }
        
        // Position the effect
        effectElement.style.top = zonePositions[zone].top;
        effectElement.style.left = zonePositions[zone].left;
        
        // Add to greenhouse view
        greenhouseView.appendChild(effectElement);
        
        // Remove after animation completes
        setTimeout(() => {
            if (effectElement.parentNode) {
                effectElement.parentNode.removeChild(effectElement);
            }
        }, 2000);
    }


    toggleVoiceRecognition() {
        this.voiceRecognitionActive = !this.voiceRecognitionActive;
        const voiceControl = document.getElementById('voiceControl');
        
        if (this.voiceRecognitionActive) {
            voiceControl.classList.add('recording');
            voiceControl.innerHTML = '<i class="fas fa-microphone"></i>';
            this.startVoiceRecognition();
        } else {
            // Stop speech recognition if it's running
            if (this.recognition) {
                this.recognition.stop();
                this.recognition = null;
            }
            voiceControl.classList.remove('recording');
            voiceControl.innerHTML = '<i class="fas fa-microphone"></i>';
            // Hide feedback when voice recognition is turned off
            this.hideVoiceFeedback();
        }
    }

    setupVoiceRecognition() {
        // Voice command processing with synonyms
        this.voiceCommands = {
            'move to zone': (zone) => this.moveRobotToZone(zone.toUpperCase()),
            'water zone': (zone) => this.waterZone(zone.toUpperCase()),
            'apply manure to zone': (zone) => this.applyManureToZone(zone.toUpperCase()),
            'fertilize zone': (zone) => this.applyFertilizerToZone(zone.toUpperCase()),
            'toggle day night': () => this.toggleDayNight(),
            'turn on heater': () => this.toggleActuator('heater'),
            'turn off heater': () => this.toggleActuator('heater'),
            'turn on cooling fan': () => this.toggleActuator('cooling_fan'),
            'turn off cooling fan': () => this.toggleActuator('cooling_fan'),
            'turn on humidifier': () => this.toggleActuator('humidifier'),
            'turn off humidifier': () => this.toggleActuator('humidifier'),
            'turn on dehumidifier': () => this.toggleActuator('dehumidifier'),
            'turn off dehumidifier': () => this.toggleActuator('dehumidifier'),
            'turn on irrigation': () => this.toggleActuator('irrigation'),
            'turn off irrigation': () => this.toggleActuator('irrigation'),
            'turn on lights': () => this.toggleActuator('lights'),
            'turn off lights': () => this.toggleActuator('lights'),
            'turn on grow lights': () => this.toggleActuator('lights'), // Synonym for lights
            'turn off grow lights': () => this.toggleActuator('lights'), // Synonym for lights
            'turn on co2 injector': () => this.toggleActuator('co2_injector'),
            'turn off co2 injector': () => this.toggleActuator('co2_injector'),
            'turn on nutrient pump': () => this.toggleActuator('nutrient_pump'),
            'turn off nutrient pump': () => this.toggleActuator('nutrient_pump')
        };

        // Voice command responses for speech feedback
        this.voiceResponses = {
            'move to zone': (zone) => `Moving robot to zone ${zone}`,
            'water zone': (zone) => `Watering zone ${zone}`,
            'apply manure to zone': (zone) => `Applying manure to zone ${zone}`,
            'fertilize zone': (zone) => `Fertilizing zone ${zone}`,
            'toggle day night': () => `Toggling day and night mode`,
            'turn on heater': () => `Turning on heater`,
            'turn off heater': () => `Turning off heater`,
            'turn on cooling fan': () => `Turning on cooling fan`,
            'turn off cooling fan': () => `Turning off cooling fan`,
            'turn on humidifier': () => `Turning on humidifier`,
            'turn off humidifier': () => `Turning off humidifier`,
            'turn on dehumidifier': () => `Turning on dehumidifier`,
            'turn off dehumidifier': () => `Turning off dehumidifier`,
            'turn on irrigation': () => `Turning on irrigation`,
            'turn off irrigation': () => `Turning off irrigation`,
            'turn on lights': () => `Turning on grow lights`,
            'turn off lights': () => `Turning off grow lights`,
            'turn on grow lights': () => `Turning on grow lights`,
            'turn off grow lights': () => `Turning off grow lights`,
            'turn on co2 injector': () => `Turning on CO2 injector`,
            'turn off co2 injector': () => `Turning off CO2 injector`,
            'turn on nutrient pump': () => `Turning on nutrient pump`,
            'turn off nutrient pump': () => `Turning off nutrient pump`
        };
    }

    startVoiceRecognition() {
        // Check if speech recognition is supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // Create recognition instance
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            // Event handlers
            this.recognition.onstart = () => {
                console.log('Voice recognition started');
                this.showVoiceFeedback("Listening...", "Please speak your command");
            };
            
            this.recognition.onresult = (event) => {
                const command = event.results[event.results.length - 1][0].transcript;
                console.log('Recognized command:', command);
                this.processVoiceCommand(command);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showVoiceFeedback("Error", `Speech recognition error: ${event.error}`);
                this.speakResponse("Sorry, I encountered an error with voice recognition.");
            };
            
            this.recognition.onend = () => {
                console.log('Voice recognition ended');
                if (this.voiceRecognitionActive) {
                    // Restart recognition if still active
                    this.recognition.start();
                }
            };
            
            // Start recognition
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                this.showVoiceFeedback("Error", "Failed to start voice recognition");
                this.speakResponse("Sorry, I couldn't start voice recognition.");
            }
        } else {
            // Fallback for browsers that don't support speech recognition
            console.log('Web Speech API not supported');
            this.showVoiceFeedback("Error", "Web Speech API not supported in this browser");
            this.speakResponse("Sorry, voice recognition is not supported in your browser.");
            
            // Simulate voice recognition for demonstration
            setTimeout(() => {
                if (this.voiceRecognitionActive) {
                    this.voiceRecognitionActive = false;
                    const voiceControl = document.getElementById('voiceControl');
                    voiceControl.classList.remove('recording');
                    voiceControl.innerHTML = '<i class="fas fa-microphone"></i>';
                }
            }, 5000); // Stop after 5 seconds for demo
        }
    }

    processVoiceCommand(command) {
        command = command.toLowerCase();

        // Display the voice command
        this.showVoiceFeedback(command, "Processing your command...");

        for (const [key, func] of Object.entries(this.voiceCommands)) {
            if (command.includes(key)) {
                // Extract zone if needed
                const zoneMatch = command.match(/zone ([a-d])/);
                const zone = zoneMatch ? zoneMatch[1] : null;

                // Get response message
                let responseMessage = "";
                if (this.voiceResponses[key]) {
                    responseMessage = zone ? this.voiceResponses[key](zone) : this.voiceResponses[key]();
                } else {
                    responseMessage = "Command executed successfully";
                }

                // Display the response
                this.showVoiceFeedback(command, responseMessage);

                // Execute the command
                if (zone) {
                    func(zone);
                } else {
                    func();
                }

                // Speak the response
                this.speakResponse(responseMessage);

                return true;
            }
        }

        // If no command matched
        const errorMessage = "Sorry, I didn't understand that command. Here are some examples of what you can say: \n" +
            Object.keys(this.voiceCommands).map(cmd => `- ${cmd}`).join("\n");
        this.showVoiceFeedback(command, errorMessage);
        this.speakResponse("Sorry, I didn't understand that command. Please try again.");
        return false;
    }

    showVoiceFeedback(command, response) {
        const feedbackElement = document.getElementById('voiceFeedback');
        const commandElement = document.getElementById('voiceCommandText');
        const responseElement = document.getElementById('voiceResponseText');
        
        if (feedbackElement && commandElement && responseElement) {
            commandElement.textContent = command;
            responseElement.textContent = response;
            feedbackElement.style.display = 'block';
        }
    }

    hideVoiceFeedback() {
        const feedbackElement = document.getElementById('voiceFeedback');
        if (feedbackElement) {
            feedbackElement.style.display = 'none';
        }
    }

    speakResponse(message) {
        // Check if speech synthesis is supported
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 1.0; // Normal speech rate
            utterance.pitch = 1.0; // Normal pitch
            utterance.volume = 1.0; // Normal volume
            
            // Speak the message
            window.speechSynthesis.speak(utterance);
        } else {
            console.log("Speech synthesis not supported in this browser");
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.greenhouseApp = new GreenhouseApp();
});
