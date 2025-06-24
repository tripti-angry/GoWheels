/*
  # Initial GoWheels Database Schema

  1. New Tables
    - `profiles` - User profile information
    - `drivers` - Driver-specific information
    - `passengers` - Passenger-specific information  
    - `vehicles` - Vehicle information
    - `bookings` - Ride bookings
    - `trips` - Active/completed trips
    - `payments` - Payment records

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  phone text,
  user_type text NOT NULL CHECK (user_type IN ('passenger', 'driver')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_number text UNIQUE NOT NULL,
  car_model text NOT NULL,
  car_type text NOT NULL CHECK (car_type IN ('sedan', 'suv', 'hatchback', 'luxury')),
  created_at timestamptz DEFAULT now()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  driver_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  driver_name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  date_of_birth date NOT NULL,
  contact_no text NOT NULL,
  rating decimal(2,1) DEFAULT 5.0 CHECK (rating >= 1 AND rating <= 5),
  cab_location text,
  current_status text DEFAULT 'Available' CHECK (current_status IN ('Off Duty', 'Available', 'In Ride')),
  vehicle_id uuid REFERENCES vehicles(vehicle_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Passengers table
CREATE TABLE IF NOT EXISTS passengers (
  passenger_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date,
  pickup_location text,
  status boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  booking_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id uuid REFERENCES passengers(passenger_id) ON DELETE CASCADE,
  pickup_location text NOT NULL,
  drop_location text NOT NULL,
  ride_type text NOT NULL,
  scheduled_time timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (pickup_location != drop_location)
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  trip_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(booking_id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(driver_id),
  passenger_id uuid REFERENCES passengers(passenger_id),
  pickup_location text NOT NULL,
  drop_location text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  fare decimal(10,2),
  trip_date_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  payment_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid REFERENCES trips(trip_id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('cash', 'card', 'upi', 'wallet')),
  payment_amount decimal(10,2) NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Drivers policies
CREATE POLICY "Anyone can read available drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (current_status = 'Available');

CREATE POLICY "Drivers can update own data"
  ON drivers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Drivers can insert own data"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Passengers policies
CREATE POLICY "Passengers can read own data"
  ON passengers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Passengers can update own data"
  ON passengers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Passengers can insert own data"
  ON passengers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Vehicles policies
CREATE POLICY "Anyone can read vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

-- Bookings policies
CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    passenger_id IN (
      SELECT passenger_id FROM passengers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    passenger_id IN (
      SELECT passenger_id FROM passengers WHERE user_id = auth.uid()
    )
  );

-- Trips policies
CREATE POLICY "Users can read own trips"
  ON trips FOR SELECT
  TO authenticated
  USING (
    passenger_id IN (
      SELECT passenger_id FROM passengers WHERE user_id = auth.uid()
    ) OR
    driver_id IN (
      SELECT driver_id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (
    passenger_id IN (
      SELECT passenger_id FROM passengers WHERE user_id = auth.uid()
    ) OR
    driver_id IN (
      SELECT driver_id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    trip_id IN (
      SELECT trip_id FROM trips WHERE 
      passenger_id IN (SELECT passenger_id FROM passengers WHERE user_id = auth.uid()) OR
      driver_id IN (SELECT driver_id FROM drivers WHERE user_id = auth.uid())
    )
  );

-- Insert sample data
INSERT INTO vehicles (car_number, car_model, car_type) VALUES
('DL01AB1234', 'Toyota Camry', 'sedan'),
('DL02CD5678', 'Honda CR-V', 'suv'),
('DL03EF9012', 'Maruti Swift', 'hatchback'),
('DL04GH3456', 'BMW 5 Series', 'luxury'),
('DL05IJ7890', 'Hyundai Creta', 'suv');