import * as fs from "fs";
import * as https from "https";
            
export default class AllCardsDownloader{

    private localCardFile: string;

    public constructor(localCardFile: string){
        this.localCardFile = localCardFile;
    }

    public currentDate(): Promise<Date>{
        return new Promise((resolve, _reject) => {
            fs.stat(this.localCardFile, (err, stats) => {
                if(err || !stats){
                    resolve(null);
                }else{
                    resolve(stats.ctime);
                }
            });
        });
    }

    private ensureDirsExist(): void{
        let pieces = this.localCardFile.split("/");
        let piecesSoFar = "";
        for(let i = 0; i < pieces.length - 1; i++){
            let piece = pieces[i];
            if(piecesSoFar === ""){
                piecesSoFar = piece;
            }else{
                piecesSoFar += "/" + piece;
            }
            if(piece === "." || piece === ".."){
                continue;
            }
            try{
                fs.statSync(piecesSoFar);
            }catch(_err){
                fs.mkdirSync(piecesSoFar);
            }
        }
    }

    public exec(quiet?: boolean): Promise<void>{
        const allCardsDataUrl = "https://api.scryfall.com/bulk-data";
        const esc = String.fromCharCode(27);
        const clearLine = esc + "[2k";
        const gotoLineStart = esc + "[1G";

        return new Promise((resolve, _reject) => {
            this.ensureDirsExist();
            https.get(allCardsDataUrl, (allCardsDataResponse) => {
                let result = "";
                allCardsDataResponse.on("data", (chunk) => {
                    result += chunk;
                });
                allCardsDataResponse.on("end", () => {
                    let resultObj = JSON.parse(result);
                    let dataObj = null;
                    for (let i = 0; i < resultObj.data.length; ++i){
                        if (resultObj.data[i].type === "all_cards"){
                            dataObj = resultObj.data[i];
                        }
                    }
                    if(!dataObj){
                        console.log("Couldn't load All Cards location.");
                    }else{
                        let totalSize = 0;
                        let lastMB = -1;
                        let allCardsUrl = dataObj.download_uri;
                        let maxMB = Math.floor((dataObj.compressed_size / (1024*1024)) * 6.29) + " MB";

                        let ws = fs.createWriteStream(this.localCardFile);

                        if(!quiet){
                            console.log("Loading data from: " + allCardsUrl);
                        }
                        https.get(allCardsUrl, (response) => {
                            if(!quiet){
                                console.log("Saving to " + this.localCardFile);
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
                                ws.close();
                                resolve();
                            });
                        });
                    }
                });
            });
        });
    }
}