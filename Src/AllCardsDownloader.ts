import * as fs from "fs";
import * as https from "https";
            
export default class AllCardsDownloader{

    private localCardFile: string;

    public constructor(localCardFile: string){
        this.localCardFile = localCardFile;
    }

    public currentDate(): Promise<Date>{
        return new Promise((resolve, _reject) => {
            fs.exists(this.localCardFile, (exists) => {
                if(!exists){
                    resolve(null);
                }else{
                    fs.stat(this.localCardFile, (err, stats) => {
                        if(err || !stats){
                            resolve(null);
                        }else{
                            resolve(stats.ctime);
                        }
                    });
                }
            });
        });
    }

    public exec(quiet?: boolean): Promise<void>{
        const allCardsUrl = "https://archive.scryfall.com/json/scryfall-all-cards.json";
        const esc = String.fromCharCode(27);

        const clearLine = esc + "[2k";
        const gotoLineStart = esc + "[1G";

        return new Promise((resolve, _reject) => {
            let ws = fs.createWriteStream(this.localCardFile);
            let totalSize = 0;
            let lastMB = -1;
            let maxMB = "688 MB"; //scryfall has no content-length header

            https.get(allCardsUrl, (response) => {
                if(!quiet){
                    console.log("Connected");
                }
                response.pipe(ws);
                
                response.on("data", (chunk) => {
                    
                    totalSize += chunk.length;
                    let curMB = Math.floor(totalSize/(1024*1024));
                    if(curMB > lastMB){
                        lastMB = curMB;
                        if(!quiet){
                            process.stdout.write(clearLine + gotoLineStart + curMB + "/" + maxMB);
                        }
                    }
                });
                response.on("end", () => {
                    if(!quiet){
                        console.log();
                        console.log("Done!");
                    }
                    resolve();
                });
            });
        });
    }
}