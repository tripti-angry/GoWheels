// app.js - Frontend JavaScript for GoWheels

document.addEventListener('DOMContentLoaded', () => {
    const GoWheelsApp = {
        config: {
            API_URL: 'http://localhost:3000/api'
        },
        state: {
            currentUser: null,
            currentBooking: null,
            currentTrip: null,
            charts: {}
        },
        elements: {}, // Will be populated in init
        
        /**
         * Initialize the application
         */
        init() {
            this.cacheElements();
            this.bindEvents();
            this.initFaq();
            this.initStatistics();
            this.checkSession();
        },
        
        /*************************** 
         * CORE APP FUNCTIONALITY 
         ***************************/
        
        /**
         * Cache DOM elements for better performance
         */
        cacheElements() {
            const el = this.elements;
            
            // Modals
            el.loginModal = document.getElementById('loginModal');
            el.signupModal = document.getElementById('signupModal');
            
            // Auth related elements
            el.authButtons = document.querySelector('.auth-buttons');
            el.userPanel = document.querySelector('.user-panel');
            el.userWelcome = document.getElementById('userWelcome');
            
            // Sections
            el.bookingSection = document.getElementById('booking');
            el.availableDriversSection = document.getElementById('availableDrivers');
            el.tripDetailsSection = document.getElementById('tripDetails');
            el.paymentSection = document.getElementById('paymentSection');
            
            // Elements inside sections
            el.tripInfo = document.getElementById('tripInfo');
            el.driversGrid = document.getElementById('driversGrid');
            el.fareDetails = document.getElementById('fareDetails');
            
            // Forms
            el.cityTaxiForm = document.getElementById('cityTaxiForm');
            el.loginForm = {
                username: document.getElementById('login-username'),
                password: document.getElementById('login-password')
            };
            
            // Statistics containers
            el.statsContainers = {
                ratingsByCarType: document.getElementById('ratingsByCarType'),
                ageDemographics: document.getElementById('ageDemographics')
            };
            
            // Buttons
            el.buttons = {
                login: document.getElementById('loginBtn'),
                signup: document.getElementById('signupBtn'),
                cancelLogin: document.getElementById('cancelLoginBtn'),
                cancelSignup: document.getElementById('cancelSignupBtn'),
                submitLogin: document.getElementById('submitLoginBtn'),
                logout: document.getElementById('logoutBtn'),
                bookNow: document.getElementById('bookNowBtn'),
                completeTrip: document.getElementById('completeTrip'),
                cancelTrip: document.getElementById('cancelTrip'),
                payNow: document.getElementById('payNow')
            };
            
            // Input fields
            el.inputs = {
                pickupLocation: document.getElementById('pickup-location'),
                dropLocation: document.getElementById('drop-location'),
                userType: document.getElementById('signup-usertype')
            };
        },
        
        /**
         * Bind event listeners
         */
        bindEvents() {
            const el = this.elements;
            const btn = el.buttons;
            
            // Modal events
            btn.login?.addEventListener('click', () => this.showModal(el.loginModal));
            btn.signup?.addEventListener('click', () => this.showModal(el.signupModal));
            btn.cancelLogin?.addEventListener('click', () => this.hideModal(el.loginModal));
            btn.cancelSignup?.addEventListener('click', () => this.hideModal(el.signupModal));
            
            // Close buttons for modals
            document.querySelectorAll('.close-modal').forEach(button => {
                button.addEventListener('click', (e) => this.hideModal(e.target.closest('.modal')));
            });
            
            // User type change in signup
            el.inputs.userType?.addEventListener('change', this.toggleDriverFields.bind(this));
            
            // Tab switching in booking form
            document.querySelectorAll('.form-tab').forEach(tab => {
                tab.addEventListener('click', this.switchTab.bind(this));
            });
            
            // Authentication
            btn.submitLogin?.addEventListener('click', this.handleLogin.bind(this));
            btn.logout?.addEventListener('click', this.handleLogout.bind(this));
            
            // Booking and trip functions
            btn.bookNow?.addEventListener('click', this.handleBooking.bind(this));
            btn.completeTrip?.addEventListener('click', this.completeTrip.bind(this));
            btn.cancelTrip?.addEventListener('click', this.cancelTrip.bind(this));
            
            // Payment
            btn.payNow?.addEventListener('click', this.processPayment.bind(this));
            
            // Ride options and cards
            document.querySelectorAll('.ride-option').forEach(option => {
                option.addEventListener('click', function() {
                    document.querySelector('.ride-option.active')?.classList.remove('active');
                    this.classList.add('active');
                });
            });

            document.querySelectorAll('.ride-card').forEach(card => {
                card.addEventListener('click', function() {
                    document.querySelector('.ride-card.selected')?.classList.remove('selected');
                    this.classList.add('selected');
                });
            });
        },
        
        /**
         * Make API request
         * @param {string} endpoint - API endpoint
         * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
         * @param {Object} data - Request data
         * @return {Promise} The response data
         */
        async apiRequest(endpoint, method = 'GET', data = null) {
            try {
                const url = this.config.API_URL + endpoint;
                const options = {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                // Add token if user is logged in
                if (this.state.currentUser?.token) {
                    options.headers['Authorization'] = `Bearer ${this.state.currentUser.token}`;
                }
                
                // Add data for POST or PUT requests
                if (data && (method === 'POST' || method === 'PUT')) {
                    options.body = JSON.stringify(data);
                }
                
                const response = await fetch(url, options);
                
                // Check if response is not ok
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'API request failed');
                }
                
                return await response.json();
            } catch (error) {
                console.error('API request error:', error);
                throw error;
            }
        },
        
        /**
         * Show alert message
         * @param {string} message - The message to show
         */
        showAlert(message) {
            // Check if alert container exists, create if not
            let alertContainer = document.getElementById('alert-container');
            if (!alertContainer) {
                alertContainer = document.createElement('div');
                alertContainer.id = 'alert-container';
                document.body.appendChild(alertContainer);
            }
            
            // Create alert element
            const alertEl = document.createElement('div');
            alertEl.className = 'alert';
            alertEl.textContent = message;
            
            // Add alert to container
            alertContainer.appendChild(alertEl);
            
            // Remove after 3 seconds
            setTimeout(() => {
                alertEl.classList.add('fadeout');
                setTimeout(() => alertEl.remove(), 500);
            }, 3000);
        },
        
        /**
         * Show modal
         * @param {HTMLElement} modal - The modal to show
         */
        showModal(modal) {
            if (modal) modal.style.display = 'block';
        },
        
        /**
         * Hide modal
         * @param {HTMLElement} modal - The modal to hide
         */
        hideModal(modal) {
            if (modal) modal.style.display = 'none';
        },
        
        /**
         * Switch tab in booking form
         */
        switchTab(e) {
            document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            // Implement actual tab content switching here if needed
        },
        
        /**
         * Toggle driver fields in signup form
         */
        toggleDriverFields(e) {
            const driverFields = document.getElementById('driver-fields');
            if (driverFields) {
                driverFields.style.display = e.target.value === 'driver' ? 'block' : 'none';
            }
        },
        
        /*************************** 
         * AUTHENTICATION 
         ***************************/
        
        /**
         * Check user session status on page load
         */
        async checkSession() {
            try {
                // Check if there's a token in local storage
                const token = localStorage.getItem('goWheelsToken');
                if (!token) return;
                
                // Verify token with server
                const userData = await this.apiRequest('/auth/verify');
                this.state.currentUser = userData;
                
                // Update UI for logged in user
                this.updateUIAfterLogin(userData);
            } catch (error) {
                // Invalid or expired token, clear it
                localStorage.removeItem('goWheelsToken');
                console.error('Session verification failed:', error);
            }
        },
        
        /**
         * Handle login
         */
        async handleLogin() {
            const username = this.elements.loginForm.username.value;
            const password = this.elements.loginForm.password.value;
            
            if (!username || !password) {
                this.showAlert('Please enter both username and password');
                return;
            }
            
            try {
                const data = await this.apiRequest('/login', 'POST', { username, password });
                this.state.currentUser = data;
                
                // Store token in localStorage if available
                if (data.token) {
                    localStorage.setItem('goWheelsToken', data.token);
                }
                
                // Update UI for logged in user
                this.updateUIAfterLogin(data);
                
                // Close modal
                this.hideModal(this.elements.loginModal);
            } catch (error) {
                this.showAlert('Login failed: ' + error.message);
            }
        },
        
        /**
         * Update UI after successful login
         * @param {Object} userData - User data
         */
        updateUIAfterLogin(userData) {
            const el = this.elements;
            
            // Common UI updates
            el.authButtons.style.display = 'none';
            el.userPanel.style.display = 'flex';
            el.userWelcome.textContent = `Welcome, ${userData.user.username}`;
            
            // User type specific updates
            if (userData.userType === 'driver') {
                // Driver UI adjustments
                el.bookingSection.style.display = 'none';
                this.showAlert(`Welcome, ${userData.driverInfo.Driver_Name}! Your current status is ${userData.driverInfo.Current_Status}.`);
            } else {
                // Passenger UI adjustments
                el.bookingSection.style.display = 'block';
                this.showAlert(`Welcome, ${userData.passengerInfo.Name}!`);
            }
        },
        
        /**
         * Handle logout
         */
        handleLogout() {
            // Clear state
            this.state.currentUser = null;
            this.state.currentBooking = null;
            this.state.currentTrip = null;
            
            // Clear localStorage
            localStorage.removeItem('goWheelsToken');
            
            // Reset UI
            const el = this.elements;
            el.authButtons.style.display = 'flex';
            el.userPanel.style.display = 'none';
            el.bookingSection.style.display = 'block';
            el.availableDriversSection.style.display = 'none';
            el.tripDetailsSection.style.display = 'none';
            el.paymentSection.style.display = 'none';
            
            // Reset forms
            el.cityTaxiForm.reset();
            el.loginForm.username.value = '';
            el.loginForm.password.value = '';
            
            this.showAlert('You have been logged out');
        },
        
        /**
         * Handle signup
         */
        async handleSignup() {
            const signupForm = document.getElementById('signupForm');
            if (!signupForm) return;
            
            const formData = new FormData(signupForm);
            const userData = Object.fromEntries(formData.entries());
            
            // Basic validation
            if (!userData.username || !userData.password || !userData.email) {
                this.showAlert('Please fill in all required fields');
                return;
            }
            
            if (userData.password !== userData.confirm_password) {
                this.showAlert('Passwords do not match');
                return;
            }
            
            try {
                // Create user account
                const data = await this.apiRequest('/signup', 'POST', userData);
                
                // Auto login after signup
                this.state.currentUser = data;
                
                // Save token in local storage
                if (data.token) {
                    localStorage.setItem('goWheelsToken', data.token);
                }
                
                // Update UI for logged in user
                this.updateUIAfterLogin(data);
                
                // Close modal
                this.hideModal(this.elements.signupModal);
            } catch (error) {
                this.showAlert('Signup failed: ' + error.message);
            }
        },
        
        /*************************** 
         * BOOKING & TRIP MANAGEMENT 
         ***************************/
        
        /**
         * Handle booking
         */
        async handleBooking() {
            if (!this.state.currentUser) {
                this.showAlert('Please login to book a ride');
                this.showModal(this.elements.loginModal);
                return;
            }
            
            if (this.state.currentUser.userType !== 'passenger') {
                this.showAlert('Only passengers can book rides');
                return;
            }
            
            const el = this.elements;
            const pickupLocation = el.inputs.pickupLocation.value;
            const dropLocation = el.inputs.dropLocation.value;
            
            if (!pickupLocation || !dropLocation) {
                this.showAlert('Please enter pickup and drop locations');
                return;
            }
            
            if (pickupLocation === dropLocation) {
                this.showAlert('Pickup and drop locations cannot be the same');
                return;
            }
            
            try {
                // Create booking
                const bookingData = await this.apiRequest('/bookings', 'POST', {
                    passenger_id: this.state.currentUser.user.username,
                    pickup_location: pickupLocation,
                    drop_location: dropLocation
                });
                
                this.state.currentBooking = {
                    id: bookingData.id,
                    pickup_location: pickupLocation,
                    drop_location: dropLocation
                };
                
                // Fetch available drivers
                const driversData = await this.apiRequest('/drivers/available');
                
                if (driversData.length === 0) {
                    this.showAlert('No drivers available at the moment. Please try again later.');
                    return;
                }
                
                // Show available drivers section
                this.renderDrivers(driversData);
                
                // Scroll to drivers section
                this.elements.availableDriversSection.scrollIntoView({
                    behavior: 'smooth'
                });
            } catch (error) {
                this.showAlert('Booking failed: ' + error.message);
            }
        },
        
        /**
         * Render available drivers
         * @param {Array} drivers - The drivers data
         */
        renderDrivers(drivers) {
            const driversGrid = this.elements.driversGrid;
            if (!driversGrid) return;
            
            driversGrid.innerHTML = '';
            this.elements.availableDriversSection.style.display = 'block';
            
            drivers.forEach(driver => {
                const driverCard = document.createElement('div');
                driverCard.className = 'driver-card';
                driverCard.innerHTML = `
                    <h3>${driver.Driver_Name}</h3>
                    <div class="driver-rating">
                        ${this.getRatingStars(driver.Rating)}
                        <span>${driver.Rating.toFixed(1)}/5</span>
                    </div>
                    <p><strong>Car:</strong> ${driver.Car_Model} (${driver.Car_Type})</p>
                    <p><strong>Location:</strong> ${driver.Cab_Location || 'Unknown'}</p>
                    <button class="btn btn-primary select-driver" data-id="${driver.Driver_ID}">Select Driver</button>
                `;
                driversGrid.appendChild(driverCard);
            });
            
            // Add event listeners for driver selection
            document.querySelectorAll('.select-driver').forEach(button => {
                button.addEventListener('click', this.selectDriver.bind(this));
            });
        },
        
        /**
         * Driver selection handler
         */
        async selectDriver(e) {
            const driverId = e.target.getAttribute('data-id');
            try {
                // Create trip with selected driver
                const tripData = await this.apiRequest('/trips', 'POST', {
                    booking_id: this.state.currentBooking.id,
                    driver_id: driverId
                });
                
                // Fetch trip details
                this.state.currentTrip = await this.apiRequest(`/trips/${tripData.trip_id}`);
                
                // Hide driver selection and show trip details
                this.elements.availableDriversSection.style.display = 'none';
                this.elements.tripDetailsSection.style.display = 'block';
                
                // Render trip info
                this.renderTripDetails();
                
                // Scroll to trip details
                this.elements.tripDetailsSection.scrollIntoView({
                    behavior: 'smooth'
                });
            } catch (error) {
                this.showAlert('Failed to create trip: ' + error.message);
            }
        },
        
        /**
         * Render trip details
         */
        renderTripDetails() {
            const trip = this.state.currentTrip;
            const tripInfo = this.elements.tripInfo;
            if (!trip || !tripInfo) return;
            
            tripInfo.innerHTML = `
                <h3>Trip #${trip.Trip_ID}</h3>
                <div class="trip-status-badge ${trip.Trip_Status.toLowerCase()}">${trip.Trip_Status}</div>
                <div class="trip-info-row">
                    <div class="trip-info-label">Passenger:</div>
                    <div class="trip-info-value">${trip.Passenger_Name}</div>
                </div>
                <div class="trip-info-row">
                    <div class="trip-info-label">Driver:</div>
                    <div class="trip-info-value">${trip.Driver_Name}</div>
                </div>
                <div class="trip-info-row">
                    <div class="trip-info-label">Vehicle:</div>
                    <div class="trip-info-value">${trip.Car_Model} (${trip.Car_Type})</div>
                </div>
                <div class="trip-info-row">
                    <div class="trip-info-label">Pickup:</div>
                    <div class="trip-info-value">${trip.Pickup_Location}</div>
                </div>
                <div class="trip-info-row">
                    <div class="trip-info-label">Destination:</div>
                    <div class="trip-info-value">${trip.Drop_Location}</div>
                </div>
                <div class="trip-info-row">
                    <div class="trip-info-label">Fare:</div>
                    <div class="trip-info-value">₹${trip.Fare}</div>
                </div>
                <div class="trip-info-row">
                    <div class="trip-info-label">Status:</div>
                    <div class="trip-info-value" id="tripStatus">${trip.Trip_Status}</div>
                </div>
            `;
            
            // Update button visibility based on trip status
            const completeBtn = this.elements.buttons.completeTrip;
            const cancelBtn = this.elements.buttons.cancelTrip;
            
            if (trip.Trip_Status === 'Completed' || trip.Trip_Status === 'Cancelled') {
                completeBtn.style.display = 'none';
                cancelBtn.style.display = 'none';
            } else {
                completeBtn.style.display = 'inline-block';
                cancelBtn.style.display = 'inline-block';
            }
        },
        
        /**
         * Complete trip
         */
        async completeTrip() {
            if (!this.state.currentTrip) return;
            
            try {
                // Update trip status
                await this.apiRequest(`/trips/${this.state.currentTrip.Trip_ID}/status`, 'PUT', { 
                    status: 'Completed' 
                });
                
                // Update UI
                const tripStatus = document.getElementById('tripStatus');
                if (tripStatus) {
                    tripStatus.textContent = 'Completed';
                }
                
                // Update current trip status
                this.state.currentTrip.Trip_Status = 'Completed';
                
                // Hide trip action buttons
                const el = this.elements;
                el.buttons.completeTrip.style.display = 'none';
                el.buttons.cancelTrip.style.display = 'none';
                
                // Show payment section
                el.tripDetailsSection.style.display = 'none';
                el.paymentSection.style.display = 'block';
                
                // Render fare details
                this.renderFareDetails();
                
                // Scroll to payment section
                el.paymentSection.scrollIntoView({
                    behavior: 'smooth'
                });
            } catch (error) {
                this.showAlert('Failed to complete trip: ' + error.message);
            }
        },
        
        /**
         * Cancel trip
         */
        async cancelTrip() {
            if (!this.state.currentTrip) return;
            
            if (!confirm('Are you sure you want to cancel this trip?')) {
                return;
            }
            
            try {
                // Update trip status
                await this.apiRequest(`/trips/${this.state.currentTrip.Trip_ID}/status`, 'PUT', {
                    status: 'Cancelled'
                });
                
                this.showAlert('Trip cancelled successfully');
                
                // Update current trip status
                this.state.currentTrip.Trip_Status = 'Cancelled';
                
                // Hide trip action buttons
                const el = this.elements;
                el.buttons.completeTrip.style.display = 'none';
                el.buttons.cancelTrip.style.display = 'none';
                
                // Update status in UI
                const tripStatus = document.getElementById('tripStatus');
                if (tripStatus) {
                    tripStatus.textContent = 'Cancelled';
                }
                
                // Reset and go back to booking
                setTimeout(() => {
                    el.tripDetailsSection.style.display = 'none';
                    el.cityTaxiForm.reset();
                    el.bookingSection.scrollIntoView({
                        behavior: 'smooth'
                    });
                    this.state.currentBooking = null;
                    // Keep currentTrip for history purposes
                }, 2000);
            } catch (error) {
                this.showAlert('Failed to cancel trip: ' + error.message);
            }
        },
        
        /**
         * Process payment
         */
        async processPayment() {
            if (!this.state.currentTrip) return;
            
            const paymentMethodEl = document.querySelector('input[name="payment-method"]:checked');
            if (!paymentMethodEl) {
                this.showAlert('Please select a payment method');
                return;
            }
            
            const paymentMethod = paymentMethodEl.value;
            
            try {
                // Process payment
                const data = await this.apiRequest('/payments', 'POST', {
                    trip_id: this.state.currentTrip.Trip_ID,
                    payment_type: paymentMethod,
                    payment_amount: this.state.currentTrip.Fare
                });
                
                // Show success message
                this.elements.paymentSection.innerHTML = `
                    <div class="container">
                        <div class="payment-success">
                            <div class="success-icon">✓</div>
                            <h2>Payment Successful!</h2>
                            <p>Payment ID: ${data.payment_id}</p>
                            <p>Amount: ₹${this.state.currentTrip.Fare}</p>
                            <p>Thank you for riding with GoWheels!</p>
                            <button class="btn btn-primary" id="backToHome">Back to Home</button>
                        </div>
                    </div>
                `;
                
                // Add event listener to the "Back to Home" button
                document.getElementById('backToHome')?.addEventListener('click', () => {
                    this.elements.paymentSection.style.display = 'none';
                    this.elements.bookingSection.scrollIntoView({
                        behavior: 'smooth'
                    });
                    
                    // Reset form
                    this.elements.cityTaxiForm.reset();
                    this.state.currentBooking = null;
                    // Keep currentTrip for history purposes
                });
            } catch (error) {
                this.showAlert('Payment failed: ' + error.message);
            }
        },
        
        /**
         * Render fare details
         */
        renderFareDetails() {
            const fare = this.state.currentTrip.Fare;
            if (!fare || !this.elements.fareDetails) return;
            
            const baseFare = Math.floor(fare * 0.9);
            const serviceFee = fare - baseFare;
            
            this.elements.fareDetails.innerHTML = `
                <h3>Fare Details</h3>
                <div class="fare-row">
                    <div class="fare-label">Base Fare:</div>
                    <div class="fare-value">₹${baseFare}</div>
                </div>
                <div class="fare-row">
                    <div class="fare-label">Service Fee:</div>
                    <div class="fare-value">₹${serviceFee}</div>
                </div>
                <div class="fare-row total">
                    <div class="fare-label">Total Amount:</div>
                    <div class="fare-value">₹${fare}</div>
                </div>
            `;
        },
        
        /*************************** 
         * TRIP HISTORY 
         ***************************/
        
        /**
         * Initialize and show rider history
         */
        async showRiderHistory() {
            if (!this.state.currentUser) {
                this.showAlert('Please login to view your ride history');
                this.showModal(this.elements.loginModal);
                return;
            }
            
            try {
                // Fetch user's trip history
                const tripHistory = await this.apiRequest('/trips/history');
                
                // Create and show history modal
                const historyModal = document.createElement('div');
                historyModal.className = 'modal';
                historyModal.id = 'historyModal';
                
                historyModal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Your Ride History</h2>
                            <span class="close-modal">&times;</span>
                        </div>
                        <div class="modal-body">
                            ${this.renderTripHistoryTable(tripHistory)}
                        </div>
                    </div>
                `;
                
                document.body.appendChild(historyModal);
                
                // Show modal
                this.showModal(historyModal);
                
                // Add event listener to close button
                historyModal.querySelector('.close-modal')?.addEventListener('click', () => {
                    historyModal.remove();
                });
                
                // Add event listeners to view trip details buttons
                document.querySelectorAll('.view-trip-details').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const tripId = e.target.getAttribute('data-trip-id');
                        this.showTripDetails(tripId);
                    });
                });
            } catch (error) {
                this.showAlert('Failed to load trip history: ' + error.message);
            }
        },
        
        /**
         * Render trip history table
         * @param {Array} trips - Trip history data
         * @return {string} HTML for trip history table
         */
        renderTripHistoryTable(trips) {
            if (!trips || trips.length === 0) {
                return '<p>You have no trip history yet.</p>';
            }
            
            let tableHTML = `
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Trip ID</th>
                            <th>Date</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Fare</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            trips.forEach(trip => {
                const tripDate = new Date(trip.Trip_Date).toLocaleDateString();
                
                tableHTML += `
                    <tr>
                        <td>${trip.Trip_ID}</td>
                        <td>${tripDate}</td>
                        <td>${trip.Pickup_Location}</td>
                        <td>${trip.Drop_Location}</td>
                        <td>₹${trip.Fare}</td>
                        <td>
                            <span class="status-badge ${trip.Trip_Status.toLowerCase()}">
                                ${trip.Trip_Status}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary view-trip-details" data-trip-id="${trip.Trip_ID}">
                                View Details
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                </table>
            `;
            
            return tableHTML;
        },
        
        /**
         * Show trip details
         * @param {string} tripId - The trip ID
         */
        async showTripDetails(tripId) {
            try {
                // Fetch trip details
                const trip = await this.apiRequest(`/trips/${tripId}`);
                
                // Create modal for trip details
                const tripDetailsModal = document.createElement('div');
                tripDetailsModal.className = 'modal';
                tripDetailsModal.id = 'tripDetailsModal';
                
                tripDetailsModal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Trip Details #${trip.Trip_ID}</h2>
                            <span class="close-modal">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="trip-details-card">
                                <div class="trip-status-badge ${trip.Trip_Status.toLowerCase()}">${trip.Trip_Status}</div>
                                <div class="trip-info-row">
                                    <strong>Date:</strong> ${new Date(trip.Trip_Date).toLocaleString()}
                                </div>
                                <div class="trip-info-row">
                                    <strong>From:</strong> ${trip.Pickup_Location}
                                </div>
                                <div class="trip-info-row">
                                    <strong>To:</strong> ${trip.Drop_Location}
                                </div>
                                <div class="trip-info-row">
                                    <strong>Fare:</strong> ₹${trip.Fare}
                                </div>
                                <div class="trip-info-row">
                                    <strong>Driver:</strong> ${trip.Driver_Name || 'N/A'}
                                </div>
                                <div class="trip-info-row">
                                    <strong>Vehicle:</strong> ${trip.Vehicle_Info || 'N/A'}
                                </div>
                                <div class="trip-info-row">
                                    <strong>Payment Method:</strong> ${trip.Payment_Method || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(tripDetailsModal);

                // Show modal
                this.showModal(tripDetailsModal);

                // Close event
                tripDetailsModal.querySelector('.close-modal')?.addEventListener('click', () => {
                    tripDetailsModal.remove();
                });
            } catch (error) {
                this.showAlert('Failed to load trip details: ' + error.message);
            }
        },
        
        /**
         * Get rating stars HTML
         * @param {number} rating - The rating value
         * @return {string} HTML for rating stars
         */
        getRatingStars(rating) {
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 !== 0;
            let starsHTML = '';
            
            // Add full stars
            for (let i = 0; i < fullStars; i++) {
                starsHTML += '★';
            }
            
            // Add half star if needed
            if (hasHalfStar) {
                starsHTML += '☆';
            }
            
            // Add empty stars to make 5 total
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
            for (let i = 0; i < emptyStars; i++) {
                starsHTML += '☆';
            }
            
            return starsHTML;
        },
        
        /**
         * Initialize FAQ functionality
         */
        initFaq() {
            // FAQ functionality would be implemented here
            // This is a placeholder for FAQ-related initialization
        },
        
        /**
         * Initialize statistics
         */
        initStatistics() {
            // Statistics functionality would be implemented here
            // This is a placeholder for statistics-related initialization
        }
    };
    
    // Initialize the application
    GoWheelsApp.init();
});