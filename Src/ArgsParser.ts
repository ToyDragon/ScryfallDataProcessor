export default class ArgsParser{
    public args: {[argName: string]: string[]};

    public constructor(rawArgs?: string[]){
        this.args = {};
        if(rawArgs){
            let currentArg = "";
            for(let i = 0; i < rawArgs.length; i++){
                let piece = rawArgs[i];
                if(piece.substr(0,1) === "-"){
                    currentArg = piece.substring(1, piece.length);
                    if(currentArg.length > 0){
                        this.args[currentArg] = this.args[currentArg] || [];
                    }
                }else if(piece.length > 0 && currentArg.length > 0){
                    this.args[currentArg].push(piece);
                }
            }
        }
    }
}