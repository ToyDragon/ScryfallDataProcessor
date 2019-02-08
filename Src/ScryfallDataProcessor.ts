import ArgsParser from "./ArgsParser";
import AllCardsDownloader from "./AllCardsDownloader";
import MapFile from "./MapFile";
import MapConstructor from "./MapConstructor";

const localCardFile = "./Files/AllCards.json";
const args = new ArgsParser(process.argv).args;
const dl = new AllCardsDownloader(localCardFile);

dl.currentDate().then((cardsDate) => {
    if(args["a"] || args["allcards"]){
        if(args["f"]){
            dl.exec();
        }else{
            let dist = new Date().getTime() - cardsDate.getTime();
            if(dist > 1000*60*60*24){
                console.log("Elapsed: " + dist);
                dl.exec();
            }else{
                console.log("Cancelled because set file is less than a day old. Use -f to override.")
            }
        }
    } else if(args["p"] || args["process"]){
        let rawMapFile = "";
        if(args["p"]){
            rawMapFile = args["p"][0]
        }else if(args["process"]){
            rawMapFile = args["process"][0];
        }
        if(!rawMapFile){
            rawMapFile = "./defaultMaps.json";
        }
        
        let mapFile = new MapFile(rawMapFile);
        mapFile.load().then(() => {
            let processor = new MapConstructor(localCardFile, mapFile);
            processor.process().then(()=>{
                processor.saveMaps();
            });
        }).catch((err) => {
            console.log("Invalid map file: " + err);
        });

    } else {
        console.log("usage: node ScryfallDataProcessor [-a [-f]] [-p [mapfile]]");
        console.log("  -a or -allcards   Update the file with all card data from Scryfall");
        console.log("  -f                Force the file with all card date to be updated ignoring the time restriction");
        console.log("  -p or -process    Process the Scryfall data into data maps. Optionally specify a mapfile describing what data to process, or use the default \"defaultMaps.json\"");
    }
});