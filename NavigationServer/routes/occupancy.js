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
var NO_DATES = "NO_DATES";

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

    var start_date = new Date(req.body.start_date);
    var end_date = new Date(req.body.end_date);

    predictOccupancy(start_date,end_date,lat,lng,"single_call",function(err, ref_name, occupancy) {
        res.json({success: true, occupancy: occupancy});
    });

});

function predictOccupancy(start_date, end_date, lat, lng, ref_name, callback) {

    //console.log("predictOccupancy " + start_date + " " + end_date + " " + lat + " " + lng);

    const callback_target = 4;
    var callback_count = 0;

    var results = {};

    var my_callback = function(val_name, result) {
        //console.log(val_name + " " + result);

        results[val_name] = result;

        callback_count++;

        if(callback_count == callback_target) {
            var blue_audio;
            var limited_audio = Math.min(results["audio_average"], 1.5); //prevent super loud audio skewing results

            if(results["max_bluetooth"] > 0 && results["audio_average"] > 0) {
                blue_audio = ( 1 * results["max_bluetooth"]) * ( 5 * limited_audio);
            } else {
                blue_audio = ( 1 * results["max_bluetooth"]) + ( 5 * limited_audio);
            }

            var occupancy;

            if(results["avg_crowd_estimate"] > 0) {
                occupancy =
                    0.6 * blue_audio +
                    0.1 * results["distinct_hotspots"] +
                    0.3 * results["avg_crowd_estimate"];
            } else {
                occupancy =
                    0.9 * blue_audio +
                    0.1 * results["distinct_hotspots"];
            }

            if(occupancy > 0.1) {
                console.log("Calculating Occupancy for ref_name: " + ref_name +  "\n" +
                    "lat: " + lat + " lng: " + lng + "\n" +
                    "max_bluetooth: " + results["max_bluetooth"] + "\n" +
                    "audio_average: " + results["audio_average"] + "\n" +
                    "distinct_hotspots: " + results["distinct_hotspots"] + "\n" +
                    "avg_crowd_estimate: " + results["avg_crowd_estimate"] + "\n" +
                    "OUTPUT OCCUPANCY: " + occupancy + "\n");
            }


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

router.post('/bulk', function(req, res, next) {
    var lat_lng_list = req.body.lat_lng_list;

    if(!lat_lng_list) {
        return handleError(res, NO_LAT+NO_LNG);
    }

    if(!req.body.start_date || !req.body.end_date) {
        return handleError(res, NO_DATES);
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

        predictOccupancy(start_date,end_date,lat,lng,lat_lng_index,function(err, ref_name, occupancy) {
            callback_count++;

            lat_lng_list[ref_name]['occupancy'] = occupancy;

            if(callback_count == callback_target) {
                res.json({success: true, lat_lng_occupancy_list : lat_lng_list});
            }

        });

    }

});

module.exports = router;