const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  episodeNumber: Number,
  title: String,
  streamLink: String
});

const SeasonSchema = new mongoose.Schema({
  seasonNumber: Number,
  episodes: [EpisodeSchema]
});

const ContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['movie', 'series'], required: true },
  description: String,
  bannerUrl: String,
  posterUrl: String,
  category: String,
  movieStreamLink: String,
  seasons: [SeasonSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Content', ContentSchema);
