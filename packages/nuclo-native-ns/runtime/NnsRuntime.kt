// nns.runtime (Kotlin): prototype subset for the worked examples. Not the final library.
// Compiled with Kotlin 2.4.10 by check_kt_build.sh. Kotlin standard library only: the tasks, which need
// kotlinx.coroutines, are in NnsAsync.kt, so a program with no `spawn` builds without it (Android host of nuclo).
package nns.runtime

import kotlin.reflect.KProperty

// ---- traps -----------------------------------------------------------------
class NNSTrap(message: String) : Error(message)
private var isStopped = false
fun stopped(): Boolean = isStopped
fun trap(message: String): Nothing {
  isStopped = true
  throw NNSTrap(message)
}
fun print(text: String) = println(text)

// ---- int and long: trap on overflow ------------------------------------------
private fun int(r: Long): Int {
  if (r < Int.MIN_VALUE || r > Int.MAX_VALUE) trap("int overflow")
  return r.toInt()
}
fun add(a: Int, b: Int): Int = int(a.toLong() + b)
fun sub(a: Int, b: Int): Int = int(a.toLong() - b)
fun mul(a: Int, b: Int): Int = int(a.toLong() * b)
fun neg(a: Int): Int = int(-a.toLong())
fun div(a: Int, b: Int): Int {
  if (b == 0) trap("division by zero")
  return int(a.toLong() / b)
}
fun rem(a: Int, b: Int): Int {
  if (b == 0) trap("division by zero")
  if (a == Int.MIN_VALUE && b == -1) trap("int overflow")
  return a % b
}
private inline fun long(op: () -> Long): Long = try { op() } catch (e: ArithmeticException) { trap("long overflow") }
fun add(a: Long, b: Long): Long = long { Math.addExact(a, b) }
fun sub(a: Long, b: Long): Long = long { Math.subtractExact(a, b) }
fun mul(a: Long, b: Long): Long = long { Math.multiplyExact(a, b) }
fun neg(a: Long): Long = long { Math.negateExact(a) }
fun div(a: Long, b: Long): Long {
  if (b == 0L) trap("division by zero")
  if (a == Long.MIN_VALUE && b == -1L) trap("long overflow")
  return a / b
}
fun rem(a: Long, b: Long): Long {
  if (b == 0L) trap("division by zero")
  if (a == Long.MIN_VALUE && b == -1L) trap("long overflow")
  return a % b
}
fun toInt(x: Double): Int {
  if (!(x > -2147483649.0 && x < 2147483648.0)) trap("toInt: value out of range")
  return x.toInt()
}
fun toInt(x: Long): Int {
  if (x < Int.MIN_VALUE || x > Int.MAX_VALUE) trap("toInt: value out of range")
  return x.toInt()
}

// ---- float to text: the ECMAScript Number::toString format --------------------
fun text(x: Double): String {
  if (x.isNaN()) return "NaN"
  if (x == 0.0) return "0"
  if (x.isInfinite()) return if (x > 0) "Infinity" else "-Infinity"
  val parts = Math.abs(x).toString().split("E") // the shortest digits that give the same value (JDK 19 or later)
  val mantissa = parts[0].split(".")
  var digits = mantissa[0] + mantissa.getOrElse(1) { "" }
  var n = mantissa[0].length + (parts.getOrNull(1)?.toInt() ?: 0)
  digits = digits.trimEnd('0').ifEmpty { "0" }
  while (digits.length > 1 && digits[0] == '0') { digits = digits.substring(1); n -= 1 }
  val k = digits.length
  val body = when {
    k <= n && n <= 21 -> digits + "0".repeat(n - k)
    0 < n && n <= 21 -> digits.substring(0, n) + "." + digits.substring(n)
    -6 < n && n <= 0 -> "0." + "0".repeat(-n) + digits
    else -> {
      val e = n - 1
      digits.substring(0, 1) + (if (k == 1) "" else "." + digits.substring(1)) + "e" + (if (e < 0) "-" else "+") + Math.abs(e)
    }
  }
  return if (x < 0) "-$body" else body
}

// ---- string length: Unicode scalar values -------------------------------------------
fun length(s: String): Int = s.codePointCount(0, s.length)
fun split(s: String, separator: String): NList<String> = NList(ArrayList(s.split(separator)))

/** `s.slice(start, end)`: positions count scalar values; a position out of range is moved into the range. */
fun strSlice(s: String, start: Int, end: Int?): String {
  val n = s.codePointCount(0, s.length)
  val from = start.coerceIn(0, n)
  val to = (end ?: n).coerceIn(from, n)
  if (n == s.length) return s.substring(from, to)
  return s.substring(s.offsetByCodePoints(0, from), s.offsetByCodePoints(0, to))
}
/** `s.indexOf(part)`: the scalar position of the first `part`, or -1; 0 for the empty part. */
fun strIndexOf(s: String, part: String): Int {
  val i = s.indexOf(part)
  return if (i < 0) -1 else s.codePointCount(0, i)
}
// ---- string order by Unicode scalar values ---------------------------------------
fun compare(a: String, b: String): Int {
  var i = 0
  var j = 0
  while (i < a.length && j < b.length) {
    val p = a.codePointAt(i)
    val q = b.codePointAt(j)
    if (p != q) return if (p < q) -1 else 1
    i += Character.charCount(p)
    j += Character.charCount(q)
  }
  return if (i < a.length) 1 else if (j < b.length) -1 else 0
}
fun <T : Comparable<T>> compare(a: T, b: T): Int =
  if (a is String && b is String) compare(a as String, b as String) else a.compareTo(b)

// ---- the copy check -------------------------------------------------------------
/** The base class of each record and each collection. It holds the two marks. */
abstract class Value {
  @JvmField var shared = false
  @JvmField var borrows = 0
  /** A shallow copy with clear marks. It sets `shared` on each child. */
  abstract fun clone(): Value
}
fun <T> share(x: T): T {
  if (x is Value) x.shared = true
  return x
}
fun <T> borrow(x: T): T {
  if (x is Value) x.borrows += 1
  return x
}
fun release(x: Any?) {
  if (x is Value) x.borrows -= 1
}
/** Gives `x` when it has one holder. If not, gives a private copy. */
@Suppress("UNCHECKED_CAST")
fun <T : Value> own(x: T): T = if (x.shared || x.borrows > 0) x.clone() as T else x
/** `own` for a value of a type parameter: it can be a `Value` or not. */
@Suppress("UNCHECKED_CAST")
fun <T> ownAny(x: T): T = if (x is Value && (x.shared || x.borrows > 0)) x.clone() as T else x

// ---- lists -------------------------------------------------------------------
class NList<T>(private val items: ArrayList<T> = ArrayList()) : Value(), List<T> by items {
  private fun check(i: Int): Int {
    if (i < 0 || i >= items.size) trap("index out of range")
    return i
  }
  fun at(i: Int): T = items[check(i)]
  fun setAt(i: Int, v: T) { items[check(i)] = v }
  fun add(v: T) { items.add(v) }
  /** `xs` is a spread: its elements get a second holder. */
  fun addAll(xs: NList<T>) { for (v in xs) items.add(share(v)) }
  fun insert(i: Int, v: T) {
    if (i < 0 || i > items.size) trap("index out of range")
    items.add(i, v)
  }
  fun removeAt(i: Int): T = items.removeAt(check(i))
  fun clear() { items.clear() }
  fun pop(): T? = if (items.isEmpty()) null else items.removeAt(items.size - 1)
  /** In place and stable. */
  fun sortWith(less: (T, T) -> Boolean) {
    items.sortWith { a, b -> if (less(a, b)) -1 else if (less(b, a)) 1 else 0 }
  }
  override fun clone(): NList<T> = NList(ArrayList(items)).also { for (v in items) share(v) }
  override fun equals(other: Any?) = other is NList<*> && items == other.items
  override fun hashCode() = items.hashCode()
}
fun <T> nlistOf(vararg xs: T): NList<T> = NList(ArrayList(xs.asList()))
/** A list literal with a spread: `[0, ...xs]` is `buildNList { add(0); addAll(xs) }`. */
inline fun <T> buildNList(build: NList<T>.() -> Unit): NList<T> = NList<T>().apply(build)
fun <T, U> map(xs: NList<T>, f: (T) -> U): NList<U> = NList(ArrayList(xs.map(f)))
fun <T> filter(xs: NList<T>, keep: (T) -> Boolean): NList<T> = NList(ArrayList(xs.filter(keep)))
/** The element at `i`, after the copy check. The list must have one holder. */
fun <T> NList<T>.ownAt(i: Int): T {
  val e = ownAny(at(i))
  setAt(i, e)
  return e
}

// ---- `&` parameters ------------------------------------------------------------
/** Holds a value for the time of one call. `store` writes it back to its path. */
class Cell<T>(@JvmField var v: T, private val put: (T) -> Unit) {
  fun store() = put(v)
}
fun <T> cellAt(xs: NList<T>, i: Int): Cell<T> = Cell(xs.at(i)) { xs.setAt(i, it) }

// ---- Map and Set: insertion order ----------------------------------------------
class NMap<K, V>(private val items: LinkedHashMap<K, V> = LinkedHashMap()) : Value() {
  operator fun get(k: K): V? = items[k]
  operator fun set(k: K, v: V) { items[k] = v }
  fun delete(k: K): Boolean = items.remove(k) != null
  fun has(k: K): Boolean = items.containsKey(k)
  val keys: NList<K> get() = NList(ArrayList(items.keys))
  override fun clone(): NMap<K, V> = NMap(LinkedHashMap(items)).also { for (v in items.values) share(v) }
  override fun equals(other: Any?) = other is NMap<*, *> && items == other.items
  override fun hashCode() = items.hashCode()
}
fun <K, V> nmapOf(vararg entries: Pair<K, V>): NMap<K, V> = NMap(linkedMapOf(*entries))
class NSet<T>(private val items: LinkedHashSet<T> = LinkedHashSet()) : Value() {
  fun add(v: T) { items.add(v) }
  fun contains(v: T): Boolean = items.contains(v)
  fun remove(v: T): Boolean = items.remove(v)
  operator fun iterator(): Iterator<T> = items.iterator()
  override fun clone(): NSet<T> = NSet(LinkedHashSet(items)).also { for (v in items) share(v) }
  override fun equals(other: Any?) = other is NSet<*> && items == other.items
  override fun hashCode() = items.hashCode()
}
fun <T> NList<T>.toNSet(): NSet<T> = NSet(LinkedHashSet(this))

// ---- Result -----------------------------------------------------------------
sealed interface Result<out T, out E>
data class Ok<T>(val v0: T) : Result<T, Nothing>
data class Err<E>(val v0: E) : Result<Nothing, E>

// ---- top-level `let`: computed at first use --------------------------------------
class LazyVar<T>(private var init: (() -> T)?) {
  private var value: Any? = null
  @Suppress("UNCHECKED_CAST")
  operator fun getValue(owner: Any?, property: KProperty<*>): T {
    val f = init
    if (f != null) { init = null; value = f() }
    return value as T
  }
  operator fun setValue(owner: Any?, property: KProperty<*>, v: T) {
    init = null
    value = v
  }
}
fun <T> lazyVar(init: () -> T) = LazyVar(init)
