package nuclo

/** A small recursive-descent JSON parser: objects → LinkedHashMap, arrays → ArrayList, every number → Double.
 *  Malformed input throws IllegalArgumentException. */
internal fun parseJson(text: String): Any? {
    val p = JsonParser(text)
    p.skip()
    val value = p.value()
    p.skip()
    if (p.i != text.length) p.fail("unexpected data after the value")
    return value
}

private class JsonParser(val s: String) {
    var i = 0

    fun fail(why: String): Nothing = throw IllegalArgumentException("nuclo: malformed JSON at $i: $why")

    fun skip() { while (i < s.length && (s[i] == ' ' || s[i] == '\n' || s[i] == '\r' || s[i] == '\t')) i++ }

    fun value(): Any? {
        if (i >= s.length) fail("unexpected end")
        return when (val c = s[i]) {
            '{' -> obj()
            '[' -> arr()
            '"' -> str()
            't' -> word("true", true)
            'f' -> word("false", false)
            'n' -> word("null", null)
            else -> if (c == '-' || c in '0'..'9') num() else fail("unexpected '$c'")
        }
    }

    fun word(w: String, v: Any?): Any? {
        if (!s.startsWith(w, i)) fail("expected $w")
        i += w.length
        return v
    }

    fun obj(): Any? {
        val out = LinkedHashMap<String, Any?>()
        i++
        skip()
        if (i < s.length && s[i] == '}') { i++; return out }
        while (true) {
            skip()
            if (i >= s.length || s[i] != '"') fail("expected a key")
            val key = str()
            skip()
            if (i >= s.length || s[i] != ':') fail("expected ':'")
            i++
            skip()
            out[key] = value()
            skip()
            if (i >= s.length) fail("unexpected end")
            if (s[i] == ',') { i++; continue }
            if (s[i] == '}') { i++; return out }
            fail("expected ',' or '}'")
        }
    }

    fun arr(): Any? {
        val out = ArrayList<Any?>()
        i++
        skip()
        if (i < s.length && s[i] == ']') { i++; return out }
        while (true) {
            skip()
            out.add(value())
            skip()
            if (i >= s.length) fail("unexpected end")
            if (s[i] == ',') { i++; continue }
            if (s[i] == ']') { i++; return out }
            fail("expected ',' or ']'")
        }
    }

    fun str(): String {
        i++
        val b = StringBuilder()
        while (true) {
            if (i >= s.length) fail("unterminated string")
            val c = s[i++]
            when (c) {
                '"' -> return b.toString()
                '\\' -> {
                    if (i >= s.length) fail("unterminated string")
                    when (val e = s[i++]) {
                        '"' -> b.append('"'); '\\' -> b.append('\\'); '/' -> b.append('/')
                        'b' -> b.append('\b'); 'f' -> b.append('\u000c'); 'n' -> b.append('\n')
                        'r' -> b.append('\r'); 't' -> b.append('\t')
                        'u' -> {
                            if (i + 4 > s.length) fail("bad \\u escape")
                            b.append(s.substring(i, i + 4).toIntOrNull(16)?.toChar() ?: fail("bad \\u escape"))
                            i += 4
                        }
                        else -> fail("bad escape \\$e")
                    }
                }
                else -> if (c < ' ') fail("control character in string") else b.append(c)
            }
        }
    }

    fun num(): Any? {
        val start = i
        if (s[i] == '-') i++
        while (i < s.length && (s[i] in '0'..'9' || s[i] == '.' || s[i] == 'e' || s[i] == 'E' || s[i] == '+' || s[i] == '-')) i++
        return s.substring(start, i).toDoubleOrNull() ?: fail("bad number")
    }
}
