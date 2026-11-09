---
name: architecture-spatial-dispatch
description: >-
  Use this skill for designing high-concurrency spatial dispatch engines, Uber H3 hexagonal indexing, Redis telemetry caching, WebSocket scaling, and database architecture.
---

# Architecture, Spatial Indexing & Dispatch Engine Skill

## Overview
This skill provides architectural guidelines for scaling RideFlow's dispatch and telemetry pipeline to handle thousands of concurrent drivers and ride requests with sub-second latency.

## Core Architectural Patterns

### 1. Uber H3 Geospatial Indexing
- Convert driver lat/lng coordinates into H3 index cells (Resolution 7 ~1.2km radius, Resolution 8 ~460m, Resolution 9 ~170m).
- Index active available drivers in memory / Redis using `H3Index -> Set<DriverId>`.
- For incoming ride requests, query the pickup location's H3 cell and adjacent `kRing(1)` or `kRing(2)` neighbors.

### 2. Batch Dispatch vs. Greedy Dispatch
- **Greedy (Legacy)**: Instantly broadcast ride to closest single driver.
- **Batch Bipartite Matching (Uber Standard)**: Collect requests within a 3-5 second matching window, compute the global cost matrix (minimizing aggregate rider wait times and driver deadheading), and assign optimally using Hungarian or Min-Cost Max-Flow algorithms.

### 3. High-Frequency Telemetry Ingestion
- Decouple driver GPS pings from relational database writes.
- Write location pings to Redis Geohash / in-memory buffer (`GEOADD active_drivers <lng> <lat> <driver_id>`).
- Persist downsampled location breadcrumbs to PostgreSQL only at 30-second intervals or at trip milestone events.
