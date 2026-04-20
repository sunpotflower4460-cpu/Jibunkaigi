const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const normalizeTimestamp = (value) => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const normalizeString = (value) => (typeof value === 'string' ? value : '');

const normalizeObject = (value) => (isPlainObject(value) ? value : {});

const normalizeNullableObject = (value) => (isPlainObject(value) ? value : null);

export const buildJoeDebugEntry = ({
  timestamp = null,
  userText = '',
  estimateState = {},
  microSignals = {},
  microSignalBias = null,
  fusedState = null,
  protoMeaning = null,
  activated = {},
  systemInstruction = '',
  promptText = '',
} = {}) => ({
  timestamp: normalizeTimestamp(timestamp),
  userText: normalizeString(userText),
  estimateState: normalizeObject(estimateState),
  microSignals: normalizeObject(microSignals),
  microSignalBias: normalizeNullableObject(microSignalBias),
  fusedState: normalizeNullableObject(fusedState),
  protoMeaning: normalizeNullableObject(protoMeaning),
  activated: normalizeObject(activated),
  systemInstruction: normalizeString(systemInstruction),
  promptText: normalizeString(promptText),
});
