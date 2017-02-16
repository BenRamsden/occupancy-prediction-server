/**
 * Created by benra on 29/12/2016.
 */

var mysql = require('mysql');

var mysqlpool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'gibsonXC40',
    database: 'NavigationDB'
});

var database = function() {};

database.prototype.getObservations = function(idUser, obtype, callback) {
    mysqlpool.getConnection(function(err, connection) {
        if(err) {
            return callback(err);
        }

        connection.query('select * from ' + obtype + ' WHERE idUser = ?', [idUser], function(err, results) {
            connection.release();

            if(err) return callback(err);

            return callback(null, results);
        });
    });
};

database.prototype.getUserId = function(apitoken, callback) {
    mysqlpool.getConnection(function(err, connection) {
        if(err) {
            return callback(err);
        }

        connection.query('select idUser from users WHERE api_token = ?', [apitoken], function(err, results) {
            connection.release();

            if(err) return callback(err);

            if(results.length == 0) return callback(new Error("apitoken does not belong to a user"));

            return callback(null, results[0].idUser);
        });
    });
};

database.prototype.getHotspots = function(callback) {
    mysqlpool.getConnection(function(err, connection) {
        if (err) {
            return callback(err);
        }

        connection.query('select * from hotspots', function(err, results) {
            connection.release();

            if(err) return callback(err);

            return callback(null, results);
        });

    });
};

var makeInsertQueryWithCallback = function(query, vals, callback) {
    mysqlpool.getConnection(function(err, connection) {
        if (err) {
            return callback(err);
        }

        connection.query(query, vals, function(err, results) {
            connection.release();

            if(err) return callback(err);

            return callback(null, results);
        });

    });
};

database.prototype.insertHotspotObservation = function(idUser, params, callback) {

    var query_1 = "INSERT INTO hotspots" +
        " (idHotspot,ssid,mac,frequency)" +
        " VALUES (DEFAULT, ?, ?, ?)";

    var vals_1 = [params.ssid, params.mac, params.frequency];

    makeInsertQueryWithCallback(query_1, vals_1, function(err, results) {
        if(err) {
            return callback(err);
        }

        console.log("Insert hotspots got results:" + results.insertId);

        if(typeof results.insertId == "undefined") {
            return callback(new Error("Could not do hotspot_observations insert because insert into hotspots did not return insertId"));
        }

        var query_2 = "INSERT INTO hotspot_observations" +
            " (idHotspotObservation,idHotspot,idUser,lat,lng,signal_level,observation_date)" +
            " VALUES (DEFAULT, ?, ?, ?, ?, ?, ?)";

        var idHotspot = results.insertId;

        var vals_2 = [idHotspot,idUser, params.lat, params.lng, params.signal_level, params.observation_date];

        makeInsertQueryWithCallback(query_2, vals_2, callback);
    });

};

database.prototype.insertAudioObservation = function(idUser, params, callback) {

    var query = "INSERT INTO audio_observations" +
                " (idAudioObservation,idUser,lat,lng,audio_histogram,observation_date)" +
                " VALUES (DEFAULT, ?, ?, ?, ?, ?)";

    var vals = [idUser, params.lat, params.lng, JSON.stringify(params.audio_histogram), params.observation_date];

    makeInsertQueryWithCallback(query, vals, callback);

};

database.prototype.insertCrowdObservation = function(idUser, params, callback) {

    var query = "INSERT INTO crowd_observations" +
                " (idCrowdObservation,idUser,lat,lng,occupancy_estimate,observation_date)" +
                " VALUES (DEFAULT, ?, ?, ?, ?, ?)";

    var vals = [idUser, params.lat, params.lng, params.occupancy_estimate, params.observation_date];

    makeInsertQueryWithCallback(query, vals, callback);

};

database.prototype.insertBluetoothObservation = function(idUser, params, callback) {

    var query = "INSERT INTO bluetooth_observations" +
                " (idBluetoothObservation,idUser,lat,lng,bluetooth_count,observation_date)" +
                " VALUES (DEFAULT, ?, ?, ?, ?, ?)";

    var vals = [idUser, params.lat, params.lng, params.bluetooth_count, params.observation_date];

    makeInsertQueryWithCallback(query, vals, callback);

};

database.prototype.insertAccelerometerObservation = function(idUser, params, callback) {

    var query = "INSERT INTO accelerometer_observations" +
                " (idAccelerometerObservation,idUser,lat,lng,acceleration_timeline,observation_date)" +
                " VALUES (DEFAULT, ?, ?, ?, ?, ?)";

    var vals = [idUser, params.lat, params.lng, JSON.stringify(params.acceleration_timeline), params.observation_date];

    makeInsertQueryWithCallback(query, vals, callback);

};

module.exports = database;