/* RESETS NavigationDB */
DROP DATABASE IF EXISTS NavigationDB;
CREATE DATABASE NavigationDB;
USE NavigationDB;


/*	
	users table
	Stores user authentication information for login
	Requires user personal details in order for user to register
*/
CREATE TABLE users (
	idUser INT(32) UNSIGNED NOT NULL AUTO_INCREMENT,
    
    username VARCHAR(32) NOT NULL,
    password VARCHAR(32) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    register_date DATETIME NOT NULL,
    api_token VARCHAR(101) NOT NULL,
    
    PRIMARY KEY (idUser)
);

INSERT INTO users (username, password, full_name, email_address, register_date, api_token) VALUES ('benadmin','benadminpass','Ben Dissertation','ben@dissertation.com',NOW(),'koH6a1UC71rTDM1LKppXeKYJ54cjc8nIfuJAKPly1GDYpjMMLLCuK5LBp3fXAEkCcID1jCh5pCQp9D8DmCWhJHQlLcUcy4gD68Qy');

/*
	hotspots table
	Each time a new hotspot (of new mac) is observed it is inserted
    Referenced any time data is collected in relation to a hotspot    
*/
CREATE TABLE hotspots (
	idHotspot INT(32) UNSIGNED NOT NULL AUTO_INCREMENT,
    
    ssid VARCHAR(32) UNIQUE NOT NULL,
    mac VARCHAR(32) UNIQUE NOT NULL,
    frequency INT(32) UNIQUE NOT NULL,

    PRIMARY KEY (idHotspot)
);


/*
	hotspot_observations table
    Logs the position and number of people connected when the app collects hotspot data
	Combined lat and lng can be used to map the area a specific hotspot covers
    MAX(observation_date) can be used to stop users submitting locations too frequently
*/
CREATE TABLE hotspot_observations (
	idHotspotObservation INT(32) UNSIGNED NOT NULL AUTO_INCREMENT,
    idHotspot INT(32) UNSIGNED NOT NULL,
    idUser INT(32) UNSIGNED NOT NULL,
    
	lat FLOAT(10, 6) NOT NULL,
	lng FLOAT(10, 6) NOT NULL,
    
    signal_level INT(32) NOT NULL,
    observation_date DATETIME NOT NULL,
    
    PRIMARY KEY (idHotspotObservation),
    
    INDEX (idHotspot),
	FOREIGN KEY (idHotspot) REFERENCES hotspots(idHotspot) ON DELETE CASCADE,
        
    INDEX (idUser),
	FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
);


/*
	audio_observations table
    Logs the audio information and position when the app collects audio data
    
    HISTOGRAM STRUCTURE
    {{"lo":"0","hi":"499","vl":"45.9"},{"lo":"500","hi":"999","vl":"34.3"}}audio_observations
*/
CREATE TABLE audio_observations (
	idAudioObservation INT(32) UNSIGNED NOT NULL AUTO_INCREMENT,
	idUser INT(32) UNSIGNED NOT NULL,

	lat FLOAT(10, 6) NOT NULL,
	lng FLOAT(10, 6) NOT NULL,
    
    audio_histogram JSON NOT NULL,
    observation_date DATETIME NOT NULL,
    
	PRIMARY KEY (idAudioObservation),
    
	INDEX (idUser),
	FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
);

/*
	crowd_observations table
    Logs the user input when a user is prompted for an approximate number of people
    at the current venue they are in
*/

CREATE TABLE crowd_observations (
	idCrowdObservation INT(32) UNSIGNED NOT NULL AUTO_INCREMENT,
    idUser INT(32) UNSIGNED NOT NULL,
    
	lat FLOAT(10, 6) NOT NULL,
	lng FLOAT(10, 6) NOT NULL,
    
    occupancy_estimate INT(32) UNSIGNED NOT NULL,
    observation_date DATETIME NOT NULL,
    
    PRIMARY KEY (idCrowdObservation),

	INDEX (idUser),
   	FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
);


/*
	bluetooth_observations table
    Logs the data provided by the client device counting bluetooth
    devices in the local area
*/

CREATE TABLE bluetooth_observations (
	idBluetoothObservation INT(32) UNSIGNED NOT NULL AUTO_INCREMENT,
    idUser INT(32) UNSIGNED NOT NULL,
    
	lat FLOAT(10, 6) NOT NULL,
	lng FLOAT(10, 6) NOT NULL,
    
    bluetooth_count INT(32) UNSIGNED NOT NULL,
    observation_date DATETIME NOT NULL,
    
    PRIMARY KEY (idBluetoothObservation),

	INDEX (idUser),
   	FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
);


/*
	accelerometer_observations table
    Logs the data provided by the client device counting bluetooth
    devices in the local area
*/

CREATE TABLE accelerometer_observations (
	idAccelerometerObservation INT(32) UNSIGNED NOT NULL AUTO_INCREMENT,
    idUser INT(32) UNSIGNED NOT NULL,
    
	lat FLOAT(10, 6) NOT NULL,
	lng FLOAT(10, 6) NOT NULL,
    
    acceleration_timeline JSON NOT NULL,
    observation_date DATETIME NOT NULL,
    
    PRIMARY KEY (idAccelerometerObservation),

	INDEX (idUser),
   	FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
);