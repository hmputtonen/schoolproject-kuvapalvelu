const express = require("express");
const app = express();
const crypto = require("crypto");

const session = require("express-session");

const multer = require("multer");
const upload = multer({dest : "./public/uploads/"});

const bodyParser = require("body-parser");

const kuvapalvelu = require("./models/kuvapalvelu");
const portti = 3113;

app.set("views", "./views");
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { "extended" : true } ));

app.use(express.static("./public"));

app.use(session({
                    "secret" : "Harjoitustyö2019",
                    "resave" : false,
                    "saveUninitialized" : false
                }));

app.use((req, res, next) => {
    
    if(!req.session.Kirjaudu && req.path != "/kirjautuminen/" && req.path != "/lisaaKuva/" && req.path != "/rekisteroityminen/" && req.path != "/rekIlmoitus/" && req.path != "/lisaaTykkays/" && req.path != "/poistaKuva"){

    kuvapalvelu.haeKaikkiKuvat((err,kuvat) => {
        
        
        res.render("index", {"kuvat" : kuvat, "kayttaja" : req.session.kayttaja });
       

    });    


} else {   

   next();
  
}
});     

//sisäänkirjaus
app.get("/kirjautuminen/", (req,res) =>{

    res.render("kirjautuminen", {"virhe" : null});

});

app.post("/kirjautuminen/", (req, res) => {

    kuvapalvelu.haeKayttaja(req.body, (err,kayttaja) => {


        if(kayttaja != null || kayttaja != undefined) {

            let hash = crypto.createHash("SHA512").update(req.body.salasana).digest("hex");
           
            if(hash == kayttaja.salasana) {

                req.session.Kirjaudu = true;

                let sessioKayttaja = {
                                        "id" : kayttaja.kayttaja_id,
                                        "kayttajatunnus" : kayttaja.kayttajatunnus
                                    };
                
                req.session.kayttaja = sessioKayttaja;
                
                res.redirect("/");

            } else {

                req.session.Kirjaudu = false;

                res.render("kirjautuminen", {"virhe" : "Virheellinen kayttajatunnus tai salasana."});

            }
            
        } else {

            req.session.Kirjaudu = false;

            res.render("kirjautuminen", {"virhe" : "Virheellinen käyttäjätunnus tai salasana."});

        }

    });

});

//uloskirjaus

app.post("/kirjauduUlos/", (req,res) => {

    if(req.session) {

        req.session.destroy();

        res.redirect("/");
    }

});

//rekisteröityminen
app.get("/rekisteroityminen/", (req,res) =>{

    res.render("rekisteroityminen", { "virhe" : null});

});

app.post("/rekisteroityminen", (req, res) =>{
    
    
    kuvapalvelu.haekayttajatunnus((err,kayttajat) =>{

        let vanhatKayttajat = '';
        let kayttajatStringify = JSON.stringify(kayttajat);
        let kayttajatParse = JSON.parse(kayttajatStringify);

       kayttajatParse.forEach(kayttaja => {
            
             vanhatKayttajat = kayttaja.kayttajatunnus;
        });
        
        if(vanhatKayttajat != req.body.uusiKayttajaTunnus){
    
            kuvapalvelu.lisaaUusiKayttaja(req.body, () => {

            res.redirect("/rekIlmoitus/");
            
        });

        } else {

            res.render("rekisteroityminen", {"virhe" : "Käyttäjätunnus on varattu. Ole hyvä ja valitse uusi käyttäjätunnus."});

        }   

  });
});

//ilmoitus onnistuseesta rekisteröitymisestä:
app.get("/rekIlmoitus/", (req,res) =>{

    res.render("rekIlmoitus", {});

});



//kuvan lisäys
app.get("/lisaaKuva/", (req,res) => {

    res.render("lisaaKuva", {"virhe" : null,"kayttaja": req.session.kayttaja});

});

app.post("/lisaaKuva/", upload.single("kuvatiedosto"),(req,res) => {

    let filetype = req.file.originalname;
    let splittedFiletype = filetype.split('.');

    if(splittedFiletype[1] != 'jpg' && splittedFiletype[1] != 'png' && splittedFiletype[1] != 'jpeg'){

    
        res.render("lisaaKuva", {"kayttaja" : req.session.kayttaja ,"virhe" : "Virheellinen tiedostomuoto. Vain '.jpg'/ 'png' muodossa olevat tiedostot ovat ladattavissa."});
    
    } else {

    kuvapalvelu.lisaaUusiKuva(req, (err) => {

        res.redirect("/");
       

    });
}
});

//näytetään vain omat kuvat

app.get("/omatKuvat/", (req,res) => {

    kuvapalvelu.haeKaikkiKuvat((err,kuvat)=> {
        kuvapalvelu.haeKommentit((err,kommentit) => {
        res.render("omatKuvat", {"kuvat": kuvat, "kommentit" : kommentit, "kayttaja" : req.session.kayttaja});

        });
    });

});


//Kuvan poisto

app.post("/poistaKuva", (req,res) => {

    kuvapalvelu.poistaKuva(req.body, () => {
        kuvapalvelu.kommenttienPoisto(req.body, () => {

        
        
        res.redirect("/");
        });
    });

});

//Tykkäyksen lisäys
app.post("/lisaaTykkays", (req,res) => {

    kuvapalvelu.lisaaTykkays(req, () => {

       res.redirect("/");
       
      
    });

});
//Kommentin lisäys
app.post("/lisaaKommentti", (req,res) => {

    kuvapalvelu.lisaaKommentti(req.body, () => {
        kuvapalvelu.kasvataKommenttilaskuria(req.body, () => {
        res.redirect("/");

        });
    });
});

//Kaikkien kuvien haku
app.get("/", (req,res) => {

    kuvapalvelu.haeKaikkiKuvat((err,kuvat)=> {
    
        kuvapalvelu.haeKommentit((err,kommentit) => {

        res.render("index", {"kuvat": kuvat, "kommentit": kommentit, "kayttaja" : req.session.kayttaja});

    });
});
});

app.listen(portti, () => {

    console.log(`Palvelin käynnistyi porttiin: ${portti}`);

});