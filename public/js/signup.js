import { AuthService } from '../src/lib/auth.js'
import { DatabaseService } from '../src/lib/database.js'

class SignupPage {
    constructor() {
        this.form = document.getElementById('signupForm')
        this.userTypeSelect = document.getElementById('userType')
        this.driverFields = document.getElementById('driverFields')
        this.errorMessage = document.getElementById('errorMessage')
        this.successMessage = document.getElementById('successMessage')
        
        this.init()
    }
    
    init() {
        this.form.addEventListener('submit', this.handleSignup.bind(this))
        this.userTypeSelect.addEventListener('change', this.toggleDriverFields.bind(this))
        this.checkAuthState()
    }
    
    async checkAuthState() {
        const user = await AuthService.getCurrentUser()
        if (user) {
            window.location.href = 'index.html'
        }
    }
    
    toggleDriverFields() {
        const userType = this.userTypeSelect.value
        if (userType === 'driver') {
            this.driverFields.style.display = 'block'
            this.setDriverFieldsRequired(true)
        } else {
            this.driverFields.style.display = 'none'
            this.setDriverFieldsRequired(false)
        }
    }
    
    setDriverFieldsRequired(required) {
        const fields = this.driverFields.querySelectorAll('input, select')
        fields.forEach(field => {
            field.required = required
        })
    }
    
    async handleSignup(e) {
        e.preventDefault()
        
        const formData = this.getFormData()
        
        if (!this.validateForm(formData)) {
            return
        }
        
        this.hideMessages()
        this.setLoading(true)
        
        try {
            const result = await AuthService.signUp(formData.email, formData.password, {
                full_name: formData.fullName,
                phone: formData.phone,
                user_type: formData.userType
            })
            
            if (result.success) {
                // Create additional profile data
                if (formData.userType === 'passenger') {
                    await this.createPassengerProfile(result.data.user.id, formData)
                } else if (formData.userType === 'driver') {
                    await this.createDriverProfile(result.data.user.id, formData)
                }
                
                this.showSuccess('Account created successfully! Please check your email to verify your account.')
                setTimeout(() => {
                    window.location.href = 'login.html'
                }, 3000)
            } else {
                this.showError(result.error)
            }
        } catch (error) {
            this.showError('An unexpected error occurred. Please try again.')
        } finally {
            this.setLoading(false)
        }
    }
    
    async createPassengerProfile(userId, formData) {
        const passengerData = {
            user_id: userId,
            name: formData.fullName,
            phone: formData.phone,
            email: formData.email
        }
        
        await DatabaseService.createPassenger(passengerData)
    }
    
    async createDriverProfile(userId, formData) {
        // This would create driver and vehicle records
        // Implementation depends on your Supabase schema
        console.log('Creating driver profile for:', userId, formData)
    }
    
    getFormData() {
        return {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            userType: document.getElementById('userType').value,
            licenseNumber: document.getElementById('licenseNumber').value,
            vehicleModel: document.getElementById('vehicleModel').value,
            vehicleType: document.getElementById('vehicleType').value
        }
    }
    
    validateForm(formData) {
        if (formData.password !== formData.confirmPassword) {
            this.showError('Passwords do not match')
            return false
        }
        
        if (formData.password.length < 6) {
            this.showError('Password must be at least 6 characters long')
            return false
        }
        
        if (formData.userType === 'driver') {
            if (!formData.licenseNumber || !formData.vehicleModel || !formData.vehicleType) {
                this.showError('Please fill in all driver information')
                return false
            }
        }
        
        return true
    }
    
    setLoading(loading) {
        const submitBtn = this.form.querySelector('button[type="submit"]')
        if (loading) {
            submitBtn.disabled = true
            submitBtn.textContent = 'Creating Account...'
        } else {
            submitBtn.disabled = false
            submitBtn.textContent = 'Create Account'
        }
    }
    
    showError(message) {
        this.errorMessage.textContent = message
        this.errorMessage.style.display = 'block'
        this.successMessage.style.display = 'none'
    }
    
    showSuccess(message) {
        this.successMessage.textContent = message
        this.successMessage.style.display = 'block'
        this.errorMessage.style.display = 'none'
    }
    
    hideMessages() {
        this.errorMessage.style.display = 'none'
        this.successMessage.style.display = 'none'
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupPage()
})