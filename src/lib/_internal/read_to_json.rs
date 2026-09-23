use std::{fs::read_to_string, path::Path};

use serde::Deserialize;

use crate::_internal::errors::ArgumentError;

pub fn read_to_json<T: for<'a> Deserialize<'a>>(input_file: &Path) -> Result<T, ArgumentError> {
    let input_str = read_to_string(input_file).or(Err("Could not read input file."))?;
    let input_parsed: T = serde_json::from_str(&input_str).map_err(|e| ArgumentError {
        description: format!("Could not parse input file: {}", e),
    })?;
    Ok(input_parsed)
}
