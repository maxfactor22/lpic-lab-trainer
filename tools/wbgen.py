"""Build an LPIC lab workbook .docx from a JSON spec.
usage: python wbgen.py <template.docx> <spec.json> <out.docx>
Spec: a list of blocks, each [kind, ...]:
  ["h1", text] ["sub", text] ["h2", text] ["h3", text] ["p", text]
  ["bullets", [items], num_id=1]  ["numbered", [items]]
  ["lab", {title, scenario, task, deliverable, steps:[...], validation, trap}]
"""
import sys, json, docx
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

template, spec, out = sys.argv[1:4]
d = docx.Document(template)
body = d.element.body
for child in list(body):
    if child.tag != qn('w:sectPr'):
        body.remove(child)

def item(t, num_id):
    para = d.add_paragraph(t, style='List Paragraph')
    numPr = OxmlElement('w:numPr')
    ilvl = OxmlElement('w:ilvl'); ilvl.set(qn('w:val'), '0')
    nid = OxmlElement('w:numId'); nid.set(qn('w:val'), str(num_id))
    numPr.append(ilvl); numPr.append(nid)
    para._p.get_or_add_pPr().append(numPr)

STY = {"h1": "Heading 1", "sub": "Subtitle", "h2": "Heading 2", "h3": "Heading 3"}
for b in json.load(open(spec, encoding="utf-8")):
    k = b[0]
    if k in STY: d.add_paragraph(b[1], style=STY[k])
    elif k == "p": d.add_paragraph(b[1])
    elif k == "bullets":
        for t in b[1]: item(t, b[2] if len(b) > 2 else 1)
    elif k == "numbered":
        for t in b[1]: item(t, 2)
    elif k == "lab":
        L = b[1]
        d.add_paragraph(L["title"], style="Heading 3")
        d.add_paragraph("Scenario: " + L["scenario"])
        d.add_paragraph("Task: " + L["task"])
        d.add_paragraph("Deliverable: " + L["deliverable"])
        d.add_paragraph("Suggested commands and keys: " + L["steps"][0])
        for s in L["steps"][1:]: d.add_paragraph(s)
        d.add_paragraph("Validation: " + L["validation"])
        d.add_paragraph("Real-world trap: " + L["trap"])
    else:
        raise SystemExit(f"unknown block kind {k!r}")
d.save(out)
print("saved", out)
