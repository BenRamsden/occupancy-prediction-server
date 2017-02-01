/**
 * Created by benra on 04/12/2016.
 */
var express = require('express');
var router = express.Router();
var errorHandler = require('../errorHandler');
var database = require('../database');

/* GET observations by user. */
router.get('/:obtype', function(req, res, next) {
    var apitoken = errorHandler.prototype.getApiTokenOrThrow(req.query.apitoken);

    var obtype = errorHandler.prototype.getValidObservationTypeOrThrow(req.params.obtype);

    database.prototype.getUserId(apitoken, function(err, idUser) {
        if(errorHandler.prototype.handleError(err, res)) return;

        var tablename = obtype+'Observations';

        database.prototype.getObservations(idUser, tablename, function(err, observations) {
            if(errorHandler.prototype.handleError(err, res)) return;

            res.json({tablename:tablename, my_observations: observations, idUser: idUser});
        });

    });

}).post('/:obtype', function(req, res, next) {
    var apitoken = errorHandler.prototype.getApiTokenOrThrow(req.query.apitoken);

    var obtype = errorHandler.prototype.getValidObservationTypeOrThrow(req.params.obtype);

    /* Insert observation of type obtype into table, with id of user with apitoken */
    var processCallback = function(err) {
        if(errorHandler.prototype.handleError(err, res)) return;

        res.json({success:true});
    };

    database.prototype.getUserId(apitoken, function(err, idUser) {
        if(errorHandler.prototype.handleError(err, res)) return;

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
                res.json({success:false,reason:"obtype provided not valid"});
                break;
        }

    });
});


var processHotspotObservation = function(idUser, req, callback) {
    var required_params = ['lat','lng','number_connected','observation_date'];

    var params = errorHandler.prototype.getQueryParams(req, required_params);

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