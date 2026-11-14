//! Each platform's navigation conventions, drawn with GPUI: colours, metrics,
//! icons and the motion of a push or pop.
//!
//! The look follows the target OS. `NUCLO_LOOK=ios|android|macos|windows|linux`
//! overrides it, so any look can be previewed on the machine at hand.
use std::time::Duration;

use gpui::{Rgba, rgb, rgba};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Look {
    Ios,
    Android,
    Macos,
    Windows,
    Linux,
}

/// Where a screen sits during a transition.
pub struct Layer {
    /// Horizontal offset, in px.
    pub x: f32,
    pub opacity: f32,
    /// Black over the screen, 0..1 (the screen underneath dims as it is covered).
    pub dim: f32,
}

impl Look {
    pub fn detect() -> Self {
        match std::env::var("NUCLO_LOOK").as_deref() {
            Ok("ios") => return Look::Ios,
            Ok("android") => return Look::Android,
            Ok("macos") => return Look::Macos,
            Ok("windows") => return Look::Windows,
            Ok("linux") => return Look::Linux,
            _ => {}
        }
        if cfg!(target_os = "ios") {
            Look::Ios
        } else if cfg!(target_os = "android") {
            Look::Android
        } else if cfg!(target_os = "macos") {
            Look::Macos
        } else if cfg!(target_os = "windows") {
            Look::Windows
        } else {
            Look::Linux
        }
    }

    /// Desktop navigation: tabs live in a sidebar, not a bottom bar.
    pub fn sidebar(self) -> bool {
        matches!(self, Look::Macos | Look::Windows)
    }

    pub fn sidebar_width(self) -> f32 {
        match self {
            Look::Windows => 260.,
            _ => 220.,
        }
    }

    pub fn accent(self) -> Rgba {
        rgb(match self {
            Look::Ios | Look::Macos => 0x007aff,
            Look::Android => 0x6750a4,
            Look::Windows => 0x005fb8,
            Look::Linux => 0x3584e4,
        })
    }

    pub fn text(self) -> Rgba {
        rgb(match self {
            Look::Android => 0x1d1b20,
            Look::Windows => 0x1a1a1a,
            _ => 0x1c1c1e,
        })
    }

    pub fn secondary_text(self) -> Rgba {
        rgb(match self {
            Look::Android => 0x49454f,
            Look::Windows => 0x5f5f5f,
            _ => 0x6e6e73,
        })
    }

    /// Behind the screens when the app sets no page colour.
    pub fn page(self) -> Rgba {
        rgb(match self {
            Look::Ios => 0xf2f2f7,
            Look::Android => 0xfef7ff,
            Look::Macos => 0xffffff,
            Look::Windows => 0xf9f9f9,
            Look::Linux => 0xfafafa,
        })
    }

    /// Bars and the sidebar.
    pub fn chrome(self) -> Rgba {
        match self {
            Look::Ios => rgba(0xf9f9fbf2),
            Look::Android => rgb(0xf3edf7),
            Look::Macos => rgb(0xe8e8ea),
            Look::Windows => rgb(0xf3f3f3),
            Look::Linux => rgb(0xebebed),
        }
    }

    /// The selected tab's background.
    pub fn selection(self) -> Rgba {
        match self {
            Look::Android => rgb(0xe8def8),
            Look::Macos => rgba(0x0000001a),
            Look::Windows => rgba(0x0000000f),
            _ => rgba(0x0000000f),
        }
    }

    pub fn back_icon(self) -> &'static str {
        match self {
            Look::Android | Look::Windows => "icons/arrow-back.svg",
            _ => "icons/chevron-left.svg",
        }
    }

    pub fn duration(self) -> Duration {
        Duration::from_millis(match self {
            Look::Ios => 380,
            Look::Android => 300,
            Look::Macos => 280,
            Look::Windows => 300,
            Look::Linux => 300,
        })
    }

    /// `reveal` 0 shows the top screen in place; 1 has it gone, the screen
    /// below in place. A push runs it 1 → 0, a pop 0 → 1, a back swipe follows
    /// the finger. Returns the (top, below) layers for a stack `width` wide.
    pub fn layers(self, reveal: f32, width: f32) -> (Layer, Layer) {
        let shown = 1. - reveal;
        match self {
            // The top slides over a parallaxed, dimmed screen (UINavigationController, AdwNavigationView).
            Look::Ios | Look::Linux => (
                Layer { x: reveal * width, opacity: 1., dim: 0. },
                Layer { x: -shown * width * 0.3, opacity: 1., dim: shown * 0.12 },
            ),
            // Both screens slide a full width (NSViewController .slideForward).
            Look::Macos => (
                Layer { x: reveal * width, opacity: 1., dim: 0. },
                Layer { x: -shown * width, opacity: 1., dim: 0. },
            ),
            // Material 3 shared axis X: a short slide with a cross-fade.
            Look::Android => (
                Layer { x: reveal * 30., opacity: (1. - reveal * 1.6).max(0.), dim: 0. },
                Layer { x: -shown * 30., opacity: (1. - shown * 1.6).max(0.), dim: 0. },
            ),
            // Fluent drill-in: the page enters from a little to the right, fading in.
            Look::Windows => (
                Layer { x: reveal * 40., opacity: shown, dim: 0. },
                Layer { x: 0., opacity: reveal, dim: 0. },
            ),
        }
    }

    pub fn ease(self, t: f32) -> f32 {
        let t = t.clamp(0., 1.);
        match self {
            // Emphasized decelerate / exponential ease out.
            Look::Android | Look::Windows => 1. - (1. - t).powi(5),
            Look::Macos => {
                if t < 0.5 {
                    4. * t * t * t
                } else {
                    1. - (-2. * t + 2.).powi(3) / 2.
                }
            }
            _ => 1. - (1. - t).powi(3),
        }
    }

    /// Swiping back starts from the left edge on touch screens, anywhere on a trackpad.
    pub fn swipe_from_edge(self) -> bool {
        matches!(self, Look::Ios | Look::Android)
    }

    pub fn swipes_back(self) -> bool {
        matches!(self, Look::Ios | Look::Macos | Look::Linux)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_settled_stack_shows_only_the_top() {
        for look in [Look::Ios, Look::Android, Look::Macos, Look::Windows, Look::Linux] {
            let (top, below) = look.layers(0., 400.);
            assert_eq!((top.x, top.opacity), (0., 1.), "{look:?}");
            let (top, below_gone) = look.layers(1., 400.);
            assert!(top.x > 0. || top.opacity == 0., "{look:?} top leaves");
            assert_eq!(below_gone.x, 0., "{look:?} below arrives");
            assert!(below.x <= 0.);
            assert_eq!(look.ease(0.), 0.);
            assert!((look.ease(1.) - 1.).abs() < 1e-6);
        }
    }
}
