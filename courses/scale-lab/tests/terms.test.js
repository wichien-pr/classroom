import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {glossaryInventory} from '../src/terms.js';
const expected=JSON.parse(readFileSync(new URL('./fixtures/glossary-expansions.json',import.meta.url)));
const aliases=glossaryInventory.flatMap(entry=>entry.aliases);
test('reviewed acronym inventory is exhaustive with independent expected forms',()=>{
 assert.deepEqual(Object.fromEntries(aliases.filter(a=>a.fullForm).map(a=>[a.name,a.fullForm])),expected);
 for(const alias of aliases.filter(a=>a.fullForm))assert.equal(alias.heading,`${alias.name} (${expected[alias.name]})`);
 for(const entry of glossaryInventory){assert.ok(entry.meaning);assert.ok(entry.example);assert.ok(entry.warning);}
});
test('products, ordinary words, SQL keywords and shorthand get no fabricated full forms',()=>{
 for(const name of ['Redis','Memcached','JOIN','p95','Dedup','App','Origin','Relational']){
  assert.equal(aliases.find(a=>a.name===name).fullForm,null,name);
 }
 for(const name of ['Redis','Memcached','JOIN','p95'])assert.equal(aliases.find(a=>a.name===name).heading,name);
});
test('aliases retain canonical grouping independently from acronym headings',()=>{
 for(const [canonical,alias] of [['TLS','HTTPS'],['SQL','RDBMS'],['RPO','RTO'],['Throughput','RPS'],['Stale data','TTL']]){
  const entry=glossaryInventory.find(e=>e.title===canonical);
  assert.ok(entry.aliases.some(a=>a.name===alias));
  assert.equal(entry.aliases.find(a=>a.name===alias).heading,`${alias} (${expected[alias]})`);
 }
});
