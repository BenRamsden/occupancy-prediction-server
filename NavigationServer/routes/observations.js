/**
 * Created by benra on 04/12/2016.
 */
var express = require('express');
var router = express.Router();

var handleError = require('../handleError');
var database = require('../database');

var observation_types = ['hotspot','audio','crowd','bluetooth','accelerometer'];

const NO_API_TOKEN = "NO_API_TOKEN";
const NO_OBTYPE = "NO_OBTYPE";
const ERR_DB_GET_USER_ID = "ERR_DB_GET_USER_ID";
const ERR_DB_GET_OBSERVATIONS = "ERR_DB_GET_OBSERVATIONS";
const ERR_DB_INSERT_OBSERVATION = "ERR_DB_INSERT_OBSERVATION";
const OBTYPE_NOT_SUPPORTED = "OBTYPE_NOT_SUPPORTED";
const NO_LAT = "NO_LAT";
const NO_LNG = "NO_LNG";
const NO_NUMBER_CONNECTED = "NO_NUMBER_CONNECTED";
const NO_OBSERVATION_DATE = "NO_OBSERVATION_DATE";
const MISSING_START_OR_END_DATE = "MISSING_START_OR_END_DATE";

/* GET observations by user. */
router.get('/:obtype', function(req, res, next) {
    var apitoken = req.query.apitoken;

    if(!apitoken) {
        return handleError(res, NO_API_TOKEN);
    }

    var obtype = req.params.obtype;

    if(!obtype) {
        return handleError(res, NO_OBTYPE);
    }

    /* FETCH ALL ENTRIES */
    database.prototype.getUserId(apitoken, function(err, idUser) {
        if(err) {
            return handleError(res, ERR_DB_GET_USER_ID);
        }

        var tablename = obtype+'_observations';

        database.prototype.getObservations(idUser, tablename, function(err, observations) {
            if(err) {
                return handleError(res, ERR_DB_GET_OBSERVATIONS);
            }

            res.json({tablename:tablename, my_observations: observations, idUser: idUser});
        });

    });

}).get('/:obtype/:start_date/:end_date', function(req, res, next) {
    var apitoken = req.query.apitoken;

    if(!apitoken) {
        return handleError(res, NO_API_TOKEN);
    }

    var obtype = req.params.obtype;

    if(!obtype) {
        return handleError(res, NO_OBTYPE);
    }

    var start_date = req.params.start_date;
    var end_date = req.params.end_date;

    if(!start_date || !end_date) {
        return handleError(res, MISSING_START_OR_END_DATE);
    }

    var tablename = obtype+'_observations';

    database.prototype.getObservationsBetweenDates(tablename, start_date, end_date, function(err, observations) {
        if(err) {
            return handleError(res, ERR_DB_GET_OBSERVATIONS);
        }

        res.json({tablename:tablename, my_observations: observations});
    });


    res.json({success: false, reason: "not yet implemented", dates: start_date + end_date});


}).post('/:obtype', function(req, res, next) {
    var apitoken = req.query.apitoken;

    if(!apitoken) {
        return handleError(res, NO_API_TOKEN);
    }

    var obtype = req.params.obtype;

    if(!obtype) {
        return handleError(res, NO_OBTYPE);
    }

    /* Insert observation of type obtype into table, with id of user with apitoken */
    var processCallback = function(err_code) {
        if(err_code) {
            return handleError(res, err_code);
        }

        res.json({success:true});
    };

    database.prototype.getUserId(apitoken, function(err, idUser) {
        if(err) {
            return handleError(res, ERR_DB_GET_USER_ID);
        }

        switch(obtype) {
            case 'hotspot':
                processHotspotObservation(idUser, req, processCallback);
                break;
            case 'audio':
                processAudioObservation(idUser, req, processCallback);
                break;
            case 'crowd':
                processCrowdObservation(idUser, req, processCallback);
                break;
            case 'bluetooth':
                processBluetoothObservation(idUser, req, processCallback);
                break;
            case 'accelerometer':
                processAccelerometerObservation(idUser, req, processCallback);
                break;
            default:
                console.log("Hit default with obtype: "+obtype);
                return handleError(res, OBTYPE_NOT_SUPPORTED);
                break;
        }

    });
});

var MISSING_PARAM_ = "MISSING_PARAM_";

function getParamsOrCallback(req, required_params, callback) {
    var params_out = {};
    for(var i=0; i<required_params.length; i++) {
        if(typeof req.body[required_params[i]] !== "undefined") {
            params_out[required_params[i]] = req.body[required_params[i]];
        } else {
            callback(MISSING_PARAM_+required_params[i]);
            return false;
        }
    }
    return params_out;
}

var processHotspotObservation = function(idUser, req, callback) {
    var required_params = ['ssid','mac','frequency',
                           'lat','lng','signal_level','observation_date'];

    var params = getParamsOrCallback(req, required_params, callback);

    if(!params) { return; }

    console.log("idUser " + idUser + " did POST Hotspot Observation Params: "+JSON.stringify(params));

    database.prototype.insertHotspotObservation(idUser, params, callback);
};

var processAudioObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','audio_histogram','observation_date'];

    var params = getParamsOrCallback(req, required_params, callback);

    if(!params) { return; }

    console.log("idUser " + idUser + " did POST Audio Observation Params: "+JSON.stringify(params));

    database.prototype.insertAudioObservation(idUser, params, callback);
};

var processCrowdObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','occupancy_estimate','observation_date'];

    var params = getParamsOrCallback(req, required_params, callback);

    if(!params) { return; }

    console.log("idUser " + idUser + " did POST Crowd Observation Params: "+JSON.stringify(params));

    database.prototype.insertCrowdObservation(idUser, params, callback);
};

var processBluetoothObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','bluetooth_count','observation_date'];

    var params = getParamsOrCallback(req, required_params, callback);

    if(!params) { return; }

    console.log("idUser " + idUser + " did POST Bluetooth Observation Params: "+JSON.stringify(params));

    database.prototype.insertBluetoothObservation(idUser, params, callback);
};

var processAccelerometerObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','acceleration_timeline','observation_date'];

    var params = getParamsOrCallback(req, required_params, callback);

    if(!params) { return; }

    console.log("idUser " + idUser + " did POST Accelerometer Observation Params: "+JSON.stringify(params));

    database.prototype.insertAccelerometerObservation(idUser, params, callback);
};

module.exports = router;