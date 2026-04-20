const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const normalizeTimestamp = (value) => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const normalizeString = (value) => (typeof value === 'string' ? value : '');

const normalizeObject = (value) => (isPlainObject(value) ? value : {});

const normalizeNullableObject = (value) => (isPlainObject(value) ? value : null);

export const buildJoeDebugEntry = (input = {}) => {
  const source = isPlainObject(input) ? input : {};

  return {
    timestamp: normalizeTimestamp(source.timestamp),
    userText: normalizeString(source.userText),
    estimateState: normalizeObject(source.estimateState),
    microSignals: normalizeObject(source.microSignals),
    microSignalBias: normalizeNullableObject(source.microSignalBias),
    fusedState: normalizeNullableObject(source.fusedState),
    protoMeaning: normalizeNullableObject(source.protoMeaning),
    activated: normalizeObject(source.activated),
    systemInstruction: normalizeString(source.systemInstruction),
    promptText: normalizeString(source.promptText),
  };
};
