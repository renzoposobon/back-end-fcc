let express = require('express');
let app = express();
require('dotenv').config();
let bodyParser = require('body-parser')

// body-parser paquete instalado
app.use(bodyParser.urlencoded({extended: false}))

app.use(function middleware(req, res, next) {
  let string = req.method + " " + req.path + " - " + req.ip;
  console.log(string);
  next();
});

app.use('/public', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/json', (req, res) => {
  let message = {"message": "Hello json"};

  // dotenv paquete instalado
  if (process.env.MESSAGE_STYLE === "uppercase") {
    message.message = message.message.toUpperCase();
  }

  res.json(message);
});

app.get(
  "/now",
  (req, res, next) => {
    req.time = new Date().toString()
    next();
  },
  (req, res) => {
    res.send({
      time: req.time
    });
  }
);

// Entrada de parametros de ruta del cliente
app.get("/:word/echo", (req, res) => {
  const { word } = req.params;
  res.json({
    echo: word
  });
});

// Entrada de parametros de consulta del cliente
// Primero se obtiene
app.get("/name", function(req, res) {
  var firstName = req.query.first;
  var lastName = req.query.last;

  var { first: firstName, last: lastName } = req.query;

  res.json({
    name: `${firstName} ${lastName}`
  });
  //chequear: http://localhost:3000/name?first=renzo&last=posobon
});

// Luego se envía
app.post("/name", function(req, res) {
  // Handle the data in the request
  var string = req.body.first + " " + req.body.last;
  res.json({ name: string });
});


module.exports = app;