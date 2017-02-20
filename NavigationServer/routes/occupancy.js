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

    var callback_count = 0;
    var callback_results = {};

    database.prototype.getOccupancyEstimation(apitoken, lat, lng, function(err, type, results) {
        if(err) {
            handleError(res, err);
        }

        callback_results[type] = results;

        callback_count++;

        if(callback_count == 7) {

            var occupancy =
                callback_results[constants.HOTSPOT_OBSERVATIONS] +
                callback_results[constants.MAX_BLUETOOTH_COUNT] +
                callback_results[constants.TOTAL_HOTSPOTS] +
                callback_results[constants.ACCELEROMETER_OBSERVATIONS] +
                callback_results[constants.AUDIO_OBSERVATIONS] +
                callback_results[constants.BLUETOOTH_OBSERVATIONS] +
                callback_results[constants.CROWD_OBSERVATIONS];

            res.json({success: true, results: callback_results, occupancy: occupancy});
        }
    });

});

module.exports = router;