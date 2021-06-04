const fetch = require("node-fetch");
const express = require("express");
const app = express();
const port = 3000;
require('dotenv').config()

let time = 0;
let token;

app.listen(port, () => {
  console.log(`Spotify-image-search listening at http://localhost:${port}`);
});

app.use(express.static('public'))

async function getToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization:
        `Basic ${process.env.SPOTIFY_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  const data = await res.json();
  return data.access_token;
}

const updateToken = async () => {
    if(Date.now() - time > 3600000){
        token = await getToken();
        time = Date.now();
        console.log("Fetched new access token")
    }
}

const search = async (keyword, type) => {
  await updateToken();
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${keyword}&type=${type}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await res.json();
  return data;
};

const newReleases = async () => {
    await updateToken();
    console.log(token);
    const res = await fetch(
      `https://api.spotify.com/v1/browse/new-releases`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    return data;
  };

app.get("/search/:type/:keyword", async (req, res) => {
  const { type, keyword } = req.params
  const data = await search(keyword, type);
  const results = data[`${type}s`].items;
  const responseData = results.map(result => ({
      name: result.name,
      image: result.images[0]?.url
  }))
  res.json(responseData);
});

app.get("/new", async (req, res) => {
    const data = await newReleases();
    const results = data.albums.items;
    const responseData = results.map(result => ({
        name: result.name,
        artist: result.artists[0].name
    }))
    res.json(responseData);
  });
