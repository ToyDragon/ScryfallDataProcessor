import { ScryfallFullCard } from "mtgtypes";
import * as fs from "fs";

interface RawMapFilter{
    key?: keyof ScryfallFullCard;
    value?: keyof ScryfallFullCard;
    operator?: MapFilterOperator;
}

interface RawMapDetails{
    name: string;
    duplicates: boolean;
    key: string;
    value: string;
}

export enum MapFilterOperator{
    Equals = "equals",
    NotEquals = "notequals",
    Exists = "exists",
    Contains = "contains",
    NotContains = "notcontains"
}

export interface RawMapFileData{
    filter?: RawMapFilter[];
    maps?: RawMapDetails[];
}

export default class MapFile{

    public data: RawMapFileData;
    private path: string;

    public constructor(pathOrMapdata: string | RawMapFileData){
        if(typeof(pathOrMapdata) === "string"){
            this.path = pathOrMapdata;
        }else{
            this.data = pathOrMapdata;
        }
    }

    public loadFromFile(): Promise<void>{
        return new Promise((resolve, reject) => {
            fs.exists(this.path, (exists) => {
                if(!exists){
                    reject("Map file \"" + this.path + "\" doesn't exist");
                }else{
                    fs.readFile(this.path, {encoding: "utf8"}, (err, rawStringData) => {
                        if(err){
                            reject("Couldn't read map file");
                        }else{
                            this.data = JSON.parse(rawStringData);
                            let error = this.verifyData();
                            if(!error){
                                resolve();
                            }else{
                                reject(error);
                            }
                        }
                    });
                }
            })
        });
    }

    public verifyData(): string{
        if(!this.data) return "Unable to find root object.";
        if(this.data.filter){
            if(!Array.isArray(this.data.filter)) return "Filters are not an array.";
            for(let i = 0; i < this.data.filter.length; i++){
                let f = this.data.filter[i];
                if(!f) return "Filter object is null.";
                if(typeof(f) !== "object") return "Filter is not an object.";
                if(typeof(f.key) !== "string") return "Filter key is not a string.";
                if(f.key.length <= 0) return "Filter key is empty.";
                if(typeof(f.value) !== "string") return "Filter value is not a string.";
                if(f.value.length <= 0) return "Filter value is empty.";
                if(f.operator !== MapFilterOperator.Equals
                    && f.operator !== MapFilterOperator.NotEquals
                    && f.operator !== MapFilterOperator.Exists
                    && f.operator !== MapFilterOperator.Contains
                    && f.operator !== MapFilterOperator.NotContains) return "Filter operator inavlid.";
            }
        }
        
        if(!this.data.maps) return "Unable to find maps.";
        if(!Array.isArray(this.data.maps)) return "Maps are not an array.";
        if(this.data.maps.length === 0) return "Maps are empty.";
        for(let i = 0; i < this.data.maps.length; i++){
            let m = this.data.maps[i];
            if(!m) return "Map object is null.";
            if(typeof(m) !== "object") return "Map is not an object.";
            if(typeof(m.duplicates) !== "boolean") return "Map duplicate is not a boolean.";
            if(typeof(m.key) !== "string") return "Map key is not a string.";
            if(m.key.length <= 0) return "Map key is empty.";
            if(typeof(m.value) !== "string") return "Map value is not a string.";
            if(m.value.length <= 0) return "Map value is empty.";
            if(typeof(m.name) !== "string") return "Map name is not a string.";
            if(m.name.length <= 0) return "Map name is empty.";
        }

        return null;
    }
}