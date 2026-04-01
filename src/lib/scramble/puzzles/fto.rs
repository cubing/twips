use cubing::{
    alg::{parse_alg, Alg},
    kpuzzle::{KPattern, KPuzzle},
};
use rand::Rng;

use crate::{
    _internal::{
        errors::SearchError,
        search::{filter::filtering_decision::FilteringDecision, move_count::MoveCount},
    },
    experimental_lib_api::{
        KPuzzleSimpleMaskPhase, KPuzzleSimpleMaskPhaseConstructionOptions, MultiPhaseSearch,
    },
    scramble::{
        get_kpuzzle::GetKPuzzle,
        puzzles::{
            canonicalizing_solved_kpattern_depth_filter::{
                CanonicalizingSolvedKPatternDepthFilter,
                CanonicalizingSolvedKPatternDepthFilterConstructionParameters,
            },
            definitions::{
                fto_orientation_canonicalization_kpattern, fto_phase1_mask_kpattern,
                fto_phase2_mask_kpattern,
            },
        },
        randomize::OrbitRandomizationConstraints,
        scramble_finder::{
            scramble_finder::ScrambleFinder,
            solving_based_scramble_finder::{NoScrambleOptions, SolvingBasedScrambleFinder},
        },
        scramble_search::move_list_from_vec,
    },
};

use super::{
    super::randomize::{randomize_orbit, OrbitOrientationConstraint, OrbitPermutationConstraint},
    definitions::fto_kpuzzle,
};

const FTO_MINIMUM_OPTIMAL_SOLUTION_MOVE_COUNT: MoveCount = MoveCount(2);

pub(crate) struct FTOScrambleFinder {
    kpuzzle: KPuzzle,
    canonicalizing_solved_kpattern_depth_filter: CanonicalizingSolvedKPatternDepthFilter,
    multi_phase_search: MultiPhaseSearch<KPuzzle>,
}

impl Default for FTOScrambleFinder {
    fn default() -> Self {
        let kpuzzle = fto_kpuzzle();
        let canonicalizing_solved_kpattern_depth_filter =
            CanonicalizingSolvedKPatternDepthFilter::try_new(
                CanonicalizingSolvedKPatternDepthFilterConstructionParameters {
                    canonicalization_mask: fto_orientation_canonicalization_kpattern().clone(),
                    canonicalization_generator_moves: move_list_from_vec(vec!["Rv", "Uv"]),
                    max_canonicalizing_move_count_below: MoveCount(5),
                    solved_pattern: kpuzzle.default_pattern().clone(),
                    depth_filtering_generator_moves: move_list_from_vec(vec![
                        "U", "L", "F", "R", "u", "l", "f", "r",
                    ]),
                    min_optimal_solution_move_count: FTO_MINIMUM_OPTIMAL_SOLUTION_MOVE_COUNT,
                },
            )
            .unwrap();

        let mut masked_target_patterns: Vec<KPattern> = vec![];
        for place_bottom_piece in [
            parse_alg!(""),
            parse_alg!("L"),
            parse_alg!("L'"),
            parse_alg!("U L"),
        ] {
            let with_bottom_piece_placed = fto_phase2_mask_kpattern()
                .apply_alg(place_bottom_piece)
                .unwrap();
            for orient_bottom_piece in [parse_alg!(""), parse_alg!("L U' L")] {
                let with_bottom_piece_placed_and_oriented = with_bottom_piece_placed
                    .apply_alg(orient_bottom_piece)
                    .unwrap();
                for auf in [parse_alg!(""), parse_alg!("U"), parse_alg!("U'")] {
                    masked_target_patterns.push(
                        with_bottom_piece_placed_and_oriented
                            .apply_alg(auf)
                            .unwrap(),
                    );
                }
            }
        }

        // dbg!(&masked_target_patterns);

        let multi_phase_search = MultiPhaseSearch::try_new(
            kpuzzle.clone(),
            vec![
                Box::new(
                    KPuzzleSimpleMaskPhase::try_new(
                        "Solve back pyramid".to_owned(),
                        fto_phase1_mask_kpattern().clone(),
                        move_list_from_vec(vec!["U", "L", "F", "R", "BL", "BR", "B", "D"]),
                        Default::default(),
                    )
                    .unwrap(),
                ),
                // TODO: use cosets to have a single target pattern.
                Box::new(
                    KPuzzleSimpleMaskPhase::try_new(
                        "Solve to <U, L>".to_owned(),
                        fto_phase2_mask_kpattern().clone(),
                        move_list_from_vec(vec!["U", "L", "F", "R"]),
                        KPuzzleSimpleMaskPhaseConstructionOptions {
                            masked_target_patterns: Some(masked_target_patterns),
                            ..Default::default()
                        },
                    )
                    .unwrap(),
                ),
                // TODO: use moves from https://github.com/cubing/cubing.js/blob/805dffc66d4b696a128282d531568c5905bd071a/src/cubing/vendor/mpl/xyzzy/fto-solver.js#L1968-L1998
                Box::new(
                    KPuzzleSimpleMaskPhase::try_new(
                        "Solve <U, L>".to_owned(),
                        kpuzzle.default_pattern().clone(),
                        move_list_from_vec(vec!["U", "L"]),
                        Default::default(),
                    )
                    .unwrap(),
                ),
            ],
            Default::default(),
        )
        .unwrap();

        Self {
            kpuzzle: kpuzzle.clone(),
            canonicalizing_solved_kpattern_depth_filter,
            multi_phase_search,
        }
    }
}

impl ScrambleFinder for FTOScrambleFinder {
    type TPuzzle = KPuzzle;
    type ScrambleOptions = NoScrambleOptions;

    fn filter_pattern(
        &mut self,
        pattern: &KPattern,
        _scramble_options: &NoScrambleOptions,
    ) -> FilteringDecision {
        self.canonicalizing_solved_kpattern_depth_filter
            .depth_filter(pattern)
            .unwrap()
    }
}

impl SolvingBasedScrambleFinder for FTOScrambleFinder {
    fn derive_fair_unfiltered_pattern<R: Rng>(
        &mut self,
        _scramble_options: &NoScrambleOptions,
        mut rng: R,
    ) -> KPattern {
        let mut scramble_pattern = self.kpuzzle.default_pattern();

        randomize_orbit(
            &mut scramble_pattern,
            0,
            "C4RNER",
            OrbitRandomizationConstraints {
                permutation: Some(OrbitPermutationConstraint::EvenParity),
                orientation: Some(OrbitOrientationConstraint::EvenOddHackSumToZero(vec![
                    1, 3, 5,
                ])),
                ..Default::default()
            },
            &mut rng,
        );

        for subset in [
            vec![0, 1, 2, 3, 4, 14, 15, 16, 19, 20, 22, 23],
            vec![5, 6, 7, 8, 9, 10, 11, 12, 13, 17, 18, 21],
        ] {
            randomize_orbit(
                &mut scramble_pattern,
                1,
                "CENTERS",
                OrbitRandomizationConstraints {
                    permutation: Some(OrbitPermutationConstraint::EvenParity), // TODO: technically correct but doesn't have an effect on randomness?
                    subset: Some(subset),
                    ..Default::default()
                },
                &mut rng,
            );
        }

        randomize_orbit(
            &mut scramble_pattern,
            2,
            "EDGES",
            OrbitRandomizationConstraints {
                permutation: Some(OrbitPermutationConstraint::EvenParity),
                orientation: Some(OrbitOrientationConstraint::AllZero),
                ..Default::default()
            },
            &mut rng,
        );

        scramble_pattern
    }

    fn solve_pattern(
        &mut self,
        pattern: &KPattern,
        _scramble_options: &NoScrambleOptions,
    ) -> Result<Alg, SearchError> {
        self.multi_phase_search
            .chain_first_solution_for_each_phase(pattern)
    }

    fn collapse_inverted_alg(&mut self, alg: Alg) -> Alg {
        alg // TODO
    }
}

impl GetKPuzzle for FTOScrambleFinder {
    fn get_kpuzzle(&self) -> &KPuzzle {
        fto_kpuzzle()
    }
}

#[cfg(test)]
mod tests {
    use cubing::alg::parse_alg;

    use crate::scramble::{
        puzzles::{definitions::fto_kpuzzle, fto::FTOScrambleFinder},
        scramble_finder::{
            scramble_finder::ScrambleFinder, solving_based_scramble_finder::NoScrambleOptions,
        },
    };

    #[test]
    fn filter_3_mover() -> Result<(), String> {
        // Regression test for a 3-mover that requires reorientation to work.
        let alg = parse_alg!("F U F L R BR' R' F' L' U'");
        let pattern = fto_kpuzzle().default_pattern().apply_alg(alg).unwrap();

        let mut fto_scramble_finder = FTOScrambleFinder::default();
        assert!(fto_scramble_finder
            .filter_pattern(&pattern, &NoScrambleOptions {})
            .is_reject());

        Ok(())
    }
}
