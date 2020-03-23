require('dotenv').config();
process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const axios       = require('axios')

const TKN_BOT = '1087756157:AAE0e2dgll0JliyCL8esAWQWFxgsyTMF8aE';
const URL     = 'https://progetto-pdgt-federici.herokuapp.com'

let where_i_am = "Start";  //FLAG status
let TKN_Log   = ""

const bot = new TelegramBot(TKN_BOT, {polling: true});

// OPTS------------------------------------------------------
const opts_start = {
    "reply_markup": {
        "inline_keyboard": [
            [{
                "text": "Login"
                ,"callback_data": "Login"            
            }, 
            {
                "text": "Signup"
                ,"callback_data": "Signup"            
            }]
        ]
    }
}
const opts_after_signup = {
    "reply_markup": {
        "inline_keyboard": [
            [{
                "text": "Login"
                ,"callback_data": "Login"            
            }]
        ]
    }
}
const opts_view_station = {
    "reply_markup": {
        "inline_keyboard": [
            [{
                "text": "View All station"
                ,"callback_data": "all"            
            }], 
            [{
                "text": "View by name "
                ,"callback_data": "name"            
            }], 
            [{
                "text": "View by region "
                ,"callback_data": "region"            
            }], 
            [{
                "text": "View by province "
                ,"callback_data": "province"            
            }]
        ]
    }
}
const opts_keyboard = {
    "reply_markup": {
        "keyboard": [
            ["🚂View stations", "📍View station position"], ["➕Add station", "📝Modify station"], ["❌Delete station"]
        ]
    }
}
//-----------------------------------------------------------

bot.onText(/\/start/, (msg, match) => {
    where_i_am = "Start"
    let txt = 'Welcome, to use my power register or Login: ';
    bot.sendMessage(msg.chat.id, txt, opts_start);
});

bot.onText(/\/options/, (msg, match) => {
    const chatId = msg.chat.id;
    if(where_i_am == 'Inside'){
        let txt = 'Choose what you want'
        bot.sendMessage(msg.chat.id, txt, opts_keyboard)
    }else{
        let txt = 'You must register or Login: ';
        bot.sendMessage(msg.chat.id, txt, opts_start);
    }
});

bot.on('callback_query', function onCallbackQuery(example){
    const action = example.data // This is responsible for checking the content of callback_data
    const msg = example.message
    
    if (action == 'Login' && where_i_am == 'Start'){
        console.log('Login')
        where_i_am = action;
        bot.sendMessage(msg.chat.id, "Tell me your email and password")
    }else if (action == 'Signup' && where_i_am == 'Start'){
        console.log('Signup')
        where_i_am = action;
        bot.sendMessage(msg.chat.id, "Tell me your email and password so I'll register")
    }else if (action == 'all' && where_i_am == 'Inside'){
        // GET_ALL_STATIONS-------------------------------------------------------
        axios.get(URL + '/stations')
        .then((response) => {
            getStation(msg.chat.id, response.data.count, response.data.stations)
        });
        //-----------------------------------------------------------------------
    }else if (action == 'name' && where_i_am == 'Inside'){
        where_i_am = action;

        let txt = "Tell me the station's Name: "
        bot.sendMessage(msg.chat.id, txt)
    }else if ((action == 'region' || action == 'province') && where_i_am == 'Inside'){
        where_i_am = action;

        let txt = "Tell me the "+ action +" where you want to search for the station: "
        bot.sendMessage(msg.chat.id, txt)
    }
});

bot.on('message', (msg) => {
    if (where_i_am == 'Login'){
        // LOGIN-----------------------------------------------------------------
        let userInfo = msg.text.toString().split(" ")
        axios.post(URL + '/users/login', {
            email: userInfo[0].toLowerCase(),
            password: userInfo[1]
        })
        .then((response) => {
            where_i_am = "Inside"
            TKN_Log = response.data.token
            let txt1 = 'TOP you\'re in :)'
            let txt2 = '\n\nChoose what you want: '
            bot.sendMessage(msg.chat.id, txt1+txt2, opts_keyboard)
            //console.log(tokenLog)
        },(error) => {
            where_i_am = "Start"
            let txt1 = 'Authentication failed try again:\n';
            let txt2 = 'You must write your email and password divided by a space'
            bot.sendMessage(msg.chat.id, txt1+txt2, opts_start)
        });
        //------------------------------------------------------------------------
    }else if (where_i_am == 'Signup'){
        where_i_am = 'Start'
        // SIGNUP-----------------------------------------------------------------
        let userInfo = msg.text.toString().split(" ")
        axios.post(URL + '/users/signup', {
            email: userInfo[0].toLowerCase(),
            password: userInfo[1]
        })
        .then((response) => {
            let txt = 'Registered successfully now try to log in';
            bot.sendMessage(msg.chat.id, txt, opts_after_signup)
        },(error) => {
            let txt1 = 'Authentication failed try again:\n';
            let txt2 = 'You must write your email and password divided by a space'
            bot.sendMessage(msg.chat.id, txt1+txt2, opts_start)
        });
        //------------------------------------------------------------------------
    }else if (where_i_am == 'Inside' && msg.text.toString().includes("🚂View")){
        let txt = 'Choose what you want to view the satations';
        bot.sendMessage(msg.chat.id, txt, opts_view_station);
    }else if (where_i_am == 'Inside' && msg.text.toString().includes("📍View")){
        // PROOF GET_ONE_STATION--------------------------------------------------
        let id_st = "5e6f9fbfa509220612ef49fc"
        axios.get(URL + '/stations/'+id_st)
        .then((response) => {
            let txt = "Here is the point of " + response.data.station.Nome + "'s station:"
            bot.sendMessage(msg.chat.id, txt);
            bot.sendLocation(msg.chat.id, 
                            response.data.station.Latitudine,
                            response.data.station.Longitudine);   
            //console.log(response.data.station._id)
        });
        //------------------------------------------------------------------------

    }else if (where_i_am == 'Inside' && msg.text.toString().includes("➕Add")){
        let txt1 = "Tell me all station's information you want to add, you will have to write me: "
        let txt2 = "\nNAME\nMUNICIPALITY\nPROVINCE\nREGION\nLONGITUDE\nLATITUDE\nID_OpenStreetMap (if you know it)\n\n"
        let txt3 = "You must write all infos divided by a space."
        bot.sendMessage(msg.chat.id, txt1+txt2+txt3)
        where_i_am = "➕Add";
    }else if (where_i_am == 'Inside' && msg.text.toString().includes("📝Modify")){
        // PROOF GET_PATCH_STATION--------------------------------------------------
        //------------------------------------------------------------------------
    }else if (where_i_am == 'Inside' && msg.text.toString().includes("❌Delete")){
        where_i_am = "❌Delete";

        let txt = "Tell me the station's id to be eliminated"
        bot.sendMessage(msg.chat.id, txt)
    }else if (where_i_am == 'name'|| where_i_am == 'region' || where_i_am == 'province'){
        // GET_STATIONS-------------------------------------------------------
        axios.get(URL + '/stations/'+where_i_am+'/'+msg.text.toString())
        .then((response) => {
            getStation(msg.chat.id, response.data.count, response.data.stations)
        });
        //-----------------------------------------------------------------------
        where_i_am = 'Inside'
    }else if(where_i_am == '➕Add'){
        // PROOF GET_ADD_STATION--------------------------------------------------
        let stationInfo = msg.text.toString().split(" ")
        let header = { headers: { 'Authorization': "bearer " + TKN_Log} }
        let req = { Nome: stationInfo[0],
            Comune: stationInfo[1],
            Provincia: stationInfo[2],
            Regione: stationInfo[3],
            Longitudine: parseFloat(stationInfo[4]),
            Latitudine: parseFloat(stationInfo[5])
        }
        //idopenmap it's unnecessary
        if(stationInfo.length == 7){
            req.ID_OpenStreetMap = parseInt(stationInfo[6])
        }
        axios.post(URL + '/stations/', req, header)
        .then((response) => {
            let station     = response.data.addedStation
            let station_txt = "REGION: " + station.Regione + "\n" +
                              "PROVINCE: " + station.Provincia + "\n" +
                              "MUNICIPALITY: " +  station.Comune + "\n" +
                              "NAME: " + station.Nome + "\n" +
                              "with ID: " + station._id
            let txt = "Here is the new station: \n"
            bot.sendMessage(msg.chat.id, txt + station_txt)
            bot.sendLocation(msg.chat.id, station.Latitudine, station.Longitudine);
        });
        //------------------------------------------------------------------------
    }else if (where_i_am == '❌Delete'){
        // PROOF GET_DELETE_STATION--------------------------------------------------
        let header = { headers: { 'Authorization': "bearer " + TKN_Log} }
        
        axios.delete(URL + '/stations/'+msg.text.toString(), header)
        .then((response) => {
            let txt = "Station successfully deleted"
            bot.sendMessage(msg.chat.id, txt)
            where_i_am = "Inside"
        }).catch((error) => {
            if(error.response.data.message.toString().includes("token_error")){
                let txt = 'Session expired';
                bot.sendMessage(msg.chat.id, txt, opts_after_signup);
                where_i_am = "Start"
            }else{
                let txt = 'ID error retry';
                bot.sendMessage(msg.chat.id, txt, opts_keyboard);
                where_i_am = "Inside"
            }

        })
        //------------------------------------------------------------------------
    }
    
});


function getStation(idchat, n_stations, stations){
    let stations_txt = ""
    if (n_stations > 1){
        for(let i = 0; i < n_stations; i++){
        stations_txt =  stations_txt + (i+1) + ") " +
                        stations[i].Regione + 
                        ": " + stations[i].Nome + " di " +
                        stations[i].Comune + " \n\n"
        }
        let txt = "Here are all the " + n_stations + " stations: \n\n" + stations_txt
        bot.sendMessage(idchat, txt)
    }else{
        let txt = "Here is the point of " + stations[0].Nome + "'s station"
        bot.sendMessage(idchat, txt);
        bot.sendLocation(idchat, stations[0].Latitudine, stations[0].Longitudine);
    }
}