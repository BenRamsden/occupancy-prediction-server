/**
 * Created by ben on 19/02/2017.
 */
var express = require('express');
var router = express.Router();

var handleError = require('../handleError');
var database = require('../database');
var constants = require('../constants');

var NO_LAT = "NO_LAT";
var NO_LNG = "NO_LNG";

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

    getOccupancyEstimation(apitoken, lat, lng, function(results, occupancy) {
        res.json({success: true, results: results, occupancy: occupancy});
    });

});

router.post('/bulk', function(req, res, next) {
    var apitoken = req.query.apitoken;

    if(!apitoken) {
        return handleError(res, NO_API_TOKEN);
    }

    var latlng_list_param = req.body.latlng_list;

    if(!latlng_list_param) {
        return handleError(res, NO_LAT+NO_LNG);
    }

    var latlng_list = JSON.parse(latlng_list_param);

    for(latlng_index in latlng_list) {
        var lat = latlng_list[latlng_index].lat;
        var lng = latlng_list[latlng_index].lng;

        console.log("Processing lat " + lat + " lng " + lng);
    }

    res.json({success: false, reason: "not yet implemented"});
    return;

    getOccupancyEstimation(apitoken, lat, lng, function(results, occupancy) {
        res.json({success: true, results: results, occupancy: occupancy});
    });

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

            callback(callback_results, occupancy);
        }
    });
}

module.exports = router;