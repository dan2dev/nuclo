//! Device data (src/device.ts): the battery, read from the platform.
//! Desktop: starship-battery (IOKit, sysfs, Win32). iOS and Android: gpui-mobile.

/// `__nuclo_device(name)`: JSON now, or "" when the device has none.
pub fn read(name: &str) -> String {
    match name {
        "battery" => battery().unwrap_or_default(),
        _ => String::new(),
    }
}

/// {"level": 0..1 | null, "state": …, "minutes": n | null}
fn json(level: Option<f32>, state: &str, minutes: Option<u32>) -> String {
    let level = level.map_or("null".into(), |l| format!("{l:.3}"));
    let minutes = minutes.map_or("null".into(), |m| m.to_string());
    format!(r#"{{"level":{level},"state":"{state}","minutes":{minutes}}}"#)
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
fn battery() -> Option<String> {
    use starship_battery::State;
    use starship_battery::units::{ratio::ratio, time::minute};
    let battery = starship_battery::Manager::new().ok()?.batteries().ok()?.flatten().next()?;
    let state = match battery.state() {
        State::Charging => "charging",
        State::Discharging | State::Empty => "discharging",
        State::Full => "full",
        _ => "unknown",
    };
    let time = match state {
        "charging" => battery.time_to_full(),
        "discharging" => battery.time_to_empty(),
        _ => None,
    };
    let minutes = time.map(|t| t.get::<minute>().round() as u32).filter(|&m| m > 0);
    Some(json(Some(battery.state_of_charge().get::<ratio>()), state, minutes))
}

#[cfg(any(target_os = "ios", target_os = "android"))]
fn battery() -> Option<String> {
    use gpui_mobile::packages::battery::{BatteryState, battery_info};
    let info = battery_info();
    let state = match info.state {
        BatteryState::Charging => "charging",
        BatteryState::Discharging => "discharging",
        BatteryState::Full => "full",
        BatteryState::Unknown => "unknown",
    };
    // The iOS simulator reports neither: no battery.
    if info.level < 0 && state == "unknown" {
        return None;
    }
    Some(json((info.level >= 0).then(|| info.level as f32 / 100.), state, None))
}

#[cfg(test)]
mod tests {
    #[test]
    fn battery_json_matches_the_contract() {
        assert_eq!(super::json(Some(0.5634), "discharging", Some(285)), r#"{"level":0.563,"state":"discharging","minutes":285}"#);
        assert_eq!(super::json(None, "unknown", None), r#"{"level":null,"state":"unknown","minutes":null}"#);
        assert_eq!(super::read("nope"), "");
    }

    /// Whatever this machine has: no battery, or a reading in the contract's shape.
    #[test]
    fn this_machine_battery_is_absent_or_valid() {
        let json = super::read("battery");
        eprintln!("battery: {json:?}");
        if json.is_empty() {
            return;
        }
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        let level = value["level"].as_f64();
        assert!(level.is_none_or(|l| (0. ..=1.).contains(&l)), "{json}");
        assert!(["charging", "discharging", "full", "unknown"].contains(&value["state"].as_str().unwrap()), "{json}");
    }
}
