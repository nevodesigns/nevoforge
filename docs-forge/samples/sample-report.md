---
title: Line Follower Drive Unit, Design Review
subtitle: Internal sample report
client: NevoForge QA
author: Nwokolo Victor Oluebubechukwu
date: 2026-07-21
---
# Overview
This sample exercises every block the pipeline supports: headings, body text with **bold** and *italic* runs, tables, and figure placeholders.

# Drive Unit
## Motor Selection
The drive uses two N20 gearmotors at 6 V. Stall current was measured at 1.6 A per motor, so the driver must handle a combined 3.2 A worst case.

## Fastener Summary
| Size | Quantity | Location |
|---|---|---|
| M3 x 8 | 12 | Chassis plate |
| M3 x 12 | 4 | Motor mounts |
| M2 x 6 | 8 | Sensor bracket |

![Exploded view of the drive unit](placeholder)

# Conclusion
The layout passes the checklist. Remaining concern: bearing seats need a tolerance check before the next print run.
