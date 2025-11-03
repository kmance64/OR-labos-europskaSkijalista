import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "open_data";
let db;

async function connectDB() {
    await client.connect();
    db = client.db(dbName);
    console.log("Spojeno na MongoDB");
}
connectDB();

app.get("/skijalista", async (req, res) => {
    const collection = db.collection("skijalista");
    const result = await collection.find({}).toArray();
    const flatData = [];
    result.forEach(s => {
      s.Staze.forEach(staza => {
        flatData.push({
          Naziv: s.Naziv,
          Drzava: s.Drzava,
          Regija: s.Regija,
          Visina_pocetna_m: s.Visina_pocetna_m,
          Visina_vrh_m: s.Visina_vrh_m,
          Naziv_staze: staza.Naziv,
          Duzina_staze_km: staza.Duzina_km,
          Tezina_staze: staza.Tezina
        });
      });
    });

    res.json(flatData);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server pokrenut na http://localhost:${PORT}`));
