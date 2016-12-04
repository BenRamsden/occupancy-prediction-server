/**
 * Created by benra on 04/12/2016.
 */

var express = require('express');
var router = express.Router();
var mysqlpool = require('../mysqlpool');

/* GET hotspots listing. */
router.get('/', function(req, res, next) {

    mysqlpool.getConnection(function(err, con) {
        con.query('select * from hotspots', function(err, result) {
            con.release();
            res.send(result);
        });
    });

});

module.exports = router;