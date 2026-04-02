/**
 * sqlite-adapter.js
 *
 * Envuelve el módulo nativo `node:sqlite` (disponible desde Node 22.5+)
 * con una API compatible con better-sqlite3, para que los modelos
 * no necesiten cambios.
 *
 * Diferencia clave entre ambos:
 *   better-sqlite3 → stmt.run({ key: val })   — el objeto sin prefijo
 *   node:sqlite    → stmt.run({ '@key': val }) — el objeto CON prefijo @
 *
 * Este adaptador convierte automáticamente los objetos de parámetros.
 */

const { DatabaseSync } = require('node:sqlite');

// ── Convierte { key: val } → { '@key': val } para parámetros nombrados ──────
function toNamed(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return params;
  }
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    // Si ya tiene prefijo (@, :, $) lo dejamos igual
    out[/^[@:$]/.test(k) ? k : `@${k}`] = v;
  }
  return out;
}

// ── Convierte BigInt → Number para lastInsertRowid / changes ────────────────
function normalizeResult(result) {
  if (!result) return result;
  return {
    lastInsertRowid: Number(result.lastInsertRowid ?? 0),
    changes:         Number(result.changes         ?? 0),
  };
}

// ── Wrapper de Statement ─────────────────────────────────────────────────────
class AdaptedStatement {
  constructor(stmt) {
    this._stmt = stmt;
  }

  /** Devuelve la primera fila o undefined */
  get(...args) {
    if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      return this._stmt.get(toNamed(args[0])) ?? undefined;
    }
    return this._stmt.get(...args) ?? undefined;
  }

  /** Devuelve todas las filas como array */
  all(...args) {
    if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      return this._stmt.all(toNamed(args[0]));
    }
    return this._stmt.all(...args);
  }

  /** Ejecuta INSERT / UPDATE / DELETE, devuelve { lastInsertRowid, changes } */
  run(...args) {
    let result;
    if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      result = this._stmt.run(toNamed(args[0]));
    } else {
      result = this._stmt.run(...args);
    }
    return normalizeResult(result);
  }
}

// ── Wrapper de Database ──────────────────────────────────────────────────────
class AdaptedDatabase {
  constructor(filePath) {
    this._db = new DatabaseSync(filePath);
  }

  /** Ejecuta SQL sin retorno (CREATE TABLE, PRAGMA, etc.) */
  exec(sql) {
    this._db.exec(sql);
    return this; // compatibilidad con encadenamiento
  }

  /** Equivalente a db.pragma('key = value') de better-sqlite3 */
  pragma(str) {
    this._db.exec(`PRAGMA ${str}`);
  }

  /** Prepara un statement y devuelve el wrapper */
  prepare(sql) {
    return new AdaptedStatement(this._db.prepare(sql));
  }
}

module.exports = AdaptedDatabase;
