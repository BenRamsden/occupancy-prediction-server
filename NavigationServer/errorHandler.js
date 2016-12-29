/**
 * Created by benra on 29/12/2016.
 */

var errorHandler = function() {};

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
        return obtype + 'observations';
    } else {
        throw new Error(obtype + " not valid observation type like "+ JSON.stringify(observation_types));
    }
};

module.exports = errorHandler;