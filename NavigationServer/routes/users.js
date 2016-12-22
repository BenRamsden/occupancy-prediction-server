var express = require('express');
var router = express.Router();
var mysqlpool = require('../mysqlpool');
var async = require("async");

/* GET users listing. */
router.get('/', function(req, res, next) {
    apitoken = req.query.apitoken;

    async.series([
        function(callback) {
            /* Check if client included apitoken query paramater */
            if(!apitoken) return callback(new Error("Incorrect query parameters"));

            callback();
        },
        /* First check if the user exists with that api token */
        function(callback) {
            mysqlpool.getConnection(function(err, con) {
                if(err) return callback(err);

                con.query('SELECT idUser from Users WHERE api_token = ?', [apitoken], function(err, results) {
                    con.release();

                    if(err) return callback(err);

                    if(results.length == 0) return callback(new Error("Api Token not valid"));

                    idUser = results[0].idUser;
                    callback();
                });
            });
        },
        /* Secondly return the user data on record for that user */
        function(callback) {
            mysqlpool.getConnection(function(err, con) {
                if(err) return callback(err);

                con.query('select * from users WHERE idUser = ?', [idUser], function(err, result) {
                    con.release();

                    if(err) return callback(err);

                    res.json(result);
                    callback();
                });
            });
        }
    ], function(err) { //This function gets called after the two tasks have called their "task callbacks"
        if (err) res.json({error:err.message});
    });


});

module.exports = router;




