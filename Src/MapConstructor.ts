import MapFile, { MapFilterOperator } from "./MapFile";
import * as fs from "fs";
import { ScryfallFullCard, ScryfallRelatedCard, ScryfallComponent, MTGCardSuperType, ScryfallLegalities, MTGCostType } from "mtgtypes";

export default class MapConstructor{

    private localCardFile: string;
    private mapTemplate: MapFile;
    private outputDir: string;
    private maps: {}[] = [];
    private cardTypesRegex = /([a-zA-Z ]*)(?:— ([a-zA-Z \n]*)(?:\(((?:[0-9x\*+-]*(?:\{1\/2\})?|∞))(?:\/([0-9x\*+-]*(?:\{1\/2\})?))?\))?)?/u;
    private tokenRegex = /([0-9]+\/[0-9]+)? ?((?:(?:blue|black|white|red|green|colorless)(?:,? and )?)+) ?((?:[A-Za-z]+ )+) ?((?:creature|artifact ?)+) tokens?(?: with ((?:[a-z]+)(?: and [a-z]{2,})?))?(?: named ([A-Za-z]+))?/;

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

    private cleanTokenString(s: string): string{
        let val = s.toLowerCase().replace(/\//g,"_").replace(/[^a-zA-Z0-9]/g,"");
        return val;
    }

    private cleanTokenColorString(s: string): string{
        let result = this.cleanTokenString(s.replace(/,? ?and/g,""));
        let val = "";
        if(!result){
            val = "colorless";
        }
        if(result.indexOf("white") >= 0){
            val = "white" + val;
        }
        if(result.indexOf("blue") >= 0){
            val = "blue" + val;
        }
        if(result.indexOf("black") >= 0){
            val = "black" + val;
        }
        if(result.indexOf("red") >= 0){
            val = "red" + val;
        }
        if(result.indexOf("green") >= 0){
            val = "green" + val;
        }
        return val;
    }

    private parseTokenObject(token: ScryfallFullCard): string{
        let cleanName = this.cleanTokenString((token.name || "").split(" ")[0]);
        let cleanType = this.cleanTokenString(token.type_line);
        if(cleanName === "marit"){
            return "2020blackavatarcreatureflyingandindestructible";
        }
        if(cleanType.indexOf(cleanName) === -1){
            return cleanName;
        }
        let ptString = "";
        if(token.power || token.toughness){
            ptString = this.cleanTokenString(token.power + "/" + token.toughness);
        }

        let colors = "colorless";
        if(token.colors){
            colors = this.cleanTokenColorString(token.colors.join("").replace("W","white").replace("U","blue").replace("B","black").replace("R","red").replace("G","green"));
        }
        
        let types="",subtypes="";
        let typeResult = this.cardTypesRegex.exec(token.type_line);
        if(typeResult) {
            let individualTypes = (typeResult[1]) + "".split(" ");
            for(let type of individualTypes){
                if(!type || type.length === 0){ continue; }
                if(!this.IsSuperType(type)){
                    types += type;
                }
            }
            types = this.cleanTokenString(types).replace("token","");
            subtypes = this.cleanTokenString(typeResult[2] + "");
        }

        let modifiers = token.oracle_text.split(/[\n\(]/)[0].split(",").join("");
        if(modifiers.indexOf("{") === 0){
            modifiers = "";
        }
        modifiers = this.cleanTokenString(modifiers);
        if(modifiers.indexOf("when") === 0 || modifiers.indexOf("this") === 0 || modifiers.indexOf("sacrifice") === 0 || modifiers.indexOf("atthebeginning") === 0 || modifiers.indexOf("creaturesyoucontrol") === 0){
            modifiers = "";
        }

        return this.sanitizeToken(ptString, colors, subtypes, types, modifiers, "");
    }

    private sanitizeToken(powertoughness?: string, colors?: string, subtype?: string, type?: string, modifiers?: string, name?: string){
        if(powertoughness){powertoughness = this.cleanTokenString(powertoughness);}
        if(colors){colors = this.cleanTokenColorString(colors);}
        if(subtype){subtype = this.cleanTokenString(subtype);}
        if(type){type = this.cleanTokenString(type);}
        if(modifiers){modifiers = this.cleanTokenString(modifiers);}
        if(name){name = this.cleanTokenString(name);}

        if(name){
            return name;
        }

        let tokenstr = "";
        if(powertoughness){
            tokenstr += powertoughness;
        }
        
        if(colors){
            tokenstr += colors;
        }
        
        if(subtype){
            tokenstr += subtype;
        }
        
        if(type){
            tokenstr += type;
        }
        
        if(modifiers){
            tokenstr += modifiers;
        }

        let result = this.cleanTokenString(tokenstr);
        if(result === "44redbirdcreatureflying"){
            result = "44redrukhcreatureflying";
        }
        return result;
    }

    private parseTokens(text: string): string[]{
        let tokens = [];
        let result = this.tokenRegex.exec(text);
        while(result){
            let pt = result[1];
            let colors = result[2];
            let subtype = result[3];
            let type = result[4];
            let modifiers = result[5];
            let name = result[6];
            let tokenstring = this.sanitizeToken(pt, colors, subtype, type, modifiers, name);

            tokens.push(tokenstring);
            text = text.substr(result.index + result[0].length);
            result = this.tokenRegex.exec(text);
        }

        return tokens;
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

        if(key === "tokenstring"){
            return [this.parseTokenObject(card)];
        }

        let value = card[key];

        if(Array.isArray(value)){
            if(modifier === "join"){
                return [value.join("")];
            }else if(modifier === "0"){
                return [value[0]];
            }else if(modifier === "tokenid"){
                return (value as ScryfallRelatedCard[]).filter((x)=>{return x.component === ScryfallComponent.Token}).map((x)=>{return x.id});
            }else if(modifier === "orcolorless" && value.length === 0){
                return  [MTGCostType.Colorless];
            }else if(value && modifier){
                let allModifiers = prop.split(".");
                for(let i = 1; i < allModifiers.length; i++){
                    if(value){
                        value = value[allModifiers[i]];
                    }
                }
                return [value];
            }

            return value;
        }

        if(modifier === "parseTokens"){
            return this.parseTokens(card[key]);
        }

        if(modifier === "islegal"){
            let legalFormats = [];

            for(let format in value){
                if(value[format] === "legal"){
                    legalFormats.push(format);
                }
            }

            return legalFormats;
        }else if(modifier === "parseTypes" || modifier === "parseSuperTypes"){
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
        }else if(modifier === "parseSubTypes"){
            let result = this.cardTypesRegex.exec(value);
            if(!result || result.length < 3 || typeof result[2] !== "string") return [];
            return  result[2].trim().split(" ");
        }else if(value && modifier){
            let allModifiers = prop.split(".");
            for(let i = 1; i < allModifiers.length; i++){
                if(value){
                    value = value[allModifiers[i]];
                }
            }
            return [value];
        }
        
        if(!value && key === "image_uris" && card.card_faces){
            let result = card.card_faces[0].image_uris as any;
            if(modifier){
                result = result[modifier];
            }
            return [result];
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

    private excludeItem(operator: MapFilterOperator, realValue: string, expectedValue: string): boolean{
        realValue = realValue || "";
        if(operator === MapFilterOperator.Equals){
            if(realValue != expectedValue){
                return true;
            }
        }

        if(operator === MapFilterOperator.NotEquals){
            if(realValue == expectedValue){
                return true;
            }
        }

        if(operator === MapFilterOperator.Exists){
            if(!realValue){
                return true;
            }
        }

        if(operator === MapFilterOperator.Contains){
            if((realValue as string).indexOf(expectedValue) === -1){
                return true;
            }
        }

        if(operator === MapFilterOperator.NotContains){
            if((realValue as string).indexOf(expectedValue) !== -1){
                return true;
            }
        }

        return false;
    }

    private cardMeetsFilter(card: ScryfallFullCard): boolean{
        if(this.mapTemplate.data.filter){
            for(let filter of this.mapTemplate.data.filter){
                let rawValueList = this.getItem(card, filter.key);
                let expectedValue = filter.value;
                for(let realValue of rawValueList){
                    if(this.excludeItem(filter.operator, realValue, expectedValue)){
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