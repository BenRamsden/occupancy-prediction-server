/**
 * Created by benra on 29/12/2016.
 */
var constants = require('./constants');

var mysql = require('mysql');

var os = require('os');

if(os.platform() == 'win32') {
    //Assume running remotely on non_aws server
    var mysqlpool = mysql.createPool({
        connectionLimit: 50,
        host: '54.154.109.216',
        port: '3306',
        user: 'navigation_remote',
        password: 'gibsonXC40_99546',
        database: 'NavigationDB'
    });

    console.log("Loaded remote mysqlpool, os platform: " + os.platform());
} else {
    //Assume running locally to mysql database on my AWS server
    var mysqlpool = mysql.createPool({
        connectionLimit: 50,
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: 'gibsonXC40',
        database: 'NavigationDB'
    });

    console.log("Loaded local mysqlpool, os platform: " + os.platform());
}

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

database.prototype.getObservationData = function(train_start_date, train_end_date, train_lat, train_lng, callback) {
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

    queryObservationData("COUNT(DISTINCT idHotspot)","hotspot_observations", 1000, params, observation_callback);
    queryObservationData("AVG(bluetooth_count)","bluetooth_observations", 1000, params, observation_callback);
    queryObservationData("AVG(occupancy_estimate)","crowd_observations", 1000, params, observation_callback);
    queryObservationData("acceleration_timeline","accelerometer_observations", 1000, params, observation_callback);
    queryObservationData("audio_histogram","audio_observations", 1000, params, observation_callback);

};


database.prototype.getObservationDataNoLocation = function(train_start_date, train_end_date, callback) {
    var params =
        {
            start_date: train_start_date,
            end_date: train_end_date
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

    queryObservationData("COUNT(DISTINCT idHotspot)","hotspot_observations", 1000, params, observation_callback);
    queryObservationData("AVG(bluetooth_count)","bluetooth_observations", 1000, params, observation_callback);
    queryObservationData("AVG(occupancy_estimate)","crowd_observations", 1000, params, observation_callback);
    queryObservationData("acceleration_timeline","accelerometer_observations", 1000, params, observation_callback);
    queryObservationData("audio_histogram","audio_observations", 1000, params, observation_callback);

};

function queryObservationData(field, table_name, limit, params, callback) {
    const lat = params.lat;
    const lng = params.lng;
    const distance_limit = params.distance_limit;

    const start_date = params.start_date;
    const end_date = params.end_date;

    var query_mode = "allparams";

    if(!lat && !lng && !distance_limit) {

        if(start_date && end_date) {
            query_mode = "justdate";
        } else {
            return callback("MISSING_PARAMS");
        }

    }

    var query, vals;

    if(query_mode == "allparams") {
        query =
            " SELECT " + field + ", " + distance_subquery + ", " +
            " DATE_FORMAT(observation_date, '%Y-%m-%d %H:%i') as minute_group" +
            " FROM " + table_name +
            " WHERE observation_date > " + start_date +
            " AND observation_date < " + end_date +
            " GROUP BY (minute_group) " +
            " HAVING distance < " + distance_limit +
            " ORDER BY observation_date ASC" +
            " LIMIT " + limit;


        vals = [lat, lng, lat];
    } else {
        query =
            " SELECT " + field + ", " +
            " DATE_FORMAT(observation_date, '%Y-%m-%d %H:%i') as minute_group" +
            " FROM " + table_name +
            " WHERE observation_date > " + start_date +
            " AND observation_date < " + end_date +
            " GROUP BY (minute_group) " +
            " ORDER BY observation_date ASC" +
            " LIMIT " + limit;

        vals = [];
    }

    makeQueryWithCallback(query, vals, function(err, results) {
        if (err) {
            return callback(query);
        }

        return callback(null, results, table_name);
    });
}

const distance_subquery =
    " ( 3959" +
    " * acos( cos( radians( ? ) )" +
    " * cos( radians( lat ) )" +
    " * cos( radians( lng )" +
    " - radians( ? ) )" +
    " + sin( radians( ? ) )" +
    " * sin( radians( lat ) ) ) )" +
    " AS distance ";

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



database.prototype.getDistinctHotspots = function(start_date, end_date, lat, lng, callback) {

    const distance_limit = 0.01;

    const field_name = "COUNT(DISTINCT idHotspot)";

    var query =
        " SELECT " + field_name + ", " +

        " ( 3959" +
        " * acos( cos( radians( ? ) )" +  //lat
        " * cos( radians( lat ) )" +
        " * cos( radians( lng )" +
        " - radians( ? ) )" +             //lng
        " + sin( radians( ? ) )" +        //lat
        " * sin( radians( lat ) ) ) )" +
        " AS distance " +

        " FROM hotspot_observations " +
        " WHERE observation_date > ? " +  //start_date
        " AND observation_date < ? " +    //end_date
        " HAVING distance < ? ";          //distance_limit

    var vals = [lat, lng, lat, start_date, end_date, distance_limit];

    makeQueryWithCallback(query, vals, function(err, results) {
        if (err) {
            return callback(query);
        }

        if(typeof results[0] == 'undefined') {
            return callback(null, 0);
        }

        return callback(null, results[0][field_name]);
    });

};

database.prototype.getMaxBluetoothCount = function(start_date, end_date, lat, lng, callback) {

    const distance_limit = 0.01;

    const field_name = "MAX(bluetooth_count)";

    var query =
        " SELECT " + field_name + ", " +

        " ( 3959" +
        " * acos( cos( radians( ? ) )" +  //lat
        " * cos( radians( lat ) )" +
        " * cos( radians( lng )" +
        " - radians( ? ) )" +             //lng
        " + sin( radians( ? ) )" +        //lat
        " * sin( radians( lat ) ) ) )" +
        " AS distance " +

        " FROM bluetooth_observations " +
        " WHERE observation_date > ? " +  //start_date
        " AND observation_date < ? " +    //end_date
        " HAVING distance < ? ";          //distance_limit

    var vals = [lat, lng, lat, start_date, end_date, distance_limit];

    makeQueryWithCallback(query, vals, function(err, results) {
        if (err) {
            return callback(query);
        }

        if(typeof results[0] == 'undefined') {
            return callback(null, 0);
        }

        return callback(null, results[0][field_name]);
    });
};

database.prototype.getAudioHistogramAverage = function(start_date, end_date, lat, lng, callback) {

    const distance_limit = 0.01;

    const field_name = "audio_histogram";

    var query =
        " SELECT " + field_name + ", " +

        " ( 3959" +
        " * acos( cos( radians( ? ) )" +  //lat
        " * cos( radians( lat ) )" +
        " * cos( radians( lng )" +
        " - radians( ? ) )" +             //lng
        " + sin( radians( ? ) )" +        //lat
        " * sin( radians( lat ) ) ) )" +
        " AS distance " +

        " FROM audio_observations " +
        " WHERE observation_date > ? " +  //start_date
        " AND observation_date < ? " +    //end_date
        " HAVING distance < ? ";          //distance_limit

    var vals = [lat, lng, lat, start_date, end_date, distance_limit];

    makeQueryWithCallback(query, vals, function(err, results) {
        if (err) {
            return callback(query);
        }

        if(typeof results[0] == 'undefined') {
            return callback(null, 0);
        }

        var audio_histogram_results = JSON.parse(results[0][field_name]);
        var total = 0;
        var count = 0;

        for(arrindex in audio_histogram_results) {
            for(arrindex2 in audio_histogram_results[arrindex]) {
                total += audio_histogram_results[arrindex][arrindex2];
                count++;
            }
        }

        if(count > 0) {
            total = total / count;
        }

        return callback(null, total);
    });
};

database.prototype.getAverageCrowdEstimate = function(start_date, end_date, lat, lng, callback) {

    const distance_limit = 0.01;

    const field_name = "AVG(occupancy_estimate)";

    var query =
        " SELECT " + field_name + ", " +

        " ( 3959" +
        " * acos( cos( radians( ? ) )" +  //lat
        " * cos( radians( lat ) )" +
        " * cos( radians( lng )" +
        " - radians( ? ) )" +             //lng
        " + sin( radians( ? ) )" +        //lat
        " * sin( radians( lat ) ) ) )" +
        " AS distance " +

        " FROM crowd_observations " +
        " WHERE observation_date > ? " +  //start_date
        " AND observation_date < ? " +    //end_date
        " HAVING distance < ? ";          //distance_limit

    var vals = [lat, lng, lat, start_date, end_date, distance_limit];

    makeQueryWithCallback(query, vals, function(err, results) {
        if (err) {
            return callback(query);
        }

        if(typeof results[0] == 'undefined') {
            return callback(null, 0);
        }

        return callback(null, results[0][field_name]);
    });
};



module.exports = database;