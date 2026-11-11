# Brand collection exploration: asset sources

Local design exploration only (`/dev/brand-collection`). Not for publication.

## VNest identity (client-supplied, proposed direction, not yet confirmed as final)

| File | Source | How it was made |
|---|---|---|
| `vnest-symbol.svg` | `AI_edited_2026.ai` (Adobe Illustrator 25.0, 1 artboard 1000×1000, sha256 `4e4c36e9…c6b229f`), supplied by the client on 15/10/2026 | The artwork's own vector paths, copied out of the file's content stream without redrawing: the symbol only |
| `vnest-wordmark.svg` | same | the "vnest" wordmark only |
| `vnest-lockup.svg` | same | symbol, wordmark and "HOSPITALITY MANAGEMENT" |

Colours exactly as in the artwork: the symbol and tagline are `#AB7444` (sRGB 0.671 0.455 0.267, ICC-based); the wordmark is `#3C3C3C` (gray 0.235).

Palette reference: `Vnest_Logo_Concept_Presentation_15.06.2026_final.pdf` (6 slides, sha256 `0e390865…d002f53f`). Slide 2 lists Copper `#A87444`, Dark Olive `#37412F`, Warm Taupe `#8A8173`, Beige `#F1ECE4`. The artwork measures `#AB7444` for copper, which matches the brief; the slide's `#A87444` is treated as a typing error, to be confirmed. Beige appears only on the slide (the artwork has no beige), and the slide prints it very faintly; `#F1ECE4` is the value read from it.

## Partner brand logos

Not supplied. Bare Boutique Stays, The Nắng Suites and Pepper House appear as labelled placeholder slots. Nothing has been drawn, traced or approximated.

## Property pictures

The drawn stand-ins in `../exploration/` and nothing else. Each carries "ẢNH MẪU · KHÔNG PHẢI HÌNH ẢNH VNEST" inside the picture. The assignment of a drawing to a property is arbitrary and says nothing about that property.

## Client-content placeholder (03.3-C1, 16/10/2026)

`placeholder.svg` is a plain beige (`#F1ECE4`) 3:2 frame with no content. The `/dev/brand-collection/b-client` preview draws its label ("Ảnh giữ chỗ" and the reason) in HTML over it, so it can be read at every size. It stands in for VNest photographs until gate G2 (photography) is authorised.
