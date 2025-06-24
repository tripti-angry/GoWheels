import { supabase } from './supabase.js'

export class DatabaseService {
  // Driver operations
  static async getAvailableDrivers() {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('current_status', 'Available')
        .order('rating', { ascending: false })
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  static async getDriverById(id) {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('driver_id', id)
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Passenger operations
  static async createPassenger(passengerData) {
    try {
      const { data, error } = await supabase
        .from('passengers')
        .insert([passengerData])
        .select()
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  static async getPassengerByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Booking operations
  static async createBooking(bookingData) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  static async getBookingsByPassenger(passengerId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trips (*)
        `)
        .eq('passenger_id', passengerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Trip operations
  static async createTrip(tripData) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select()
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  static async updateTripStatus(tripId, status) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({ status })
        .eq('trip_id', tripId)
        .select()
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}