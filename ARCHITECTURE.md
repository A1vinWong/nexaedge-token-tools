# NexaEdge Protocol — Architecture Design

> **Status:** Pre-seed concept design. No mainnet protocol deployed yet.  
> **Last updated:** June 2026

-----

## 1. Problem

Edge AI inference today faces a trilemma:

- **GPU cloud** is expensive ($2–4/hr H100), centralised, and latency-bound (50–150ms round-trip)
- **On-device AI** is isolated — no coordination, no economic incentive, no task routing
- **Bandwidth networks** (e.g. Grass) monetise idle internet but ignore compute entirely

6.8 billion smartphones sit idle for 18+ hours per day. Modern devices (Apple A-series, Snapdragon 8 Gen) carry dedicated NPUs capable of running 1B–4B parameter models locally. NexaEdge is designed to coordinate this untapped compute into a verifiable, incentivised inference network.

-----

## 2. Core Design Thesis

> Turn every idle smartphone into a provable compute node, rewarded in NEXA for verified AI work.

Three properties make this distinct from prior DePIN approaches:

1. **Compute, not bandwidth** — the scarce resource being monetised is CPU/NPU cycles, not residential IP addresses
1. **Verifiable execution** — every task result must be provably correct before reward is issued
1. **Hardware-bound identity** — node identity is anchored to physical device fingerprint, not a software key that can be spoofed

-----

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DEMAND LAYER                         │
│   AI Buyers (developers, labs, DeFi protocols)              │
│   Submit tasks via REST API · Pay in NEXA (SPL)             │
└───────────────────────┬─────────────────────────────────────┘
                        │  Task Request + NEXA escrow
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    COORDINATION LAYER                        │
│   Solana SPL · BFT Consensus · Reward Settlement            │
│                                                             │
│   • Task queue management                                   │
│   • Node selection (reputation + availability)              │
│   • Proof validation                                        │
│   • Atomic reward distribution                              │
└───────────────────────┬─────────────────────────────────────┘
                        │  Task dispatch
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPPLY LAYER                           │
│   Device Nodes (smartphones, tablets)                       │
│                                                             │
│   • WASM sandbox (isolated execution environment)           │
│   • NPU/CPU inference runtime                               │
│   • Thermal guard daemon (39°C ceiling)                     │
│   • Hardware fingerprint module                             │
│   • ZK proof generation                                     │
└─────────────────────────────────────────────────────────────┘
```

-----

## 4. Node Lifecycle

### 4.1 Registration

1. Device installs NexaEdge client
1. Client generates a **hardware fingerprint** — derived from a combination of device identifiers (SoC model, GPU UUID, secure enclave attestation). This is hashed and committed on-chain.
1. Node registers on Solana with its fingerprint hash and a Solana wallet (SPL)
1. Node enters the availability pool

### 4.2 Task Assignment

1. Buyer submits task (model ID + input payload) and locks NEXA in escrow
1. Coordinator selects `n` nodes from the pool using a weighted lottery (stake weight + uptime score)
1. Task is dispatched to selected nodes simultaneously (redundant execution)

### 4.3 Execution

1. Node receives task inside **WASM sandbox** — model weights are streamed, inputs are processed locally
1. NPU is invoked via a platform-specific bridge (CoreML on iOS, NNAPI on Android)
1. **Thermal guard daemon** monitors device temperature continuously:
- If temp ≥ 39°C → task execution paused, node signals unavailability
- Passive cooling wait → node re-enters pool when temp ≤ 36°C
1. Inference result + execution metadata is produced

### 4.4 Verification (Proof of Compute)

1. Node generates a **ZK proof** attesting:
- Correct model was run (model hash matches)
- Hardware fingerprint matches registered identity
- Output was produced within declared latency window
1. Proof is submitted to the coordination layer
1. BFT consensus across `n` redundant nodes confirms result consistency
1. If ≥ ⅔ nodes agree → result accepted, NEXA released from escrow to participating nodes

### 4.5 Reward Distribution

- Base reward: proportional to compute contribution (task complexity × execution time)
- Bonus: uptime streak multiplier (encourages consistent availability)
- Slash: nodes submitting invalid proofs lose a portion of staked NEXA

-----

## 5. Sybil Resistance

A core weakness of existing DePIN networks (notably Grass) is susceptibility to Sybil attacks — one operator spinning up thousands of virtual nodes via VPN/VM to claim disproportionate rewards.

NexaEdge mitigates this at two layers:

|Layer    |Mechanism                              |Attack prevented                                               |
|---------|---------------------------------------|---------------------------------------------------------------|
|Identity |Hardware fingerprint committed on-chain|One physical device = one node identity                        |
|Execution|ZK proof of compute                    |Cannot fake task completion without running it                 |
|Consensus|BFT redundant execution                |Cannot corrupt result without controlling ≥ ⅓ of selected nodes|

Hardware fingerprinting is not perfect — it will be pressure-tested in the hardware alpha phase (Q3 2026 target). The design assumes a threat model where most attackers are economically rational and will not invest in physical device farms when returns are below farm cost.

-----

## 6. Supported Workload Types

### 6.1 Edge AI Inference (Primary)

- Model range: 1.8B–3.8B parameter SLMs (Phi-3 mini, Gemma 2B, Qwen 1.5B)
- Execution: WASM → CoreML (iOS) / NNAPI (Android)
- Target latency: < 5ms for cached models on NPU
- Privacy property: input data never leaves the device

### 6.2 RLHF Dataset Validation

- Distributed labelling and cross-validation of AI training datasets
- Each chunk validated by ≥ 3 independent nodes
- Output: consensus label with confidence score

### 6.3 ZK-ML Proof Generation

- Fragment ZK proof generation across multiple nodes
- Aggregated proof verified on-chain
- Use case: verifiable AI inference for DeFi and compliance applications

-----

## 7. NEXA Token Role

|Function  |Description                                              |
|----------|---------------------------------------------------------|
|Payment   |Buyers pay in NEXA for compute tasks                     |
|Reward    |Nodes earn NEXA for verified task completion             |
|Stake     |Nodes stake NEXA to participate; slashed for misbehaviour|
|Governance|Future: token-weighted protocol parameter votes          |

**Token facts (on-chain, verifiable):**

- Contract: `D7h9MvFDkVxPYeJwSTcE7VkKXo6mygCHYph36P8oeic2`
- Supply: 100,000,000 NEXA (fixed — mint authority revoked)
- Network: Solana Mainnet
- Standard: SPL Token

🔍 [Verify on Solscan](https://solscan.io/token/D7h9MvFDkVxPYeJwSTcE7VkKXo6mygCHYph36P8oeic2)

-----

## 8. Thermal Safety Design

Device longevity is a supply-side SLA concern. Institutional compute buyers require predictable uptime guarantees; running devices at thermal limits destroys hardware and increases churn.

The **39°C thermal protocol** is a hardcoded constraint in the node daemon:

```
while task_running:
    temp = read_device_temp()
    if temp >= 39°C:
        pause_task_queue()
        signal_coordinator(status="thermal_hold")
        wait_until(temp <= 36°C)
        resume_task_queue()
```

This is enforced at the WASM sandbox level — not configurable by the node operator. It trades short-term throughput for long-term device health and network reliability.

-----

## 9. Planned Development Milestones

|Phase  |Target |Deliverable                                                                             |
|-------|-------|----------------------------------------------------------------------------------------|
|Q2 2026|NOW    |Architecture, whitepaper, waitlist, NEXA minted                                         |
|Q3 2026|MVP    |WASM runtime on iOS/Android, Phi-3 mini on NPU, thermal daemon, 50-device internal alpha|
|Q4 2026|Beta   |BFT testnet, SPL reward distribution, ZK proof of compute, 1,000-node closed beta       |
|Q1 2027|Mainnet|Open enrollment, Solana Seeker integration, marketplace, 3 paying buyers                |
|2027+  |Scale  |ZK-ML live, laptop/IoT expansion, Series A                                              |

-----

## 10. Open Research Questions

These are honest unknowns that will be resolved during the MVP and beta phases:

1. **Hardware fingerprint robustness** — how stable are device identifiers across OS updates? How resistant to spoofing on rooted devices?
1. **WASM → NPU bridge latency** — what is the real overhead of the WASM sandbox on CoreML/NNAPI invocation?
1. **ZK proof generation cost on mobile** — proof generation is compute-intensive; what is the net reward after proof overhead?
1. **Thermal variance across device SKUs** — the 39°C ceiling may need per-device-class calibration
1. **BFT consensus latency at scale** — at 100K nodes, what is the p99 consensus round-trip?

-----

## Contact

- Website: [nexaedge.org](https://nexaedge.org)
- Email: [contact@nexaedge.org](mailto:contact@nexaedge.org)
- X: [@nexaedge_](https://x.com/nexaedge_)
- Telegram: [t.me/NexaEdge7](https://t.me/NexaEdge7)
