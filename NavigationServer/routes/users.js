var express = require('express');
var router = express.Router();
var mysqlpool = require('../mysqlpool');

/* GET users listing. */
router.get('/', function(req, res, next) {

    mysqlpool.getConnection(function(err, con) {
        con.query('select * from users', function(err, result) {
            con.release();
            res.send(result);
        });
    });

});

module.exports = router;
