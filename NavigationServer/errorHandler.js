/**
 * Created by benra on 29/12/2016.
 */

var errorHandler = function() {};

var observation_types = ['hotspot','audio','crowd','bluetooth','accelerometer'];

errorHandler.prototype.handleError = function(err, res) {
    if(err) {
        res.json({error: err.message});
    }
    return err;
};

errorHandler.prototype.getApiTokenOrThrow = function(apitoken) {
    /* Check if client included apitoken query paramater */
    if(apitoken) {
        return apitoken;
    } else {
        throw new Error("apitoken query parameter missing");
    }
};

errorHandler.prototype.getValidObservationTypeOrThrow = function (obtype) {
    if(!obtype) {
        throw new Error(":obtype url parameter missing");
    }

    if(observation_types.indexOf(obtype) >= 0) {
        return obtype;
    } else {
        throw new Error(obtype + " not valid observation type");
    }
};

errorHandler.prototype.getQueryParams = function(req, required_params) {
    var return_params = {};

    required_params.forEach(function(element) {

        if(Object.keys(req.query).indexOf(element) >= 0) {
            return_params[element] = req.query[element];
        } else {
            throw new Error(element + " query param missing");
        }

    });

    return return_params;
};

module.exports = errorHandler;