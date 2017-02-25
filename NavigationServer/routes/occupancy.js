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

router.post('/neural', function(req, res, next) {
    const train_start_date = "'2017-02-24 13:53:00'";
    const train_end_date = "'2017-02-24 14:50:00'";
    const train_lat = "52.953018";
    const train_lng = "-1.184026";

    database.prototype.getObservationTrainingData(train_start_date, train_end_date, train_lat, train_lng,
        function(err, results) {
            if(err) {
                res.json({success: false, reason: err});
                return;
            }

            var training_data = {};
            var observation;

            for( arrindex in results['hotspot_observations'] ) {
                observation = results['hotspot_observations'][arrindex];

                var hotspot_id_count = observation['COUNT(idHotspotObservation)'];
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

                var acceleration_timeline = observation['acceleration_timeline'];
                var minute_group = observation['minute_group'];

                var average = 0;
                var count = 0;

                for(arrindex2 in acceleration_timeline) {
                    const sample = acceleration_timeline[arrindex2];
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

                var audio_histogram = observation['audio_histogram'];
                var minute_group = observation['minute_group'];

                /* TODO: minute_groups will collide, as aggregation function has not being used
                 * TODO: Should handle combining multiple data sets below */

                if(training_data[minute_group]) {
                    training_data[minute_group].audio_histogram = audio_histogram;
                } else {
                    training_data[minute_group] = {};
                    training_data[minute_group].audio_histogram = audio_histogram;
                }
            }

            res.json({success: true, training_data: training_data });
        }
    );

});

router.post('', function(req, res, next) {
    var apitoken = req.query.apitoken;

    if(!apitoken) {
        return handleError(res, NO_API_TOKEN);
    }

    var lat = req.body.lat;

    if(!lat) {
        return handleError(res, NO_LAT);
    }

    var lng = req.body.lng;

    if(!lng) {
        return handleError(res, NO_LNG);
    }

    getOccupancyEstimation(apitoken, lat, lng, function(results, occupancy, oc_lat, oc_lng) {
        res.json({success: true, results: results, occupancy: occupancy});
    });

});

router.post('/bulk', function(req, res, next) {
    var apitoken = req.query.apitoken;

    if(!apitoken) {
        return handleError(res, NO_API_TOKEN);
    }

    var lat_lng_list = req.body.lat_lng_list;

    console.log("lat_lng_list: " + lat_lng_list);

    if(!lat_lng_list) {
        return handleError(res, NO_LAT+NO_LNG);
    }

    var end_index = 0;

    for(lat_lng_index in lat_lng_list) {
        end_index++;
    }

    //TODO: Deny overly long query

    var lat_lng_occupancy_list = {};
    var output_index = 0;

    for(lat_lng_index in lat_lng_list) {
        var lat = lat_lng_list[lat_lng_index].lat;
        var lng = lat_lng_list[lat_lng_index].lng;

        //console.log("Processing lat " + lat + " lng " + lng);

        getOccupancyEstimation(apitoken, lat, lng, function(results, occupancy, oc_lat, oc_lng) {
            //console.log("callback output_index: " + output_index + " end_index: " + end_index);

            lat_lng_occupancy_list[output_index] = {lat: oc_lat, lng: oc_lng, occupancy: occupancy};

            output_index++;

            if(output_index == end_index) {
                res.json({success: true, lat_lng_occupancy_list: lat_lng_occupancy_list});
            }

        });

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
                (1 * callback_results[constants.MAX_BLUETOOTH_COUNT]) +
                (0.125 * callback_results[constants.TOTAL_HOTSPOTS]) +
                (1 * callback_results[constants.CROWD_AVERAGE_ESTIMATE]) +
                (5 * callback_results[constants.AUDIO_HISTOGRAM_ANALYSIS]);

            occupancy = occupancy / 4;

            callback(callback_results, occupancy, lat, lng);
        }
    });
};

module.exports = router;