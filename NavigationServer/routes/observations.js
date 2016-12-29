/**
 * Created by benra on 04/12/2016.
 */

var express = require('express');
var router = express.Router();
var mysqlpool = require('../mysqlpool');
var async = require("async");

observation_types = ['audio','hotspot','crowd'];

/* GET observations by user. */
router.get('/:obtype', function(req, res, next) {
    apitoken = getApiTokenOrThrow(req.query.apitoken);

    obtype = getValidObservationTypeOrThrow(req.params.obtype);

    mysqlpool.getConnection(function(err, con) {
        if(err) throw err; //throw SQL Error

        con.query('select idUser from users WHERE api_token = ?', [apitoken], function(err, result) {
            if(err) throw err; //throw SQL Error

            if(result.length == 0) {
                throw new Error("apitoken does not belong to a user");
                /* TODO: Find where to catch async mysql calls and handle */
            }

            idUser = result.idUser;

            con.query('select * from ' + obtype + ' WHERE idUser = ?', [idUser], function(err, result) {
                if(err) throw err;  //throw SQL Error

                con.release();
                res.send(result);
            });
        });
    });

}).post('/:obtype', function(req, res, next) {
    apitoken = getApiTokenOrThrow(req.query.apitoken);

    obtype = getValidObservationTypeOrThrow(req.params.obtype);

    /* TODO: Insert observation of type obtype into table, with id of user with apitoken */

    res.send("Hey from POST");
});

var getApiTokenOrThrow = function(apitoken) {
    /* Check if client included apitoken query paramater */
    if(apitoken) {
        return apitoken;
    } else {
        throw new Error("apitoken query parameter missing");
    }
};

var getValidObservationTypeOrThrow = function (obtype) {
    if(!obtype) {
        throw new Error(":obtype url parameter missing");
    }

    if(observation_types.indexOf(obtype) >= 0) {
        return obtype + 'observations';
    } else {
        throw new Error(obtype + " not valid observation type like "+ JSON.stringify(observation_types));
    }
};

module.exports = router;