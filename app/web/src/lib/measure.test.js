import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measure, candidates, number } from './measure.js';
const e = (id, x, y, width = 10, height = 10) => ({ id, label: id, source: 'accessibility', rect: { x, y, width, height } });
const region = { x: 0, y: 0, width: 100, height: 100 };
test('nearest horizontal and vertical gaps preserve fractional points', () => {
 const result = measure([e('a',0,0),e('b',20.25,0),e('c',40,0),e('d',0,30)], region);
 assert.equal(result.gaps.find(g=>g.from==='a' && g.axis==='x').distance,10.25);
 assert.equal(result.gaps.find(g=>g.from==='a' && g.axis==='y').distance,20);
 assert.equal(number(10.25),'10.3');
});
test('touching edges measure zero; overlap and diagonals do not', () => {
 assert.equal(measure([e('a',0,0),e('b',10,0)],region).gaps[0].distance,0);
 assert.equal(measure([e('a',0,0),e('b',5,5)],region).gaps.length,0);
 assert.equal(measure([e('a',0,0),e('b',20,20)],region).gaps.length,0);
});
test('innermost fully enclosed elements only', () => {
 const r = measure([e('outer',0,0,80,80),e('inner',10,10),e('outside',95,95)],region);
 assert.deepEqual(r.elements.map(e=>e.id),['inner']);
 assert.equal(measure([],region).elements.length,0);
});
test('stable nearest neighbor ties', () => {
 const a=e('a',0,0,10,30), b=e('b',20,0), c=e('c',20,20);
 assert.equal(measure([c,b,a],region).gaps.find(g=>g.from==='a' && g.axis==='x').to,'b');
});
test('SDK deduplication retains accessible label; disabled and mismatched SDK excluded', () => {
 const frame={ points: region, tree:{label:'App',children:[{role:'AXButton',label:'Continue',frame:e('a',10,10).rect}]}, sdk:null };
 const ax=candidates(frame); assert.equal(ax.length,1);
 frame.sdk={appName:'App',windows:[],tags:[{name:'Button',frame:e('a',11,10).rect}]};
 const sdk=candidates(frame); assert.equal(sdk.length,1); assert.equal(sdk[0].source,'sdk'); assert.match(sdk[0].label,/Continue/);
 assert.equal(candidates(frame),sdk);
 frame.sdk={...frame.sdk,appName:'Other'}; assert.equal(candidates(frame)[0].source,'accessibility');
 frame.sdk=null; assert.equal(candidates(frame)[0].rect.x,10);
});
test('invalid and offscreen bounds excluded',()=>{
 const frame={points:region,tree:{children:[{frame:e('x',-1,0).rect},{frame:e('y',0,0,NaN).rect}]}};
 assert.deepEqual(candidates(frame),[]);
});

test('hidden ancestors exclude their descendants',()=>{
 assert.deepEqual(candidates({points:region,tree:{children:[{hidden:true,children:[{frame:e('a',10,10).rect}]}]}}),[]);
});
test('pointer conversion is independent of CSS zoom and handles rotations',async()=>{
 const { pointerPoint, drawing }=await import('./measure.js');
 const screen={width:400,height:800};
 assert.deepEqual(pointerPoint(.25,.5,screen),{x:100,y:400});
 assert.deepEqual(pointerPoint(.25,.5,screen,'landscape-right'),{x:200,y:600});
 assert.deepEqual(pointerPoint(.25,.5,screen,'landscape-left'),{x:200,y:200});
 assert.deepEqual(pointerPoint(.25,.5,screen,'portrait-upside-down'),{x:300,y:400});
 assert.deepEqual(pointerPoint(100/400,400/800,screen),pointerPoint(200/800,800/1600,screen));
 const data=measure([e('a',0,0,20,10)],region,'landscape-right');
 assert.equal(drawing(data)[0].text,'10 × 20 pt');
});

test('component inspection measures the outer search box while internal inspection keeps its contents',()=>{
 const all=[{...e('search',0,0,90,30),component:true},e('icon',5,10),e('text',20,10,40,10),e('mic',70,5,15,20),e('row',0,40,90,30)];
 const outer=measure(all,region,'portrait','components');
 assert.deepEqual(outer.elements.map(e=>e.id),['search','row']);
 assert.equal(outer.gaps[0].distance,10);
 assert.equal(measure(all,region,'portrait','elements').elements.length,4);
 assert.equal(measure(all,{x:0,y:5,width:90,height:25},'portrait','components').elements.length,3);
});
test('component inspection never invents an absent border or promotes plain wrappers',()=>{
 const all=[e('wrapper',0,0,90,90),e('text',20,10,40,10),e('row',0,40,90,30)];
 assert.deepEqual(measure(all,region,'portrait','components').elements.map(e=>e.id),['text','row']);
});
test('tagged control bounds take priority over anonymous painted inner containers',()=>{
 const frame={points:{width:402,height:874},tree:{label:'Ape',children:[{role:'AXTextField',label:'Search',frame:{x:76,y:403,width:240,height:22}}]},sdk:{appName:'Ape',windows:[{frame:{x:0,y:0,width:402,height:874},children:[{type:'Painted',background:'#fff',frame:{x:70,y:399,width:250,height:30},children:[]}]}],tags:[{name:'StockSearchFieldView',frame:{x:24,y:386,width:354,height:58}}]}};
 const result=measure(candidates(frame),{x:0,y:0,width:402,height:874},'portrait','components');
 assert.equal(result.elements.length,1);
 assert.equal(result.elements[0].label,'StockSearchFieldView');
 assert.equal(result.elements[0].rect.height,58);
});
