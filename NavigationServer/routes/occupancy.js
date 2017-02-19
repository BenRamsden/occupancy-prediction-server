/**
 * Created by ben on 19/02/2017.
 */
var express = require('express');
var router = express.Router();

var handleError = require('../handleError');
var database = require('../database');

router.get('', function(req, res, next) {
    var apitoken = req.query.apitoken;

    if(!apitoken) {
        return handleError(res, NO_API_TOKEN);
    }

    // var obtype = req.params.obtype;
    //
    // if(!obtype) {
    //     return handleError(res, NO_OBTYPE);
    // }

    res.json({success: true});

});

module.exports = router;