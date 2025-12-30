import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";

import swaggerUi from "swagger-ui-express";
const openapiSpec = JSON.parse(fs.readFileSync("openapi.json", "utf8"));


const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// MongoDB
// -----------------------
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

// --------------------
// Response wrapper
// -----------------------
function apiResponse(res, statusCode, status, message, response) {
    res.status(statusCode).json({
        status,
        message,
        response
    });
}

// -----------------------
// a) GET – cijela kolekcija + filtriranje
// ----------------------
app.get("/skijalista", async (req, res) => {
    try {
        const { drzava, regija, tezina } = req.query;
        const collection = db.collection("skijalista");

        let query = {};
        if (drzava) query.Drzava = drzava;
        if (regija) query.Regija = regija;

        const result = await collection.find(query).toArray();
        let flat = [];

        result.forEach(s => {
            s.Staze.forEach(staza => {
                if (!tezina || staza.Tezina === tezina) {
                    flat.push({
                        id: s._id,
                        Naziv: s.Naziv,
                        Drzava: s.Drzava,
                        Regija: s.Regija,
                        Visina_pocetna_m: s.Visina_pocetna_m,
                        Visina_vrh_m: s.Visina_vrh_m,
                        Naziv_staze: staza.Naziv,
                        Duzina_staze_km: staza.Duzina_km,
                        Tezina_staze: staza.Tezina
                    });
                }
            });
        });

        apiResponse(res, 200, "OK", "Dohvaćena kolekcija skijališta", flat);
    } catch (err) {
        apiResponse(res, 500, "Error", "Greška na serveru", null);
    }
});

// ------------------------
// b) GET – jedan resurs po ID-u
// --------------------
app.get("/skijalista/:id", async (req, res) => {
    try {
        const skijaliste = await db
            .collection("skijalista")
            .findOne({ _id: new ObjectId(req.params.id) });

        if (!skijaliste) {
            return apiResponse(res, 404, "Not Found", "Skijalište ne postoji", null);
        }

        apiResponse(res, 200, "OK", "Dohvaćeno skijalište", skijaliste);
    } catch {
        apiResponse(res, 400, "Bad Request", "Neispravan ID", null);
    }
});

// ---------------------
// c) DODATNE GET RUTE (3 komada)
// --------------------

// 1. Skijališta po državi
app.get("/skijalista/drzava/:drzava", async (req, res) => {
    try {
        const data = await db.collection("skijalista")
            .find({ Drzava: req.params.drzava })
            .toArray();

        apiResponse(res, 200, "OK", "Skijališta po državi", data);
    } catch {
        apiResponse(res, 500, "Error", "Greška na serveru", null);
    }
});

// 2. Skijališta s minimalnom visinom vrha
app.get("/skijalista/min-visina/:visina", async (req, res) => {
    try {
        const data = await db.collection("skijalista")
            .find({ Visina_vrh_m: { $gte: Number(req.params.visina) } })
            .toArray();

        apiResponse(res, 200, "OK", "Skijališta po visini", data);
    } catch {
        apiResponse(res, 500, "Error", "Greška na serveru", null);
    }
});

// 3. Skijališta s određenim brojem žičara
app.get("/skijalista/zicare/:broj", async (req, res) => {
    try {
        const data = await db.collection("skijalista")
            .find({ Broj_zicara: { $gte: Number(req.params.broj) } })
            .toArray();

        apiResponse(res, 200, "OK", "Skijališta po broju žičara", data);
    } catch {
        apiResponse(res, 500, "Error", "Greška na serveru", null);
    }
});

// --------------------
// d) POST – dodavanje resursa
// --------------------
app.post("/skijalista", async (req, res) => {
    try {
        const result = await db.collection("skijalista").insertOne(req.body);
        apiResponse(res, 201, "Created", "Skijalište dodano", result);
    } catch {
        apiResponse(res, 400, "Bad Request", "Neispravni podaci", null);
    }
});

// --------------------
// e) PUT – ažuriranje resursa
// --------------------
app.put("/skijalista/:id", async (req, res) => {
    try {
        const result = await db.collection("skijalista").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );

        if (result.matchedCount === 0) {
            return apiResponse(res, 404, "Not Found", "Skijalište ne postoji", null);
        }

        apiResponse(res, 200, "OK", "Skijalište ažurirano", result);
    } catch {
        apiResponse(res, 400, "Bad Request", "Greška pri ažuriranju", null);
    }
});

// --------------------
// f) DELETE – brisanje resursa
// --------------------
app.delete("/skijalista/:id", async (req, res) => {
    try {
        const result = await db.collection("skijalista").deleteOne({
            _id: new ObjectId(req.params.id)
        });

        if (result.deletedCount === 0) {
            return apiResponse(res, 404, "Not Found", "Skijalište ne postoji", null);
        }

        apiResponse(res, 200, "OK", "Skijalište obrisano", null);
    } catch {
        apiResponse(res, 400, "Bad Request", "Neispravan ID", null);
    }
});

//-----------------------------
// API
//-----------------------------

app.get("/openapi", (req, res) => {
    try {
        const spec = JSON.parse(fs.readFileSync("openapi.json", "utf8"));
        res.json(spec);
    } catch {
        res.status(500).json({
            status: "Error",
            message: "Ne mogu učitati OpenAPI specifikaciju",
            response: null
        });
    }
});


app.use("/swagger", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// --------------------
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server radi na http://localhost:${PORT}`);
});
