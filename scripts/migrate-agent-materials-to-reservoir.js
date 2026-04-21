#!/usr/bin/env node
/**
 * migrate-agent-materials-to-reservoir.js
 *
 * Phase P-2: Migrate agent materials (beliefFilters/memoryStore/fieldNodes)
 * to reservoir format (thought/feeling/move nodes).
 *
 * Purpose:
 * - Read belief/memory/field from 5 agents (joe, ray, ken, mina, satou)
 * - Convert to reservoir node format: { id, textSeed, tags, vector, type }
 * - Map: belief → thought, memory → feeling, fieldNode → move
 * - Output to src/reservoir/agents/{name}/migrated/
 * - Preserve vector format (desire, fear, freeze, etc.)
 * - Auto-generate tags from tone/sense/id prefixes
 * - Log exceptions for manual review
 *
 * IMPORTANT: This is ADDITIVE ONLY - does not delete/overwrite existing nodes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Agent list
const AGENTS = ['joe', 'ray', 'ken', 'mina', 'satou'];

// Mapping rules
const MAPPING_RULES = {
  belief: 'thought',
  memory: 'feeling',
  field: 'move'
};

// Migration log
const migrationLog = {
  timestamp: new Date().toISOString(),
  agents: {},
  exceptions: [],
  summary: {
    totalBeliefs: 0,
    totalMemories: 0,
    totalFieldNodes: 0,
    totalThoughts: 0,
    totalFeelings: 0,
    totalMoves: 0
  }
};

/**
 * Convert belief filter to thought node
 */
function beliefToThought(belief, agentName, index) {
  const id = `${agentName}-migrated-thought-${String(index + 1).padStart(3, '0')}`;

  // Generate tags from sense/id
  const tags = [];
  if (belief.sense) {
    // Extract meaningful words from sense
    const senseWords = belief.sense
      .replace(/[、。]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 3);
    tags.push(...senseWords);
  }
  if (belief.id) {
    tags.push(belief.id);
  }

  // Extract axis from vector keys
  const axis = Object.keys(belief.vector || {});

  return {
    id,
    owner: agentName,
    category: 'thought',
    textSeed: belief.sense || belief.id || 'untitled belief',
    tags: [...new Set(tags)], // deduplicate
    axis,
    triggers: [], // will need manual review
    antiTriggers: [],
    weight: 0.7, // default weight
    vector: belief.vector || {},
    tonalHints: [],
    stanceHints: [],
    avoidHints: [],
    _source: {
      type: 'belief',
      originalId: belief.id,
      migrationDate: new Date().toISOString()
    }
  };
}

/**
 * Convert memory to feeling node
 */
function memoryToFeeling(memory, agentName, index) {
  const id = `${agentName}-migrated-feeling-${String(index + 1).padStart(3, '0')}`;

  // Generate tags from tone/trace/id
  const tags = [];
  if (memory.tone) {
    tags.push(memory.tone);
  }
  if (memory.id) {
    tags.push(memory.id);
  }

  // Extract axis from vector keys
  const axis = Object.keys(memory.vector || {});

  return {
    id,
    owner: agentName,
    category: 'feeling',
    textSeed: memory.trace || memory.id || 'untitled memory',
    tags: [...new Set(tags)],
    axis,
    triggers: [], // will need manual review
    antiTriggers: [],
    weight: memory.weight || 0.7,
    vector: memory.vector || {},
    tonalHints: memory.tone ? [memory.tone] : [],
    stanceHints: [],
    avoidHints: [],
    _source: {
      type: 'memory',
      originalId: memory.id,
      migrationDate: new Date().toISOString()
    }
  };
}

/**
 * Convert field node to move node
 */
function fieldToMove(fieldNode, agentName, index) {
  const id = `${agentName}-migrated-move-${String(index + 1).padStart(3, '0')}`;

  // Generate tags from text/id
  const tags = [];
  if (fieldNode.id) {
    tags.push(fieldNode.id);
  }

  // Extract meaningful words from text
  if (fieldNode.text) {
    const textWords = fieldNode.text
      .replace(/[、。]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .slice(0, 3);
    tags.push(...textWords);
  }

  // Extract axis from vector keys
  const axis = Object.keys(fieldNode.vector || {});

  return {
    id,
    owner: agentName,
    category: 'move',
    textSeed: fieldNode.text || fieldNode.id || 'untitled field node',
    tags: [...new Set(tags)],
    axis,
    triggers: [], // will need manual review
    antiTriggers: [],
    weight: 0.7,
    vector: fieldNode.vector || {},
    tonalHints: [],
    stanceHints: [],
    avoidHints: [],
    _source: {
      type: 'field',
      originalId: fieldNode.id,
      migrationDate: new Date().toISOString()
    }
  };
}

/**
 * Handle negative values in vectors
 * Reservoir expects positive values, so we convert negative weights to suppressionTags
 */
function handleNegativeVectorValues(node) {
  const { vector } = node;
  const negativeAxes = [];

  for (const [key, value] of Object.entries(vector)) {
    if (value < 0) {
      negativeAxes.push(key);
      // Remove negative value from vector
      delete vector[key];
    }
  }

  if (negativeAxes.length > 0) {
    // Add suppression tags
    node.antiTriggers = node.antiTriggers || [];
    node.antiTriggers.push(...negativeAxes.map(axis => `suppress-${axis}`));

    migrationLog.exceptions.push({
      nodeId: node.id,
      issue: 'negative-vector-values',
      axes: negativeAxes,
      resolution: 'converted to antiTriggers'
    });
  }

  return node;
}

/**
 * Migrate a single agent's materials
 */
async function migrateAgent(agentName) {
  console.log(`\n📦 Migrating agent: ${agentName}`);

  const agentPath = path.join(projectRoot, 'src', 'agents', agentName);
  const agentLog = {
    beliefs: { count: 0, nodes: [] },
    memories: { count: 0, nodes: [] },
    fieldNodes: { count: 0, nodes: [] },
    errors: []
  };

  // Load belief filters
  try {
    const beliefPath = path.join(agentPath, 'beliefFilters.js');
    if (fs.existsSync(beliefPath)) {
      const module = await import(beliefPath);
      const beliefs = module.beliefFilters || module.default || [];

      const thoughts = beliefs.map((belief, idx) => {
        const node = beliefToThought(belief, agentName, idx);
        return handleNegativeVectorValues(node);
      });

      agentLog.beliefs.count = beliefs.length;
      agentLog.beliefs.nodes = thoughts;
      migrationLog.summary.totalBeliefs += beliefs.length;
      migrationLog.summary.totalThoughts += thoughts.length;

      console.log(`  ✓ Beliefs: ${beliefs.length} → ${thoughts.length} thoughts`);
    }
  } catch (error) {
    agentLog.errors.push({ type: 'belief', error: error.message });
    console.error(`  ✗ Error loading beliefs: ${error.message}`);
  }

  // Load memory store
  try {
    const memoryPath = path.join(agentPath, 'memoryStore.js');
    if (fs.existsSync(memoryPath)) {
      const module = await import(memoryPath);
      const memories = module.memoryStore || module.default || [];

      const feelings = memories.map((memory, idx) => {
        const node = memoryToFeeling(memory, agentName, idx);
        return handleNegativeVectorValues(node);
      });

      agentLog.memories.count = memories.length;
      agentLog.memories.nodes = feelings;
      migrationLog.summary.totalMemories += memories.length;
      migrationLog.summary.totalFeelings += feelings.length;

      console.log(`  ✓ Memories: ${memories.length} → ${feelings.length} feelings`);
    }
  } catch (error) {
    agentLog.errors.push({ type: 'memory', error: error.message });
    console.error(`  ✗ Error loading memories: ${error.message}`);
  }

  // Load field nodes
  try {
    const fieldPath = path.join(agentPath, 'field.js');
    if (fs.existsSync(fieldPath)) {
      const module = await import(fieldPath);
      const fieldNodes = module[`${agentName.toUpperCase()}_FIELD_NODES`]
                      || module.fieldNodes
                      || module.default
                      || [];

      const moves = fieldNodes.map((fieldNode, idx) => {
        const node = fieldToMove(fieldNode, agentName, idx);
        return handleNegativeVectorValues(node);
      });

      agentLog.fieldNodes.count = fieldNodes.length;
      agentLog.fieldNodes.nodes = moves;
      migrationLog.summary.totalFieldNodes += fieldNodes.length;
      migrationLog.summary.totalMoves += moves.length;

      console.log(`  ✓ Field nodes: ${fieldNodes.length} → ${moves.length} moves`);
    }
  } catch (error) {
    agentLog.errors.push({ type: 'field', error: error.message });
    console.error(`  ✗ Error loading field nodes: ${error.message}`);
  }

  migrationLog.agents[agentName] = agentLog;
  return agentLog;
}

/**
 * Write migrated nodes to files
 */
function writeMigratedFiles(agentName, agentLog) {
  const migratedDir = path.join(projectRoot, 'src', 'reservoir', 'agents', agentName, 'migrated');

  // Create migrated directory
  if (!fs.existsSync(migratedDir)) {
    fs.mkdirSync(migratedDir, { recursive: true });
  }

  // Write thoughts (from beliefs)
  if (agentLog.beliefs.nodes.length > 0) {
    const thoughtPath = path.join(migratedDir, 'thoughtNodes.js');
    const content = `/**
 * ${agentName} migrated thought nodes
 * Source: beliefFilters.js
 * Migration date: ${new Date().toISOString()}
 *
 * IMPORTANT: This is auto-generated. Manual review required.
 * Review triggers/antiTriggers and adjust weights as needed.
 */

import { NodeOwners, NodeCategories } from '../../../types.js';

export const ${agentName}MigratedThoughts = ${JSON.stringify(agentLog.beliefs.nodes, null, 2)};
`;
    fs.writeFileSync(thoughtPath, content);
    console.log(`  📝 Wrote: ${thoughtPath}`);
  }

  // Write feelings (from memories)
  if (agentLog.memories.nodes.length > 0) {
    const feelingPath = path.join(migratedDir, 'feelingNodes.js');
    const content = `/**
 * ${agentName} migrated feeling nodes
 * Source: memoryStore.js
 * Migration date: ${new Date().toISOString()}
 *
 * IMPORTANT: This is auto-generated. Manual review required.
 * Review triggers/antiTriggers and adjust weights as needed.
 */

import { NodeOwners, NodeCategories } from '../../../types.js';

export const ${agentName}MigratedFeelings = ${JSON.stringify(agentLog.memories.nodes, null, 2)};
`;
    fs.writeFileSync(feelingPath, content);
    console.log(`  📝 Wrote: ${feelingPath}`);
  }

  // Write moves (from field nodes)
  if (agentLog.fieldNodes.nodes.length > 0) {
    const movePath = path.join(migratedDir, 'moveNodes.js');
    const content = `/**
 * ${agentName} migrated move nodes
 * Source: field.js
 * Migration date: ${new Date().toISOString()}
 *
 * IMPORTANT: This is auto-generated. Manual review required.
 * Review triggers/antiTriggers and adjust weights as needed.
 */

import { NodeOwners, NodeCategories } from '../../../types.js';

export const ${agentName}MigratedMoves = ${JSON.stringify(agentLog.fieldNodes.nodes, null, 2)};
`;
    fs.writeFileSync(movePath, content);
    console.log(`  📝 Wrote: ${movePath}`);
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting agent materials migration to reservoir...\n');
  console.log('Phase P-2: activateAgent unification');
  console.log('Mapping: belief → thought, memory → feeling, field → move\n');

  // Migrate each agent
  for (const agentName of AGENTS) {
    const agentLog = await migrateAgent(agentName);
    writeMigratedFiles(agentName, agentLog);
  }

  // Write migration log
  const logPath = path.join(projectRoot, 'scripts', 'migration-log.json');
  fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));
  console.log(`\n📊 Migration log written to: ${logPath}`);

  // Print summary
  console.log('\n📈 Migration Summary:');
  console.log(`  Total beliefs → thoughts: ${migrationLog.summary.totalBeliefs} → ${migrationLog.summary.totalThoughts}`);
  console.log(`  Total memories → feelings: ${migrationLog.summary.totalMemories} → ${migrationLog.summary.totalFeelings}`);
  console.log(`  Total field nodes → moves: ${migrationLog.summary.totalFieldNodes} → ${migrationLog.summary.totalMoves}`);
  console.log(`  Exceptions: ${migrationLog.exceptions.length}`);

  if (migrationLog.exceptions.length > 0) {
    console.log('\n⚠️  Exceptions requiring manual review:');
    migrationLog.exceptions.forEach((exc, idx) => {
      console.log(`  ${idx + 1}. ${exc.nodeId}: ${exc.issue} (${exc.resolution})`);
    });
  }

  console.log('\n✅ Migration complete!');
  console.log('\n⚠️  IMPORTANT: Manual review required before committing:');
  console.log('   1. Review all migrated nodes in src/reservoir/agents/*/migrated/');
  console.log('   2. Adjust triggers/antiTriggers for each node');
  console.log('   3. Verify weights are appropriate');
  console.log('   4. Check exception log for negative vector values');
  console.log('   5. Run tests: npm run test:run');
}

// Run migration
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
