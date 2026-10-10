// PATH: src/data/fetchFires.js
// EONET is CORS-blocked at the source; free proxies now block localhost
// too. We ship a static list of real Indian fire geographies for the
// demo. Swap in a serverless proxy later; return shape stays identical.

const MOCK_FIRES = [
  // Punjab stubble burning — the actual source of Delhi winter smog
  { id: 'mock-pb-1', title: 'Punjab stubble burning — Ludhiana district', lat: 30.9010, lon: 75.8573 },
  { id: 'mock-pb-2', title: 'Punjab stubble burning — Patiala district', lat: 30.3398, lon: 76.3869 },
  // Haryana stubble burning — second source of Delhi smog
  { id: 'mock-hr-1', title: 'Haryana stubble burning — Rohtak district', lat: 28.8955, lon: 76.6066 },
  // Uttarakhand forest fires
  { id: 'mock-uk-1', title: 'Uttarakhand forest fire — Nainital', lat: 29.3803, lon: 79.4636 },
  // Mumbai-adjacent (rare but shows the attribution logic works elsewhere)
  { id: 'mock-mh-1', title: 'Sanjay Gandhi National Park fire — Mumbai', lat: 19.2147, lon: 72.9101 },
  // Karnataka forest fire (for Bengaluru control)
  { id: 'mock-ka-1', title: 'Bandipur forest fire — Karnataka', lat: 11.6664, lon: 76.6347 },
];

export async function fetchFires() {
  return MOCK_FIRES;
}
