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

var makeQueryWithCallback = function(query, vals, callback) {
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

var insertHotspotObservation = function(idUser, idHotspot, params, callback) {
    var query = "INSERT INTO hotspot_observations" +
        " (idHotspotObservation,idHotspot,idUser,lat,lng,signal_level,observation_date)" +
        " VALUES (DEFAULT, ?, ?, ?, ?, ?, ?)";

    var vals = [idHotspot, idUser, params.lat, params.lng, params.signal_level, params.observation_date];

    makeQueryWithCallback(query, vals, callback);

    console.log("HotspotObservations: Inserted new hotspot observation with idHotspot " + idHotspot);
};

database.prototype.insertHotspotObservation = function(idUser, params, callback) {

    var query_0 = "SELECT idHotspot FROM hotspots" +
        " WHERE ssid=? AND mac=?";

    var vals_0 = [params.ssid, params.mac, params.frequency];

    makeQueryWithCallback(query_0, vals_0, function(err, results) {
        if(err) {
            return callback(err);
        }

        if(results.length > 0) {

            console.log("Hotspot: Matched existing hotspot with idHotspot " + results[0].idHotspot);

            /* Use existing idHotspot, this hotspot has been seen before */
            insertHotspotObservation(idUser, results[0].idHotspot, params, callback);

        } else {

            /* Make a new entry into hotspots, this router has not been seen before */
            var query_1 = "INSERT INTO hotspots" +
                " (idHotspot,ssid,mac,frequency)" +
                " VALUES (DEFAULT, ?, ?, ?)";

            var vals_1 = [params.ssid, params.mac, params.frequency];

            makeQueryWithCallback(query_1, vals_1, function(err, results) {
                if(err) {
                    return callback(err);
                }

                console.log("Hotspot: Inserted new hotspot with idHotspot " + results.insertId);

                if(typeof results.insertId == "undefined") {
                    return callback(new Error("Could not do hotspot_observations insert because insert into hotspots did not return insertId"));
                }

                insertHotspotObservation(idUser, results.insertId, params, callback);

            });

        }

    });

};

database.prototype.getOccupancyEstimation = function(apitoken, lat, lng, callback) {
    var results_collection = {};

    //var example = "SELECT id, ( 3959 * acos( cos( radians(37) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(-122) ) + sin( radians(37) ) * sin( radians( lat ) ) ) ) AS distance FROM markers HAVING distance < 25 ORDER BY distance LIMIT 0 , 20;";

    var query_0 = "SELECT idHotspotObservation ," +
        " ( 3959" +
        " * acos( cos( radians( ? ) )" +
        " * cos( radians( lat ) )" +
        " * cos( radians( lng )" +
        " - radians( ? ) )" +
        " + sin( radians( ? ) )" +
        " * sin( radians( lat ) ) ) )" +
        " AS distance FROM hotspot_observations";

    var vals_0 = [lat, lng, lat];

    makeQueryWithCallback(query_0, vals_0, function(err, results) {
        if (err) {
            return callback(err);
        }

        callback(null, results);
    });

};

database.prototype.insertAudioObservation = function(idUser, params, callback) {

    var query = "INSERT INTO audio_observations" +
                " (idAudioObservation,idUser,lat,lng,audio_histogram,observation_date)" +
                " VALUES (DEFAULT, ?, ?, ?, ?, ?)";

    var vals = [idUser, params.lat, params.lng, JSON.stringify(params.audio_histogram), params.observation_date];

    makeQueryWithCallback(query, vals, callback);

};

database.prototype.insertCrowdObservation = function(idUser, params, callback) {

    var query = "INSERT INTO crowd_observations" +
                " (idCrowdObservation,idUser,lat,lng,occupancy_estimate,observation_date)" +
                " VALUES (DEFAULT, ?, ?, ?, ?, ?)";

    var vals = [idUser, params.lat, params.lng, params.occupancy_estimate, params.observation_date];

    makeQueryWithCallback(query, vals, callback);

};

database.prototype.insertBluetoothObservation = function(idUser, params, callback) {

    var query = "INSERT INTO bluetooth_observations" +
                " (idBluetoothObservation,idUser,lat,lng,bluetooth_count,observation_date)" +
                " VALUES (DEFAULT, ?, ?, ?, ?, ?)";

    var vals = [idUser, params.lat, params.lng, params.bluetooth_count, params.observation_date];

    makeQueryWithCallback(query, vals, callback);

};

database.prototype.insertAccelerometerObservation = function(idUser, params, callback) {

    var query = "INSERT INTO accelerometer_observations" +
                " (idAccelerometerObservation,idUser,lat,lng,acceleration_timeline,observation_date)" +
                " VALUES (DEFAULT, ?, ?, ?, ?, ?)";

    var vals = [idUser, params.lat, params.lng, JSON.stringify(params.acceleration_timeline), params.observation_date];

    makeQueryWithCallback(query, vals, callback);

};

module.exports = database;