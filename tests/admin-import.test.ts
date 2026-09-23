import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareImport } from "../lib/admin/import-words";

test("CSV handles quoted commas, escaped quotes, multiline fields and Vietnamese", () => {
  const result = prepareImport({csv: 'word,definition,example,meaning_vi\r\nhello,"A, greeting","Say ""hello""\nagain",xin chào'});
  assert.equal(result.errors.length, 0);
  assert.equal(result.words[0].example, 'Say "hello"\nagain');
  assert.equal(result.words[0].meaningVi, "xin chào");
});
test("import validates all rows and reports their source position", () => {
  const result = prepareImport({ words: [
    {word:"hello",definition:"Greeting",example:"Hello!",meaningVi:"xin chào"},
    {word:"bad",definition:"",example:"Bad",meaningVi:"xấu"},
  ] });
  assert.equal(result.words.length, 1);
  assert.equal(result.errors[0].line, 2);
});
test("import rejects malformed, oversized and ambiguous input", () => {
  assert.throws(() => prepareImport({csv:'word,definition,example,meaning_vi\nx,"unclosed,x,y'}));
  assert.throws(() => prepareImport({words:Array(201).fill({})}));
  assert.throws(() => prepareImport({csv:"x".repeat(262145)}));
  assert.throws(() => prepareImport({csv:"x",words:[]}));
});
test("import reports duplicate words without silently overwriting them", () => {
  const w = {word:"hello",definition:"Greeting",example:"Hello!",meaningVi:"xin chào"};
  const result = prepareImport({words:[w,{...w,word:"HELLO"}]}, ["hello"]);
  assert.equal(result.warnings.length, 2);
});
