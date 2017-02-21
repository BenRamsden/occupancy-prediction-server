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

        if(callback_count == 9) {

            var occupancy =
                (3 * callback_results[constants.MAX_BLUETOOTH_COUNT]) +
                (0.125 * callback_results[constants.TOTAL_HOTSPOTS]) +
                (1 * callback_results[constants.CROWD_AVERAGE_ESTIMATE]) +
                (5 * callback_results[constants.AUDIO_HISTOGRAM_ANALYSIS]);

            occupancy = occupancy / 4;

            res.json({success: true, results: callback_results, occupancy: occupancy});
        }
    });

});

module.exports = router;