var team = { _id: "5844c463d3292d31fefe30a5",
  id: 'T07MF5GQM',
  identity:
   { ok: true,
     url: 'https://suto-collective.slack.com/',
     team: 'Suto',
     user: 'nima',
     team_id: 'T07MF5GQM',
     user_id: 'U07MEUK1S' },
  auth:
   { ok: true,
     access_token: 'xoxp-7729186837-7728971060-112893294231-f419b238898d362d0625d27310759a4d',
     scope: 'identify,bot,commands',
     user_id: 'U07MEUK1S',
     team_name: 'Suto',
     team_id: 'T07MF5GQM',
     bot:
      { bot_user_id: 'U3ACJ72JX',
        bot_access_token: 'xoxb-112426240643-3Oyisp0DR22BxmOyHW4ehQT9' } },
  createdBy: 'U07MEUK1S',
  url: 'https://suto-collective.slack.com/',
  name: 'Suto',
  access_token: 'xoxp-7729186837-7728971060-112893294231-f419b238898d362d0625d27310759a4d',
  bot:
   { bot_user_id: 'U3ACJ72JX',
     bot_access_token: 'xoxb-112426240643-3Oyisp0DR22BxmOyHW4ehQT9' } }

 var event = {
   "token": "7TlnQJPz9uW9pIhVlSdN6Vs5",
   "team_id": "T07MF5GQM",
   "api_app_id": "A28U2CF2P",
   "event": {
     "type": "message",
     "user": "U07MEUK1S",
     "text": "<@U3ACJ72JX> top stories",
     "ts": "1480970694.000004",
     "channel": "C2U8YAP16",
     "event_ts": "1480970694.000004"
   },
   "type": "event_callback",
   "authed_users": [
     "U07MEUK1S"
   ]
 }



process.env.MONGO_URL = "mongodb://db-user-stdlib:ann6gbDxzbgFLcVTUro@ds119728.mlab.com:19728/hacker-news-bot"
process.env.SLACK_VERTIFICATION_TOKEN = "7TlnQJPz9uW9pIhVlSdN6Vs5"
var data = {kwargs: event}
var f = require('./f/webhook')

try {
f(data, console.error)
} catch(e) {debugger}
