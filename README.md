# KSB Diff

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
| ST0116 Software developer, Level 4 | 1.2 | ST0116/v1.2 (November 2025) | Not yet |

Each file holds the standard's reference, title, level and versions; every KSB with its text; and every assessment method with its grading descriptors, the KSBs each descriptor covers, and the descriptor text.

The comparison tool is not built yet. See the [roadmap](ROADMAP.md).

## Layout

```
data/
  ST0116/
    v1.2.json          one file per published version
schema/
  standard.schema.json the structure every data file must follow
```

Descriptor identifiers such as `M1-P01` (method 1, pass descriptor 1) are assigned by this repository to make comparison possible. They do not appear in the published plans.

## Important limits

- **This is not an official source.** It is not produced, endorsed or checked by Skills England or any awarding or assessment body. The published standard and assessment plan are the authority; always check against them before relying on anything here.
- **It records what the plans say. It does not interpret them.** There is no guidance on how to meet a descriptor, no marking or grading of anyone's work, and no prediction of outcomes.

## Licences

- **Code and schema:** [MIT](LICENSE).
- **Standards content** (KSB and descriptor text): Crown copyright, reproduced under the Open Government Licence v3.0. See [DATA-LICENCE.md](DATA-LICENCE.md).
