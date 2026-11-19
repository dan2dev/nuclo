//! The app's allocator: the system's, with a small cache of freed small blocks on the UI thread.
//!
//! JavaScript code allocates many small, short-lived objects (class instances, records, closures, `Rc` boxes); the
//! system allocator costs ~12 ns per malloc + free on macOS, a cache pop / push ~1–2 ns.
//! - Small = at most 128 bytes, alignment at most 16: 8 classes of 16-byte steps. Every small block, on every thread,
//!   is a system block of its class's size, so any thread may free it to the system and the UI thread may keep it.
//! - The UI thread (`enable_pool`, from `nuclo::start`) keeps up to 1 MB of freed blocks per class in a free list and
//!   allocates from it first; beyond that, frees go to the system. Memory kept: at most 8 MB, reused, never more.
use std::alloc::{GlobalAlloc, Layout, System};
use std::cell::Cell;
use std::ptr::null_mut;

const GRAIN: usize = 16;
const CLASSES: usize = 8;
const SMALL: usize = GRAIN * CLASSES;
/// Bytes of freed blocks kept per class.
const KEEP: usize = 1 << 20;

struct Local {
    on: Cell<bool>,
    free: [Cell<*mut u8>; CLASSES],
    count: [Cell<usize>; CLASSES],
}

thread_local! {
    static LOCAL: Local = const {
        Local { on: Cell::new(false), free: [const { Cell::new(null_mut()) }; CLASSES], count: [const { Cell::new(0) }; CLASSES] }
    };
}

pub struct Pool;

/// Freed small blocks of the calling thread are kept and reused from now on (the UI thread, once).
pub fn enable_pool() {
    let _ = LOCAL.try_with(|p| p.on.set(true));
}

#[inline(always)]
fn class_of(l: &Layout) -> Option<usize> {
    if l.size() <= SMALL && l.align() <= GRAIN {
        Some((l.size().max(1) + GRAIN - 1) / GRAIN - 1)
    } else {
        None
    }
}

#[inline(always)]
fn class_layout(c: usize) -> Layout {
    unsafe { Layout::from_size_align_unchecked((c + 1) * GRAIN, GRAIN) }
}

unsafe impl GlobalAlloc for Pool {
    #[inline]
    unsafe fn alloc(&self, l: Layout) -> *mut u8 {
        let Some(c) = class_of(&l) else { return System.alloc(l) };
        let cached = LOCAL.try_with(|p| {
            let head = p.free[c].get();
            if !head.is_null() {
                p.free[c].set(*(head as *mut *mut u8));
                p.count[c].set(p.count[c].get() - 1);
            }
            head
        });
        match cached {
            Ok(head) if !head.is_null() => head,
            _ => System.alloc(class_layout(c)),
        }
    }

    #[inline]
    unsafe fn dealloc(&self, ptr: *mut u8, l: Layout) {
        let Some(c) = class_of(&l) else { return System.dealloc(ptr, l) };
        let kept = LOCAL.try_with(|p| {
            if !p.on.get() || p.count[c].get() >= KEEP / ((c + 1) * GRAIN) {
                return false;
            }
            *(ptr as *mut *mut u8) = p.free[c].get();
            p.free[c].set(ptr);
            p.count[c].set(p.count[c].get() + 1);
            true
        });
        if kept != Ok(true) {
            System.dealloc(ptr, class_layout(c));
        }
    }

    unsafe fn alloc_zeroed(&self, l: Layout) -> *mut u8 {
        if class_of(&l).is_none() {
            return System.alloc_zeroed(l);
        }
        let ptr = self.alloc(l);
        if !ptr.is_null() {
            std::ptr::write_bytes(ptr, 0, l.size());
        }
        ptr
    }

    unsafe fn realloc(&self, ptr: *mut u8, l: Layout, new: usize) -> *mut u8 {
        let nl = Layout::from_size_align_unchecked(new, l.align());
        let (old_class, new_class) = (class_of(&l), class_of(&nl));
        if old_class.is_none() && new_class.is_none() {
            return System.realloc(ptr, l, new);
        }
        // Same class: the block already has room.
        if old_class == new_class {
            return ptr;
        }
        let out = self.alloc(nl);
        if !out.is_null() {
            std::ptr::copy_nonoverlapping(ptr, out, l.size().min(new));
            self.dealloc(ptr, l);
        }
        out
    }
}
