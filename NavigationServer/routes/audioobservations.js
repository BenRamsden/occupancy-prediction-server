/**
 * Created by benra on 04/12/2016.
 */

var express = require('express');
var router = express.Router();

/* GET hotspots listing. */
router.get('/', function(req, res, next) {
    res.send('audioobservations api');
});

module.exports = router;