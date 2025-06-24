import { AuthService } from '../src/lib/auth.js'
import { DatabaseService } from '../src/lib/database.js'

class GoWheelsApp {
    constructor() {
        this.currentUser = null
        this.availableDrivers = []
        this.selectedDriver = null
        this.currentTrip = null
        
        this.init()
    }
    
    async init() {
        await this.checkAuthState()
        this.initEventListeners()
        this.initBookingForm()
        
        // Set up auth state listener
        AuthService.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                this.handleSignOut()
            } else if (event === 'SIGNED_IN') {
                this.handleSignIn(session.user)
            }
        })
    }
    
    async checkAuthState() {
        const user = await AuthService.getCurrentUser()
        if (user) {
            this.currentUser = user
            this.updateUIForAuthenticatedUser()
        } else {
            this.updateUIForUnauthenticatedUser()
        }
    }
    
    updateUIForAuthenticatedUser() {
        const authButtons = document.querySelector('.auth-buttons')
        const userPanel = document.querySelector('.user-panel')
        
        if (authButtons) authButtons.style.display = 'none'
        if (userPanel) {
            userPanel.style.display = 'flex'
            const welcomeText = userPanel.querySelector('#userWelcome')
            if (welcomeText) {
                welcomeText.textContent = `Welcome, ${this.currentUser.user_metadata?.full_name || this.currentUser.email}`
            }
        }
    }
    
    updateUIForUnauthenticatedUser() {
        const authButtons = document.querySelector('.auth-buttons')
        const userPanel = document.querySelector('.user-panel')
        
        if (authButtons) authButtons.style.display = 'flex'
        if (userPanel) userPanel.style.display = 'none'
    }
    
    handleSignIn(user) {
        this.currentUser = user
        this.updateUIForAuthenticatedUser()
    }
    
    handleSignOut() {
        this.currentUser = null
        this.updateUIForUnauthenticatedUser()
        window.location.href = 'login.html'
    }
    
    initEventListeners() {
        // Auth buttons
        const loginBtn = document.getElementById('loginBtn')
        const signupBtn = document.getElementById('signupBtn')
        const logoutBtn = document.getElementById('logoutBtn')
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login.html'
            })
        }
        
        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                window.location.href = 'signup.html'
            })
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this))
        }
        
        // Booking form
        const bookBtn = document.querySelector('.book-btn')
        if (bookBtn) {
            bookBtn.addEventListener('click', this.handleBooking.bind(this))
        }
        
        // Ride type selection
        const rideOptions = document.querySelectorAll('.ride-option')
        rideOptions.forEach(option => {
            option.addEventListener('click', this.selectRideType.bind(this))
        })
        
        // Ride cards
        const rideCards = document.querySelectorAll('.ride-card')
        rideCards.forEach(card => {
            card.addEventListener('click', this.selectRideCard.bind(this))
        })
    }
    
    async handleLogout() {
        const result = await AuthService.signOut()
        if (result.success) {
            this.handleSignOut()
        }
    }
    
    selectRideType(e) {
        const rideOptions = document.querySelectorAll('.ride-option')
        rideOptions.forEach(option => option.classList.remove('active'))
        e.currentTarget.classList.add('active')
    }
    
    selectRideCard(e) {
        const rideCards = document.querySelectorAll('.ride-card')
        rideCards.forEach(card => card.classList.remove('selected'))
        e.currentTarget.classList.add('selected')
    }
    
    initBookingForm() {
        // Set default date and time
        const dateInput = document.getElementById('pickup-date')
        const timeInput = document.getElementById('pickup-time')
        
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0]
            dateInput.value = today
        }
        
        if (timeInput) {
            const now = new Date()
            const currentTime = now.toTimeString().slice(0, 5)
            timeInput.value = currentTime
        }
    }
    
    async handleBooking() {
        if (!this.currentUser) {
            alert('Please sign in to book a ride')
            window.location.href = 'login.html'
            return
        }
        
        const pickupLocation = document.querySelector('.address-input:first-child').value
        const dropLocation = document.querySelector('.address-input:last-child').value
        const selectedRideCard = document.querySelector('.ride-card.selected')
        const pickupDate = document.getElementById('pickup-date').value
        const pickupTime = document.getElementById('pickup-time').value
        
        if (!pickupLocation || !dropLocation) {
            alert('Please enter both pickup and drop locations')
            return
        }
        
        if (!selectedRideCard) {
            alert('Please select a ride type')
            return
        }
        
        const rideType = selectedRideCard.querySelector('.ride-name').textContent
        const ridePrice = selectedRideCard.querySelector('.ride-price').textContent
        
        try {
            // Get available drivers
            const driversResult = await DatabaseService.getAvailableDrivers()
            if (!driversResult.success || driversResult.data.length === 0) {
                alert('No drivers available at the moment. Please try again later.')
                return
            }
            
            this.availableDrivers = driversResult.data
            this.showDriverSelection(pickupLocation, dropLocation, rideType, ridePrice, pickupDate, pickupTime)
            
        } catch (error) {
            console.error('Booking error:', error)
            alert('An error occurred while booking. Please try again.')
        }
    }
    
    showDriverSelection(pickup, drop, rideType, price, date, time) {
        const availableDriversSection = document.getElementById('availableDrivers')
        const driversGrid = document.getElementById('driversGrid')
        
        if (!availableDriversSection || !driversGrid) {
            console.error('Driver selection elements not found')
            return
        }
        
        // Clear previous drivers
        driversGrid.innerHTML = ''
        
        // Create driver cards
        this.availableDrivers.forEach(driver => {
            const driverCard = this.createDriverCard(driver, pickup, drop, rideType, price, date, time)
            driversGrid.appendChild(driverCard)
        })
        
        // Show the section
        availableDriversSection.style.display = 'block'
        availableDriversSection.scrollIntoView({ behavior: 'smooth' })
    }
    
    createDriverCard(driver, pickup, drop, rideType, price, date, time) {
        const card = document.createElement('div')
        card.className = 'driver-card'
        card.innerHTML = `
            <div class="driver-info">
                <h3>${driver.driver_name}</h3>
                <div class="driver-rating">
                    ${'★'.repeat(driver.rating)}${'☆'.repeat(5 - driver.rating)}
                    <span>(${driver.rating}/5)</span>
                </div>
                <p class="driver-location">${driver.cab_location}</p>
            </div>
            <div class="vehicle-info">
                <p class="vehicle-model">${driver.vehicles?.car_model || 'Unknown Model'}</p>
                <p class="vehicle-type">${driver.vehicles?.car_type || 'Unknown Type'}</p>
            </div>
            <button class="btn btn-primary select-driver-btn">Select Driver</button>
        `
        
        const selectBtn = card.querySelector('.select-driver-btn')
        selectBtn.addEventListener('click', () => {
            this.selectDriver(driver, pickup, drop, rideType, price, date, time)
        })
        
        return card
    }
    
    async selectDriver(driver, pickup, drop, rideType, price, date, time) {
        this.selectedDriver = driver
        
        try {
            // Get passenger info
            const passengerResult = await DatabaseService.getPassengerByUserId(this.currentUser.id)
            if (!passengerResult.success) {
                alert('Error getting passenger information')
                return
            }
            
            const passenger = passengerResult.data
            
            // Create booking
            const bookingData = {
                passenger_id: passenger.passenger_id,
                pickup_location: pickup,
                drop_location: drop,
                ride_type: rideType,
                scheduled_time: `${date} ${time}`,
                status: 'pending'
            }
            
            const bookingResult = await DatabaseService.createBooking(bookingData)
            if (!bookingResult.success) {
                alert('Error creating booking')
                return
            }
            
            // Create trip
            const tripData = {
                booking_id: bookingResult.data.booking_id,
                driver_id: driver.driver_id,
                passenger_id: passenger.passenger_id,
                pickup_location: pickup,
                drop_location: drop,
                status: 'pending',
                fare: this.calculateFare(price)
            }
            
            const tripResult = await DatabaseService.createTrip(tripData)
            if (!tripResult.success) {
                alert('Error creating trip')
                return
            }
            
            this.currentTrip = tripResult.data
            this.showTripDetails()
            
        } catch (error) {
            console.error('Error selecting driver:', error)
            alert('An error occurred. Please try again.')
        }
    }
    
    calculateFare(priceRange) {
        // Extract base price from range like "₹100-120"
        const match = priceRange.match(/₹(\d+)-(\d+)/)
        if (match) {
            const min = parseInt(match[1])
            const max = parseInt(match[2])
            return Math.floor(Math.random() * (max - min + 1)) + min
        }
        return 100 // Default fare
    }
    
    showTripDetails() {
        const tripDetailsSection = document.getElementById('tripDetails')
        const tripInfo = document.getElementById('tripInfo')
        
        if (!tripDetailsSection || !tripInfo) {
            console.error('Trip details elements not found')
            return
        }
        
        tripInfo.innerHTML = `
            <div class="trip-summary">
                <h3>Trip Confirmed!</h3>
                <div class="trip-route">
                    <p><strong>From:</strong> ${this.currentTrip.pickup_location}</p>
                    <p><strong>To:</strong> ${this.currentTrip.drop_location}</p>
                </div>
                <div class="driver-details">
                    <h4>Your Driver</h4>
                    <p><strong>Name:</strong> ${this.selectedDriver.driver_name}</p>
                    <p><strong>Rating:</strong> ${this.selectedDriver.rating}/5</p>
                    <p><strong>Vehicle:</strong> ${this.selectedDriver.vehicles?.car_model}</p>
                    <p><strong>Contact:</strong> ${this.selectedDriver.contact_no}</p>
                </div>
                <div class="fare-info">
                    <p><strong>Estimated Fare:</strong> ₹${this.currentTrip.fare}</p>
                </div>
            </div>
        `
        
        // Hide driver selection and show trip details
        document.getElementById('availableDrivers').style.display = 'none'
        tripDetailsSection.style.display = 'block'
        tripDetailsSection.scrollIntoView({ behavior: 'smooth' })
        
        // Set up trip action buttons
        this.initTripActions()
    }
    
    initTripActions() {
        const completeBtn = document.getElementById('completeTrip')
        const cancelBtn = document.getElementById('cancelTrip')
        
        if (completeBtn) {
            completeBtn.addEventListener('click', this.completeTrip.bind(this))
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.cancelTrip.bind(this))
        }
    }
    
    async completeTrip() {
        if (!this.currentTrip) return
        
        try {
            const result = await DatabaseService.updateTripStatus(this.currentTrip.trip_id, 'completed')
            if (result.success) {
                this.showPaymentSection()
            } else {
                alert('Error completing trip')
            }
        } catch (error) {
            console.error('Error completing trip:', error)
            alert('An error occurred. Please try again.')
        }
    }
    
    async cancelTrip() {
        if (!this.currentTrip) return
        
        if (confirm('Are you sure you want to cancel this trip?')) {
            try {
                const result = await DatabaseService.updateTripStatus(this.currentTrip.trip_id, 'cancelled')
                if (result.success) {
                    alert('Trip cancelled successfully')
                    this.resetBookingForm()
                } else {
                    alert('Error cancelling trip')
                }
            } catch (error) {
                console.error('Error cancelling trip:', error)
                alert('An error occurred. Please try again.')
            }
        }
    }
    
    showPaymentSection() {
        const paymentSection = document.getElementById('paymentSection')
        const fareDetails = document.getElementById('fareDetails')
        
        if (!paymentSection || !fareDetails) {
            console.error('Payment section elements not found')
            return
        }
        
        fareDetails.innerHTML = `
            <h3>Trip Completed!</h3>
            <div class="fare-breakdown">
                <p><strong>Base Fare:</strong> ₹${Math.floor(this.currentTrip.fare * 0.7)}</p>
                <p><strong>Distance Charge:</strong> ₹${Math.floor(this.currentTrip.fare * 0.2)}</p>
                <p><strong>Service Fee:</strong> ₹${Math.floor(this.currentTrip.fare * 0.1)}</p>
                <hr>
                <p class="total-fare"><strong>Total: ₹${this.currentTrip.fare}</strong></p>
            </div>
        `
        
        // Hide trip details and show payment
        document.getElementById('tripDetails').style.display = 'none'
        paymentSection.style.display = 'block'
        paymentSection.scrollIntoView({ behavior: 'smooth' })
        
        // Set up payment button
        const payBtn = document.getElementById('payNow')
        if (payBtn) {
            payBtn.addEventListener('click', this.processPayment.bind(this))
        }
    }
    
    async processPayment() {
        const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked')
        
        if (!selectedPaymentMethod) {
            alert('Please select a payment method')
            return
        }
        
        // Simulate payment processing
        alert(`Payment of ₹${this.currentTrip.fare} processed successfully via ${selectedPaymentMethod.value}!`)
        
        // Reset the booking form
        this.resetBookingForm()
    }
    
    resetBookingForm() {
        // Hide all sections
        const sections = ['availableDrivers', 'tripDetails', 'paymentSection']
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId)
            if (section) section.style.display = 'none'
        })
        
        // Clear form data
        const addressInputs = document.querySelectorAll('.address-input')
        addressInputs.forEach(input => input.value = '')
        
        // Reset selections
        const rideCards = document.querySelectorAll('.ride-card')
        rideCards.forEach(card => card.classList.remove('selected'))
        if (rideCards.length > 0) {
            rideCards[0].classList.add('selected')
        }
        
        // Reset trip data
        this.currentTrip = null
        this.selectedDriver = null
        this.availableDrivers = []
        
        // Scroll back to booking form
        document.querySelector('.booking-container').scrollIntoView({ behavior: 'smooth' })
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GoWheelsApp()
})