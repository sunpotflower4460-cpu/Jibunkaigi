const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const sanitizeDebugValue = (value) => {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(sanitizeDebugValue).filter((item) => item !== undefined);
  if (!isPlainObject(value)) return undefined;

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, sanitizeDebugValue(item)])
      .filter(([, item]) => item !== undefined),
  );
};

const normalizeTimestamp = (value) => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const normalizeString = (value) => (typeof value === 'string' ? value : '');

const normalizeObject = (value) => {
  const sanitized = sanitizeDebugValue(value);
  return isPlainObject(sanitized) ? sanitized : {};
};

const normalizeNullableObject = (value) => {
  const sanitized = sanitizeDebugValue(value);
  return isPlainObject(sanitized) ? sanitized : null;
};

export const shouldBuildJoeDebugEntry = (options = {}) => {
  if (typeof options.enabled === 'boolean') return options.enabled;

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

  // Dev-only display artifact. This object is never written to Firestore and must stay
  // detached from the production prompt/persistence path.
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
