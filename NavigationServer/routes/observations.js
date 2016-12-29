/**
 * Created by benra on 04/12/2016.
 */
var express = require('express');
var router = express.Router();
var errorHandler = require('../errorHandler');
var database = require('../database');

observation_types = ['hotspot','audio','crowd','bluetooth','accelerometer'];

/* GET observations by user. */
router.get('/:obtype', function(req, res, next) {
    var apitoken = errorHandler.prototype.getApiTokenOrThrow(req.query.apitoken);

    var obtype = errorHandler.prototype.getValidObservationTypeOrThrow(req.params.obtype);

    database.prototype.getUserId(apitoken, function(err, idUser) {
        if(errorHandler.prototype.handleError(err, res)) return;

        database.prototype.getObservations(idUser, obtype, function(err, observations) {
            if(errorHandler.prototype.handleError(err, res)) return;

            res.json({observations: observations, idUser: idUser});
        });

    });

}).post('/:obtype', function(req, res, next) {
    var apitoken = errorHandler.prototype.getApiTokenOrThrow(req.query.apitoken);

    var obtype = errorHandler.prototype.getValidObservationTypeOrThrow(req.params.obtype);

    /* TODO: Insert observation of type obtype into table, with id of user with apitoken */

    res.json({error: "To be implemented: "+obtype+" insertion"});
});

module.exports = router;