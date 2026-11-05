# Roadmap

## 1. Trustworthy first file

- Check every KSB and descriptor in `data/ST0116/v1.2.json` against the published assessment plan, word for word, and record the result in the README table.
- Add the grading rules for each method and for the overall grade, quoted from the plan.
- Write a validation script, with no dependencies, that checks every data file against the schema and confirms that each descriptor's KSBs exist and belong to its method.
- Run the validation on every push with GitHub Actions.

## 2. The first comparison

- Add the previous published version of ST0116, so there are two versions to compare.
- Build a command-line tool that compares two versions and reports KSBs and descriptors that were added, removed or reworded, and descriptors that moved between methods.
- Write tests for the comparison, including reworded text and renumbered descriptors.

## 3. A page anyone can use

- Publish a static site on GitHub Pages where a user picks a standard and two versions and sees the changes.
- Add a plain-text and a CSV export of each comparison.

## 4. More standards

- Add other digital standards one at a time, starting with Level 4 data analyst and Level 3 business administrator, each checked against its published source before it is marked as checked.
- Write a contribution guide so others can add a standard and have it validated.

## Out of scope

- Marking, grading or giving feedback on anyone's work.
- Interpreting what a descriptor means or how to meet it.
- Any use of AI models.
