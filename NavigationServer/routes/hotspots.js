/**
 * Created by benra on 04/12/2016.
 */

var express = require('express');
var router = express.Router();

var errorHandler = require('../errorHandler');
var database = require('../database');

/* GET hotspots listing. */
router.get('/', function(req, res, next) {

    database.prototype.getHotspots(function(err, hotspots) {
        if(errorHandler.prototype.handleError(err, res)) return;

        res.json({hotspots: hotspots});
    });

});

module.exports = router;