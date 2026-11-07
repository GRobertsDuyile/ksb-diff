# KSB Diff

[![Validate data](https://github.com/GRobertsDuyile/ksb-diff/actions/workflows/validate.yml/badge.svg)](https://github.com/GRobertsDuyile/ksb-diff/actions/workflows/validate.yml)

KSB Diff keeps open, structured data for English apprenticeship standards and their assessment plans, one file per published version, so that anyone can see exactly what changed between versions.

## Why it exists

Apprenticeship standards and their assessment plans are revised over time, and revisions are being introduced in phases. When a new version is published, training providers, curriculum teams and end-point assessment organisations have to work out what changed: which knowledge, skills and behaviours (KSBs) were added, removed or reworded, and which grading descriptors moved. Today that means reading two PDFs side by side. This repository holds each version as data, so the comparison can be done by a tool and checked by anyone.

## Who it is for

- Curriculum developers and training providers updating programmes to a new version.
- End-point assessment organisations checking what their assessors need to know.
- Apprentices and employers who want to see what their standard asks for.
- Developers who need the content of a standard in a machine-readable form.

## What is here now

| Standard | Version | Assessment plan | Checked against source |
|---|---|---|---|
| ST0116 Software developer, Level 4 | 1.2 | [ST0116/v1.2](https://skillsengland.education.gov.uk/media/fwedv2h3/st0116-software-developer-level-4-ap-for-publication-17112025.pdf) | Yes, 7 November 2026 |

Each file holds the standard's reference, title, level and versions; every KSB with its text; every assessment method with its grading descriptors, the KSBs each descriptor covers, and the descriptor text; the grading rules for each method and for the overall grade, quoted from the plan; and links to the published standard and assessment plan it was checked against, with the date of the check.

"Checked against source" means every KSB was compared with the published standard page, and every descriptor and mapping with the published assessment plan, character for character.

The comparison tool is not built yet. See the [roadmap](ROADMAP.md).

## Assessment reform

England is replacing end-point assessment with apprenticeship assessment. The change is being introduced standard by standard as Skills England publishes revised assessment plans, and the government expects the sector to remain in transition during 2026 and 2027 ([GOV.UK](https://www.gov.uk/government/publications/apprenticeship-funding-rules-2025-to-2026/changes-to-apprenticeship-assessment-2025-to-2026)). Standards whose plans have not been revised keep end-point assessment.

ST0116 version 1.2 is an end-point assessment plan. When a revised plan for a standard is published, it is added here as a new version, so the change of assessment model can be compared with the version it replaces. Recording that change is planned for schema version 2; see the [roadmap](ROADMAP.md).

## Layout

```
data/
  ST0116/
    v1.2.json          one file per published version
schema/
  standard.schema.json the structure every data file must follow
scripts/
  validate.js          checks every data file against the schema
tests/
  validate.test.js     tests for the validator
```

Descriptor identifiers such as `M1-P01` (method 1, pass descriptor 1) are assigned by this repository so that each descriptor can be referred to. They do not appear in the published plans. An identifier only identifies a descriptor within one file: the same identifier in another version may refer to a different descriptor, so identifiers are never used to match descriptors across versions.

## Checking the data

Every push runs the validator and its tests with GitHub Actions. To run them yourself, install Node.js 22 or later; nothing else is needed.

```
node scripts/validate.js
node --test
```

The validator checks each file against the schema, then checks what a schema cannot: that every KSB a descriptor lists exists and is assessed by that descriptor's method, that identifiers are unique and match their method and grade, and that the file's path matches its reference and version.

## Important limits

- **This is not an official source.** It is not produced, endorsed or checked by Skills England or any awarding or assessment body. The published standard and assessment plan are the authority; always check against them before relying on anything here.
- **It records what the plans say. It does not interpret them.** There is no guidance on how to meet a descriptor, no marking or grading of anyone's work, and no prediction of outcomes.

## Licences

- **Code and schema:** [MIT](LICENSE).
- **Standards content** (KSB and descriptor text): Crown copyright, reproduced under the Open Government Licence v3.0. See [DATA-LICENCE.md](DATA-LICENCE.md).
