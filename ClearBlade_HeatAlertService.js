function HeatAlertService(req, resp){
    ClearBlade.init({request:req});
    log(req);
    log('itemid');
    log(req.params.items[0].item_id);

    function sendSMS(val){
        var farenheight = (val * 9 / 5) + 32; //Sensor is in celcius
        var options = {
        "auth":{
            user: "",
            pass : ""
        },
        uri : "https://api.twilio.com/2010-04-01/Accounts/{AccountSID}/SMS/Messages.json",
        "body":{
            "Body" : val,
            "To" :  "",
            "From": ""
        },
        "form":true
        };
        
     var requestObject = ClearBlade.http().Request();
        requestObject.post(options,function(err,result){
            if(err){
                log(err);
                resp.error(err);
            }else{
                resp.success(result);
            }
        }); 
    }
        
        function sendCall(num){
        var options = {
        "auth":{
            user: "",
            pass : ""
        }, "ApplicationSid":"",
        uri : "https://api.twilio.com/2010-04-01/Accounts/{AcctSID}/Calls",
        "Url": "https://handler.twilio.com/twiml/{YourAppTwiml}",
        "body":{
            "Body" : "Warning - heat alarm at your house please check the temperature!",
            "To" :  ""+num+"",
            "From": "{TwilioPhoneNumber}",
        },
        "form":true
        };
        
     var voiceObject = ClearBlade.http().Request();
        voiceObject.post(options,function(err,result){
            if(err){
                log(err);
                resp.error(err);
            }else{
                resp.success(result);
            }
        }); 
        }

    var callback = function(err, data) {
        if (err) {
            resp.error("fetch error : " + JSON.stringify(data));
        } else {
            log(data);
            //We have the record now update with the decoded data
            var q = ClearBlade.Query({ collectionName: "Sensor Data" });
            q.equalTo("item_id", data.DATA[0].item_id);
            try {
            log('got the item');
            log(data.DATA[0].raw_payload);
            var decodedPayload = data.DATA[0].raw_payload;
            log('time to make some calls');
            if(data.DATA[0].device_name == "F03D291000001E64") //This is the specific device ID that has the temp sensor.
            {
                log('in the call');
                log(decodedPayload);
                if(decodedPayload.length == 2)
                {
                    //This should be heat.
                    log('heat');
                    
                    var temp = decodedPayload;
                    log(temp);
                    if(parseInt(temp) > 18)
                    {
                        temp = temp * 9 / 5 + 32;
                      //sendSMS("Warning - heat alarm at your house please check the temperature! It is "+parseInt(temp) + ' degrees!');  
                      //sendCall(<number>);
                      //sendCall(<number>);
                    }
                    
                }
                else
                {
                    //This should be humidity.
                    log('humidity');
                    log(decodedPayload);
                    decodedPayload = decodedPayload.substring(1, decodedPayload.length - 1);
                    log('skip sms right now');
                    //sendSMS("The humidity in your house is high (over "+decodedPayload+") - you might have a leak! ");
                    //sendCall();
                }
                    //
                    //
            }else
            {
                log('not the right device');
                
            }
            }
            catch(ex)
            {
                decodedPayload="Parser Error!";
            }
            log(decodedPayload);
            
            var changes = {
                decoded_payload: JSON.stringify(decodedPayload)
            };

            var updateCallback = function(err, data) {
                if (err) {
                    log(JSON.stringify(data));
                    resp.error("update error : " + JSON.stringify(data));
                } else {
                    resp.success(data);
                }
            };
            query.update(changes, updateCallback);
        }
    };
    
        //Query the item that was created
    var col = ClearBlade.Collection({ collectionName: "Sensor Data" });
    var query = ClearBlade.Query({ collectionName: "Sensor Data" });
    //query.equalTo("item_id", "9a12758a-5686-4343-a1fe-b95223b6b6c6");
    query.equalTo("item_id", req.params.items[0].item_id);
    col.fetch(query, callback);
    
}
