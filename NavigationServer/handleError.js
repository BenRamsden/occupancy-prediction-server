/**
 * Created by ben on 05/02/2017.
 */

function handleError(temp_res, err_code) {
    console.log("HANDLE_ERROR: Sending error response, error: " + err_code);

    temp_res.status(503);
    temp_res.json({ result : {success: false, reason: err_code }});

    return;
}

module.exports = handleError;