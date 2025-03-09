import { describe, expect, it } from 'bun:test';
import { taggifyString } from '../../src/utils/taggify';

describe('taggifyString', () => {
  it('should add prefixes', () => {
    expect(taggifyString('prefix', 'hello')).toBe('[prefix] hello');
  });
  it('should replace spaces', () => {
    expect(taggifyString('prefix', 'hello world')).toBe('[prefix] hello_world');
  });
  it('should remove spaces at start or end', () => {
    expect(taggifyString('prefix', ' hello world ')).toBe('[prefix] hello_world');
  });
  it('should replace special characters', () => {
    expect(taggifyString('prefix', ' héllõ wôrld ')).toBe('[prefix] hello_world');
  });
});
