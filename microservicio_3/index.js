require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
const urlRegex = /^https?:\/\/(?:www\.)?[\w\.-]+\.[a-z]{2,}(?:\/[\w\.\/%&=]*)?$/;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const connection = mongoose.connection;

connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model('Url', urlSchema);
let currentShortUrl = 1;

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const url = req.body.url;
  if (urlRegex.test(url)) {
    Url.findOne({ original_url: url }, (err, foundUrl) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUrl) {
          res.send({
            original_url: foundUrl.original_url,
            short_url: foundUrl.short_url
          });
        } else {
          const newUrl = new Url({
            original_url: url,
            short_url: currentShortUrl
          });
          newUrl.save((err, savedUrl) => {
            if (err) {
              console.log(err);
            } else {
              currentShortUrl++;
              res.send({
                original_url: savedUrl.original_url,
                short_url: savedUrl.short_url
              });
            }
          });
        }
      }
    });
  } else {
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:shortUrl', (req, res) => {
  const shortUrl = Number(req.params.shortUrl);
  Url.findOne({ short_url: shortUrl }, (err, foundUrl) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUrl) {
        res.redirect(foundUrl.original_url);
      } else {
        res.json({ error: 'invalid short url' });
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});