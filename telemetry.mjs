export const STALE_MS = 15000;
export function validateMeasurement(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('JSON объект қажет.');
  const {pointId, signal, baseline} = input;
  if (typeof pointId !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(pointId)) throw new Error('pointId: 1–32 латын әрпі, сан, _ немесе - қажет.');
  for (const [key,value] of Object.entries({signal,baseline})) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${key}: 0–100 аралығындағы сан қажет.`);
  }
  const hasLat=input.lat != null, hasLng=input.lng != null;
  if (hasLat !== hasLng) throw new Error('lat және lng бірге жіберілуі керек.');
  if (hasLat && (typeof input.lat !== 'number' || typeof input.lng !== 'number' || !Number.isFinite(input.lat) || !Number.isFinite(input.lng) || Math.abs(input.lat)>90 || Math.abs(input.lng)>180)) throw new Error('GPS координаталары дұрыс емес.');
  if (input.moundId != null && (typeof input.moundId !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(input.moundId))) throw new Error('moundId дұрыс емес.');
  const deviation = Number(Math.abs(signal-baseline).toFixed(2));
  return {pointId,signal,baseline,deviation,status:deviation>=20?'ANOMALY':deviation>=10?'RECHECK':'NORMAL',lat:hasLat?input.lat:null,lng:hasLng?input.lng:null,moundId:input.moundId || null,source:'ESP32'};
}
