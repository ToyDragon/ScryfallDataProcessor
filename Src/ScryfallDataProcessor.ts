import ArgsParser from "./ArgsParser";
import AllCardsDownloader from "./AllCardsDownloader";
import MapFile from "./MapFile";
import MapConstructor from "./MapConstructor";

const args = new ArgsParser(process.argv);

const localCardFile = args.getValue("input", "./Files/AllCards.json");
const outputDir = args.getValue("output", "./Files");
const dl = new AllCardsDownloader(localCardFile);

dl.currentDate().then((cardsDate) => {
    if(args.hasArg("allcards")){
        if(args.hasArg("force")){
            dl.exec();
        }else{
            let cardsTime = (cardsDate && cardsDate.getTime()) || 0;
            let curTime = new Date().getTime();
            let dist = curTime - cardsTime;
            if(dist > 1000*60*60*24){
                dl.exec();
            }else{
                console.log("Cancelled because set file is less than a day old. Use -f to override.")
            }
        }
    } else if(args.hasArg("process")){
        
        let rawMapFile = args.getValue("process", __dirname + "/../defaultMaps.json");
        
        let mapFile = new MapFile(rawMapFile);
        mapFile.load().then(() => {
            let processor = new MapConstructor(localCardFile, mapFile, outputDir);
            processor.process().then(()=>{
                processor.saveMaps();
            });
        }).catch((err) => {
            console.log("Invalid map file: " + err);
        });

    } else {
        console.log("usage: node ScryfallDataProcessor [-a [-f]] [-i file] [-o dir] [-p [mapfile]]");
        console.log("  -a[llcards]        Update the file with all card data from Scryfall");
        console.log("  -f[orce]           Force the file with all card date to be updated ignoring the time restriction");
        console.log("  -i[nput] <file>    Specify the location that the card data should be loaded from or saved to, or use the default \"./Files/AllCards.json\"");
        console.log("  -o[output] <dir>   Specify the location that the map data should be saved, or use the default \"./Files\"")
        console.log("  -p[rocess] <file>  Process the Scryfall data into data maps. Optionally specify a mapfile describing what data to process, or use the default \"defaultMaps.json\"");
    }
});