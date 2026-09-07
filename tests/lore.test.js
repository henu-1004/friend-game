import test from 'node:test';
import assert from 'node:assert/strict';
import { traits, rollTrait, activate, damage } from '../src/lore.js';
const fighter = id => ({trait:traits.find(t=>t.id===id),hp:50,vx:100,vy:0,x:0,y:0,nextProc:0});
test('rematches always replace the previous trait',()=>{for(const trait of traits)for(let i=0;i<100;i++)assert.notEqual(rollTrait(trait.id).id,trait.id);});
test('immortal revives exactly once',()=>{const f=fighter('immortal');assert.equal(damage(f,60),true);assert.equal(f.hp,40);assert.equal(damage(f,60),false);assert.equal(f.hp,0);});
test('snack heals within cap and respects cooldown',()=>{const f=fighter('snack');f.hp=98;assert.equal(activate(f,[f],0),true);assert.equal(f.hp,100);assert.equal(activate(f,[f],1),false);});
test('escape activates only at low health; rage boosts movement',()=>{const f=fighter('escape');f.hp=90;assert.equal(activate(f,[f],0),false);f.hp=40;assert.equal(activate(f,[f],0),true);assert.equal(f.vx,180);const r=fighter('rage');activate(r,[r],0);assert.equal(r.vx,180);assert.equal(r.boostUntil,2);});
test('magnet pulls living opponents toward fighter',()=>{const f=fighter('magnet'),other={hp:100,x:100,y:0,vx:0,vy:0};activate(f,[f,other],0);assert.equal(other.vx,-140);assert.equal(other.vy,0);});
