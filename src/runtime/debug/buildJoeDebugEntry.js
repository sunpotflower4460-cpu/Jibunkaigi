const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const normalizeTimestamp = (value) => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const normalizeString = (value) => (typeof value === 'string' ? value : '');

const normalizeObject = (value) => (isPlainObject(value) ? value : {});

const normalizeNullableObject = (value) => (isPlainObject(value) ? value : null);

export const shouldBuildJoeDebugEntry = (options = {}) => {
  const {
    isJoeDebugAvailable = false,
    isJoeDebugPanelVisible = false,
    agentId = '',
    isMaster = false,
  } = options;
  return Boolean(isJoeDebugAvailable && isJoeDebugPanelVisible && agentId === 'creative' && !isMaster);
};

export const buildJoeDebugEntry = (input = {}, options = null) => {
  if (options && !shouldBuildJoeDebugEntry(options)) return null;
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
