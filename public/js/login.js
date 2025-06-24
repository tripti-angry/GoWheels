import { AuthService } from '../src/lib/auth.js'

class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm')
        this.errorMessage = document.getElementById('errorMessage')
        this.successMessage = document.getElementById('successMessage')
        
        this.init()
    }
    
    init() {
        this.form.addEventListener('submit', this.handleLogin.bind(this))
        this.checkAuthState()
    }
    
    async checkAuthState() {
        const user = await AuthService.getCurrentUser()
        if (user) {
            window.location.href = 'index.html'
        }
    }
    
    async handleLogin(e) {
        e.preventDefault()
        
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        
        this.hideMessages()
        this.setLoading(true)
        
        try {
            const result = await AuthService.signIn(email, password)
            
            if (result.success) {
                this.showSuccess('Login successful! Redirecting...')
                setTimeout(() => {
                    window.location.href = 'index.html'
                }, 1500)
            } else {
                this.showError(result.error)
            }
        } catch (error) {
            this.showError('An unexpected error occurred. Please try again.')
        } finally {
            this.setLoading(false)
        }
    }
    
    setLoading(loading) {
        const submitBtn = this.form.querySelector('button[type="submit"]')
        if (loading) {
            submitBtn.disabled = true
            submitBtn.textContent = 'Signing In...'
        } else {
            submitBtn.disabled = false
            submitBtn.textContent = 'Sign In'
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
    new LoginPage()
})