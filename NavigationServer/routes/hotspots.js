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

}).post('/', function(req, res, next) {

    var ssid = req.body.ssid;
    var mac = req.body.mac;
    var signal_level = req.body.signal_level;
    var frequency = req.body.frequency;
    var register_date = req.body.register_date;

    console.log("Received a post to hotspots"
                + "\nssid: " + ssid
                + "\nmac: " + mac
                + "\nsignal_level: " + signal_level
                + "\nfrequency: " + frequency
                + "\nregister_date: " + register_date);

    res.json({});

});

module.exports = router;