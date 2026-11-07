# Roadmap

Work is listed in the order it will be done. Each step ends in its own commit.

## 1. A trustworthy first file

- Confirm on the Skills England page whether the ST0116 v1.2 assessment plan (November 2025) is a pre-reform end-point assessment plan or a reformed apprenticeship assessment plan, and record the answer.
- Check every KSB and descriptor in `data/ST0116/v1.2.json` against the published standard and assessment plan, word for word. Published text is kept exactly as written, including its spelling, grammar and punctuation. Where the published text appears to contain an error, the text is left unchanged and the observation goes in a separate note.
- Add three optional fields to schema version 1: `sourceUrl`, the published page each file was checked against; `checkedAgainstSource`, the date of the check; and `gradingRules`, quoted from the plan. Existing files stay valid.
- Add the grading rules for each method and for the overall grade, quoted word for word from the plan.
- Write a validation script with no dependencies. It checks only the schema keywords this repository uses (`type`, `required`, `enum`, `pattern`, `const`, `minLength`, `minItems`, `additionalProperties`), and confirms that each descriptor's KSBs exist and belong to its method. Run it on every push with GitHub Actions.

## 2. Schema version 2 for the assessment reform

England is replacing end-point assessment with apprenticeship assessment, introduced standard by standard. Schema version 2 records what the reform changes, and every value must come from the published plan; where the plan does not say, the field is left out rather than guessed.

- Version fields: the assessment model, the publisher's status exactly as worded on the page, a normalised status, the approval date, the date the version applies to new starts, the source URL and the date of the word-for-word check.
- Method fields: whether the method is an assessment method or a mandatory qualification, when it may take place, who carries it out, and the qualification's title and reference where one applies.
- KSB fields: whether the KSB is mandatory, and how it is covered (assessed, sampled or verified by the employer).
- Upgrade the ST0116 file to version 2.
- Add the first pair of versions to compare. If a successor to ST0116 v1.2 has been published, that pair comes first; otherwise a reformed digital plan and its predecessor.

## 3. The comparison tool

A command-line tool in plain Node.js with no dependencies. It compares two versions of one standard and reports, in this order:

1. A change of assessment model, stated first. If either file does not record the model, the tool says so rather than reporting no change.
2. Status and dates.
3. KSBs added, removed or reworded, with the old and new text, and changes in coverage.
4. Methods added, removed, renamed, or changed in type, timing or assessor.
5. Descriptors added, removed, reworded, moved between methods, or changed in grade.

Matching rules:

- Descriptor identifiers such as `M1-P01` identify a descriptor within one file only. The tool never uses them to match descriptors across versions.
- KSBs are matched by code and checked by text similarity, because a revised plan can reuse a code for different content.
- Descriptors are matched within each method first, then the unmatched descriptors are compared across all methods, so a descriptor that moved is reported as moved.
- The similarity measure and threshold are stated in the documentation and covered by tests. Any pair below the threshold is reported as removed and added, never as reworded.

Output formats: plain text, Markdown and CSV. Tests include a standard whose assessment becomes a mandatory qualification, reworded KSBs, a reused KSB code and a moved descriptor.

## 4. A page anyone can use

- Publish a static site on GitHub Pages where a user picks a standard and two versions and sees the changes.
- Add other digital standards one at a time, each checked against its published source before it is marked as checked.
- Write a contribution guide so others can add a standard and have it validated.

## 5. Wales

Welsh apprenticeships use frameworks rather than KSB standards, so they get their own data model instead of a stretched version of this one.

- Confirm the licence and published formats of Welsh framework documents, and the final content of the Welsh Apprenticeship Specification once its consultation closes.
- Write `framework.schema.json`, holding pathways, qualifications and other requirements, with English and Welsh text where both are published.
- Add one framework, then a framework mode to the comparison tool: qualifications added, removed or replaced per pathway, pathways added or removed, and the change of specification when it happens.

## Out of scope

- Marking, grading or giving feedback on anyone's work.
- Interpreting what a descriptor means or how to meet it.
- Any use of AI models.
