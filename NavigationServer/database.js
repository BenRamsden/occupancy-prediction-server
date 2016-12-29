/**
 * Created by benra on 29/12/2016.
 */

var mysql = require('mysql');

var mysqlpool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: 'gibsonXC40',
    database: 'navigationdb'
});

var database = function() {};

database.prototype.getObservations = function(idUser, obtype, callback) {
    mysqlpool.getConnection(function(err, connection) {
        if(err) {
            connection.release();
            return callback(err);
        }

        connection.query('select * from ' + obtype + ' WHERE idUser = ?', [idUser], function(err, results) {
            connection.release();

            if(err) return callback(err);

            return callback(null, results);
        });
    });
};

database.prototype.getUserId = function(apitoken, callback) {
    mysqlpool.getConnection(function(err, connection) {
        if(err) {
            connection.release();
            return callback(err);
        }

        connection.query('select idUser from users WHERE api_token = ?', [apitoken], function(err, results) {
            connection.release();

            if(err) return callback(err);

            if(results.length == 0) return callback(new Error("apitoken does not belong to a user"));

            return callback(null, results[0].idUser);
        });
    });
};

database.prototype.getHotspots = function(callback) {
    mysqlpool.getConnection(function(err, connection) {
        if (err) {
            connection.release();
            return callback(err);
        }

        connection.query('select * from hotspots', function(err, results) {
            connection.release();

            if(err) return callback(err);

            return callback(null, results);
        });

    });
};

module.exports = database;