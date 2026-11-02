import {writeFileSync} from 'node:fs';
const str={type:'string',minLength:1};
const obj=(properties)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const arr=(items)=>({type:'array',items});
const schema={ $schema:'https://json-schema.org/draft/2020-12/schema',title:'Source-grounded model',...obj({version:{enum:['1']},source:obj({file:str,sha256:str}),sections:arr(obj({title:str,line:{type:'integer',minimum:1}})),facts:arr(obj({id:str,status:{enum:['explicit']},source:obj({file:str,section:str,line:{type:'integer',minimum:1},text:str})})),entities:arr(obj({id:str,name:str,description:str,attributeCandidates:arr(str),sourceFactId:str,status:{enum:['proposed-in-source']}})),physicalTables:arr(obj({})),physicalReady:{enum:[false]},ambiguities:arr(str)})};
writeFileSync('metadata/model.schema.json',JSON.stringify(schema,null,2)+'\n');
