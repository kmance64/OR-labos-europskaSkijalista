
db = connect("mongodb://127.0.0.1:27017/open_data"); //Povezivanje s bazom
const fs = require("fs"); // Uvoz Node modula za pisanje u datoteku

const outputPath = "C:/Users/mance/Desktop/FER/5.semestar/Otvoreno računarstvo/lab1/europska_skijalista.csv"; 
let csv = "Naziv,Drzava,Regija,Visina_pocetna_m,Visina_vrh_m,Ukupna_duzina_staza_km,Broj_zicara,Cijena_dnevne_karte_EUR,Web_stranica,Geografska_sirina,Geografska_duzina,Naziv_staze,Duzina_staze_km,Tezina_staze\n";

db.skijalista.aggregate([
  { $unwind: "$Staze" },
  {
    $project: {
      _id: 0,
      Naziv: 1,
      Drzava: 1,
      Regija: 1,
      Visina_pocetna_m: 1,
      Visina_vrh_m: 1,
      Ukupna_duzina_staza_km: 1,
      Broj_zicara: 1,
      Cijena_dnevne_karte_EUR: 1,
      Web_stranica: 1,
      Geografska_sirina: "$Koordinate.Geografska_sirina",
      Geografska_duzina: "$Koordinate.Geografska_duzina",
      Naziv_staze: "$Staze.Naziv",
      Duzina_staze_km: "$Staze.Duzina_km",
      Tezina_staze: "$Staze.Tezina"
    }
  }
]).forEach(function(doc) {
  csv += [
    doc.Naziv,
    doc.Drzava,
    doc.Regija,
    doc.Visina_pocetna_m,
    doc.Visina_vrh_m,
    doc.Ukupna_duzina_staza_km,
    doc.Broj_zicara,
    doc.Cijena_dnevne_karte_EUR,
    doc.Web_stranica,
    doc.Geografska_sirina,
    doc.Geografska_duzina,
    doc.Naziv_staze,
    doc.Duzina_staze_km,
    doc.Tezina_staze
  ].join(",") + "\n";
});

// Spremanje CSV-a na disk
fs.writeFileSync(outputPath, csv, { encoding: "utf8" });

