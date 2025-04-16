-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS GoWheels;
USE GoWheels;

-- Drop tables in reverse order of dependencies to avoid foreign key constraint errors
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS Trip;
DROP TABLE IF EXISTS Booking;
DROP TABLE IF EXISTS Passenger;
DROP TABLE IF EXISTS Drivers;
DROP TABLE IF EXISTS Vehicle;
DROP TABLE IF EXISTS Users;

-- Users Table
CREATE TABLE Users (
    username BIGINT(10) NOT NULL,
    pwd VARCHAR(255) NOT NULL, -- CHANGED: Increased password length for better security
    category BOOLEAN NOT NULL,
    PRIMARY KEY (username),
    INDEX idx_users_category (category) -- ADDED: Index on category for faster filtering
);

-- Vehicle Table
CREATE TABLE Vehicle (
    Car_No BIGINT(10) NOT NULL,
    Car_Model VARCHAR(30) NOT NULL,
    Car_Type VARCHAR(30) NOT NULL,
    PRIMARY KEY (Car_No),
    INDEX idx_vehicle_type (Car_Type) -- ADDED: Index on Car_Type for faster queries by vehicle type
);

-- Drivers Table
CREATE TABLE Drivers (
    Driver_ID BIGINT(10) PRIMARY KEY,
    Driver_Name VARCHAR(50) NOT NULL, -- CHANGED: Increased name length for longer names
    Driver_License_Number BIGINT UNIQUE NOT NULL, -- CHANGED: INT to BIGINT for longer license numbers
    Date_of_Birth DATE NOT NULL,
    Contact_No BIGINT(10) NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Cab_Location VARCHAR(100) NOT NULL, -- CHANGED: Increased location field length
    Current_Status ENUM('Off Duty', 'Available', 'In Ride') NOT NULL, -- CHANGED: Using ENUM for better data integrity
    Driver_Car_No BIGINT(10),
    FOREIGN KEY (Driver_Car_No) REFERENCES Vehicle(Car_No) ON DELETE SET NULL ON UPDATE CASCADE, -- CHANGED: SET NULL instead of CASCADE on delete for data integrity
    INDEX idx_drivers_status (Current_Status), -- ADDED: Index for faster status filtering
    INDEX idx_drivers_rating (Rating) -- ADDED: Index for faster rating-based queries
);

-- Passenger Table
CREATE TABLE Passenger (
    Passenger_ID BIGINT(10) NOT NULL,
    Name VARCHAR(50) NOT NULL, -- CHANGED: Increased name length for longer names
    Date_of_Birth DATE NOT NULL,
    Contact_Number BIGINT(10) NOT NULL,
    Pickup_Location VARCHAR(100), -- CHANGED: Increased location field length
    Status BOOLEAN NOT NULL,
    PRIMARY KEY (Passenger_ID),
    INDEX idx_passenger_status (Status) -- ADDED: Index on Status for faster filtering
);

-- Booking Table
CREATE TABLE Booking (
    Booking_ID BIGINT(10) AUTO_INCREMENT, -- ADDED: Separate primary key for normalization
    Booking_Passenger_ID BIGINT(10) NOT NULL, -- CHANGED: NOT NULL constraint
    Drop_Location VARCHAR(100) NOT NULL,
    Pickup_Location VARCHAR(100) NOT NULL,
    Booking_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- ADDED: Timestamp for booking
    PRIMARY KEY (Booking_ID),
    FOREIGN KEY (Booking_Passenger_ID) REFERENCES Passenger(Passenger_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (Drop_Location <> Pickup_Location),
    INDEX idx_booking_passenger (Booking_Passenger_ID) -- ADDED: Index for faster passenger lookup
);

-- Trip Table
CREATE TABLE Trip (
    Trip_ID BIGINT(10) NOT NULL,
    Trip_Status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') NOT NULL, -- CHANGED: Using ENUM for status with more options
    Trip_Date_Time DATETIME NOT NULL, -- CHANGED: Using DATETIME instead of just DATE for timestamp
    Trip_Passenger_ID BIGINT(10) NOT NULL,
    Trip_Driver_ID BIGINT(10) NOT NULL,
    Drop_Location VARCHAR(100) NOT NULL,
    Pickup_Location VARCHAR(100) NOT NULL,
    Fare DECIMAL(10,2), -- ADDED: Fare field for trip cost
    PRIMARY KEY (Trip_ID),
    FOREIGN KEY (Trip_Passenger_ID) REFERENCES Passenger(Passenger_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Trip_Driver_ID) REFERENCES Drivers(Driver_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_trip_status (Trip_Status), -- ADDED: Index for status filtering
    INDEX idx_trip_driver (Trip_Driver_ID), -- ADDED: Index for driver filtering
    INDEX idx_trip_passenger (Trip_Passenger_ID) -- ADDED: Index for passenger filtering
);

-- Payment Table
CREATE TABLE Payment (
    Payment_ID BIGINT(12) NOT NULL UNIQUE,
    Trip_ID BIGINT(10) NOT NULL,
    Payment_Type ENUM('Cash', 'Credit Card', 'Debit Card', 'Mobile Wallet', 'Other') NOT NULL, -- CHANGED: Using ENUM for payment types
    Payment_Amount DECIMAL(10,2) NOT NULL,
    Payment_Status ENUM('Pending', 'Completed', 'Failed', 'Refunded') NOT NULL, -- CHANGED: ENUM with more options
    Payment_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- ADDED: Timestamp for payment
    PRIMARY KEY (Payment_ID),
    FOREIGN KEY (Trip_ID) REFERENCES Trip(Trip_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_payment_status (Payment_Status) -- ADDED: Index for faster payment status filtering
);
-- First insert Vehicle data since Drivers depends on it
INSERT INTO Vehicle (Car_No, Car_Model, Car_Type) VALUES
(9838663964, 'Toyota Camry', 'Sedan'),
(6694212283, 'Honda Civic', 'Sedan'),
(3940377678, 'Ford Explorer', 'SUV'),
(3830384408, 'Hyundai Elantra', 'Sedan'),
(9543016275, 'Chevrolet Cruze', 'Sedan'),
(5668955419, 'Toyota Corolla', 'Sedan'),
(4808165457, 'Honda Accord', 'Sedan'),
(1271345889, 'Nissan Altima', 'Sedan'),
(4663663508, 'Toyota RAV4', 'SUV'),
(2526140943, 'Ford Focus', 'Sedan'),
(7368946823, 'Honda CR-V', 'SUV'),
(6287231718, 'Hyundai Sonata', 'Sedan'),
(5588139364, 'Chevrolet Malibu', 'Sedan'),
(6817375916, 'Toyota Avalon', 'Sedan'),
(4322435491, 'Honda Fit', 'Hatchback'),
(1669324931, 'Nissan Sentra', 'Sedan'),
(3045304729, 'Toyota Prius', 'Hybrid'),
(548666679, 'Ford Escape', 'SUV'),
(1573456586, 'Hyundai Tucson', 'SUV'),
(7356627868, 'Chevrolet Equinox', 'SUV'),
(7884417332, 'Toyota Camry', 'Sedan'),
(8465468508, 'Honda Civic', 'Sedan'),
(7706520412, 'Ford Explorer', 'SUV'),
(6106378495, 'Hyundai Elantra', 'Sedan'),
(5950687213, 'Chevrolet Cruze', 'Sedan'),
(882839411, 'Toyota Corolla', 'Sedan'),
(2151594203, 'Honda Accord', 'Sedan'),
(847256421, 'Nissan Altima', 'Sedan'),
(8136536198, 'Toyota RAV4', 'SUV'),
(7123548329, 'Ford Focus', 'Sedan'),
(9272557259, 'Honda CR-V', 'SUV'),
(486316351, 'Hyundai Sonata', 'Sedan'),
(3436329932, 'Chevrolet Malibu', 'Sedan'),
(1870033701, 'Toyota Avalon', 'Sedan'),
(2389749399, 'Honda Fit', 'Hatchback'),
(8740926478, 'Nissan Sentra', 'Sedan'),
(5858129102, 'Toyota Prius', 'Hybrid'),
(2862636533, 'Ford Escape', 'SUV'),
(9219215942, 'Hyundai Tucson', 'SUV'),
(5379940714, 'Chevrolet Equinox', 'SUV'),
(3531121081, 'Toyota Camry', 'Sedan'),
(4291262221, 'Honda Civic', 'Sedan'),
(9873667989, 'Ford Explorer', 'SUV'),
(3667821646, 'Hyundai Elantra', 'Sedan'),
(9605605201, 'Chevrolet Cruze', 'Sedan');

-- Insert Users data
INSERT INTO Users (username, pwd, category) VALUES
(56133405, '56133405', 0),
(109621042, '109621042', 1),
(225462214, '225462214', 1),
(231663498, '231663498', 0),
(317155210, '317155210', 1),
(388722827, '388722827', 1),
(397184204, '397184204', 0),
(453605419, '453605419', 0),
(455852200, '455852200', 0),
(459110594, '459110594', 1),
(468392726, '468392726', 1),
(472878786, '472878786', 0),
(558227279, '558227279', 0),
(608387363, '608387363', 1),
(621943797, '621943797', 1),
(623626160, '623626160', 0),
(630808341, '630808341', 0),
(756069866, '756069866', 1),
(765319829, '765319829', 1),
(816331812, '816331812', 1),
(848102347, '848102347', 1),
(850219213, '850219213', 1),
(881329053, '881329053', 1),
(906391121, '906391121', 1),
(946844860, '946844860', 1),
(1057772895, '1057772895', 1),
(1137398825, '1137398825', 0),
(1158270291, '1158270291', 0),
(1206729953, '1206729953', 1),
(1218621621, '1218621621', 0),
(1266339140, '1266339140', 1),
(1303440628, '1303440628', 0),
(1320150322, '1320150322', 0),
(1321549504, '1321549504', 0),
(1385217707, '1385217707', 1),
(1448617294, '1448617294', 1),
(1472265157, '1472265157', 0),
(1481300377, '1481300377', 0),
(1527994147, '1527994147', 0),
(1559319216, '1559319216', 0),
(1610347498, '1610347498', 0),
(1688152229, '1688152229', 1),
(1779374399, '1779374399', 1),
(1792844875, '1792844875', 1),
(1925395065, '1925395065', 1),
(2180563221, '2180563221', 1),
(2226423281, '2226423281', 1),
(2249120935, '2249120935', 1),
(2263997350, '2263997350', 0),
(2329248660, '2329248660', 1),
(2329711425, '2329711425', 1),
(2437269355, '2437269355', 1),
(2459219075, '2459219075', 0),
(2503902499, '2503902499', 1),
(2581383089, '2581383089', 0),
(2599939399, '2599939399', 1),
(2628752034, '2628752034', 0),
(2673548351, '2673548351', 1),
(2685935126, '2685935126', 0),
(2707181900, '2707181900', 1),
(2874022411, '2874022411', 1),
(3001314540, '3001314540', 1),
(3065022702, '3065022702', 0),
(3126126790, '3126126790', 1),
(3129939091, '3129939091', 0),
(3184757188, '3184757188', 1),
(3191551123, '3191551123', 1),
(3229897439, '3229897439', 1),
(3365753540, '3365753540', 1),
(3383064972, '3383064972', 0),
(3414667029, '3414667029', 0),
(3492890369, '3492890369', 1),
(3503264620, '3503264620', 1),
(3626242374, '3626242374', 1),
(3696717258, '3696717258', 0),
(3701472831, '3701472831', 0),
(3803496861, '3803496861', 0),
(3825994732, '3825994732', 1),
(3871944289, '3871944289', 1),
(3883257230, '3883257230', 0),
(3919670310, '3919670310', 0),
(3944637283, '3944637283', 1),
(4020546517, '4020546517', 0),
(4030430554, '4030430554', 1),
(4056377693, '4056377693', 0),
(4100728727, '4100728727', 0),
(4116270156, '4116270156', 0),
(4121431782, '4121431782', 0),
(4126644792, '4126644792', 1),
(4132567958, '4132567958', 1),
(4146571073, '4146571073', 0),
(4193366693, '4193366693', 0),
(4249098702, '4249098702', 1),
(4439643574, '4439643574', 0),
(4487270162, '4487270162', 0),
(4586099526, '4586099526', 0),
(4593231361, '4593231361', 0);

-- Insert Passenger data
INSERT INTO Passenger (Passenger_ID, Name, Date_of_Birth, Contact_Number, Pickup_Location, Status) VALUES
(109621042, 'Berti Spick', '2005-08-16', 8834680294, '0 Manitowish Road', TRUE),
(225462214, 'Earle Jilliss', '1999-06-20', 8211564785, '5 Hintze Park', TRUE),
(317155210, 'Aeriel Dorkins', '2002-02-04', 9938042082, '27257 Michigan Circle', TRUE),
(388722827, 'Sophia Copper', '2001-05-15', 4276479959, '0 American Circle', FALSE),
(459110594, 'Mordy Onele', '1999-12-29', 3869621052, '82875 Doe Crossing Street', FALSE),
(468392726, 'Tab Holbie', '1995-07-02', 356630587, '2277 Forster Junction', FALSE),
(608387363, 'Chantal Coule', '2005-02-10', 8550650234, '0 Red Cloud Street', FALSE),
(621943797, 'Myrwyn Pitsall', '2001-10-24', 6512656938, '0 Carey Park', FALSE),
(756069866, 'Hamilton Cawthorn', '2001-05-10', 2783880520, '1091 Sherman Pass', FALSE),
(765319829, 'Krystalle Tidmarsh', '2002-03-16', 9237007256, '9 Fairfield Court', FALSE),
(816331812, 'Cristobal Verdy', '2002-01-27', 9326510387, '8 Warner Crossing', FALSE),
(848102347, 'Renee Demchen', '1998-08-10', 8435262650, '66 Clove Center', FALSE),
(850219213, 'Corabella McGettigan', '2002-01-05', 7430778909, '72 Cordelia Road', FALSE),
(881329053, 'April Fanner', '2004-11-26', 3781571408, '46322 Village Green Trail', FALSE),
(906391121, 'Rozanna Stolz', '2006-09-08', 7285486183, '50 Green Ridge Road', FALSE),
(946844860, 'Velma Betteriss', '2003-02-07', 3173819683, '47 Oak Valley Way', FALSE),
(1057772895, 'Arden Napleton', '1978-07-05', 8592338352, '05 Huxley Park', FALSE),
(1206729953, 'Ricky Hawthorne', '2001-09-24', 5889997963, '13 Schurz Circle', FALSE),
(1266339140, 'Ailis Rootham', '2001-09-15', 5372916303, '6183 Scoville Alley', FALSE),
(1385217707, 'Panchito Fernie', '2001-05-31', 4595992459, '74527 Oriole Road', FALSE),
(1448617294, 'Nils Dallmann', '2001-07-01', 4270534818, '949 Warbler Drive', FALSE),
(1688152229, 'Billye Hillburn', '2002-02-17', 2839596296, '4385 Fair Oaks Junction', FALSE),
(1779374399, 'Fay Wilacot', '2002-01-25', 8180089967, '75204 International Plaza', FALSE),
(1792844875, 'Ardith Batterbee', '2001-12-30', 586519033, '9 Raven Lane', FALSE),
(1925395065, 'Michaelina Lightbourn', '2002-02-12', 5031160918, '5 Barby Road', FALSE),
(2180563221, 'Bobina Handford', '2002-01-25', 9051504578, '0 Dawn Trail', FALSE),
(2226423281, 'Sephira Fullerlove', '2001-11-02', 8359756732, '6346 Merrick Place', FALSE),
(2249120935, 'Jarred Keepence', '2001-03-28', 4420991518, '076 Nancy Point', FALSE),
(2329248660, 'Johna Driffe', '2001-12-20', 5959460173, '9 Canary Avenue', FALSE),
(5312345678, 'Jasmine Taylor', '2001-05-18', 7123456789, '123 Sunflower Street', TRUE),
(5423456789, 'Daniel Brown', '2002-01-09', 8234567890, '456 Daisy Lane', TRUE),
(5534567890, 'Isabella Clark', '2001-07-14', 9345678901, '789 Rose Avenue', TRUE),
(5645678901, 'Mason Adams', '2001-11-29', 1456789012, '321 Tulip Road', TRUE),
(5756789012, 'Charlotte Walker', '2001-09-03', 2567890123, '654 Lily Court', TRUE),
(5867890123, 'Jacob Miller', '2002-02-22', 3678901234, '987 Orchid Drive', TRUE),
(5978901234, 'Amelia Davis', '2001-04-06', 4789012345, '159 Violet Way', TRUE),
(6089012345, 'William Wilson', '2001-10-15', 5890123456, '357 Carnation Boulevard', TRUE),
(6190123456, 'Harper Anderson', '2001-12-01', 6901234567, '246 Daffodil Street', TRUE),
(6201234567, 'Elijah Moore', '2001-06-27', 7012345678, '135 Iris Place', TRUE),
(6312345678, 'Sofia Thomas', '2001-08-12', 8123456789, '864 Poppy Lane', TRUE),
(6423456789, 'Lucas Jackson', '2002-01-30', 9234567890, '975 Marigold Avenue', TRUE),
(6534567890, 'Evelyn White', '2001-05-24', 1345678901, '753 Azalea Road', TRUE),
(2329711425, 'Miof mela Kittow', '2002-02-12', 1371495688, '05 Stoughton Pass', FALSE),
(2437269355, 'Whitby Hearns', '2001-10-21', 4583184492, '900 Gale Terrace', FALSE),
(2503902499, 'Chastity Kerford', '2001-03-14', 6221763010, '01 Judy Place', FALSE),
(2599939399, 'Lynda Larrington', '2001-12-31', 8550341460, '0 Kenwood Court', FALSE),
(2673548351, 'Harlene Renault', '2001-12-17', 7329347302, '6420 Commercial Center', FALSE),
(2707181900, 'Andrei Gartenfeld', '2001-09-30', 154228672, '62884 Kropf Place', FALSE),
(2874022411, 'Chicky Worsnip', '2001-09-04', 7547430988, '9 Grim Hill', FALSE),
(3001314540, 'Margret O Kinedy', '2002-01-31', 9965600112, '3461 Marcy Point', FALSE),
(3126126790, 'Laurel Brauninger', '2001-09-19', 3823504223, '32 Di Loreto Parkway', FALSE),
(3184757188, 'Lacy Burfield', '2002-01-05', 911526951, '6 Ridge Oak Terrace', FALSE),
(3191551123, 'Gwenora McCrossan', '2001-09-14', 4336724148, '1192 Arkansas Alley', FALSE),
(3229897439, 'Vinnie Poser', '2002-02-07', 2459814887, '74644 Blue Bill Park Junction', FALSE),
(3365753540, 'Kata Kubicka', '2001-05-22', 1967225478, '4292 Little Fleur Terrace', FALSE),
(3492890369, 'Fin Luckman', '2001-09-13', 5899931663, '25691 Northridge Street', FALSE),
(3503264620, 'Madeline Rablin', '2001-11-20', 9243123637, '12541 High Crossing Center', FALSE),
(3626242374, 'Iggy Sommerlie', '2002-02-07', 1572023821, '04098 Burning Wood Parkway', FALSE),
(3825994732, 'Anthe Jennens', '2001-05-03', 8372411352, '83766 Oakridge Junction', FALSE),
(3871944289, 'Melosa Usherwood', '2001-10-02', 1409283909, '15109 Bartelt Point', FALSE),
(3944637283, 'Roana Eagleton', '2001-08-27', 3415399354, '859 Maryland Drive', FALSE),
(4030430554, 'Joelynn Whiskerd', '2001-12-05', 3112258126, '400 Green Ridge Avenue', FALSE),
(4126644792, 'Tripti Kashyap', '2001-01-01', 1234567890, 'Okhla', FALSE),
(4132567958, 'Kunal Kapoor', '2001-01-01', 1234567890, 'Okhla', FALSE),
(4249098702, 'Muskan Sachdev', '2001-01-01', 1234567890, 'Okhla', TRUE),
(4301542876, 'Olivia Chen', '2001-06-12', 7825463910, '234 Maple Avenue', TRUE),
(4452987631, 'Ethan Rodriguez', '2002-01-15', 6543217890, '567 Oak Street', TRUE),
(4503216789, 'Sophia Williams', '2001-09-22', 9087651234, '890 Pine Boulevard', TRUE),
(4654321098, 'Noah Johnson', '2001-04-30', 5432167890, '123 Cedar Lane', TRUE),
(4705612387, 'Ava Martinez', '2001-11-05', 8765432109, '456 Birch Road', TRUE),
(4856790123, 'Liam Thompson', '2002-02-18', 3216549870, '789 Willow Drive', TRUE),
(4907834561, 'Emma Garcia', '2001-07-19', 6789054321, '321 Aspen Court', TRUE),
(5008976543, 'Benjamin Lee', '2001-08-03', 4567890123, '654 Redwood Way', TRUE),
(5109832456, 'Mia Patel', '2001-10-11', 2345678901, '987 Spruce Street', TRUE),
(5210987654, 'Alexander Wright', '2001-12-25', 8901234567, '210 Elm Place', TRUE);


-- Drivers Table entry
INSERT INTO Drivers (Driver_ID, Driver_Name, Driver_License_Number, Date_of_Birth, Contact_No, Rating, Cab_Location, Current_Status, Driver_Car_No) VALUES
(56133405, 'Matteo Bennellick', 645756756, '1994-05-06', 5479909371, 4, '430 David Street', 'Available', 9838663964),
(231663498, 'Elisabeth Domenichelli', 363456533, '1988-10-14', 6908150747, 3, '2417 Anderson Alley', 'Off Duty', 6694212283),
(397184204, 'Gertrude Oxenbury', 333333, '1991-11-12', 6270433401, 5, '85696 Graedel Place', 'Available', 3940377678),
(453605419, 'Tomkin Higgonet', 777643333, '1984-03-11', 3947251440, 3, '84676 Coolidge Pass', 'Available', 3830384408),
(455852200, 'Christoph Erridge', 565674576, '1994-12-18', 3928254898, 1, '36 Everett Alley', 'Off Duty', 9543016275),
(472878786, 'Liliane Micklewright', 55656565, '1984-11-15', 7087706446, 1, '094 Lyons Place', 'Available', 5668955419),
(558227279, 'Javier Ronisch', 53653375, '1984-12-12', 7295193391, 5, '911 Jenifer Drive', 'Off Duty', 4808165457),
(623626160, 'Raddy McKinn', 555666666, '1990-09-19', 1739520351, 5, '40976 Shelley Center', 'Available', 1271345889),
(630808341, 'Kellina Lyfe', 654676546, '1982-04-19', 2579397167, 5, '62457 Clove Plaza', 'Available', 4663663508),
(1137398825, 'Aldo Traynor', 866555555, '1991-01-01', 8937221780, 5, '5 Oneill Trail', 'Available', 2526140943),
(1158270291, 'Whitaker Dunan', 754363737, '1990-12-19', 2923169190, 5, '79160 Mitchell Terrace', 'Off Duty', 7368946823),
(1218621621, 'Rachael Ollarenshaw', 436345653, '1985-03-13', 2539605249, 5, '110 Loftsgordon Drive', 'Off Duty', 6287231718),
(1303440628, 'Iain Hotchkin', 753353, '1980-11-15', 6754912227, 1, '8 Lawn Center', 'Available', 5588139364),
(1320150322, 'Wendeline Karlowicz', 536566635, '1982-08-13', 6386331508, 2, '84 Old Gate Road', 'Off Duty', 6817375916),
(1321549504, 'Arel Stredder', 657647765, '1986-11-11', 2846840733, 2, '693 Dakota Hill', 'Off Duty', 4322435491),
(1472265157, 'Brandise Stuckford', 645432245, '1983-12-17', 9692312348, 5, '4 Clyde Gallagher Trail', 'Off Duty', 1669324931),
(1481300377, 'Sella Beckitt', 866433333, '1988-06-19', 8127009989, 2, '22829 Hooker Terrace', 'Available', 3045304729),
(1527994147, 'Avigdor Pervoe', 988009006, '1992-06-19', 2358430501, 5, '59 Westport Center', 'Off Duty', 548666679),
(1559319216, 'Lindsey Sherwill', 897555544, '1987-05-17', 3394336480, 1, '42249 Independence Trail', 'Available', 1573456586),
(1610347498, 'Tilly Pinhorn', 345635737, '1988-02-13', 7820523956, 1, '62170 Troy Plaza', 'Off Duty', 7356627868),
(2263997350, 'Giraldo Ference', 543645645, '1980-11-13', 207969337, 5, '087 Delladonna Plaza', 'Available', 7884417332),
(2459219075, 'Morna Edwicker', 567867564, '1983-04-09', 1588076873, 5, '1 Jenifer Drive', 'Off Duty', 8465468508),
(2581383089, 'Sauveur Lotterington', 563454565, '1987-09-10', 2814934295, 5, '4 Macpherson Hill', 'Available', 7706520412),
(2628752034, 'Truman Lockhurst', 435634563, '1988-11-19', 4042940382, 3, '3 Westridge Drive', 'Available', 6106378495),
(2685935126, 'Verney Pessler', 3563453, '1985-10-18', 1670868729, 2, '71 Blaine Crossing', 'Off Duty', 5950687213),
(3065022702, 'Kimball Klejin', 90450968, '1980-09-20', 4725648426, 5, '76537 Sheridan Park', 'Off Duty', 882839411),
(3129939091, 'Lettie Pirson', 553323565, '1989-12-11', 8967876351, 5, '62556 Loomis Lane', 'Available', 2151594203),
(3383064972, 'Hilario Tomczynski', 900000968, '1980-05-19', 6478718492, 3, '93222 Lerdahl Center', 'Available', 847256421),
(3414667029, 'Rhiamon Waycott', 5745433, '1985-06-11', 8414734421, 1, '9683 Florence Lane', 'Available', 8136536198),
(3696717258, 'Aliza Dahill', 536443646, '1991-03-14', 9908448471, 5, '49 Manitowish Pass', 'Available', 7123548329),
(3701472831, 'Renae Trustrie', 688885646, '1989-02-19', 8144551109, 5, '3557 Sage Court', 'Available', 9272557259),
(3803496861, 'Bard Sirrell', 988955968, '1980-01-19', 8282256773, 2, '9674 Buhler Alley', 'Available', 486316351),
(3883257230, 'Katie Badrock', 888886546, '1990-11-14', 2751668143, 5, '8 Everett Way', 'Off Duty', 3436329932),
(3919670310, 'Eberhard Vaune', 754334566, '1987-01-17', 6507630993, 5, '3728 Eastlawn Pass', 'Off Duty', 1870033701),
(4020546517, 'Becka Addinall', 7755333, '1986-04-10', 8727508854, 5, '1 Cambridge Lane', 'Available', 2389749399),
(4056377693, 'Filippo Childerley', 567657585, '1991-01-10', 1043299459, 2, '44452 Sycamore Terrace', 'Available', 8740926478),
(4100728727, 'Marcellus Gannicleff', 43563456, '1988-11-13', 9017404825, 5, '55779 Mendota Hill', 'Available', 5858129102),
(4116270156, 'Angel Fearnehough', 777544557, '1981-04-16', 6318762175, 1, '773 8th Circle', 'Available', 2862636533),
(4121431782, 'Eugenia Inchley', 654767564, '1986-06-15', 2657990894, 3, '57454 Welch Pass', 'Available', 9219215942),
(4146571073, 'Alford Belding', 543536534, '1986-03-17', 2814204599, 2, '07171 Prairieview Avenue', 'Available', 5379940714),
(4193366693, 'Glenine Poschel', 888654477, '1990-07-11', 4867072826, 5, '902 Homewood Center', 'Available', 3531121081),
(4439643574, 'Horatius Kilfeather', 676765445, '1993-01-15', 5647875661, 5, '95 Green Place', 'Off Duty', 4291262221),
(4487270162, 'Brit Calow', 546758565, '1987-03-01', 8939100581, 3, '61 Florence Place', 'Off Duty', 9873667989),
(4586099526, 'Swen McGurn', 88853333, '1981-03-14', 8411250814, 2, '7 Mcbride Lane', 'Available', 3667821646),
(4593231361, 'Ronna Possek', 456756756, '1987-10-11', 2929439238, 5, '9 Mcguire Crossing', 'Available', 9605605201);

-- Insert Booking data
INSERT INTO Booking (Drop_Location, Pickup_Location, Booking_Passenger_ID) VALUES
("11447 Browning Trail", "73595 Thompson Street", 388722827),
("rajasthan", "okhla", 459110594),
("5951 Susan Avenue", "5 East Hill", 468392726),
("963 Bay Street", "611 Reinke Way", 608387363),
("19 Bayside Street", "17395 Buhler Place", 621943797),
("14 Corry Drive", "4850 Northport Crossing", 756069866),
("819 Mccormick Parkway", "417 Emmet Court", 765319829),
("5 Acker Junction", "87 Monterey Point", 816331812),
("8 Grim Way", "64363 Novick Place", 848102347),
("8 Loeprich Avenue", "98 Gale Point", 850219213),
("32 Butterfield Crossing", "9 Dixon Street", 881329053),
("36 Browning Road", "152 Sachs Street", 906391121),
("176 Gina Lane", "28240 Duke Place", 946844860),
("365 Veith Plaza", "1 Farwell Plaza", 1057772895),
("5470 Scofield Alley", "19932 Charing Cross Plaza", 1206729953),
("44061 Center Circle", "10873 Melby Trail", 1266339140),
("84 Carey Circle", "004 Lawn Center", 1385217707),
("03 Bellgrove Terrace", "8823 Stuart Center", 1448617294),
("8073 Starling Circle", "73 Towne Trail", 1688152229),
("2940 Thackeray Hill", "7 Union Circle", 1779374399),
("72347 Brentwood Parkway", "878 Killdeer Lane", 1792844875),
("25 Starling Avenue", "57 Sutteridge Lane", 1925395065),
("42746 Sunbrook Circle", "80 Jana Lane", 2180563221),
("1 Green Place", "723 Harbort Avenue", 2226423281),
("244 Kim Point", "02466 Heffernan Avenue", 2249120935),
("35 Colorado Way", "67722 Reindahl Plaza", 2329248660),
("082 Shasta Hill", "42 Dwight Junction", 2329711425),
("4497 Kinsman Pass", "3 Green Alley", 2437269355),
("41852 Sunfield Parkway", "84254 Lotheville Way", 2503902499),
("9 Mayfield Hill", "4996 Beilfuss Lane", 2599939399),
("6613 Westerfield Point", "1 Swallow Pass", 2673548351),
("0046 Bowman Pass", "2 Lyons Terrace", 2707181900),
("804 Marcy Junction", "3116 Park Meadow Pass", 2874022411),
("7823 Oak Valley Plaza", "91154 Ridgeview Pass", 3001314540),
("250 Scott Street", "88 Meadow Valley Terrace", 3126126790),
("2 Charing Cross Avenue", "001 Oak Valley Lane", 3184757188),
("0 Talmadge Point", "2529 East Pass", 3191551123),
("7959 Birchwood Point", "912 Myrtle Crossing", 3229897439),
("04492 Center Hill", "6 Elka Circle", 3365753540),
("83572 Loftsgordon Way", "4392 Helena Court", 3492890369),
("30813 Mockingbird Avenue", "87318 Washington Point", 3503264620),
("89 Pawling Avenue", "3420 Doe Crossing Pass", 3626242374),
("4943 Warrior Road", "342 Northfield Parkway", 3825994732),
("8038 Sommers Trail", "543 Union Plaza", 3871944289),
("71 Columbus Trail", "67 Portage Terrace", 3944637283),
("9171 Utah Drive", "94 Park Meadow Parkway", 4030430554);

-- 1. Find drivers with the highest ratings who are currently available, along with their vehicle details:
SELECT 
    d.Driver_ID, 
    d.Driver_Name, 
    d.Rating, 
    d.Cab_Location, 
    d.Contact_No,
    v.Car_Model, 
    v.Car_Type
FROM Drivers d
JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
WHERE d.Current_Status = 'Available' 
AND d.Rating >= 4 -- ADDED: Filter for high-rated drivers first
ORDER BY d.Rating DESC, d.Driver_Name
LIMIT 10;

-- 2. Find drivers who are off duty
SELECT 
    d.Driver_ID, 
    d.Driver_Name, 
    d.Contact_No, 
    d.Rating,
    v.Car_Model,
    v.Car_Type
FROM Drivers d
JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
WHERE d.Current_Status = 'Off Duty'
ORDER BY d.Rating DESC, d.Driver_Name;

-- 3. Calculate average rating of drivers by car type
SELECT 
    v.Car_Type, 
    ROUND(AVG(d.Rating), 2) AS Average_Rating, 
    MIN(d.Rating) AS Lowest_Rating,
    MAX(d.Rating) AS Highest_Rating,
    COUNT(d.Driver_ID) AS Driver_Count
FROM Drivers d
JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
GROUP BY v.Car_Type
HAVING COUNT(d.Driver_ID) > 0 
ORDER BY Average_Rating DESC;

-- 4. Calculate the average age of drivers and passengers
SELECT 
    'Drivers' AS User_Type, 
    ROUND(AVG(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)), 1) AS Average_Age,
    MIN(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Youngest_Age,
    MAX(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Oldest_Age,
    COUNT(*) AS Total_Count
FROM Drivers
UNION
SELECT 
    'Passengers' AS User_Type, 
    ROUND(AVG(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)), 1) AS Average_Age,
    MIN(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Youngest_Age,
    MAX(YEAR(CURRENT_DATE) - YEAR(Date_of_Birth)) AS Oldest_Age,
    COUNT(*) AS Total_Count
FROM Passenger
ORDER BY User_Type;

-- 5. Retrieve the Oldest and Youngest Driver
SELECT 
    Driver_Name, 
    Date_of_Birth, 
    YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) AS Age,
    Contact_No,
    Rating,
    CASE 
        WHEN Date_of_Birth = (SELECT MIN(Date_of_Birth) FROM Drivers) THEN 'Oldest'
        WHEN Date_of_Birth = (SELECT MAX(Date_of_Birth) FROM Drivers) THEN 'Youngest'
    END AS Age_Extreme
FROM Drivers
WHERE 
    Date_of_Birth = (SELECT MIN(Date_of_Birth) FROM Drivers)
    OR Date_of_Birth = (SELECT MAX(Date_of_Birth) FROM Drivers)
ORDER BY Date_of_Birth;

-- 6. Find Passengers Who Have Booked a Trip But Never Completed One
SELECT 
    P.Passenger_ID, 
    P.Name,
    P.Contact_Number,
    COUNT(B.Booking_Passenger_ID) AS Number_Of_Bookings
FROM Passenger P
INNER JOIN Booking B ON P.Passenger_ID = B.Booking_Passenger_ID
LEFT JOIN Trip T ON P.Passenger_ID = T.Trip_Passenger_ID
WHERE T.Trip_ID IS NULL
GROUP BY P.Passenger_ID, P.Name, P.Contact_Number
ORDER BY Number_Of_Bookings DESC;

-- 7. Find the average rating by driver age group:
SELECT 
    CASE 
        WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) < 25 THEN 'Under 25'
        WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) BETWEEN 25 AND 35 THEN '25-35'
        WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) BETWEEN 36 AND 45 THEN '36-45'
        ELSE 'Over 45'
    END AS Age_Group,
    ROUND(AVG(Rating), 2) AS Average_Rating,
    COUNT(*) AS Driver_Count
FROM Drivers
GROUP BY Age_Group
ORDER BY Age_Group;

-- 8. Find the most popular car model among drivers:
SELECT v.Car_Model, COUNT(*) AS Driver_Count
FROM Drivers d
JOIN Vehicle v ON d.Driver_Car_No = v.Car_No
GROUP BY v.Car_Model
ORDER BY Driver_Count DESC
LIMIT 5;

-- Update some passengers to have the same pickup location
UPDATE Passenger SET Pickup_Location = '123 Main Street' WHERE Passenger_ID IN (5312345678, 5423456789, 5534567890);
UPDATE Passenger SET Pickup_Location = '456 Oak Avenue' WHERE Passenger_ID IN (5645678901, 5756789012, 5867890123);
UPDATE Passenger SET Pickup_Location = '789 Pine Boulevard' WHERE Passenger_ID IN (5978901234, 6089012345, 6190123456);
UPDATE Passenger SET Pickup_Location = '27257 Michigan Circle' WHERE Passenger_ID IN (317155210, 4301542876, 4452987631);
UPDATE Passenger SET Pickup_Location = '0 American Circle' WHERE Passenger_ID IN (388722827, 4503216789, 4654321098);

-- 9. Find pickup locations with multiple passengers and list those passengers
SELECT 
    p.Pickup_Location,
    COUNT(*) AS Passenger_Count,
    GROUP_CONCAT(p.Name ORDER BY p.Name SEPARATOR ', ') AS Passenger_Names
FROM 
    Passenger p
WHERE 
    p.Pickup_Location IS NOT NULL
GROUP BY 
    p.Pickup_Location
HAVING 
    COUNT(*) > 1
ORDER BY 
    Passenger_Count DESC, p.Pickup_Location;
    
-- 10. Group passengers by age range
SELECT 
    CASE 
        WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) < 20 THEN 'Under 20'
        WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) BETWEEN 20 AND 25 THEN '20-25'
        WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) BETWEEN 26 AND 30 THEN '26-30'
        WHEN YEAR(CURRENT_DATE) - YEAR(Date_of_Birth) BETWEEN 31 AND 40 THEN '31-40'
        ELSE 'Over 40'
    END AS Age_Group,
    COUNT(*) AS Passenger_Count
FROM 
    Passenger
GROUP BY 
    Age_Group
ORDER BY 
    CASE 
        WHEN Age_Group = 'Under 20' THEN 1
        WHEN Age_Group = '20-25' THEN 2
        WHEN Age_Group = '26-30' THEN 3
        WHEN Age_Group = '31-40' THEN 4
        ELSE 5
    END;
    
    
-- 11. Group passengers by birth month to analyze seasonal patterns
SELECT 
    MONTH(Date_of_Birth) AS Birth_Month,
    MONTHNAME(Date_of_Birth) AS Month_Name,
    COUNT(*) AS Passenger_Count
FROM 
    Passenger
GROUP BY 
    Birth_Month, Month_Name
ORDER BY 
    Birth_Month;
    
-- 12. Find passengers whose pickup location doesn't match their stored location in the passenger table
SELECT 
    p.Passenger_ID, 
    p.Name, 
    p.Pickup_Location AS Stored_Location,
    b.Pickup_Location AS Booking_Location
FROM 
    Passenger p
JOIN 
    Booking b ON p.Passenger_ID = b.Booking_Passenger_ID
WHERE 
    p.Pickup_Location IS NOT NULL 
    AND b.Pickup_Location IS NOT NULL
    AND p.Pickup_Location != b.Pickup_Location
ORDER BY 
    p.Name;



