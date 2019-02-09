import MapFile, { MapFilterOperator } from "./MapFile";
import * as fs from "fs";
import { ScryfallFullCard, ScryfallRelatedCard, ScryfallComponent, MTGCardSuperType, ScryfallLegalities } from "mtgtypes";

export default class MapConstructor{

    private localCardFile: string;
    private mapTemplate: MapFile;
    private outputDir: string;
    private maps: {}[] = [];
    private cardTypesRegex = /([a-zA-Z ]*)(?:— ([a-zA-Z \n]*)(?:\(((?:[0-9x\*+-]*(?:\{1\/2\})?|∞))(?:\/([0-9x\*+-]*(?:\{1\/2\})?))?\))?)?/u;

    public constructor(localCardFile: string, mapTemplate: MapFile, outputDir: string){
        this.localCardFile = localCardFile;
        this.mapTemplate = mapTemplate;
        this.outputDir = outputDir;
        for(let i = 0; i < mapTemplate.data.maps.length; i++){
            this.maps.push({});
        }
    }

    public process(): Promise<void>{
        const esc = String.fromCharCode(27);
        const clearLine = esc + "[2k";
        const gotoLineStart = esc + "[1G";

        return new Promise((resolve, _reject) => {
            let stream = fs.createReadStream(this.localCardFile, {encoding: "UTF8"});
            let buffer = "";
            let cards = 0;
            stream.on("data", (data: string) => {
                stream.pause();
                buffer += data;
                while(true){
                    stream.pause();
                    let result = this.checkForCard(buffer);
                    if(result){
                        let cardData = buffer.substr(result.start, result.end - result.start + 1);
                        buffer = buffer.substr(result.end + 1);
                        this.parseOneCard(cardData);
                        cards++;
                        if(cards % 100 === 0){
                            process.stdout.write(clearLine + gotoLineStart + cards + " cards processed.");
                        }
                    }else{
                        break;
                    }
                }
                stream.resume();
            });

            stream.on("end", () => {
                console.log();
                resolve();
            });
        });
    }

    public saveMaps(): Promise<void>{
        return new Promise((resolve, _reject) => {
            for(let i = 0; i < this.mapTemplate.data.maps.length; i++){
                let mapData = this.mapTemplate.data.maps[i];
                let fileName = this.outputDir + "/" + mapData.name + ".json";
                fs.writeFileSync(fileName, JSON.stringify(this.maps[i]));
                console.log("Wrote " + fileName);
            }
            resolve();
        });
    }

    private parseOneCard(buffer: string): void{
        let cardData = JSON.parse(buffer) as ScryfallFullCard;
        if(this.cardMeetsFilter(cardData)){
            this.addToMaps(cardData);
        }
    }

    private addToMaps(card: ScryfallFullCard): void{
        for(let i = 0; i < this.mapTemplate.data.maps.length; i++){
            let mapData = this.mapTemplate.data.maps[i];
            let keyData = this.getItem(card, mapData.key);
            let valueData = this.getItem(card, mapData.value);
            for(let key of keyData){
                if(key === null || key === undefined){
                    continue;
                }
                for(let value of valueData){
                    if(value === null || value === undefined){
                        continue;
                    }
                    if(mapData.duplicates){
                        this.maps[i][key] = this.maps[i][key] || [];
                        this.maps[i][key].push(value);
                    }else{
                        this.maps[i][key] = value;
                    }
                }
            }
        }
    }

    private getItem(card: ScryfallFullCard, prop: string): string[]{
        let key = prop.split(".")[0];
        let modifier = prop.split(".")[1];
        let value = card[key];
        if(Array.isArray(value)){
            if(modifier === "join"){
                return [value.join("")];
            }
            if(modifier === "0"){
                return [value[0]];
            }
            if(modifier === "tokenid"){
                return (value as ScryfallRelatedCard[]).filter((x)=>{return x.component === ScryfallComponent.Token}).map((x)=>{return x.id});
            }

            return value;
        }

        if(modifier === "islegal"){
            let legalFormats = [];

            for(let format in value){
                if(value[format] === "legal"){
                    legalFormats.push(format);
                }
            }

            return legalFormats;
        }

        if(modifier === "parseTypes" || modifier === "parseSuperTypes"){
            let result = this.cardTypesRegex.exec(value);
            if(!result || result.length < 2 || typeof result[1] !== "string") { return []; }
            let individualTypes = result[1].split(" ");
            let types = [];
            let superTypes = [];
            for(let type of individualTypes){
                if(!type || type.length === 0){ continue; }
                if(this.IsSuperType(type)){
                    superTypes.push(type);
                }else{
                    types.push(type);
                }
            }
            if(modifier === "parseTypes"){
                return types;
            }
            return superTypes;
        }

        if(modifier === "parseSubTypes"){
            let result = this.cardTypesRegex.exec(value);
            if(!result || result.length < 3 || typeof result[2] !== "string") return [];
            return  result[2].trim().split(" ");
        }

        if(value && modifier && modifier.length > 0){
            return [value[modifier]];
        }

        return [value];
    }

    private IsSuperType(candidate: string): boolean{
        for(let superType in MTGCardSuperType){
            if(candidate === superType){
                return true;
            }
        }

        return false;
    }

    private cardMeetsFilter(card: ScryfallFullCard): boolean{
        if(this.mapTemplate.data.filter){
            for(let filter of this.mapTemplate.data.filter){
                let realValue = card[filter.key];
                let expectedValue = filter.value;
                if(filter.operator === MapFilterOperator.Equals){
                    if(realValue != expectedValue){
                        return false;
                    }
                }

                if(filter.operator === MapFilterOperator.NotEquals){
                    if(realValue == expectedValue){
                        return false;
                    }
                }

                if(filter.operator === MapFilterOperator.Exists){
                    if(!realValue){
                        return false;
                    }
                }
            }
        }

        return true;
    }

    private checkForCard(buffer: string): {start: number, end: number} | null{
        let brackets = 0;
        let start = -1;
        for(let i = 0; i < buffer.length; i++){
            let char = buffer.charAt(i);
            if(char === "{"){
                if(start === -1){
                    start = i;
                }
                brackets++;
            }
            if(char === "}"){
                brackets--;
                
                if(brackets === 0){
                    return {
                        start: start,
                        end: i
                    };
                }
            }
        }
        return null;
    }
}