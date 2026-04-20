import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { joeThoughtNodes } from './joe/thoughtNodes.js';
import { joeFeelingNodes } from './joe/feelingNodes.js';
import { joeMoveNodes } from './joe/moveNodes.js';

import { kenThoughtNodes } from './ken/thoughtNodes.js';
import { kenFeelingNodes } from './ken/feelingNodes.js';
import { kenMoveNodes } from './ken/moveNodes.js';

import { minaThoughtNodes } from './mina/thoughtNodes.js';
import { minaFeelingNodes } from './mina/feelingNodes.js';
import { minaMoveNodes } from './mina/moveNodes.js';

import { rayThoughtNodes } from './ray/thoughtNodes.js';
import { rayFeelingNodes } from './ray/feelingNodes.js';
import { rayMoveNodes } from './ray/moveNodes.js';

import { satouThoughtNodes } from './satou/thoughtNodes.js';
import { satouFeelingNodes } from './satou/feelingNodes.js';
import { satouMoveNodes } from './satou/moveNodes.js';

import { mirrorThoughtNodes } from './mirror/thoughtNodes.js';
import { mirrorFeelingNodes } from './mirror/feelingNodes.js';
import { mirrorMoveNodes } from './mirror/moveNodes.js';

import { sharedThoughtNodes } from '../shared/thoughtNodes.js';
import { sharedFeelingNodes } from '../shared/feelingNodes.js';
import { sharedMoveNodes } from '../shared/moveNodes.js';

const imperativePattern = /しろ$|するな$|してください$|しないで$|せよ$/;

const baseFieldChecks = (node, expectedOwner, expectedCategory) => {
  assert.ok(node.id, 'id');
  assert.strictEqual(node.owner, expectedOwner, 'owner');
  assert.strictEqual(node.category, expectedCategory, 'category');
  assert.ok(node.textSeed, 'textSeed');
  assert.ok(Array.isArray(node.tags), 'tags');
  assert.ok(Array.isArray(node.axis), 'axis');
  assert.ok(Array.isArray(node.triggers), 'triggers');
  assert.ok(typeof node.weight === 'number', 'weight');
  assert.ok(node.weight > 0 && node.weight <= 1, 'weight range');
  if (node.antiTriggers) {
    assert.ok(Array.isArray(node.antiTriggers), 'antiTriggers array');
  }
};

const hintChecks = (node) => {
  const hintGroups = [node.tonalHints, node.stanceHints, node.avoidHints];
  for (const hints of hintGroups) {
    if (!hints) continue;
    assert.ok(Array.isArray(hints));
    hints.forEach((hint) => {
      assert.ok(typeof hint === 'string');
      assert.ok(!imperativePattern.test(hint), `imperative hint: ${hint}`);
    });
  }
};

const seedCheck = (node) => {
  assert.ok(node.textSeed.length < 120, `textSeed too long: ${node.id}`);
  assert.ok(!/です$|ます$|でしょう$|ください$|よ$/.test(node.textSeed), `textSeed should stay seed-like: ${node.id}`);
};

const agentConfigs = [
  { id: 'joe', thoughts: joeThoughtNodes, feelings: joeFeelingNodes, moves: joeMoveNodes, counts: { thought: 7, feeling: 5, move: 5 } },
  { id: 'ken', thoughts: kenThoughtNodes, feelings: kenFeelingNodes, moves: kenMoveNodes, counts: { thought: 6, feeling: 5, move: 5 } },
  { id: 'mina', thoughts: minaThoughtNodes, feelings: minaFeelingNodes, moves: minaMoveNodes, counts: { thought: 6, feeling: 6, move: 5 } },
  { id: 'ray', thoughts: rayThoughtNodes, feelings: rayFeelingNodes, moves: rayMoveNodes, counts: { thought: 6, feeling: 5, move: 5 } },
  { id: 'satou', thoughts: satouThoughtNodes, feelings: satouFeelingNodes, moves: satouMoveNodes, counts: { thought: 5, feeling: 4, move: 5 } },
  { id: 'mirror', thoughts: mirrorThoughtNodes, feelings: mirrorFeelingNodes, moves: mirrorMoveNodes, counts: { thought: 5, feeling: 4, move: 4 } },
];

describe('Agent particle structure', () => {
  for (const config of agentConfigs) {
    const { id, thoughts, feelings, moves, counts } = config;
    const allNodes = [...thoughts, ...feelings, ...moves];

    test(`${id} counts match targets`, () => {
      assert.strictEqual(thoughts.length, counts.thought);
      assert.strictEqual(feelings.length, counts.feeling);
      assert.strictEqual(moves.length, counts.move);
    });

    test(`${id} nodes have base fields and seeds`, () => {
      thoughts.forEach((node) => {
        baseFieldChecks(node, id, 'thought');
        seedCheck(node);
        hintChecks(node);
      });
      feelings.forEach((node) => {
        baseFieldChecks(node, id, 'feeling');
        seedCheck(node);
        hintChecks(node);
      });
      moves.forEach((node) => {
        baseFieldChecks(node, id, 'move');
        seedCheck(node);
        hintChecks(node);
      });
    });

    test(`${id} has multiple nodes with tonal hints`, () => {
      const withTonal = allNodes.filter((node) => Array.isArray(node.tonalHints) && node.tonalHints.length > 0);
      assert.ok(withTonal.length >= 3, `${id} should have several nodes carrying tonalHints`);
    });
  }
});

describe('Shared particle structure', () => {
  test('shared counts match targets', () => {
    assert.strictEqual(sharedThoughtNodes.length, 8);
    assert.strictEqual(sharedFeelingNodes.length, 9);
    assert.strictEqual(sharedMoveNodes.length, 9);
  });

  const sharedNodes = [
    ...sharedThoughtNodes.map((node) => ({ ...node, category: 'thought' })),
    ...sharedFeelingNodes.map((node) => ({ ...node, category: 'feeling' })),
    ...sharedMoveNodes.map((node) => ({ ...node, category: 'move' })),
  ];

  test('shared nodes have base fields and hints are descriptive', () => {
    sharedNodes.forEach((node) => {
      baseFieldChecks(node, 'shared', node.category);
      seedCheck(node);
      hintChecks(node);
    });
  });

  test('shared nodes include tonal hints', () => {
    const withHints = sharedNodes.filter((node) => Array.isArray(node.tonalHints) && node.tonalHints.length > 0);
    assert.ok(withHints.length >= 3, 'shared nodes should use tonalHints on several particles');
  });
});
