"""
Synthetic Data Generator for Indian Railways Automatic Block Planning (SIH26027)
Simulates a realistic High-Density Network (HDN) trunk corridor (NDLS to DDU)
with Stations, Track Sections, Asset Risk Scores, Train Timetable, and Block Demands.
"""

import json
import random
import os
from typing import List, Dict, Tuple
from .models import Station, TrackSection, Train, BlockRequest, NetworkData


def generate_network_data(seed: int = 42) -> NetworkData:
    """Generate deterministic, realistic Indian Railways corridor data."""
    random.seed(seed)

    # 1. Major Stations along NDLS - DDU trunk corridor
    stations = [
        Station(code="NDLS", name="New Delhi", division="Delhi (NR)", zone="Northern Railway", km_mark=0.0, latitude=28.6415, longitude=77.2197),
        Station(code="GZB", name="Ghaziabad Jn", division="Delhi (NR)", zone="Northern Railway", km_mark=25.0, latitude=28.6692, longitude=77.4538),
        Station(code="ALJN", name="Aligarh Jn", division="Prayagraj (NCR)", zone="North Central Railway", km_mark=131.0, latitude=27.8974, longitude=78.0880),
        Station(code="TDL", name="Tundla Jn", division="Prayagraj (NCR)", zone="North Central Railway", km_mark=209.0, latitude=27.2081, longitude=78.2415),
        Station(code="ETW", name="Etawah Jn", division="Prayagraj (NCR)", zone="North Central Railway", km_mark=301.0, latitude=26.7769, longitude=79.0232),
        Station(code="CNB", name="Kanpur Central", division="Prayagraj (NCR)", zone="North Central Railway", km_mark=440.0, latitude=26.4547, longitude=80.3507),
        Station(code="FTP", name="Fatehpur", division="Prayagraj (NCR)", zone="North Central Railway", km_mark=518.0, latitude=25.9284, longitude=80.8128),
        Station(code="PRYJ", name="Prayagraj Jn", division="Prayagraj (NCR)", zone="North Central Railway", km_mark=635.0, latitude=25.4497, longitude=81.8286),
        Station(code="MZP", name="Mirzapur", division="Prayagraj (NCR)", zone="North Central Railway", km_mark=724.0, latitude=25.1460, longitude=82.5690),
        Station(code="DDU", name="Pt. Deen Dayal Upadhyaya", division="DDU (ECR)", zone="East Central Railway", km_mark=788.0, latitude=25.2818, longitude=83.1189),
        # Loop/Branch connector
        Station(code="AF", name="Agra Fort", division="Agra (NCR)", zone="North Central Railway", km_mark=235.0, latitude=27.1795, longitude=78.0211),
    ]

    # Baseline 24-hour traffic profile templates (normalized trains/hour)
    # Peak commuter/passenger hours: 06-10 and 17-22; Night freight corridors: 00-05
    profile_trunk = [
        1.2, 0.8, 0.6, 0.8, 1.5, 2.5, 3.8, 4.2, 4.0, 3.5, 2.8, 2.4,
        2.2, 2.5, 2.8, 3.2, 3.8, 4.2, 4.5, 4.0, 3.2, 2.4, 1.8, 1.4
    ]
    profile_suburban = [
        0.8, 0.4, 0.3, 0.6, 1.8, 3.5, 4.8, 5.0, 4.5, 3.0, 2.2, 1.8,
        1.6, 1.9, 2.4, 3.2, 4.5, 5.2, 4.8, 3.6, 2.6, 1.8, 1.2, 0.9
    ]
    profile_junction = [
        1.5, 1.0, 0.8, 1.0, 1.8, 2.8, 3.6, 3.9, 3.7, 3.2, 2.9, 2.6,
        2.5, 2.8, 3.0, 3.5, 4.0, 4.1, 4.2, 3.8, 3.0, 2.5, 2.0, 1.6
    ]

    # 2. Track Sections with degradation & health attributes
    section_configs = [
        ("SEC_NDLS_GZB", "New Delhi - Ghaziabad (UP/DN Trunk)", "NDLS", "GZB", 25.0, 110, 5.0, profile_suburban, 82.0, 68.0, 75.0, 24),
        ("SEC_GZB_ALJN", "Ghaziabad - Aligarh (UP/DN Trunk)", "GZB", "ALJN", 106.0, 130, 4.0, profile_trunk, 65.0, 80.0, 85.0, 18),
        ("SEC_ALJN_TDL", "Aligarh - Tundla (UP/DN Trunk)", "ALJN", "TDL", 78.0, 130, 4.0, profile_trunk, 78.0, 62.0, 70.0, 29),
        ("SEC_TDL_AF", "Tundla - Agra Fort Connector", "TDL", "AF", 26.0, 100, 3.0, profile_junction, 52.0, 88.0, 90.0, 12),
        ("SEC_TDL_ETW", "Tundla - Etawah (High-Speed Section)", "TDL", "ETW", 92.0, 160, 4.5, profile_trunk, 88.0, 72.0, 65.0, 35),
        ("SEC_ETW_CNB", "Etawah - Kanpur (UP/DN Trunk)", "ETW", "CNB", 139.0, 130, 4.2, profile_trunk, 74.0, 75.0, 80.0, 21),
        ("SEC_CNB_FTP", "Kanpur - Fatehpur (UP/DN Trunk)", "CNB", "FTP", 78.0, 130, 4.0, profile_trunk, 85.0, 60.0, 55.0, 32),
        ("SEC_FTP_PRYJ", "Fatehpur - Prayagraj (UP/DN Trunk)", "FTP", "PRYJ", 117.0, 130, 4.0, profile_trunk, 68.0, 78.0, 82.0, 15),
        ("SEC_PRYJ_MZP", "Prayagraj - Mirzapur (UP/DN Trunk)", "PRYJ", "MZP", 89.0, 130, 3.8, profile_trunk, 71.0, 82.0, 78.0, 19),
        ("SEC_MZP_DDU", "Mirzapur - Pt. Deen Dayal Upadhyaya", "MZP", "DDU", 64.0, 130, 4.0, profile_trunk, 80.0, 65.0, 70.0, 28),
        ("SEC_CNB_BYPASS", "Kanpur Central Goods Bypass Line", "CNB", "FTP", 18.0, 80, 2.5, profile_junction, 91.0, 58.0, 62.0, 40),
    ]

    sections: List[TrackSection] = []
    for sid, sname, frm, to_st, length, mps, cap, prof, pway, ohe, sig, days in section_configs:
        # Calculate composite asset risk score (0-100, higher = higher risk / worse condition)
        # P-Way health contributes 45%, OHE 30%, Signaling 25%
        # Component health is 0-100 (100 = brand new, 0 = critical failure)
        # Therefore Risk = 100 - (weighted health) + overdue penalty
        avg_health = (pway * 0.45 + ohe * 0.30 + sig * 0.25)
        overdue_factor = min(15.0, (days / 30.0) * 10.0)
        risk = max(5.0, min(99.0, (100.0 - avg_health) * 1.5 + overdue_factor))

        sections.append(
            TrackSection(
                section_id=sid,
                name=sname,
                from_station=frm,
                to_station=to_st,
                length_km=length,
                max_speed_kmph=mps,
                capacity_trains_per_hour=cap,
                risk_score=round(risk, 1),
                pway_health=pway,
                ohe_health=ohe,
                signal_health=sig,
                days_since_last_maintenance=days,
                hourly_traffic_density=[round(v + random.uniform(-0.15, 0.15), 2) for v in prof]
            )
        )

    # 3. Scheduled Train Timetable (48 realistic trains)
    train_templates = [
        # Must-run Premium Trains (Priority 1)
        ("22436", "Vande Bharat Express (NDLS-BSB)", "VANDE_BHARAT", 1, True, "NDLS", "DDU", 6, 14),
        ("22435", "Vande Bharat Express (BSB-NDLS)", "VANDE_BHARAT", 1, True, "DDU", "NDLS", 15, 23),
        ("22416", "Vande Bharat Express (NDLS-BSB 2)", "VANDE_BHARAT", 1, True, "NDLS", "DDU", 15, 23),
        ("12302", "Howrah Rajdhani Express", "RAJDHANI", 1, True, "NDLS", "DDU", 16, 23),
        ("12301", "Howrah Rajdhani Express (UP)", "RAJDHANI", 1, True, "DDU", "NDLS", 3, 10),
        ("12424", "Dibrugarh Rajdhani Express", "RAJDHANI", 1, True, "NDLS", "DDU", 16, 23),
        ("12423", "Dibrugarh Rajdhani (UP)", "RAJDHANI", 1, True, "DDU", "NDLS", 4, 11),
        ("12004", "Lucknow Swarna Shatabdi", "SHATABDI", 1, True, "NDLS", "CNB", 6, 12),
        ("12003", "Lucknow Swarna Shatabdi (UP)", "SHATABDI", 1, True, "CNB", "NDLS", 16, 22),
        ("12418", "Prayagraj Express", "SUPERFAST", 1, True, "NDLS", "PRYJ", 22, 7),
        ("12417", "Prayagraj Express (UP)", "SUPERFAST", 1, True, "PRYJ", "NDLS", 22, 7),
        ("12560", "Shiv Ganga Express", "SUPERFAST", 1, True, "NDLS", "BSB", 20, 5),
        ("12314", "Sealdah Rajdhani Express", "RAJDHANI", 1, True, "NDLS", "DDU", 16, 23),

        # Regular Superfast & Express Trains (Priority 2)
        ("12452", "Shram Shakti Express", "SUPERFAST", 2, False, "NDLS", "CNB", 23, 6),
        ("12451", "Shram Shakti Express (UP)", "SUPERFAST", 2, False, "CNB", "NDLS", 23, 6),
        ("12398", "Mahabodhi Express", "SUPERFAST", 2, False, "NDLS", "DDU", 12, 20),
        ("12397", "Mahabodhi Express (UP)", "SUPERFAST", 2, False, "DDU", "NDLS", 14, 22),
        ("12876", "Neelachal Express", "EXPRESS", 2, False, "NDLS", "DDU", 7, 18),
        ("12875", "Neelachal Express (UP)", "EXPRESS", 2, False, "DDU", "NDLS", 8, 19),
        ("12582", "Banaras Superfast", "SUPERFAST", 2, False, "NDLS", "PRYJ", 22, 7),
        ("12556", "Gorakhdham Express", "SUPERFAST", 2, False, "NDLS", "CNB", 21, 5),
        ("14006", "Lichchhavi Express", "EXPRESS", 2, False, "NDLS", "PRYJ", 18, 5),
        ("14164", "Sangam Express", "EXPRESS", 2, False, "ALJN", "PRYJ", 19, 8),
        ("12428", "Rewa Express", "SUPERFAST", 2, False, "NDLS", "PRYJ", 22, 7),
        ("12382", "Poorva Express", "SUPERFAST", 2, False, "NDLS", "DDU", 17, 2),
        ("12296", "Sanghamitra Express", "SUPERFAST", 2, False, "DDU", "PRYJ", 8, 11),
        ("15004", "Chauri Chaura Express", "EXPRESS", 2, False, "CNB", "PRYJ", 17, 21),
        ("14218", "Unchahar Express", "EXPRESS", 2, False, "ALJN", "PRYJ", 21, 6),
        ("12402", "Magadh Express", "SUPERFAST", 2, False, "NDLS", "DDU", 21, 6),
        ("15484", "Mahananda Express", "EXPRESS", 2, False, "NDLS", "DDU", 7, 20),

        # Flexible Freight Rakes (Priority 3)
        ("FRT_CON_101", "CONCOR Container Rake (TKD-DDU)", "FREIGHT", 3, False, "NDLS", "DDU", 1, 9),
        ("FRT_CON_102", "CONCOR Container Rake (DDU-TKD)", "FREIGHT", 3, False, "DDU", "NDLS", 13, 21),
        ("FRT_CON_103", "Auto Car Carrier (Maruti Rake)", "FREIGHT", 3, False, "GZB", "CNB", 2, 7),
        ("FRT_COAL_201", "NTPC Coal Rake (Singrauli-Dadri)", "FREIGHT", 3, False, "DDU", "GZB", 0, 8),
        ("FRT_COAL_202", "NTPC Empty Rake (Dadri-Singrauli)", "FREIGHT", 3, False, "GZB", "DDU", 10, 18),
        ("FRT_COAL_203", "Thermal Coal Rake 203", "FREIGHT", 3, False, "DDU", "CNB", 14, 20),
        ("FRT_BCN_301", "FCI Foodgrain Rake (Punjab-Bihar)", "FREIGHT", 3, False, "NDLS", "DDU", 3, 11),
        ("FRT_BCN_302", "Fertilizer Rake (IFFCO-Phulpur)", "FREIGHT", 3, False, "PRYJ", "TDL", 11, 17),
        ("FRT_BCN_303", "Cement Rake (Birla-Aligarh)", "FREIGHT", 3, False, "DDU", "ALJN", 8, 16),
        ("FRT_BOXN_401", "Steel Coil Rake (Tata-Delhi)", "FREIGHT", 3, False, "DDU", "NDLS", 2, 10),
        ("FRT_BOXN_402", "Steel Empty Rake (Delhi-Tata)", "FREIGHT", 3, False, "NDLS", "DDU", 12, 20),
        ("FRT_POL_501", "IOCL Petroleum Tanker Rake", "FREIGHT", 3, False, "CNB", "GZB", 1, 6),
        ("FRT_POL_502", "BPCL Petroleum Empty Rake", "FREIGHT", 3, False, "GZB", "CNB", 13, 18),
        ("FRT_MIL_601", "Military Logistics Special Rake", "FREIGHT", 3, False, "NDLS", "PRYJ", 4, 11),
    ]

    # Map sequential main sections in order
    corridor_sections = [
        "SEC_NDLS_GZB", "SEC_GZB_ALJN", "SEC_ALJN_TDL", "SEC_TDL_ETW",
        "SEC_ETW_CNB", "SEC_CNB_FTP", "SEC_FTP_PRYJ", "SEC_PRYJ_MZP", "SEC_MZP_DDU"
    ]

    trains: List[Train] = []
    for tnum, tname, ttype, prio, must_run, orig, dest, dep_hr, arr_hr in train_templates:
        dep_str = f"{dep_hr:02d}:00"
        arr_str = f"{arr_hr:02d}:30"
        pax = 1200 if prio == 1 else (950 if prio == 2 else 0)

        # Distribute section slots along the route
        sec_slots: Dict[str, List[int]] = {}
        total_span = (arr_hr - dep_hr) % 24
        if total_span == 0:
            total_span = 8

        is_dn = (orig == "NDLS" or orig == "GZB")
        route_secs = corridor_sections if is_dn else list(reversed(corridor_sections))

        for idx, sec in enumerate(route_secs):
            slot_offset = int((idx / max(1, len(route_secs))) * total_span)
            slot = (dep_hr + slot_offset) % 24
            sec_slots[sec] = [slot]

        trains.append(
            Train(
                train_number=tnum,
                train_name=tname,
                train_type=ttype,
                priority=prio,
                is_must_run=must_run,
                origin=orig,
                destination=dest,
                departure_time=dep_str,
                arrival_time=arr_str,
                section_slots=sec_slots,
                passengers_estimated=pax
            )
        )

    # 4. Realistic Maintenance Block Requests (~40 demands across Civil, TRD, S&T, Mech)
    raw_block_demands = [
        # Civil / Engineering (P-Way)
        ("REQ-ENG-001", "SEC_TDL_ETW", "ENGINEERING", "Track Tamping (CSM Machine)", 3, 92.0, [1, 5], "CSM Tamping Machine", "TRAFFIC_BLOCK"),
        ("REQ-ENG-002", "SEC_CNB_FTP", "ENGINEERING", "Deep Screening of Ballast (BCM)", 4, 89.0, [0, 5], "BCM Track Machine", "TRAFFIC_BLOCK"),
        ("REQ-ENG-003", "SEC_NDLS_GZB", "ENGINEERING", "Turnout Renewal & Packing", 2, 84.0, [1, 4], "Turnout Tamper (UNIMAT)", "TRAFFIC_BLOCK"),
        ("REQ-ENG-004", "SEC_ALJN_TDL", "ENGINEERING", "Rail Grinding Machine (RGM)", 3, 79.0, [0, 5], "RGM Rail Grinder", "TRAFFIC_BLOCK"),
        ("REQ-ENG-005", "SEC_MZP_DDU", "ENGINEERING", "Through Rail Renewal (TRT)", 4, 82.0, [1, 6], "TRT Track Renewal Train", "TRAFFIC_BLOCK"),
        ("REQ-ENG-006", "SEC_ETW_CNB", "ENGINEERING", "Flash Butt Welding of Joints", 2, 73.0, [11, 15], "Mobile Flash Butt Welder", "TRAFFIC_BLOCK"),
        ("REQ-ENG-007", "SEC_FTP_PRYJ", "ENGINEERING", "Shoulder Ballast Cleaning (SBCM)", 3, 67.0, [12, 16], "SBCM Machine", "TRAFFIC_BLOCK"),
        ("REQ-ENG-008", "SEC_GZB_ALJN", "ENGINEERING", "De-stressing of Long Welded Rails", 3, 64.0, [10, 14], "P-Way Gang & Tensor", "TRAFFIC_BLOCK"),
        ("REQ-ENG-009", "SEC_CNB_BYPASS", "ENGINEERING", "Curved Track Gauge Correction", 2, 94.0, [0, 6], "Manual Gang & Jacks", "TRAFFIC_BLOCK"),
        ("REQ-ENG-010", "SEC_PRYJ_MZP", "ENGINEERING", "Sleeper Replacement on Approach", 3, 70.0, [1, 5], "Portal Crane Rake", "TRAFFIC_BLOCK"),
        ("REQ-ENG-011", "SEC_TDL_AF", "ENGINEERING", "Diamond Crossing Rehabilitation", 3, 56.0, [12, 16], "P-Way Heavy Gang", "TRAFFIC_BLOCK"),
        ("REQ-ENG-012", "SEC_TDL_ETW", "ENGINEERING", "Track Geometry Stabilization (DGS)", 2, 85.0, [2, 6], "DGS Dynamic Stabilizer", "TRAFFIC_BLOCK"),

        # Electrical / Traction Distribution (TRD)
        ("REQ-TRD-001", "SEC_CNB_FTP", "TRD_ELECTRICAL", "OHE Annual Overhaul (AOH)", 3, 88.0, [1, 5], "TRD Tower Wagon", "COMBINED_BLOCK"),
        ("REQ-TRD-002", "SEC_TDL_ETW", "TRD_ELECTRICAL", "Cantilever & Dropper Replacement", 2, 81.0, [0, 4], "TRD Tower Wagon", "COMBINED_BLOCK"),
        ("REQ-TRD-003", "SEC_NDLS_GZB", "TRD_ELECTRICAL", "Neutral Section Inspection & Tuning", 2, 80.0, [1, 4], "OHE Ladder Gang", "POWER_BLOCK"),
        ("REQ-TRD-004", "SEC_MZP_DDU", "TRD_ELECTRICAL", "Contact Wire Splice Replacement", 3, 76.0, [2, 6], "TRD Tower Wagon", "COMBINED_BLOCK"),
        ("REQ-TRD-005", "SEC_GZB_ALJN", "TRD_ELECTRICAL", "Isolator & Interrupter Servicing", 2, 62.0, [11, 15], "TRD Substation Gang", "POWER_BLOCK"),
        ("REQ-TRD-006", "SEC_ETW_CNB", "TRD_ELECTRICAL", "Catenary Wire Tension Calibration", 2, 71.0, [12, 16], "TRD Tower Wagon", "COMBINED_BLOCK"),
        ("REQ-TRD-007", "SEC_PRYJ_MZP", "TRD_ELECTRICAL", "Substation 25kV Feeder Testing", 2, 69.0, [1, 4], "Traction Substation Crew", "POWER_BLOCK"),
        ("REQ-TRD-008", "SEC_ALJN_TDL", "TRD_ELECTRICAL", "Tree Trimming & OHE Clearance", 3, 74.0, [10, 14], "Tree Cutting Crew & Ladder", "POWER_BLOCK"),
        ("REQ-TRD-009", "SEC_CNB_BYPASS", "TRD_ELECTRICAL", "Yard OHE Wire Height Recalibration", 3, 87.0, [0, 5], "TRD Tower Wagon", "COMBINED_BLOCK"),
        ("REQ-TRD-010", "SEC_FTP_PRYJ", "TRD_ELECTRICAL", "Anti-Creep Wire Inspection", 2, 65.0, [13, 17], "OHE Ladder Gang", "POWER_BLOCK"),

        # Signal & Telecom (S&T)
        ("REQ-SNT-001", "SEC_NDLS_GZB", "SIGNAL_TELECOM", "Electronic Interlocking (EI) Software Upgrade", 2, 86.0, [1, 4], "S&T Technical Team", "TRAFFIC_BLOCK"),
        ("REQ-SNT-002", "SEC_CNB_FTP", "SIGNAL_TELECOM", "Point Machine Replacement & Testing", 2, 85.0, [1, 5], "Point Specialist Gang", "TRAFFIC_BLOCK"),
        ("REQ-SNT-003", "SEC_TDL_ETW", "SIGNAL_TELECOM", "Multi-Section Digital Axle Counter (MSDAC) Test", 2, 78.0, [2, 5], "Axle Counter Team", "TRAFFIC_BLOCK"),
        ("REQ-SNT-004", "SEC_MZP_DDU", "SIGNAL_TELECOM", "Track Circuit Parameter Tuning", 2, 75.0, [1, 4], "S&T Line Gang", "TRAFFIC_BLOCK"),
        ("REQ-SNT-005", "SEC_ALJN_TDL", "SIGNAL_TELECOM", "Signal LED Unit & Aspect Testing", 1, 68.0, [11, 14], "S&T Inspection Crew", "TRAFFIC_BLOCK"),
        ("REQ-SNT-006", "SEC_ETW_CNB", "SIGNAL_TELECOM", "Signaling Power Cable Insulation Test", 2, 70.0, [12, 16], "S&T Cable Gang", "TRAFFIC_BLOCK"),
        ("REQ-SNT-007", "SEC_GZB_ALJN", "SIGNAL_TELECOM", "Automatic Block Signaling (ABS) Calibration", 2, 60.0, [10, 14], "ABS Test Crew", "TRAFFIC_BLOCK"),
        ("REQ-SNT-008", "SEC_CNB_BYPASS", "SIGNAL_TELECOM", "Yard Route Relay Interlocking Overhaul", 3, 90.0, [0, 4], "Interlocking Team", "TRAFFIC_BLOCK"),
        ("REQ-SNT-009", "SEC_FTP_PRYJ", "SIGNAL_TELECOM", "Level Crossing Gate Signal Interlock Check", 1, 63.0, [14, 17], "LC Gate Maintenance Gang", "TRAFFIC_BLOCK"),
        ("REQ-SNT-010", "SEC_PRYJ_MZP", "SIGNAL_TELECOM", "OFC (Optical Fiber) Joint Testing", 2, 66.0, [1, 5], "Telecom Fiber Crew", "TRAFFIC_BLOCK"),

        # Mechanical / Bridge & Structures
        ("REQ-MECH-001", "SEC_CNB_FTP", "MECHANICAL", "Ganga Bridge Girder Inspection & Painting", 3, 83.0, [10, 15], "Bridge Inspection Gang", "TRAFFIC_BLOCK"),
        ("REQ-MECH-002", "SEC_PRYJ_MZP", "MECHANICAL", "Yamuna Bridge Bearing Replacement", 4, 76.0, [11, 16], "Heavy Bridge Gang & Jack", "TRAFFIC_BLOCK"),
        ("REQ-MECH-003", "SEC_TDL_AF", "MECHANICAL", "Yamuna Rail-Road Bridge Joint Overhaul", 3, 58.0, [12, 17], "Bridge Mechanical Team", "TRAFFIC_BLOCK"),
        ("REQ-MECH-004", "SEC_NDLS_GZB", "MECHANICAL", "Yamuna Bridge Expansion Joint Check", 2, 77.0, [1, 4], "Bridge Gang", "TRAFFIC_BLOCK"),
        ("REQ-MECH-005", "SEC_ETW_CNB", "MECHANICAL", "Girder Deflection Gauge Measurement", 2, 69.0, [13, 17], "Inspection Van & Gang", "TRAFFIC_BLOCK"),
        ("REQ-MECH-006", "SEC_MZP_DDU", "MECHANICAL", "Major Culvert Masonry Reinforcement", 3, 72.0, [11, 15], "Culvert Repair Gang", "TRAFFIC_BLOCK"),
    ]

    requests: List[BlockRequest] = []
    for req_id, sec_id, dept, wtype, dur, urg, win, mtype, btype in raw_block_demands:
        requests.append(
            BlockRequest(
                id=req_id,
                section_id=sec_id,
                department=dept,
                work_type=wtype,
                duration_hours=dur,
                urgency_score=urg,
                preferred_start_window=win,
                machine_type=mtype,
                block_type=btype,
                status="PENDING",
                assigned_start_slot=None,
                assigned_slots=None,
                reason=None,
                approved_by_controller=False
            )
        )

    return NetworkData(
        stations=stations,
        sections=sections,
        trains=trains,
        requests=requests
    )


def save_fixtures(data: NetworkData, directory_path: str) -> None:
    """Save fixtures as JSON for easy seeding and testing."""
    os.makedirs(directory_path, exist_ok=True)
    with open(os.path.join(directory_path, "network_fixtures.json"), "w", encoding="utf-8") as f:
        f.write(data.model_dump_json(indent=2))


if __name__ == "__main__":
    data = generate_network_data()
    print(f"Generated {len(data.stations)} stations, {len(data.sections)} sections, {len(data.trains)} trains, {len(data.requests)} block requests.")
