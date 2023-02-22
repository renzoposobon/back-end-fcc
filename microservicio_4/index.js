const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set('strictQuery', true);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Crear un nuevo usuario
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.create({ username });
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    if (err.code === 11000) {
      res.json({ error: 'Username already taken' });
    } else {
      res.json({ error: 'An error occurred' });
    }
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().populate('exercises');
    res.json(users);
  } catch (err) {
    res.json({ error: 'An error occurred' });
  }
});

// Añadir un ejercicio a un usuario
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const exercise = await Exercise.create({
      userId: userId,
      description: description,
      duration: duration,
      date: date ? new Date(date) : new Date(),
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { exercises: exercise._id } },
      { new: true }
    ).populate('exercises');

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      exercises: updatedUser.exercises.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      })),
    });
  } catch (err) {
    res.json({ error: 'An error occurred' });
  }
});

// Obtener el log de ejercicios de un usuario
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  try {
  const user = await User.findById(userId).populate('exercises');
  let log = user.exercises.slice();
  if (from) {
    log = log.filter((exercise) => new Date(exercise.date) >= new Date(from));
  }
  if (to) {
    log = log.filter((exercise) => new Date(exercise.date) <= new Date(to));
  }
  if (limit) {
    log = log.slice(0, limit);
  }
  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      })),
    });
  } catch (err) {
    res.json({ error: 'An error occurred' });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

