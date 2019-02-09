#Scryfall Data Processor
Loads bulk data from scryfall, and processes it into smaller index files useful for web applications. Index files are large key value maps that contain very specific data. For example, the generated index "CardIDToName.json" would contain:

>{
>  "ac709474-7790-483f-9ed5-ea7abccfce53":"Island",
>  "b79ec1ab-99ac-4552-891e-839067f606fc":"Forest",
>  "8b95a588-8dd1-49f7-92d8-34e2237769f2":"Mountain",
>  "7562f3d1-bde9-4f5d-a51a-01e6d0578695":"Swamp",
>  "378318f0-c45b-4e02-a3c7-931796e8796a":"Plains",
>  "a3a9755c-b76f-4afd-b891-6ad85e3a5e2b":"Zegana, Utopian Speaker",
>  "846b7039-9449-4064-8101-1260c59872a5":"Ruric Thar, the Unbowed"
>  ...
>}

#Usage
Install globally and use the CLI to manage your indices.

> npm install -g scryfalldataprocessor

Use the -a flag to update the bulk data file from Scryfall.
> sfdata -a

Use the -p flag to construct the default indices.
> sfdata -p

##Map Template Files
Create a map template file to alter the indices created and data in them. Map templates follow this structure:

>{
>    "filter": [
>        {
>            "key": <string key from [MTGTypes.ScryfallFullCard](https://github.com/ToyDragon/MTGTypes/blob/93d2a0b6e9dfa64d9c235329a1973024964c03f2/Types.ts#L270)>,
>            "operator": <"equals" or "notequals">,
>            "value": <string value to compare against>
>        }
>    ],
>    "maps": [
>        {
>            "name": <string name of file>,
>            "duplicates": <boolean, true if the index maps keys to arrays of values>,
>            "key": "set",
>            "value": "set_name"
>        }
>    ]
>}

For more concrete examples view the [defaultMaps](https://github.com/ToyDragon/ScryfallDataProcessor/blob/master/defaultMaps.json) template file, or the [tokenMaps](https://github.com/ToyDragon/ScryfallDataProcessor/blob/master/tokenMaps.json) template file. Once your map template file is created, pass it along with the -p flag:

> sfdata -p ./myMapTemplate.json