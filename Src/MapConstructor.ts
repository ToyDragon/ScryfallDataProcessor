import MapFile, { MapFilterOperator } from "./MapFile";
import * as fs from "fs";
import { ScryfallFullCard } from "mtgtypes";

export default class MapConstructor{

    private localCardFile: string;
    private mapTemplate: MapFile;
    private maps: {}[] = [];

    public constructor(localCardFile: string, mapTemplate: MapFile){
        this.localCardFile = localCardFile;
        this.mapTemplate = mapTemplate;
        for(let i = 0; i < mapTemplate.data.maps.length; i++){
            this.maps.push({});
        }
    }

    public process(): Promise<void>{
        return new Promise((resolve, _reject) => {
            let cards = 0;
            let first = true;
            let stream = fs.createReadStream(this.localCardFile, {encoding: "UTF8"});
            let buffer = "";
            stream.on("data", (data: string) => {
                if(first){
                    data = data.substr(1);
                    first = false;
                }
                stream.pause();
                buffer += data;
                while(true){
                    stream.pause();
                    let endBracket = this.checkForCard(buffer);
                    if(endBracket){
                        let cardData = buffer.substr(0, endBracket+1);
                        buffer = buffer.substr(endBracket + 2); //Additional 1 to account for comma
                        this.parseOneCard(cardData);
                        cards++;
                        if(cards === 2){
                            break;
                        }
                    }else{
                        break;
                    }
                }
                if(cards === 2){
                    resolve();
                }else{
                    stream.resume();
                }
            });
        });
    }

    public saveMaps(): Promise<void>{
        return new Promise((resolve, _reject) => {
            for(let i = 0; i < this.mapTemplate.data.maps.length; i++){
                let mapData = this.mapTemplate.data.maps[i];
                let fileName = "./Files/" + mapData.name + ".json";
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
            if(mapData.duplicates){
                this.maps[i][keyData] = this.maps[i][keyData] || [];
                this.maps[i][keyData].push(valueData);
            }else{
                this.maps[i][keyData] = valueData;
            }
        }
    }

    private getItem(card: ScryfallFullCard, prop: string): string{
        let key = prop.split(".")[0];
        let modifier = prop.split(".")[1];
        let value = card[key];
        if(modifier === "join"){
            return (value as any).join("");
        }

        return value;
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

    private checkForCard(buffer: string): number{
        let brackets = 0;
        for(let i = 0; i < buffer.length; i++){
            let char = buffer.charAt(i);
            if(char === "{"){
                brackets++;
            }
            if(char === "}"){
                brackets--;
                
                if(brackets === 0){
                    return i;
                }
            }
        }
        return 0;
    }
}