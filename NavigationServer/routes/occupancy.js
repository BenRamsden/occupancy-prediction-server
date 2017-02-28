/**
 * Created by ben on 19/02/2017.
 */
var express = require('express');
var router = express.Router();

var handleError = require('../handleError');
var database = require('../database');
var constants = require('../constants');

var brain = require('brain');

var NO_LAT = "NO_LAT";
var NO_LNG = "NO_LNG";
var NO_START_DATE = "NO_START_DATE";
var NO_END_DATE = "NO_END_DATE";

router.post('', function(req, res, next) {
    var lat = req.body.lat;

    if(!lat) {
        return handleError(res, NO_LAT);
    }

    var lng = req.body.lng;

    if(!lng) {
        return handleError(res, NO_LNG);
    }

    var start_date = new Date();
    start_date.setMinutes( start_date.getMinutes() - 30 );
    var end_date = new Date();

    predictOccupancy(start_date,end_date,lat,lng,"single_call",function(err, ref_name, occupancy) {
        res.json({success: true, occupancy: occupancy});
    });

});

function predictOccupancy(start_date, end_date, lat, lng, ref_name, callback) {
    const callback_target = 4;
    var callback_count = 0;

    var results = {};

    var my_callback = function(ref_name, result) {
        console.log(ref_name + " " + result);

        results[ref_name] = result;

        callback_count++;

        if(callback_count == callback_target) {
            var occupancy =
                ( 1 * results["max_bluetooth"] + 1) *
                ( 5 * results["audio_average"] + 1) +
                ( 0.1 * results["distinct_hotspots"]) +
                results["avg_crowd_estimate"];

            callback(null, ref_name, occupancy);
        }
    };

    database.prototype.getMaxBluetoothCount(start_date,end_date,lat,lng,function(err, result) {
        my_callback("max_bluetooth", result);
    });

    database.prototype.getDistinctHotspots(start_date,end_date,lat,lng,function(err, result) {
        my_callback("distinct_hotspots", result);
    });

    database.prototype.getAudioHistogramAverage(start_date,end_date,lat,lng, function(err, result) {
        my_callback("audio_average", result);
    });

    database.prototype.getAverageCrowdEstimate(start_date,end_date,lat,lng, function(err, result) {
        my_callback("avg_crowd_estimate", result);
    });
}

router.post('/get_occupancy_data', function(req, res, next) {
    var start_date = req.body.start_date;

    if(!start_date) {
        return handleError(res, NO_START_DATE);
    }

    var end_date = req.body.end_date;

    if(!end_date) {
        return handleError(res, NO_END_DATE);
    }

    getOccupancyDataNoLocation("'"+start_date+"'","'"+end_date+"'", function(err, results) {
        if(err) {
            return res.json({success: false, reason: err});
        }

        res.json({success: true, results: results});
    });

});

function getOccupancyDataNoLocation(start_date, end_date, callback) {
    database.prototype.getObservationTrainingDataNoLocation(start_date, end_date,
        function(err, results) {
            if(err) {
                callback(err);
            }

            var training_data = extractTrainingData(results);

            console.log("getOccupancyDataNoLocation called with\nStart Date: " + start_date + "\nEnd Date: " + end_date + "\nGot Result Length: " + Object.keys(training_data).length);

            callback(null, training_data);

        }
    );
}

function extractTrainingData(results) {
    var training_data = {};
    var observation;

    /***************
     * GATHERING TRAINING DATA
     ***************/

    for( arrindex in results['hotspot_observations'] ) {
        observation = results['hotspot_observations'][arrindex];

        var hotspot_id_count = observation['COUNT(DISTINCT idHotspot)'];
        var minute_group = observation['minute_group'];

        if(training_data[minute_group]) {
            training_data[minute_group].hotspot_id_count = hotspot_id_count;
        } else {
            training_data[minute_group] = {};
            training_data[minute_group].hotspot_id_count = hotspot_id_count;
        }
    }

    for( arrindex in results['bluetooth_observations'] ) {
        observation = results['bluetooth_observations'][arrindex];

        var avg_bluetooth_count = observation['AVG(bluetooth_count)'];
        var minute_group = observation['minute_group'];

        if(training_data[minute_group]) {
            training_data[minute_group].avg_bluetooth_count = avg_bluetooth_count;
        } else {
            training_data[minute_group] = {};
            training_data[minute_group].avg_bluetooth_count = avg_bluetooth_count;
        }
    }

    for( arrindex in results['crowd_observations'] ) {
        observation = results['crowd_observations'][arrindex];

        var avg_crowd_occupancy_estimate = observation['AVG(occupancy_estimate)'];
        var minute_group = observation['minute_group'];

        if(training_data[minute_group]) {
            training_data[minute_group].avg_crowd_occupancy_estimate = avg_crowd_occupancy_estimate;
        } else {
            training_data[minute_group] = {};
            training_data[minute_group].avg_crowd_occupancy_estimate = avg_crowd_occupancy_estimate;
        }
    }

    for( arrindex in results['accelerometer_observations'] ) {
        observation = results['accelerometer_observations'][arrindex];

        var acceleration_timeline = JSON.parse(observation['acceleration_timeline']);
        var minute_group = observation['minute_group'];

        var average = 0;
        var count = 0;

        for(arrindex2 in acceleration_timeline) {
            var sample = acceleration_timeline[arrindex2];
            average += sample[0] + sample[1] + sample[2];
            count++;
        }

        var acceleration_average = average / count;

        /* TODO: minute_groups will collide, as aggregation function has not being used
         * TODO: Should handle combining multiple data sets below */

        if(training_data[minute_group]) {
            training_data[minute_group].acceleration_average = acceleration_average;
        } else {
            training_data[minute_group] = {};
            training_data[minute_group].acceleration_average = acceleration_average;
        }
    }

    for( arrindex in results['audio_observations'] ) {
        observation = results['audio_observations'][arrindex];

        var audio_histograms = JSON.parse(observation['audio_histogram']);
        var minute_group = observation['minute_group'];

        var average = 0;
        var count = 0;

        for(arrindex2 in audio_histograms) {
            var audio_histogram = audio_histograms[arrindex2];
            var this_average = 0;
            var this_count = 0;

            for(arrindex3 in audio_histogram) {
                this_average += audio_histogram[arrindex3];
                this_count++;
            }

            average += this_average / this_count;
            count++;
        }

        var audio_average = average / count;

        /* TODO: minute_groups will collide, as aggregation function has not being used
         * TODO: Should handle combining multiple data sets below */

        if(training_data[minute_group]) {
            training_data[minute_group].audio_average = audio_average;
        } else {
            training_data[minute_group] = {};
            training_data[minute_group].audio_average = audio_average;
        }
    }

    return training_data;
}

router.post('/bulk', function(req, res, next) {
    var lat_lng_list = req.body.lat_lng_list;

    if(!lat_lng_list) {
        return handleError(res, NO_LAT+NO_LNG);
    }

    var start_date = new Date();
    start_date.setMinutes( start_date.getMinutes() - 30 );
    var end_date = new Date();

    var end_index = 0;
    for(lat_lng_index in lat_lng_list) {
        end_index++;
    }
    var current_index = 0;

    for(lat_lng_index in lat_lng_list) {
        var lat = lat_lng_list[lat_lng_index].lat;
        var lng = lat_lng_list[lat_lng_index].lng;

        predictOccupancy(start_date,end_date,lat,lng,lat_lng_index,function(err, ref_name, occupancy) {
            lat_lng_list[ref_name].occupancy = occupancy;
        });

        current_index++;

        if(current_index == end_index) {
            res.json({success: true, lat_lng_occupancy_list: lat_lng_list});
        }

    }

});

function getOccupancyEstimation(apitoken, lat, lng, callback) {
    var callback_count = 0;
    var callback_results = {};

    database.prototype.getOccupancyEstimation(apitoken, lat, lng, function(err, type, results) {
        if(err) {
            handleError(res, err);
        }

        callback_results[type] = results;

        callback_count++;

        if(callback_count == 8) {

            var occupancy =
                (1 * callback_results[constants.MAX_BLUETOOTH_COUNT] + 2) *
                (1 * callback_results[constants.AUDIO_HISTOGRAM_ANALYSIS] + 1) +
                (1 * callback_results[constants.CROWD_AVERAGE_ESTIMATE]);

            occupancy = occupancy;

            callback(callback_results, occupancy, lat, lng);
        }
    });
};

module.exports = router;