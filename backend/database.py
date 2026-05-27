import sqlite3
try:
    import pymysql
except ImportError:
    pymysql = None
import os
try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = lambda: None
import random
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

DB_TYPE = os.getenv("DB_TYPE", "sqlite").lower()
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "smart_hospital_energy")

SQLITE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hospital_energy.db")

def get_db_connection():
    if DB_TYPE == "mysql":
        if pymysql is None:
            raise ImportError("[DB ERROR] The 'pymysql' package is missing. Please run 'pip install pymysql' in your Python environment to connect to MySQL Server.")
        try:
            # First try connecting to MySQL server to check if it's running
            conn = pymysql.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                cursorclass=pymysql.cursors.DictCursor
            )
            # Create database if not exists
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE}")
            conn.commit()
            conn.close()

            # Now connect to the specific database
            return pymysql.connect(
                host=MYSQL_HOST,
                port=MYSQL_PORT,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                database=MYSQL_DATABASE,
                cursorclass=pymysql.cursors.DictCursor
            )
        except Exception as e:
            print(f"[DB ERROR] Failed to connect to MySQL: {e}")
            print("[DB INFO] Falling back to SQLite local database.")
            # Fall back to SQLite
            conn = sqlite3.connect(SQLITE_PATH)
            conn.row_factory = sqlite3.Row
            return conn
    else:
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def execute_query(conn, query, params=None):
    cursor = conn.cursor()
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor
    except Exception as e:
        print(f"[DB ERROR] Query failed: {query} | Error: {e}")
        raise e

def init_db():
    conn = get_db_connection()
    is_mysql = not isinstance(conn, sqlite3.Connection)
    
    # Auto-increment differences
    auto_inc = "AUTO_INCREMENT" if is_mysql else "AUTOINCREMENT"
    pk_type = "INT PRIMARY KEY" if is_mysql else "INTEGER PRIMARY KEY"

    cursor = conn.cursor()

    # 1. Users Table
    execute_query(conn, f"""
    CREATE TABLE IF NOT EXISTS users (
        id {pk_type} {auto_inc},
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL
    )
    """)

    # 2. Automation Settings Table
    execute_query(conn, """
    CREATE TABLE IF NOT EXISTS settings (
        `key` VARCHAR(100) PRIMARY KEY,
        `value` VARCHAR(255) NOT NULL
    )
    """)

    # 3. Energy Readings Table (Hourly History)
    execute_query(conn, f"""
    CREATE TABLE IF NOT EXISTS energy_readings (
        id {pk_type} {auto_inc},
        timestamp VARCHAR(100) UNIQUE NOT NULL,
        total_power REAL NOT NULL,
        icu_power REAL NOT NULL,
        ot_power REAL NOT NULL,
        wards_power REAL NOT NULL,
        outpatient_power REAL NOT NULL,
        admin_power REAL NOT NULL,
        solar_gen REAL NOT NULL,
        battery_charge REAL NOT NULL,
        grid_import REAL NOT NULL,
        carbon_emitted REAL NOT NULL
    )
    """)

    # 4. Sensor Logs (ICU, OT, Wards, Outpatient)
    execute_query(conn, f"""
    CREATE TABLE IF NOT EXISTS sensor_logs (
        id {pk_type} {auto_inc},
        timestamp VARCHAR(100) NOT NULL,
        room VARCHAR(100) NOT NULL,
        temperature REAL NOT NULL,
        humidity REAL NOT NULL,
        occupancy_count INT NOT NULL,
        lights_status INT NOT NULL,
        hvac_status INT NOT NULL
    )
    """)

    # 5. Medical Equipment Status
    execute_query(conn, f"""
    CREATE TABLE IF NOT EXISTS equipment (
        id {pk_type} {auto_inc},
        name VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(100) NOT NULL,
        is_critical INT NOT NULL,
        status VARCHAR(100) NOT NULL,
        power_draw REAL NOT NULL,
        standby_loss REAL NOT NULL,
        operating_hours REAL NOT NULL,
        maintenance_due VARCHAR(100) NOT NULL
    )
    """)

    # 6. Alerts Log
    execute_query(conn, f"""
    CREATE TABLE IF NOT EXISTS alerts (
        id {pk_type} {auto_inc},
        timestamp VARCHAR(100) NOT NULL,
        type VARCHAR(100) NOT NULL,
        source VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        resolved INT DEFAULT 0
    )
    """)

    # 7. Generator & Chiller Maintenance Logs
    execute_query(conn, f"""
    CREATE TABLE IF NOT EXISTS maintenance_logs (
        id {pk_type} {auto_inc},
        timestamp VARCHAR(100) NOT NULL,
        asset_name VARCHAR(100) NOT NULL,
        vibration REAL NOT NULL,
        temperature REAL NOT NULL,
        oil_pressure REAL NOT NULL,
        failure_prob REAL NOT NULL,
        status VARCHAR(100) NOT NULL
    )
    """)

    conn.commit()

    # Seed Default Users
    cursor.execute("SELECT COUNT(*) FROM users" if not is_mysql else "SELECT COUNT(*) AS c FROM users")
    count = cursor.fetchone()
    count_val = count['c'] if is_mysql else count[0]
    
    if count_val == 0:
        default_users = [
            ("admin", "admin123", "Admin", "Dr. Sarah Jenkins (Chief Administrator)"),
            ("manager", "manager123", "Energy Manager", "Alex Rivera (Energy Operations Manager)"),
            ("tech", "tech123", "Technician", "Marcus Vance (HVAC & Facilities Tech)")
        ]
        placeholder = "%s" if is_mysql else "?"
        for user in default_users:
            cursor.execute(f"INSERT INTO users (username, password, role, name) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder})", user)
        conn.commit()
        print("[DB] Default users seeded successfully.")

    # Seed Default Settings
    cursor.execute("SELECT COUNT(*) FROM settings" if not is_mysql else "SELECT COUNT(*) AS c FROM settings")
    count = cursor.fetchone()
    count_val = count['c'] if is_mysql else count[0]
    
    if count_val == 0:
        default_settings = [
            ("hvac_eco_mode", "1"),
            ("lighting_occupancy_control", "1"),
            ("battery_peak_shaving", "1"),
            ("idle_equipment_alerts", "1"),
            ("icu_target_temp", "21.5"),
            ("ot_target_temp", "20.5"),
            ("wards_target_temp", "23.0"),
            ("outpatient_target_temp", "24.0"),
            ("admin_target_temp", "24.0")
        ]
        placeholder = "%s" if is_mysql else "?"
        for setting in default_settings:
            cursor.execute(f"INSERT INTO settings (`key`, `value`) VALUES ({placeholder}, {placeholder})", setting)
        conn.commit()
        print("[DB] Default settings seeded successfully.")

    # Seed Default Equipment
    cursor.execute("SELECT COUNT(*) FROM equipment" if not is_mysql else "SELECT COUNT(*) AS c FROM equipment")
    count = cursor.fetchone()
    count_val = count['c'] if is_mysql else count[0]
    
    if count_val == 0:
        default_equipment = [
            ("ICU Ventilator Suite A", "Ventilator", 1, "Active", 1.2, 0.0, 4820.5, "2026-08-15"),
            ("ICU Ventilator Suite B", "Ventilator", 1, "Active", 1.2, 0.0, 4120.0, "2026-08-15"),
            ("Cardiac Monitor Room 101", "Patient Monitor", 1, "Active", 0.3, 0.05, 12050.2, "2026-09-01"),
            ("Cardiac Monitor Room 102", "Patient Monitor", 1, "Standby", 0.05, 0.05, 9840.4, "2026-09-01"),
            ("Main Surgical Light OT-1", "Surgical Light", 1, "Active", 1.5, 0.0, 2100.8, "2026-07-20"),
            ("MRI Express 3T", "MRI Machine", 0, "Idle", 4.2, 12.5, 8750.1, "2026-06-10"),
            ("High-Speed CT Scanner", "CT Scanner", 0, "Standby", 1.8, 4.5, 5420.3, "2026-06-25"),
            ("Digital X-Ray Wing B", "X-Ray Machine", 0, "Off", 0.0, 2.1, 3100.2, "2026-07-05"),
            ("Hematology Analyzer Lab 1", "Lab Equipment", 0, "Active", 0.9, 0.15, 6200.5, "2026-08-01")
        ]
        placeholder = "%s" if is_mysql else "?"
        for eq in default_equipment:
            cursor.execute(
                f"INSERT INTO equipment (name, type, is_critical, status, power_draw, standby_loss, operating_hours, maintenance_due) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})",
                eq
            )
        conn.commit()
        print("[DB] Default medical equipment seeded successfully.")

    # Seed Historical Energy & Sensor Data (30 Days of Hourly Data)
    cursor.execute("SELECT COUNT(*) FROM energy_readings" if not is_mysql else "SELECT COUNT(*) AS c FROM energy_readings")
    count = cursor.fetchone()
    count_val = count['c'] if is_mysql else count[0]
    
    if count_val == 0:
        print("[DB] Seeding 30 days of hourly historical data... this might take a few seconds.")
        start_time = datetime.now() - timedelta(days=30)
        
        readings_to_insert = []
        sensor_to_insert = []
        
        for hour_offset in range(30 * 24):
            current_time = start_time + timedelta(hours=hour_offset)
            ts = current_time.strftime("%Y-%m-%d %H:00:00")
            
            hour = current_time.hour
            weekday = current_time.weekday()
            is_weekend = weekday >= 5
            
            # Simulated loads (kW) for each wing
            icu_occ = random.randint(8, 12)
            icu_power = 25.0 + icu_occ * 0.8 + random.uniform(-2, 2)
            
            ot_active = (9 <= hour <= 17) and not is_weekend
            ot_occ = random.randint(5, 15) if ot_active else 0
            ot_power = (45.0 + ot_occ * 1.5 + random.uniform(-3, 3)) if ot_active else (10.0 + random.uniform(-1, 1))
            
            ward_occ = random.randint(25, 40) if 14 <= hour <= 20 else random.randint(15, 25)
            wards_power = 15.0 + ward_occ * 0.4 + (8.0 if 12 <= hour <= 18 else 2.0)
            
            outpatient_active = (8 <= hour <= 18) and not is_weekend
            outpatient_occ = random.randint(30, 80) if outpatient_active else 0
            outpatient_power = (20.0 + outpatient_occ * 0.3 + random.uniform(-2, 2)) if outpatient_active else (3.0 + random.uniform(-0.5, 0.5))
            
            admin_active = (9 <= hour <= 17) and not is_weekend
            admin_occ = random.randint(10, 25) if admin_active else 0
            admin_power = (12.0 + admin_occ * 0.2 + random.uniform(-1, 1)) if admin_active else (2.0 + random.uniform(-0.3, 0.3))
            
            # Dynamic anomalies in history
            if hour_offset % 97 == 0:
                outpatient_power += 25.0
            if hour_offset % 133 == 0:
                admin_power += 15.0
            
            # Solar Panel generation
            solar_gen = 0.0
            if 6 <= hour <= 18:
                solar_factor = 1.0 - abs(hour - 12) / 6.0
                if solar_factor > 0:
                    solar_gen = 35.0 * solar_factor * random.uniform(0.7, 1.0)
            
            # Battery backup logic
            base_battery = 50.0
            battery_charge = base_battery
            if len(readings_to_insert) > 0:
                prev_charge = readings_to_insert[-1][8] # index 8 is battery_charge in seed list
                if 14 <= hour <= 19:
                    battery_charge = max(10.0, prev_charge - random.uniform(10, 15))
                elif solar_gen > 25.0:
                    battery_charge = min(100.0, prev_charge + random.uniform(5, 12))
                elif hour >= 23 or hour <= 5:
                    battery_charge = min(90.0, prev_charge + random.uniform(2, 4))
                else:
                    battery_charge = prev_charge
            
            raw_total = icu_power + ot_power + wards_power + outpatient_power + admin_power
            net_total = raw_total - solar_gen
            battery_contribution = 0.0
            if len(readings_to_insert) > 0:
                battery_diff = readings_to_insert[-1][8] - battery_charge
                battery_contribution = battery_diff
            
            grid_import = max(5.0, net_total - battery_contribution)
            total_power = grid_import + solar_gen + (battery_contribution if battery_contribution < 0 else 0)
            carbon_emitted = grid_import * 0.42
            
            readings_to_insert.append((
                ts, total_power, icu_power, ot_power, wards_power, outpatient_power, admin_power,
                solar_gen, battery_charge, grid_import, carbon_emitted
            ))
            
            sensor_to_insert.append((ts, "ICU", 21.0 + random.uniform(-0.5, 0.5), 50.0 + random.uniform(-2, 2), icu_occ, 1, 2))
            sensor_to_insert.append((ts, "OT", 20.0 + random.uniform(-0.3, 0.3) if ot_active else 22.0 + random.uniform(-1, 1), 48.0 + random.uniform(-1, 1), ot_occ, 1 if ot_active else 0, 2 if ot_active else 1))
            sensor_to_insert.append((ts, "General Wards", 23.0 + random.uniform(-0.8, 0.8), 52.0 + random.uniform(-3, 3), ward_occ, 1, 1))
            sensor_to_insert.append((ts, "Outpatient Clinic", 24.0 + random.uniform(-1.0, 1.0) if outpatient_active else 25.0 + random.uniform(-2, 2), 54.0 + random.uniform(-4, 4), outpatient_occ, 1 if outpatient_active else 0, 1 if outpatient_active else 0))
            sensor_to_insert.append((ts, "Administration", 24.0 + random.uniform(-1.0, 1.0) if admin_active else 25.0 + random.uniform(-2, 2), 53.0 + random.uniform(-4, 4), admin_occ, 1 if admin_active else 0, 1 if admin_active else 0))

        # Perform seeding batch inserts
        placeholder = "%s" if is_mysql else "?"
        for reading in readings_to_insert:
            cursor.execute(
                f"INSERT INTO energy_readings (timestamp, total_power, icu_power, ot_power, wards_power, outpatient_power, admin_power, solar_gen, battery_charge, grid_import, carbon_emitted) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})",
                reading
            )
        for sensor in sensor_to_insert:
            cursor.execute(
                f"INSERT INTO sensor_logs (timestamp, room, temperature, humidity, occupancy_count, lights_status, hvac_status) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})",
                sensor
            )
        conn.commit()
        print(f"[DB] Seeded {len(readings_to_insert)} historical hours and {len(sensor_to_insert)} sensor logs.")

    # Seed Maintenance Logs
    cursor.execute("SELECT COUNT(*) FROM maintenance_logs" if not is_mysql else "SELECT COUNT(*) AS c FROM maintenance_logs")
    count = cursor.fetchone()
    count_val = count['c'] if is_mysql else count[0]
    
    if count_val == 0:
        base_time = datetime.now() - timedelta(days=5)
        m_logs = []
        for i in range(120):
            current_time = base_time + timedelta(hours=i)
            ts = current_time.strftime("%Y-%m-%d %H:00:00")
            
            # Chiller health (compressor wearing out)
            ch_vibration = 1.8 + (i * 0.015) + random.uniform(-0.1, 0.1)
            ch_temp = 58.0 + (i * 0.05) + random.uniform(-0.5, 0.5)
            ch_oil = 42.0 - (i * 0.01) + random.uniform(-0.3, 0.3)
            ch_fail_prob = min(99.0, max(5.0, (ch_vibration - 1.5) * 20.0 + (ch_temp - 55.0) * 2.0))
            ch_status = "Healthy"
            if ch_fail_prob > 60:
                ch_status = "Critical"
            elif ch_fail_prob > 35:
                ch_status = "Warning"
            m_logs.append((ts, "Main Water Chiller", ch_vibration, ch_temp, ch_oil, ch_fail_prob, ch_status))
            
            # Generator health
            gen_vib = 2.1 + random.uniform(-0.15, 0.15)
            gen_temp = 72.0 + random.uniform(-1, 1)
            gen_oil = 50.0 + random.uniform(-2, 2)
            gen_fail_prob = min(99.0, max(1.0, (gen_vib - 2.0) * 10.0 + random.uniform(-3, 3)))
            gen_status = "Healthy"
            if gen_fail_prob > 40:
                gen_status = "Warning"
            m_logs.append((ts, "Emergency Generator 1", gen_vib, gen_temp, gen_oil, gen_fail_prob, gen_status))
            
        placeholder = "%s" if is_mysql else "?"
        for log in m_logs:
            cursor.execute(
                f"INSERT INTO maintenance_logs (timestamp, asset_name, vibration, temperature, oil_pressure, failure_prob, status) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})",
                log
            )
        conn.commit()
        print("[DB] Default maintenance logs seeded.")

    # Seed Default Alerts
    cursor.execute("SELECT COUNT(*) FROM alerts" if not is_mysql else "SELECT COUNT(*) AS c FROM alerts")
    count = cursor.fetchone()
    count_val = count['c'] if is_mysql else count[0]
    
    if count_val == 0:
        default_alerts = [
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Warning", "Equipment", "MRI Express 3T has been in standby mode for over 4 hours, wasting 50.0 kWh.", 0),
            ((datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"), "Critical", "HVAC", "Critical temperature deviation detected in Admin wing (27.2°C). ECO mode overridden.", 1),
            ((datetime.now() - timedelta(hours=5)).strftime("%Y-%m-%d %H:%M:%S"), "Critical", "Grid", "Grid voltage dip detected. Transitioned critical ICU load to Battery backup.", 1),
            ((datetime.now() - timedelta(hours=10)).strftime("%Y-%m-%d %H:%M:%S"), "Warning", "HVAC", "Main Chiller compressor vibration levels exceeded threshold (3.1 mm/s). Maintenance recommended.", 0)
        ]
        placeholder = "%s" if is_mysql else "?"
        for alert in default_alerts:
            cursor.execute(
                f"INSERT INTO alerts (timestamp, type, source, message, resolved) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})",
                alert
            )
        conn.commit()
        print("[DB] Seeded initial alert history.")

    conn.commit()
    conn.close()
    print(f"[DB] Database fully initialized and seeded. Active backend: {DB_TYPE.upper()}")

if __name__ == "__main__":
    init_db()
