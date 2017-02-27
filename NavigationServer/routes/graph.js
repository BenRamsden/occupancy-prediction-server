/**
 * Created by ben on 27/02/2017.
 */

var express = require('express');
var router = express.Router();

/* Returns graph page. */
router.get('/', function(req, res, next) {

    res.sendFile('graph.html' , { root : __dirname});

});

module.exports = router;