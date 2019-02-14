import AllCardsDownloader from "./AllCardsDownloader";
import MapFile, { RawMapFileData } from "./MapFile";
import MapConstructor from "./MapConstructor";

export default class ScryfallDataProcessor{
    /**
     * Ensures the all cards file is less than 24 hours old. If it is that old, or is not present, a new copy is downloaded.
     * @param fileLocation URI of the all cards file. Directories will be created if not already present.
     * @param ignoreTimeLimit True if the file should be updated, even if it's less than 24 hours old.
     */
    public static UpdateAllCardsFile(fileLocation: string, ignoreTimeLimit: boolean, quite?: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            const dl = new AllCardsDownloader(fileLocation);
            if(ignoreTimeLimit){
                dl.exec(!!quite).then(() => {
                    resolve();
                });
            }else{
                dl.currentDate().then((cardsDate) => {
                    let cardsTime = (cardsDate && cardsDate.getTime()) || 0;
                    let curTime = new Date().getTime();
                    let dist = curTime - cardsTime;
                    if(dist > 1000*60*60*24){
                        dl.exec(!!quite).then(() => {
                            resolve();
                        })
                    }else{
                        resolve();
                    }
                });
            }
        });
    }

    /**
     * Generates data indices
     * @param fileLocation Location of the all cards file
     * @param outputDir Directory to save indices
     * @param mapData Data for maps to generate
     */
    public static GenerateIndices(fileLocation: string, outputDir: string, mapData: RawMapFileData): Promise<void>{
        return new Promise((resolve, reject) => {
            if(!fileLocation){
                reject("Missing all cards file location");
            }else if(!outputDir){
                reject("Missing index output directory");
            }else{
                let mapFile = new MapFile(mapData);
        
                let error = mapFile.verifyData();
                if(error){
                    reject("Map data invalid");
                }else{
                    let processor = new MapConstructor(fileLocation, mapFile, outputDir);
                    processor.process().then(()=>{
                        processor.saveMaps().then(() => {
                            resolve();
                        });
                    });
                }
            }
        });
    }
}