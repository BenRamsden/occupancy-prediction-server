/**
 * Created by benra on 04/12/2016.
 */
var express = require('express');
var router = express.Router();

var handleError = require('../handleError');
var database = require('../database');

var observation_types = ['hotspot','audio','crowd','bluetooth','accelerometer'];

var NO_API_TOKEN = "NO_API_TOKEN";
var NO_OBTYPE = "NO_OBTYPE";
var ERR_DB_GET_USER_ID = "ERR_DB_GET_USER_ID";
var ERR_DB_GET_OBSERVATIONS = "ERR_DB_GET_OBSERVATIONS";
var ERR_DB_INSERT_OBSERVATION = "ERR_DB_INSERT_OBSERVATION";

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

    database.prototype.getUserId(apitoken, function(err, idUser) {
        if(err) {
            return handleError(res, ERR_DB_GET_USER_ID);
        }

        var tablename = obtype+'Observations';

        database.prototype.getObservations(idUser, tablename, function(err, observations) {
            if(err) {
                return handleError(res, ERR_DB_GET_OBSERVATIONS);
            }

            res.json({tablename:tablename, my_observations: observations, idUser: idUser});
        });

    });

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
            case 'Hotspot':
                processHotspotObservation(idUser, req, processCallback);
                break;
            case 'Audio':
                processAudioObservation(idUser, req, processCallback);
                break;
            case 'Crowd':
                processCrowdObservation(idUser, req, processCallback);
                break;
            case 'Bluetooth':
                processBluetoothObservation(idUser, req, processCallback);
                break;
            case 'Accelerometer':
                processAccelerometerObservation(idUser, req, processCallback);
                break;
            default:
                console.log("Hit default with obtype: "+obtype);
                break;
        }

    });
});


var NO_LAT = "NO_LAT";
var NO_LNG = "NO_LNG";
var NO_NUMBER_CONNECTED = "NO_NUMBER_CONNECTED";
var NO_OBSERVATION_DATE = "NO_OBSERVATION_DATE";

var processHotspotObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','number_connected','observation_date'];

    var params = {};

    params.lat = req.body.lat;

    if(!params.lat) {
        return callback(NO_LAT);
    }

    params.lng = req.body.lng;

    if(!params.lng) {
        return callback(NO_LNG);
    }

    params.number_connected = req.body.number_connected;

    if(!params.number_connected) {
        return callback(NO_NUMBER_CONNECTED);
    }

    params.observation_date = req.body.observation_date;

    if(!params.observation_date) {
        return callback(NO_OBSERVATION_DATE);
    }

    console.log("idUser " + idUser + " did POST HotspotObservation Params: "+JSON.stringify(params));

    database.prototype.insertHotspotObservation(idUser, params, callback);
};

var processAudioObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','audio_histogram','observation_date'];

    var params = errorHandler.prototype.getQueryParams(req, required_params);

    console.log("idUser " + idUser + " did POST AudioObservation Params: "+JSON.stringify(params));

    database.prototype.insertAudioObservation(idUser, params, callback);
};

var processCrowdObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','occupancy_estimate','observation_date'];

    var params = errorHandler.prototype.getQueryParams(req, required_params);

    console.log("idUser " + idUser + " did POST CrowdObservation Params: "+JSON.stringify(params));

    database.prototype.insertCrowdObservation(idUser, params, callback);
};

var processBluetoothObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','bluetooth_count','observation_date'];

    var params = errorHandler.prototype.getQueryParams(req, required_params);

    console.log("idUser " + idUser + " did POST BluetoothObservation Params: "+JSON.stringify(params));

    database.prototype.insertBluetoothObservation(idUser, params, callback);
};

var processAccelerometerObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','acceleration_timeline','observation_date'];

    var params = errorHandler.prototype.getQueryParams(req, required_params);

    console.log("idUser " + idUser + " did POST AccelerometerObservation Params: "+JSON.stringify(params));

    database.prototype.insertAccelerometerObservation(idUser, params, callback);
};

module.exports = router;