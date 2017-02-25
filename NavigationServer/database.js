/**
 * Created by benra on 29/12/2016.
 */
var constants = require('./constants');

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

database.prototype.getObservationsBetweenDates = function(obtype, start_date, end_date, callback) {
    mysqlpool.getConnection(function(err, connection) {
        if(err) {
            return callback(err);
        }

        connection.query('select * from ' + obtype + ' WHERE observation_date > ? AND observation_date < ?', [start_date, end_date], function(err, results) {
            connection.release();

            if(err) return callback(err);

            return callback(null, results);
        });
    });
};

database.prototype.getObservationsAfterPeriod = function(obtype, period, callback) {
    var time_statement = "";

    if(period == "last30min") {
        time_statement = "DATE_SUB(NOW(), INTERVAL 30 MINUTE)";
    } else {
        return callback(new Error("Time period provided is not permitted"));
    }

    mysqlpool.getConnection(function(err, connection) {
        if(err) {
            return callback(err);
        }

        connection.query('select * from ' + obtype + ' WHERE observation_date > '+time_statement, [], function(err, results) {
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

database.prototype.getObservationTrainingData = function(train_start_date, train_end_date, train_lat, train_lng, callback) {
    var params =
        {   lat : train_lat,
            lng: train_lng,
            start_date: train_start_date,
            end_date: train_end_date,
            distance_limit: 0.1
        };

    const callback_target = 5;
    var callback_count = 0;
    var results_list = {};

    var observation_callback = function(err, results, table_name) {
        if(err) { return callback(err); }

        results_list[table_name] = results;

        callback_count++;

        if(callback_count == callback_target) {
            callback(null, results_list);
        }
    };

    getObservationTrainingData("1","hotspot_observations", 1000, params, observation_callback);
    getObservationTrainingData("AVG(bluetooth_count)","bluetooth_observations", 1000, params, observation_callback);
    getObservationTrainingData("1","crowd_observations", 1000, params, observation_callback);
    getObservationTrainingData("1","accelerometer_observations", 1000, params, observation_callback);
    getObservationTrainingData("1","audio_observations", 1000, params, observation_callback);

};

function getObservationTrainingData(field, table_name, limit, params, callback) {
    const lat = params.lat;
    const lng = params.lng;
    const start_date = params.start_date;
    const end_date = params.end_date;
    const distance_limit = params.distance_limit;

    var pre_query = "SET sql_mode = ''; ";

    var query =
        " SELECT " + field + ", " + distance_subquery + ", " +
        " DATE_FORMAT(observation_date, '%Y-%m-%d %H:%i') as minute_group" +
        " FROM " + table_name +
        " GROUP BY (MINUTE(observation_date)) ";

    var vals = [lat, lng, lat];

    makeQueryWithCallback(pre_query + query, vals, function(err, results) {
        if (err) {
            return callback(query);
        }

        return callback(null, results, table_name);
    });
}

database.prototype.getOccupancyEstimation = function(apitoken, lat, lng, callback) {

    const LAST_HOUR = "DATE_SUB(NOW(), INTERVAL 1 HOUR)";
    const LAST_15_MIN = "DATE_SUB(NOW(), INTERVAL 15 MINUTE)";

    var params = {lat: lat, lng: lng, since_date: LAST_15_MIN, distance_limit: 0.01, limit: 1000};

    /* Count individual hotspots within 0.1 miles */
    queryObservationsFromLatLng(params, "DISTINCT idHotspot", "hotspot_observations NATURAL JOIN hotspots", function(err, results) {
        if (err) {
            return callback(err);
        }

        return callback(null, constants.TOTAL_HOTSPOTS, results.length);
    });

    /* Average bluetooth count within 0.1 miles */
    queryObservationsFromLatLng(params, "MAX(bluetooth_count)", "bluetooth_observations", function(err, results) {
        if (err) {
            return callback(err);
        }

        return callback(null, constants.MAX_BLUETOOTH_COUNT, results[0]["MAX(bluetooth_count)"]);
    });


    /* Get number of readings from user devices back */
    queryObservationsFromLatLng(params, "COUNT(*)", "hotspot_observations", function(err, results) {
        if (err) {
            return callback(err);
        }

        return callback(null, constants.HOTSPOT_OBSERVATIONS, results[0]["COUNT(*)"]);
    });

    /* Get number of readings from user devices back */
    queryObservationsFromLatLng(params, "COUNT(*)", "audio_observations", function(err, results) {
        if (err) {
            return callback(err);
        }

        return callback(null, constants.AUDIO_OBSERVATIONS, results[0]["COUNT(*)"]);
    });

    /* Get number of readings from user devices back */
    queryObservationsFromLatLng(params, "COUNT(*)", "crowd_observations", function(err, results) {
        if (err) {
            return callback(err);
        }

        return callback(null, constants.CROWD_OBSERVATIONS, results[0]["COUNT(*)"]);
    });

    /* Get number of readings from user devices back */
    queryObservationsFromLatLng(params, "COUNT(*)", "bluetooth_observations", function(err, results) {
        if (err) {
            return callback(err);
        }

        return callback(null, constants.BLUETOOTH_OBSERVATIONS, results[0]["COUNT(*)"]);
    });


    /* Gather audio histogram statistics for prediction */
    var newParams = JSON.parse(JSON.stringify(params));  //TODO: can this be done better? quick implementation of deep copy
    newParams.limit = 5;
    queryObservationsFromLatLng(newParams, "audio_histogram", "audio_observations", function(err, results) {
        if (err) {
            return callback(err);
        }

        const audio_histogram_debug_log = false;

        var output = 0;
        var count = 0;

        if( results.length != 0) {
            for(var sql_result_id in results) {

                if(audio_histogram_debug_log) console.log("on sql_result_id " + sql_result_id);

                var audio_histogram = JSON.parse(results[sql_result_id]['audio_histogram']);

                for(var hist_index in audio_histogram) {

                    var single_hist = audio_histogram[hist_index];

                    if(audio_histogram_debug_log) console.log("Got single_hist " + single_hist);

                    for(var bin_index in single_hist) {

                        var bin_val = single_hist[bin_index];

                        if(audio_histogram_debug_log) console.log("bin_index " + bin_index + " has val " + bin_val);

                        output += bin_val;

                        count++;

                    }

                }
            }

        }

        output /= count;

        return callback(null, constants.AUDIO_HISTOGRAM_ANALYSIS, output);
    });


    /* Gather accelerometer statistics for prediction */
    queryObservationsFromLatLng(params, "AVG(occupancy_estimate)", "crowd_observations", function(err, results) {
        if (err) {
            return callback(err);
        }

        return callback(null, constants.CROWD_AVERAGE_ESTIMATE, results[0]["AVG(occupancy_estimate)"]);
    });

};


const distance_subquery =
    " ( 3959" +
    " * acos( cos( radians( ? ) )" +
    " * cos( radians( lat ) )" +
    " * cos( radians( lng )" +
    " - radians( ? ) )" +
    " + sin( radians( ? ) )" +
    " * sin( radians( lat ) ) ) )" +
    " AS distance ";


function queryObservationsFromLatLng(params, field_name, table_name, callback) {
    const lat = params.lat;
    const lng = params.lng;
    const since_date = params.since_date;
    const distance_limit = params.distance_limit;
    const limit = params.limit;

    var query_1 =
        "SELECT " + field_name +
        " FROM (";

    var query_2 =
        " SELECT *, " + distance_subquery +
        " FROM " + table_name +
        " WHERE observation_date > " + since_date +
        " HAVING distance < " + distance_limit +
        " ORDER BY observation_date DESC" +
        " LIMIT " + limit;

    var query_3 =
        ") AS t2";

    var vals = [lat, lng, lat];

    makeQueryWithCallback(query_1+query_2+query_3, vals, function(err, results) {
        if (err) {
            return callback(err);
        }

        return callback(null, results);
    });
}

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