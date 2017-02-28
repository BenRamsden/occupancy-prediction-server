/**
 * Created by ben on 05/02/2017.
 */

var response_sent = false;

function handleError(temp_res, err_code) {
    if(response_sent == true) {
        console.log("HANDLE_ERROR: Response already sent, error: " + err_code);
        return;
    }

    response_sent = true;

    console.log("HANDLE_ERROR: Sending error response, error: " + err_code);

    temp_res.json({ result : {success: false, reason: err_code }});

    return;
}

module.exports = handleError;