/**
 * Created by ben on 19/02/2017.
 */
var express = require('express');
var router = express.Router();

var handleError = require('../handleError');
var database = require('../database');
var constants = require('../constants');

const NO_LAT = "NO_LAT";
const NO_LNG = "NO_LNG";
const NO_START_DATE = "NO_START_DATE";
const NO_END_DATE = "NO_END_DATE";
const NO_DATES = "NO_DATES";

const AUDIO_AVERAGE = "audio_average";
const MAX_BLUETOOTH = "max_bluetooth";
const DISTINCT_HOTSPOTS = "distinct_hotspots";
const AVERAGE_CROWD_ESTIMATE = "avg_crowd_estimate";

router.post('', function(req, res, next) {
    var lat = req.body.lat;

    if(!lat) {
        return handleError(res, NO_LAT);
    }

    var lng = req.body.lng;

    if(!lng) {
        return handleError(res, NO_LNG);
    }

    if(!req.body.start_date || !req.body.end_date) {
        return handleError(res, NO_DATES);
    }

    var options = getOptions(req);

    if(!options) {
        return handleError(res,"INVALID_OPTIONS");
    }

    var start_date = new Date(req.body.start_date);
    var end_date = new Date(req.body.end_date);

    predictOccupancy(start_date,end_date,lat,lng,options,"single_call",function(err, ref_name, occupancy) {
        res.json({success: true, occupancy: occupancy});
    });

});

router.post('/bulk', function(req, res, next) {
    var lat_lng_list = req.body.lat_lng_list;

    if(!lat_lng_list) {
        return handleError(res, NO_LAT+NO_LNG);
    }

    if(!req.body.start_date || !req.body.end_date) {
        return handleError(res, NO_DATES);
    }

    var options = getOptions(req);

    if(!options) {
        return handleError(res,"INVALID_OPTIONS");
    }

    var start_date = new Date(req.body.start_date);
    var end_date = new Date(req.body.end_date);

    var callback_target = 0;
    for(lat_lng_index in lat_lng_list) {
        callback_target++;
    }

    var callback_count = 0;

    for(var lat_lng_index in lat_lng_list) {
        var lat = lat_lng_list[lat_lng_index].lat;
        var lng = lat_lng_list[lat_lng_index].lng;

        predictOccupancy(start_date,end_date,lat,lng,options,lat_lng_index,function(err, ref_name, occupancy) {
            callback_count++;

            lat_lng_list[ref_name]['occupancy'] = occupancy;

            if(callback_count == callback_target) {
                res.json({success: true, lat_lng_occupancy_list : lat_lng_list});
            }

        });

    }

});

function getOptions(req) {
    var crowd_enabled = req.body.crowd_enabled;
    var time_enabled = req.body.time_enabled;
    var live_enabled = req.body.live_enabled;

    if(typeof crowd_enabled != 'boolean' || typeof time_enabled != 'boolean' || typeof live_enabled != 'boolean') {
        return false;
    }

    var options = {crowd_enabled: crowd_enabled, time_enabled: time_enabled, live_enabled: live_enabled};
    return options;
}

function predictOccupancy(start_date, end_date, lat, lng, options, ref_name, callback) {

    //console.log("predictOccupancy " + start_date + " " + end_date + " " + lat + " " + lng);

    const crowd_enabled = options.crowd_enabled;
    const time_enabled = options.time_enabled;
    const live_enabled = options.live_enabled;

    const callback_target = 4;
    var callback_count = 0;

    var results = {};

    var my_callback = function(val_name, result) {
        //console.log(val_name + " " + result);

        results[val_name] = result;

        callback_count++;

        if(callback_count == callback_target) {

            //INIT VARIABLES
            var live_prediction = 0;
            var time_prediction = 0;
            var crowd_prediction = 0;
            var occupancy = {};

            //PREDICT USING LIVE
            if(live_enabled) {
                var limited_audio = Math.min(results[AUDIO_AVERAGE], 1.5); //prevent super loud audio skewing results

                if(results[MAX_BLUETOOTH] > 0 && results[AUDIO_AVERAGE] > 0) {
                    live_prediction = ( 1 * results[MAX_BLUETOOTH]) * ( 5 * limited_audio);
                } else {
                    live_prediction = ( 1 * results[MAX_BLUETOOTH]) + ( 5 * limited_audio);
                }
            }

            //PREDICT USING TIME
            if(time_enabled) {
                var max_minutes = 24 * 60;
                var mid_day = new Date(start_date).setHours(13,0,0,0);
                var current_date = new Date(start_date);
                var time_to_mid_day = Math.abs(mid_day - current_date) / 1000 / 60;
                var time_to_mid_day_norm = 1 - time_to_mid_day / max_minutes;
                time_prediction = Math.max(time_to_mid_day_norm - 0.6, 0) * results[DISTINCT_HOTSPOTS];
            }

            //PREDICT USING CROWD
            if(crowd_enabled) {
                crowd_prediction = results[AVERAGE_CROWD_ESTIMATE];
            }

            //CHECK IF DATA EXISTS
            var crowd_data = crowd_enabled && crowd_prediction > 0;
            var live_data = live_enabled && live_prediction > 0;
            var time_data = time_enabled && time_prediction > 0;

            //COUNT ACTIVE DATA TYPES
            var data_type_count = 0;
            if(crowd_data) data_type_count += 1;
            if(live_data) data_type_count += 1;
            if(time_data) data_type_count += 1;

            //GET INVERSE OF ACTIVE COUNT
            var average_ratio = 1;
            if(data_type_count > 0) {
                average_ratio = 1 / data_type_count;
            }

            //MAKE PREDICTION
            occupancy.prediction =
                average_ratio * live_prediction +
                average_ratio * time_prediction +
                average_ratio * crowd_prediction;

            //LOG SIGNIFICANT PREDICTION
            if(occupancy.prediction > 0.5) {
                console.log(
                    "\noccupancy.prediction " + occupancy.prediction +
                    "\nlive_data: " + live_data +
                    "\ncrowd_data: " + crowd_data +
                    "\ntime_data: " + time_data);
            }

            //INDICATE DATA TYPES USED
            occupancy.live_data = live_data;
            occupancy.crowd_data = crowd_data;
            occupancy.time_data = time_data;

            callback(null, ref_name, occupancy);
        }
    };

    database.prototype.getMaxBluetoothCount(start_date,end_date,lat,lng,function(err, result) {
        my_callback(MAX_BLUETOOTH, result);
    });

    database.prototype.getDistinctHotspots(start_date,end_date,lat,lng,function(err, result) {
        my_callback(DISTINCT_HOTSPOTS, result);
    });

    database.prototype.getAudioHistogramAverage(start_date,end_date,lat,lng, function(err, result) {
        my_callback(AUDIO_AVERAGE, result);
    });

    database.prototype.getAverageCrowdEstimate(start_date,end_date,lat,lng, function(err, result) {
        my_callback(AVERAGE_CROWD_ESTIMATE, result);
    });
}

router.post('/get_occupancy_data', function(req, res, next) {
    if(!req.body.start_date) {
        return handleError(res, NO_START_DATE);
    }

    var start_date = new Date(req.body.start_date).toISOString();

    if(!req.body.end_date) {
        return handleError(res, NO_END_DATE);
    }

    var end_date = new Date(req.body.end_date).toISOString();

    database.prototype.getObservationDataNoLocation("'"+start_date+"'", "'"+end_date+"'",
        function(err, results) {
            if(err) {
                return res.json({success: false, reason: err});
            }

            var training_data = extractTrainingData(results);

            console.log("getOccupancyDataNoLocation called with\nStart Date: " + start_date + "\nEnd Date: " + end_date + "\nGot Result Length: " + Object.keys(training_data).length);

            res.json({success: true, results: training_data});

        }
    );

});

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

module.exports = router;