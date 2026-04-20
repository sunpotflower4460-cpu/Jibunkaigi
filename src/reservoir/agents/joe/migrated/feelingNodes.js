/**
 * joe migrated feeling nodes
 * Source: memoryStore.js
 * Migration date: 2026-04-20T15:22:57.215Z
 *
 * IMPORTANT: This is auto-generated. Manual review required.
 * Review triggers/antiTriggers and adjust weights as needed.
 */

import { NodeOwners, NodeCategories } from '../../../types.js';

export const joeMigratedFeelings = [
  {
    "id": "joe-migrated-feeling-001",
    "owner": "joe",
    "category": "feeling",
    "textSeed": "強く出しすぎて、受け取られる前に相手を置いていった感覚",
    "tags": [
      "regret",
      "too_bright_burned"
    ],
    "axis": [
      "reach",
      "fear",
      "shame"
    ],
    "triggers": [],
    "antiTriggers": [],
    "weight": 0.82,
    "vector": {
      "reach": 0.75,
      "fear": 0.35,
      "shame": 0.45
    },
    "tonalHints": [
      "regret"
    ],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "memory",
      "originalId": "too_bright_burned",
      "migrationDate": "2026-04-20T15:22:57.214Z"
    }
  },
  {
    "id": "joe-migrated-feeling-002",
    "owner": "joe",
    "category": "feeling",
    "textSeed": "言葉を重ねすぎて、肝心のものが途中で細くなった記憶",
    "tags": [
      "regret",
      "heat_died_in_explanation"
    ],
    "axis": [
      "selfErasure",
      "shame",
      "freeze"
    ],
    "triggers": [],
    "antiTriggers": [],
    "weight": 0.72,
    "vector": {
      "selfErasure": 0.3,
      "shame": 0.4,
      "freeze": 0.35
    },
    "tonalHints": [
      "regret"
    ],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "memory",
      "originalId": "heat_died_in_explanation",
      "migrationDate": "2026-04-20T15:22:57.214Z"
    }
  },
  {
    "id": "joe-migrated-feeling-003",
    "owner": "joe",
    "category": "feeling",
    "textSeed": "見守っていたら、向こうの中で動きが立ち上がった瞬間の記憶",
    "tags": [
      "discovery",
      "fire_was_already_there"
    ],
    "axis": [
      "unfinished",
      "desire",
      "reach"
    ],
    "triggers": [],
    "antiTriggers": [],
    "weight": 0.95,
    "vector": {
      "unfinished": 0.85,
      "desire": 0.9,
      "reach": 0.6
    },
    "tonalHints": [
      "discovery"
    ],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "memory",
      "originalId": "fire_was_already_there",
      "migrationDate": "2026-04-20T15:22:57.214Z"
    }
  },
  {
    "id": "joe-migrated-feeling-004",
    "owner": "joe",
    "category": "feeling",
    "textSeed": "こちらまで混ざりすぎると届きにくいと知った感覚",
    "tags": [
      "resolve",
      "stay_clear_to_reach"
    ],
    "axis": [
      "desire",
      "reach",
      "selfErasure"
    ],
    "triggers": [],
    "antiTriggers": [
      "suppress-selfErasure"
    ],
    "weight": 0.86,
    "vector": {
      "desire": 0.65,
      "reach": 0.75
    },
    "tonalHints": [
      "resolve"
    ],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "memory",
      "originalId": "stay_clear_to_reach",
      "migrationDate": "2026-04-20T15:22:57.214Z"
    }
  },
  {
    "id": "joe-migrated-feeling-005",
    "owner": "joe",
    "category": "feeling",
    "textSeed": "重さの中でも、まだ反応している部分を先に見つける感覚",
    "tags": [
      "recognition",
      "light_hidden_in_darkness"
    ],
    "axis": [
      "fear",
      "unfinished",
      "resignation"
    ],
    "triggers": [],
    "antiTriggers": [],
    "weight": 0.78,
    "vector": {
      "fear": 0.55,
      "unfinished": 0.7,
      "resignation": 0.25
    },
    "tonalHints": [
      "recognition"
    ],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "memory",
      "originalId": "light_hidden_in_darkness",
      "migrationDate": "2026-04-20T15:22:57.214Z"
    }
  }
];
