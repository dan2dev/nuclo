//! The text of a field and its selection: what a text input is without a toolkit's widget.
//! GPUI has no controls, so the backend draws this and feeds it keys and the platform's text
//! input (IME included). Adapted from the text input of nuclo-native's GPUI host, itself from
//! GPUI's `examples/input.rs` (Apache-2.0). Offsets are UTF-8 bytes unless they say UTF-16.

use std::ops::Range;

const MASK: char = '•';

#[derive(Default)]
pub struct Field {
    pub text: String,
    pub placeholder: String,
    /// Drawn as dots.
    pub password: bool,
    /// A textarea: Enter breaks the line, and lines wrap.
    pub multiline: bool,
    pub selection: Range<usize>,
    /// The cursor is at the selection's start.
    pub reversed: bool,
    /// Text an input method is still composing.
    pub marked: Option<Range<usize>>,
}

impl Field {
    /// The app set the value: the cursor goes to the end.
    pub fn set_text(&mut self, text: &str) {
        self.text = text.to_string();
        self.selection = text.len()..text.len();
        self.reversed = false;
        self.marked = None;
    }

    pub fn cursor(&self) -> usize {
        if self.reversed {
            self.selection.start
        } else {
            self.selection.end
        }
    }

    pub fn move_to(&mut self, offset: usize) {
        self.selection = offset..offset;
        self.reversed = false;
    }

    pub fn select_to(&mut self, offset: usize) {
        if self.reversed {
            self.selection.start = offset;
        } else {
            self.selection.end = offset;
        }
        if self.selection.end < self.selection.start {
            self.reversed = !self.reversed;
            self.selection = self.selection.end..self.selection.start;
        }
    }

    /// The character boundary before `offset`, and the one after.
    pub fn previous(&self, offset: usize) -> usize {
        self.text[..offset].char_indices().next_back().map_or(0, |(at, _)| at)
    }

    pub fn next(&self, offset: usize) -> usize {
        self.text[offset..].chars().next().map_or(self.text.len(), |c| offset + c.len_utf8())
    }

    /// Puts `text` in place of `range`, else of what is being composed, else of the selection.
    /// A single-line field takes no line break.
    pub fn replace(&mut self, range: Option<Range<usize>>, text: &str) -> Range<usize> {
        let range = range.or(self.marked.take()).unwrap_or(self.selection.clone());
        let text = if self.multiline { text.to_string() } else { text.replace(['\n', '\r'], " ") };
        self.text.replace_range(range.clone(), &text);
        self.move_to(range.start + text.len());
        range.start..range.start + text.len()
    }

    /// What is drawn: the text, or a dot per character.
    pub fn shown(&self) -> String {
        if self.password {
            MASK.to_string().repeat(self.text.chars().count())
        } else {
            self.text.clone()
        }
    }

    /// An offset in the text → the offset in what is drawn, and back.
    pub fn shown_offset(&self, offset: usize) -> usize {
        if self.password {
            self.text[..offset].chars().count() * MASK.len_utf8()
        } else {
            offset
        }
    }

    pub fn text_offset(&self, shown: usize) -> usize {
        if !self.password {
            return shown.min(self.text.len());
        }
        self.text.char_indices().nth(shown / MASK.len_utf8()).map_or(self.text.len(), |(at, _)| at)
    }

    // The platform's text input counts in UTF-16.

    fn from_utf16(&self, offset: usize) -> usize {
        let (mut utf8, mut utf16) = (0, 0);
        for c in self.text.chars() {
            if utf16 >= offset {
                break;
            }
            utf16 += c.len_utf16();
            utf8 += c.len_utf8();
        }
        utf8
    }

    fn to_utf16(&self, offset: usize) -> usize {
        self.text[..offset].chars().map(char::len_utf16).sum()
    }

    pub fn range_from_utf16(&self, range: &Range<usize>) -> Range<usize> {
        self.from_utf16(range.start)..self.from_utf16(range.end)
    }

    pub fn range_to_utf16(&self, range: &Range<usize>) -> Range<usize> {
        self.to_utf16(range.start)..self.to_utf16(range.end)
    }
}
