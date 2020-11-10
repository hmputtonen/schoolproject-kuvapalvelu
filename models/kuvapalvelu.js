const mysql = require("mysql");
const crypto = require("crypto");
const fs = require("fs");
const ladatutkuvat = "./public/uploads/";
const yhteys =  mysql.createConnection({
                                        host : "localhost",
                                        user : "root",
                                        password : "",
                                        database : "kuvapalvelu" 
                                        });


yhteys.connect((err) => {

    if(!err){
        console.log("Tietokantayhteys avattu");
    } else {
        throw `Virhe yhdistäessä tetokantaan: ${err}`;
    }

}); 

module.exports = {
// Kaikkien kuvien haku (plus joinatut kayttajatunnukset taulusta kayttajat)
    "haeKaikkiKuvat" : (cb) => {

        let sql = `SELECT * FROM kuvat LEFT JOIN kayttajat ON kuvat.kayttaja_id = kayttajat.kayttaja_id ORDER BY kuvat.kuva_id DESC`;

        yhteys.query(sql, (err,data) => {

            cb(err,data);
       
        });

    },

//Käyttäjätunnuksen haku
    "haekayttajatunnus" : (cb) => {

        let sql = `SELECT kayttajatunnus FROM kayttajat`;

        yhteys.query(sql, (err, data) => {

            cb(err,data);

            


        });

    },

// Kuvan lisäys
    "lisaaUusiKuva" : (uusikuva,cb) => {

        //lisättävän kuvan otsikko (lomakkeelta)
        let o = uusikuva.body.kuvaotsikko;
        //kuvan url(lomakkeelta)
        let url = uusikuva.file.filename;

        let kayttaja_id = uusikuva.body.kayttaja_id;

        let sql = `INSERT INTO kuvat (otsikko, kayttaja_id, kuvaUrl) VALUES ('${o}','${kayttaja_id}','${url}') `;

        yhteys.query(sql, (err) => {

            cb(err);
          
        });

    },

// Kuvan poistaminen 
    "poistaKuva" : (poistettava,cb) => {

        //poistetaan kuva uploads -kansiosta:
        fs.unlink(`./public/uploads/${poistettava.kuvaUrl}`, err => {

        });

        //poistetaan kuva tietokannasta:
        let poistettavaKuva = poistettava.kuva_id;

        let sql = `DELETE FROM kuvat WHERE kuva_id = '${poistettavaKuva}';`;

       
        yhteys.query(sql, (err) => {

            cb(err);
        
        });


    },
 //Kommenttien poisto
    "kommenttienPoisto" : (poistettava,cb) => {

        let poistettavaKuva = poistettava.kuva_id;

        let sql = `DELETE FROM kommentit WHERE kuva_id = '${poistettavaKuva}';`;

        yhteys.query(sql, (err) => {

            cb(err);
           
        });
    },

// Tykkayksen lisäys
    "lisaaTykkays" : (req,cb) => {

        let id = req.body.tykkays;

        
        //lisätään vanhoihin tykkäyksiin uusi tykkäys:
        let sql = `UPDATE kuvat SET tykkayksia = tykkayksia + 1 WHERE kuva_id = '${id}';`;


        yhteys.query(sql, (err) => {

            cb(err);

         
        });

    },


// Uuden käyttäjän lisäys (haeKayttaja sekä lisaaUusiKayttaja)    
    "haeKayttaja" : (kayttajatunnus, cb) => {

        let syotettyTunnus = kayttajatunnus.kayttajatunnus;

        let sql = `SELECT * FROM kayttajat WHERE kayttajatunnus = '${syotettyTunnus}';`;

        yhteys.query(sql, (err,data) => {
            

            let dataStringify = JSON.stringify(data);
            let dataParse = JSON.parse(dataStringify);
            
            if(err) throw err;

            if(data != null || data != undefined){
                
                cb(err, dataParse[0]);

            }else{

                cb(null);
        }
        
    });

    },
    "lisaaUusiKayttaja" : (uusiKayttaja, cb) => {

        let kayttajatunnus = uusiKayttaja.uusiKayttajaTunnus;
        
        let salasana = crypto.createHash("SHA512").update(uusiKayttaja.salasana).digest("hex");

        let sql = `INSERT INTO kayttajat (kayttajatunnus, salasana) VALUES ('${kayttajatunnus}','${salasana}')`

        yhteys.query(sql, (err) => {

            cb(err);
            

        });

    },

//Kommentin lisäys
    "lisaaKommentti" : (uusiKommentti, cb) => {

        let kuvaId = uusiKommentti.kuva_id;
        let kayttajatunnus = uusiKommentti.kayttajatunnus;
        let sisalto = uusiKommentti.sisalto;

        let sql = `INSERT INTO kommentit (kuva_id, kayttajatunnus, sisalto) VALUES ('${kuvaId}','${kayttajatunnus}','${sisalto}')`;

        yhteys.query(sql, (err) => {

            cb(err);
        });

    },
// Kommenttien määrän laskeminen
    "kasvataKommenttilaskuria" : (uusiKommentti,cb) => {

        let id = uusiKommentti.kuva_id;

        let sql = `UPDATE kuvat SET kommentteja = kommentteja + 1 WHERE kuva_id = '${id}';`;

        yhteys.query(sql, (err) => {

            cb(err);
        });


    },

//Haetaan kommentit    
    "haeKommentit" : (cb) => {

        let sql = `SELECT * FROM kommentit`;

        yhteys.query(sql, (err,data) => {

            cb(err,data);
     
        });
    }

};