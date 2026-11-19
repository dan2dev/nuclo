// NNSRuntime (Swift): prototype subset for the worked examples. Not the final library.

// ---- string: equality, order, and hash by Unicode scalar values -----------------
public func eq(_ a: String, _ b: String) -> Bool {
  return a.unicodeScalars.elementsEqual(b.unicodeScalars)
}
public func eq(_ a: String?, _ b: String?) -> Bool {
  if let a, let b { return eq(a, b) }
  return a == nil && b == nil
}
public func eq(_ a: [String], _ b: [String]) -> Bool {
  return a.elementsEqual(b, by: { x, y in eq(x, y) })
}
/// Equality of a generic type. A string uses the scalar rules.
public func eq<T: Equatable>(_ a: T, _ b: T) -> Bool {
  if let x = a as? String, let y = b as? String { return eq(x, y) }
  return a == b
}
public func compare(_ a: String, _ b: String) -> Int32 {
  if a.unicodeScalars.lexicographicallyPrecedes(b.unicodeScalars) { return -1 }
  return eq(a, b) ? 0 : 1
}
/// Order of two values of a generic type. A string uses the scalar order.
public func compare<T: Comparable>(_ a: T, _ b: T) -> Int32 {
  if let x = a as? String, let y = b as? String { return compare(x, y) }
  return a < b ? -1 : (a == b ? 0 : 1)
}
public func hashScalars(_ s: String, into h: inout Hasher) {
  for u in s.unicodeScalars { h.combine(u.value) }
  h.combine(UInt32.max)
}
public func hashScalars(_ s: String?, into h: inout Hasher) {
  if let s { hashScalars(s, into: &h) } else { h.combine(0 as UInt8) }
}
public func hashScalars(_ xs: [String], into h: inout Hasher) {
  for s in xs { hashScalars(s, into: &h) }
}

// ---- list and string helpers ----------------------------------------------------
/// The element at `i`, or `nil` when the index is out of range.
public func get<T>(_ xs: [T], _ i: Int32) -> T? {
  return xs.indices.contains(Int(i)) ? xs[Int(i)] : nil
}
/// `s.trim()`: without the white space at the start and the end (no Foundation).
public func nnsTrim(_ s: String) -> String {
  let a = Array(s.unicodeScalars)
  guard let first = a.firstIndex(where: { !$0.properties.isWhitespace }) else { return "" }
  let last = a.lastIndex(where: { !$0.properties.isWhitespace })!
  var out = String.UnicodeScalarView()
  out.append(contentsOf: a[first...last])
  return String(out)
}
/// `s.includes(part)`, by scalar values. The empty string is in each string.
public func nnsIncludes(_ s: String, _ part: String) -> Bool {
  let a = Array(s.unicodeScalars), b = Array(part.unicodeScalars)
  if b.isEmpty { return true }
  if b.count > a.count { return false }
  for i in 0...(a.count - b.count) where Array(a[i..<(i + b.count)]) == b { return true }
  return false
}
/// The parts of `s` between the separators, with the empty parts. The separator is matched by scalar values.
public func split(_ s: String, _ sep: String) -> [String] {
  let a = Array(s.unicodeScalars), b = Array(sep.unicodeScalars)
  if b.isEmpty { return a.map({ String($0) }) }
  var parts: [String] = []
  var cur = String.UnicodeScalarView()
  var i = 0
  while i < a.count {
    if i + b.count <= a.count && Array(a[i..<(i + b.count)]) == b {
      parts.append(String(cur))
      cur = String.UnicodeScalarView()
      i += b.count
    } else {
      cur.append(a[i])
      i += 1
    }
  }
  parts.append(String(cur))
  return parts
}

// ---- float to text: the ECMAScript Number::toString format --------------------
public func text(_ x: Double) -> String {
  if x.isNaN { return "NaN" }
  if x == 0 { return "0" }
  if x.isInfinite { return x > 0 ? "Infinity" : "-Infinity" }
  let parts = "\(abs(x))".split(separator: "e") // the shortest digits that give the same value
  let mantissa = parts[0].split(separator: ".", omittingEmptySubsequences: false)
  var digits = Array(String(mantissa[0]) + (mantissa.count > 1 ? String(mantissa[1]) : ""))
  var n = mantissa[0].count + (parts.count > 1 ? Int(parts[1])! : 0)
  while digits.count > 1 && digits.last == "0" { digits.removeLast() }
  while digits.count > 1 && digits.first == "0" { digits.removeFirst(); n -= 1 }
  let k = digits.count
  var body: String
  if k <= n && n <= 21 {
    body = String(digits) + String(repeating: "0", count: n - k)
  } else if 0 < n && n <= 21 {
    body = String(digits[..<n]) + "." + String(digits[n...])
  } else if -6 < n && n <= 0 {
    body = "0." + String(repeating: "0", count: -n) + String(digits)
  } else {
    let e = n - 1
    body = String(digits[0]) + (k == 1 ? "" : "." + String(digits[1...])) + "e" + (e < 0 ? "-" : "+") + "\(abs(e))"
  }
  return x < 0 ? "-" + body : body
}

// ---- Result ---------------------------------------------------------------------
public enum Result<T, E> {
  case ok(T)
  case err(E)
}
extension Result: Equatable where T: Equatable, E: Equatable {}
extension Result: Hashable where T: Hashable, E: Hashable {}
extension Result: Sendable where T: Sendable, E: Sendable {}

// ---- Map and Set: insertion order, value semantics --------------------------------
/// A key that compares a string by its scalar values.
struct ScalarKey<K: Hashable>: Hashable {
  let k: K
  static func == (a: ScalarKey<K>, b: ScalarKey<K>) -> Bool {
    if let x = a.k as? String, let y = b.k as? String { return eq(x, y) }
    return a.k == b.k
  }
  func hash(into h: inout Hasher) {
    if let s = k as? String { hashScalars(s, into: &h) } else { h.combine(k) }
  }
}
public struct Map<K: Hashable, V>: ExpressibleByDictionaryLiteral {
  var order: [K] = []
  var items: [ScalarKey<K>: V] = [:]
  public init(dictionaryLiteral elements: (K, V)...) {
    for (k, v) in elements { self[k] = v }
  }
  public subscript(k: K) -> V? {
    get { return items[ScalarKey(k: k)] }
    set {
      if let v = newValue {
        if items.updateValue(v, forKey: ScalarKey(k: k)) == nil { order.append(k) }
      } else {
        _ = delete(k)
      }
    }
  }
  public mutating func delete(_ k: K) -> Bool {
    let key = ScalarKey(k: k)
    if items.removeValue(forKey: key) == nil { return false }
    order.removeAll(where: { ScalarKey(k: $0) == key })
    return true
  }
}
public func keys<K, V>(_ m: Map<K, V>) -> [K] { return m.order }
public struct Set<T: Hashable> {
  var order: [T] = []
  var items: Swift.Set<ScalarKey<T>> = []
  public init(_ xs: [T]) {
    for x in xs { add(x) }
  }
  public func has(_ v: T) -> Bool { return items.contains(ScalarKey(k: v)) }
  public mutating func add(_ v: T) {
    if items.insert(ScalarKey(k: v)).inserted { order.append(v) }
  }
  public mutating func delete(_ v: T) -> Bool {
    let key = ScalarKey(k: v)
    if items.remove(key) == nil { return false }
    order.removeAll(where: { ScalarKey(k: $0) == key })
    return true
  }
}

// ---- sort: in place and stable -----------------------------------------------------
public func sort<T>(_ xs: inout [T], _ less: (T, T) -> Bool) {
  let sorted = xs.enumerated().sorted(by: { a, b in
    if less(a.element, b.element) { return true }
    if less(b.element, a.element) { return false }
    return a.offset < b.offset
  })
  xs = sorted.map({ $0.element })
}

// ---- tasks ------------------------------------------------------------------------
public struct NNSTask<T: Sendable>: Sendable {
  let task: Task<T, Error>
  public func cancel() { task.cancel() }
  /// The result, or `nil` when the task was cancelled.
  public func join() async -> T? { return try? await task.value }
}
/// The task starts later, on the main actor. A task that was cancelled before its start runs no code.
@MainActor
public func spawn<T: Sendable>(_ body: @escaping @MainActor () async throws -> T) -> NNSTask<T> {
  return NNSTask(task: Task { @MainActor in
    try Task.checkCancellation()
    return try await body()
  })
}
