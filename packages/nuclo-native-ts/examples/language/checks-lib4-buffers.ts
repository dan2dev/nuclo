/** lib4: ArrayBuffer, DataView (every size, both byte orders) and Uint8Array views of a buffer. Names start with `l4`. */

function l4Bytes(b: ArrayBuffer): string {
  return new Uint8Array(b).join(",");
}

function l4Catch(out: string[], label: string, f: () => string): void {
  try {
    out.push(`${label}: ${f()}`);
  } catch (e) {
    out.push(`${label}: ${String(e)}`);
  }
}

export function l4DataViews(): string[] {
  const out: string[] = [];
  try {
    const buf = new ArrayBuffer(16);
    const dv = new DataView(buf);
    out.push(`${buf.byteLength} ${dv.byteLength} ${dv.byteOffset} ${dv.buffer === buf} ${String(buf)} ${String(dv)}`);
    dv.setInt16(0, -2);
    dv.setInt16(2, -2, true);
    dv.setUint32(4, 0xdeadbeef);
    dv.setFloat32(8, 1.1, true);
    dv.setUint8(12, 300);
    dv.setInt8(13, -129);
    out.push(l4Bytes(buf));
    out.push([dv.getInt16(0), dv.getUint16(0), dv.getInt16(2, true), dv.getUint32(4), dv.getInt32(4), dv.getUint32(4, true)].join(" "));
    out.push([dv.getFloat32(8, true), dv.getFloat32(8), dv.getUint8(12), dv.getInt8(13), dv.getUint8(13)].join(" "));
    dv.setFloat64(0, Math.PI);
    out.push(`${dv.getFloat64(0)} ${dv.getFloat64(0, true)} ${l4Bytes(buf.slice(0, 8))}`);
    dv.setFloat64(8, NaN);
    dv.setFloat32(0, -NaN);
    dv.setFloat32(4, -0);
    out.push(`${l4Bytes(buf)} ${1 / dv.getFloat32(4)}`);
    dv.setBigInt64(0, -2n);
    dv.setBigUint64(8, 2n ** 64n - 3n, true);
    out.push(`${dv.getBigUint64(0)} ${dv.getBigInt64(0, true)} ${dv.getBigInt64(8, true)} ${dv.getBigUint64(8)}`);
    dv.setBigInt64(0, 2n ** 70n + 5n);
    out.push(`${dv.getBigInt64(0)} ${l4Bytes(buf.slice(-8))}`);
    // A view of part of a buffer: offsets are relative to it.
    const part = new DataView(buf, 4, 8);
    part.setUint16(0, 0x1234);
    out.push(`${part.byteOffset} ${part.byteLength} ${dv.getUint16(4).toString(16)} ${part.getUint8(1)}`);
    for (const v of [1.5, -1.5, 2 ** 31, 2 ** 32 + 7, -(2 ** 31) - 1, Infinity, NaN, 1e300, -0.9]) {
      dv.setInt32(0, v);
      dv.setUint16(4, v);
      dv.setInt8(6, v);
      dv.setFloat32(8, v);
      out.push(`${v}: ${dv.getInt32(0)} ${dv.getUint16(4)} ${dv.getInt8(6)} ${dv.getFloat32(8)}`);
    }
  } catch (e) {
    out.push(String(e));
  }
  return out;
}

export function l4BufferErrors(): string[] {
  const out: string[] = [];
  try {
    const buf = new ArrayBuffer(8);
    const dv = new DataView(buf);
    const at = [0, 7, 8, -1, 1.7, NaN, 6, 4.5];
    for (const i of at) {
      l4Catch(out, `getInt8(${i})`, () => String(dv.getInt8(i)));
      l4Catch(out, `getInt16(${i})`, () => String(dv.getInt16(i)));
      l4Catch(out, `setFloat64(${i})`, () => {
        dv.setFloat64(i, 1);
        return "ok";
      });
    }
    const sizes = [8, 0, -1, 2.5, NaN, Infinity];
    for (const n of sizes) l4Catch(out, `new ArrayBuffer(${n})`, () => String(new ArrayBuffer(n).byteLength));
    const windows = [[0, 8], [9, 0], [-1, 0], [2, 7], [2, -1], [8, 0], [1.5, 2.5], [3, 5]];
    for (const w of windows) {
      l4Catch(out, `new DataView(buf, ${w[0]}, ${w[1]})`, () => String(new DataView(buf, w[0]!, w[1]!).byteLength));
      l4Catch(out, `new Uint8Array(buf, ${w[0]}, ${w[1]})`, () => String(new Uint8Array(buf, w[0]!, w[1]!).length));
    }
    for (const o of [0, 8, 9, -1]) {
      l4Catch(out, `new DataView(buf, ${o})`, () => String(new DataView(buf, o).byteLength));
      l4Catch(out, `new Uint8ClampedArray(buf, ${o})`, () => String(new Uint8ClampedArray(buf, o).length));
    }
  } catch (e) {
    out.push(String(e));
  }
  return out;
}

export function l4ByteViews(): string[] {
  const out: string[] = [];
  try {
    const buf = new ArrayBuffer(8);
    const bytes = new Uint8Array(buf);
    const tail = new Uint8Array(buf, 4);
    const mid = new Uint8ClampedArray(buf, 2, 4);
    const dv = new DataView(buf);
    bytes[0] = 1;
    tail[0] = 200;
    mid[0] = 300;
    mid[3] = -5;
    dv.setUint8(7, 9);
    out.push(`${bytes.join(",")} | ${tail.join(",")} | ${mid.join(",")} | ${dv.getUint32(4)}`);
    out.push(`${tail.byteOffset} ${tail.length} ${mid.byteOffset} ${mid.length} ${tail.buffer === buf} ${mid.buffer === bytes.buffer} ${tail.buffer.byteLength}`);
    // A typed array's own buffer, and subarray views of it, are one byte store.
    const own = new Uint8Array([10, 20, 30, 40]);
    const view = new DataView(own.buffer);
    view.setUint16(1, 0xabcd);
    out.push(`${own.join(",")} ${own.subarray(2).buffer === own.buffer} ${own.slice(1).buffer === own.buffer} ${own.subarray(1).buffer.byteLength}`);
    const copy = buf.slice(2, 6);
    new Uint8Array(copy)[0] = 77;
    out.push(`${l4Bytes(copy)} ${bytes[2]} ${copy === buf} ${buf.slice(-3, -1).byteLength} ${buf.slice(5, 2).byteLength}`);
  } catch (e) {
    out.push(String(e));
  }
  return out;
}
