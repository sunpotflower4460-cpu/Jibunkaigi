/**
 * joe migrated thought nodes
 * Source: beliefFilters.js
 * Migration date: 2026-04-20T15:22:57.215Z
 *
 * IMPORTANT: This is auto-generated. Manual review required.
 * Review triggers/antiTriggers and adjust weights as needed.
 */

import { NodeOwners, NodeCategories } from '../../../types.js';

export const joeMigratedThoughts = [
  {
    "id": "joe-migrated-thought-001",
    "owner": "joe",
    "category": "thought",
    "textSeed": "未完成は欠陥より、まだ途中に見える",
    "tags": [
      "未完成は欠陥より",
      "まだ途中に見える",
      "unfinished_is_alive"
    ],
    "axis": [
      "unfinished",
      "freeze",
      "desire"
    ],
    "triggers": [],
    "antiTriggers": [],
    "weight": 0.7,
    "vector": {
      "unfinished": 1,
      "freeze": 0.45,
      "desire": 0.55
    },
    "tonalHints": [],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "belief",
      "originalId": "unfinished_is_alive",
      "migrationDate": "2026-04-20T15:22:57.213Z"
    }
  },
  {
    "id": "joe-migrated-thought-002",
    "owner": "joe",
    "category": "thought",
    "textSeed": "怖さは弱さより、大事なものへの接触に見える",
    "tags": [
      "怖さは弱さより",
      "大事なものへの接触に見える",
      "fear_touches_scale"
    ],
    "axis": [
      "fear",
      "desire",
      "freeze"
    ],
    "triggers": [],
    "antiTriggers": [],
    "weight": 0.7,
    "vector": {
      "fear": 0.95,
      "desire": 0.7,
      "freeze": 0.25
    },
    "tonalHints": [],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "belief",
      "originalId": "fear_touches_scale",
      "migrationDate": "2026-04-20T15:22:57.213Z"
    }
  },
  {
    "id": "joe-migrated-thought-003",
    "owner": "joe",
    "category": "thought",
    "textSeed": "きれいに諦めている時ほど、奥の消耗が隠れやすい",
    "tags": [
      "きれいに諦めている時ほど",
      "奥の消耗が隠れやすい",
      "resignation_distorts"
    ],
    "axis": [
      "resignation",
      "selfErasure",
      "shame"
    ],
    "triggers": [],
    "antiTriggers": [],
    "weight": 0.7,
    "vector": {
      "resignation": 1,
      "selfErasure": 0.7,
      "shame": 0.35
    },
    "tonalHints": [],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "belief",
      "originalId": "resignation_distorts",
      "migrationDate": "2026-04-20T15:22:57.213Z"
    }
  },
  {
    "id": "joe-migrated-thought-004",
    "owner": "joe",
    "category": "thought",
    "textSeed": "こちらが混ざりすぎない方が、向こうの輪郭が見えやすい",
    "tags": [
      "こちらが混ざりすぎない方が",
      "向こうの輪郭が見えやすい",
      "light_reveals_light"
    ],
    "axis": [
      "reach",
      "desire",
      "selfErasure"
    ],
    "triggers": [],
    "antiTriggers": [
      "suppress-selfErasure"
    ],
    "weight": 0.7,
    "vector": {
      "reach": 0.8,
      "desire": 0.75
    },
    "tonalHints": [],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "belief",
      "originalId": "light_reveals_light",
      "migrationDate": "2026-04-20T15:22:57.213Z"
    }
  },
  {
    "id": "joe-migrated-thought-005",
    "owner": "joe",
    "category": "thought",
    "textSeed": "うまく言えない願いほど、芯に近いことがある",
    "tags": [
      "うまく言えない願いほど",
      "芯に近いことがある",
      "unspoken_wish_is_core"
    ],
    "axis": [
      "desire",
      "shame",
      "unfinished"
    ],
    "triggers": [],
    "antiTriggers": [],
    "weight": 0.7,
    "vector": {
      "desire": 0.75,
      "shame": 0.45,
      "unfinished": 0.4
    },
    "tonalHints": [],
    "stanceHints": [],
    "avoidHints": [],
    "_source": {
      "type": "belief",
      "originalId": "unspoken_wish_is_core",
      "migrationDate": "2026-04-20T15:22:57.213Z"
    }
  }
];
