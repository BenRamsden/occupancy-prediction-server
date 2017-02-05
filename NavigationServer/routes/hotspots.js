/**
 * Created by benra on 04/12/2016.
 */

var express = require('express');
var router = express.Router();

var handleError = require('../handleError');
var database = require('../database');

var ERR_GETTING_HOTSPOTS = "ERR_GETTING_HOTSPOTS";


/* GET hotspots listing. */
router.get('/', function(req, res, next) {

    database.prototype.getHotspots(function(err, hotspots) {
        if(err) {
            return handleError(res, ERR_GETTING_HOTSPOTS);
        }

        res.json({hotspots: hotspots});
    });

});

module.exports = router;