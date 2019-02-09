# Scryfall Data Processor
Loads bulk data from scryfall, and processes it into smaller index files useful for web applications. Index files are large key value maps that contain very specific data. For example, the generated index "CardIDToName.json" would contain:

    {  
        "ac709474-7790-483f-9ed5-ea7abccfce53":"Island",  
        "b79ec1ab-99ac-4552-891e-839067f606fc":"Forest",  
        "8b95a588-8dd1-49f7-92d8-34e2237769f2":"Mountain",  
        "7562f3d1-bde9-4f5d-a51a-01e6d0578695":"Swamp",  
        "378318f0-c45b-4e02-a3c7-931796e8796a":"Plains",  
        "a3a9755c-b76f-4afd-b891-6ad85e3a5e2b":"Zegana, Utopian Speaker",  
        "846b7039-9449-4064-8101-1260c59872a5":"Ruric Thar, the Unbowed"  
        ...  
    }

# Usage
You can download the default indices directly from the Files directory in this repository for initial prototyping, but I strongly recommend you install the package and maintain the maps on your own. You will be insulated from any bugs that get committed, and you will be able to update the maps whenever you want. To do so install the package globally and use the CLI

> npm install -g scryfalldataprocessor

Use the -a flag to update the bulk data file from Scryfall, optionally with the -i flag to specifiy the location of the AllCards.json file. If not specified the default location is ./Files/AllCards.json
> sfdata -a  

or 

> sfdata -a -i ../../Data/AllCards.json

Use the optional -f flag to override the 1 day cooldown on updated the AllSets.json file. Be mindful of your impact on Scryfall please.

> sfdata -a -f

Use the -p flag to construct the indices, optionally with a map template file or the default if not specified.
> sfdata -p  

or

> sfdata -p ./spanishCards.json

Use the optional -o flag to specify a different output directory

> sfdata -p -o ../../Data/Indices

The default indices are:  
./Files/SetCodeToName.json - Maps set codes to set names  
./Files/CardIDToName.json - Maps Scryfall IDs to card names  
./Files/CardIDToSetCode.json - Maps Scryfall IDs to the code of the set it was printed in  
./Files/SetCodeToCardID.json - Maps set code to arrays of Scryfall IDs  
./Files/CardIDToOracleID.json - Maps Scryfall IDs to Oracle IDs  
./Files/OracleIDToCardID.json - Maps Oracle IDs to Scryfall IDs  
./Files/CardIDToRarity.json - Maps Scryfall IDs to rarity strings  
./Files/RarityToCardID.json - Maps rarity strings to arrays of Scryfall IDs  
./Files/CMCToCardID.json - Maps CMCs to arrays of Scryfall IDs  
./Files/CardIDToCMC.json - Maps Scryfall IDs to CMCs  
./Files/CardIDToColorIdentity.json - Maps Scryfall IDs to arrays of color strings  
./Files/ColorIdentityToCardID.json - Maps color strings to arrays of Scryfall IDs. Keys are single colors, multicolored cards show up in all relevant arrays.  
./Files/CardIDToColor.json - Maps Scryfall IDs to arrays of color strings  
./Files/ColorToCardID.json - Maps color strings to arrays of Scryfall IDs  
./Files/OracleIDToText.json - Maps Oracle IDs to oracle text  
./Files/CardIDToText.json - Maps Scryfall IDs to oracle text  
./Files/CardIDToMultiverseID.json - Maps Scryfall IDs to Multiverse IDs  
./Files/CardIDToPower.json - Maps Scryfall IDs to power strings  
./Files/CardIDToToughness.json - Maps Scryfall IDs to toughness strings  
./Files/CardIDToTokens.json - Maps Scryfall IDs to token Scryfall IDs  
./Files/CardIDToTypes.json - Maps Scryfall IDs to arrays of type strings  
./Files/CardIDToSubTypes.json - Maps Scryfall IDs to arrays of subtype strings  
./Files/CardIDToSuperTypes.json - Maps Scryfall IDs to arrays of supertype strings  
./Files/CardIDToLegalFormats.json - Maps Scryfall IDs to arrays of legal format names  
./Files/CardIDToNormalImageURI.json - Maps Scryfall IDs to normal sized image URIs  

## Map Template Files
Create a map template file to alter the indices created and data in them. Map templates follow this structure:

    {  
        "filter": [  
            {  
                "key": <string key from MTGTypes.ScryfallFullCard>,  
                "operator": <"equals" or "notequals">,  
                "value": <string value to compare against>  
            }  
        ],  
        "maps": [  
            {  
                "name": <string name of file>,  
                "duplicates": <boolean, true if the index maps keys to arrays of values>,  
                "key": <string key from MTGTypes.ScryfallFullCard to be used as key>,  
                "value": <string key from MTGTypes.ScryfallFullCard to be used as value>  
            }  
        ]   
    }  

Reference [MTGTypes.ScryfallFullCard](https://github.com/ToyDragon/MTGTypes/blob/93d2a0b6e9dfa64d9c235329a1973024964c03f2/Types.ts#L270)  or the [Scryfall API Documentation](https://scryfall.com/docs/api/cards) for available keys and values. For more concrete examples view the [defaultMaps](https://github.com/ToyDragon/ScryfallDataProcessor/blob/master/defaultMaps.json) template file, or the [tokenMaps](https://github.com/ToyDragon/ScryfallDataProcessor/blob/master/tokenMaps.json) template file. Once your map template file is created, pass it along with the -p flag:

> sfdata -p ./myMapTemplate.json

## MTGJson ID Map
Recently MTGJson removed the id field, the default index ./ExternalData/MTGJsonIDToCardID.json is meant to help with this. It maps the old MTGJson ID to Scryfall ID. Only cards with Multiverse IDs are present in the index, I still need to map the others over.
