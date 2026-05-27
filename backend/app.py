from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import os
import io
import csv
from datetime import datetime, timedelta
import threading
import sqlite3

# Import project modules
from database import init_db, get_db_connection, execute_query

# Initialize database immediately on startup so tables exist before import of background simulators
init_db()

from ml_engine import ml_engine
from iot_simulator import iot_simulator

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for modern React integrations

# Global initialization on first request
has_initialized = False

@app.before_request
def initialize_app():
    global has_initialized
    if not has_initialized:
        has_initialized = True
        print("[Flask App] Initializing database & background services...")
        # 1. Initialize SQLite Database (and seed if empty)
        init_db()
        
        # 2. Load or Train ML Models
        ret = ml_engine.load_models()
        if not ret:
            # Train models if not found
            threading.Thread(target=ml_engine.train_models).start()
            
        # 3. Start IoT Simulator background thread
        if not iot_simulator.is_alive():
            iot_simulator.start()
        print("[Flask App] Background initialization complete.")

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "system": "Smart Hospital Energy Management System REST API",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

# ==========================================
# 1. AUTHENTICATION MODULE
# ==========================================
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        is_mysql = not isinstance(conn, sqlite3.Connection)
        
        placeholder = "%s" if is_mysql else "?"
        cursor.execute(f"SELECT * FROM users WHERE username = {placeholder}", (username,))
        user = cursor.fetchone()
        conn.close()
        
        if user and user["password"] == password: # Simple plaintext password validation for demo/simulation robustness
            return jsonify({
                "message": "Login successful",
                "user": {
                    "username": user["username"],
                    "role": user["role"],
                    "name": user["name"]
                }
            })
        return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    name = data.get("name")
    role = data.get("role", "Technician")
    
    if not username or not password or not name:
        return jsonify({"error": "Username, password, and name are required."}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        is_mysql = not isinstance(conn, sqlite3.Connection)
        
        placeholder = "%s" if is_mysql else "?"
        
        # Check uniqueness
        cursor.execute(f"SELECT COUNT(*) FROM users WHERE username = {placeholder}", (username,))
        count = cursor.fetchone()
        count_val = count['c'] if is_mysql else count[0]
        if count_val > 0:
            conn.close()
            return jsonify({"error": "Username already exists."}), 409
            
        cursor.execute(
            f"INSERT INTO users (username, password, role, name) VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder})",
            (username, password, role, name)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Registration successful. Please proceed to login."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 2. BUILDING ENERGY MANAGEMENT SYSTEM (BEMS) - REAL-TIME FEED
# ==========================================
@app.route("/api/dashboard/live", methods=["GET"])
def get_live_dashboard():
    # Sync settings with actual simulator config
    iot_simulator.load_automation_settings()
    
    # Calculate carbon footprint savings indicators
    # Seeding defaults or counting historical grid savings
    return jsonify({
        "timestamp": iot_simulator.state["timestamp"],
        "wings": iot_simulator.state["wings"],
        "equipment": iot_simulator.state["equipment"],
        "renewables": iot_simulator.state["renewables"],
        "maintenance": iot_simulator.state["maintenance"],
        "automation_active": iot_simulator.state["automation_active"],
        "savings": iot_simulator.state["savings"]
    })

# ==========================================
# 3. SMART HVAC CONTROLS
# ==========================================
@app.route("/api/hvac/settings", methods=["GET", "POST"])
def get_set_hvac_settings():
    conn = get_db_connection()
    is_mysql = not isinstance(conn, sqlite3.Connection)
    cursor = conn.cursor()
    
    if request.method == "POST":
        data = request.get_json() or {}
        # Allows modifying target temperatures
        for key in ["icu_target_temp", "ot_target_temp", "wards_target_temp", "outpatient_target_temp", "admin_target_temp"]:
            if key in data:
                val = str(round(float(data[key]), 1))
                placeholder = "%s" if is_mysql else "?"
                # Clinical safety shields on ICU and OT
                if key == "icu_target_temp" and (float(val) < 20.0 or float(val) > 23.0):
                    conn.close()
                    return jsonify({"error": "ICU Temperature setpoint must remain strictly within medical boundaries (20°C - 23°C)."}), 400
                if key == "ot_target_temp" and (float(val) < 18.0 or float(val) > 22.0):
                    conn.close()
                    return jsonify({"error": "Operating Theater (OT) Temperature setpoint must remain within clinical boundaries (18°C - 22°C)."}), 400
                    
                cursor.execute(f"UPDATE settings SET `value` = {placeholder} WHERE `key` = {placeholder}", (val, key))
        conn.commit()
        
    # Retrieve current configurations
    cursor.execute("SELECT `key`, `value` FROM settings WHERE `key` LIKE '%_target_temp'")
    rows = cursor.fetchall()
    conn.close()
    
    configs = {row['key']: float(row['value']) for row in rows}
    return jsonify(configs)

# ==========================================
# 4. PREDICTIVE ENERGY ANALYTICS
# ==========================================
@app.route("/api/predictions/energy", methods=["GET"])
def get_energy_predictions():
    base_temp = float(request.args.get("outdoor_temp", 24.0))
    
    # Run predictions next 24h
    pred_list = ml_engine.predict_energy_next_24h(base_temp=base_temp)
    
    # Calculate estimated bill next month
    total_grid_import = sum(p["grid_import"] for p in pred_list)
    avg_power = sum(p["predicted_power"] for p in pred_list) / 24.0
    
    # Simple pricing model: 0.15 USD per kWh average, peak factor during peak hours
    daily_cost = 0.0
    for p in pred_list:
        rate = 0.22 if p["is_peak_hour"] else 0.12
        daily_cost += p["grid_import"] * rate
        
    predicted_monthly_bill = daily_cost * 30.0
    peak_shaving_savings = sum(p["predicted_solar"] for p in pred_list) * 0.15 * 30.0 # savings from renewable offset
    
    return jsonify({
        "predictions_24h": pred_list,
        "metrics": {
            "r2_score": round(ml_engine.energy_r2, 3),
            "mae_kw": round(ml_engine.energy_mae, 2),
            "average_predicted_kw": round(avg_power, 2),
            "predicted_daily_cost_usd": round(daily_cost, 2),
            "predicted_monthly_bill_usd": round(predicted_monthly_bill, 2),
            "estimated_savings_usd": round(peak_shaving_savings, 2),
        }
    })

# ==========================================
# 5. MEDICAL EQUIPMENT IDLE MONITOR
# ==========================================
@app.route("/api/equipment", methods=["GET", "POST"])
def get_set_equipment():
    conn = get_db_connection()
    is_mysql = not isinstance(conn, sqlite3.Connection)
    cursor = conn.cursor()
    
    if request.method == "POST":
        data = request.get_json() or {}
        name = data.get("name")
        new_status = data.get("status")
        
        if name and new_status:
            # Clinical safety shield: critical devices (ventilators, ICU suite) can NEVER be remote powered off!
            cursor.execute(f"SELECT is_critical FROM equipment WHERE name = {'%s' if is_mysql else '?'}", (name,))
            row = cursor.fetchone()
            if row and row["is_critical"] == 1 and new_status == "Off":
                conn.close()
                return jsonify({"error": "CLINICAL CRITICAL EXCEPTION: Remote power shutdowns are disabled for life support critical assets (ICU/OT ventilators/lights)."}), 403
                
            cursor.execute(
                f"UPDATE equipment SET status = {'%s' if is_mysql else '?'} WHERE name = {'%s' if is_mysql else '?'}",
                (new_status, name)
            )
            conn.commit()
            
            # Instantly update simulator live dictionary
            iot_simulator.sync_equipment_states()
            
    cursor.execute("SELECT * FROM equipment")
    equipment_list = cursor.fetchall()
    conn.close()
    
    formatted_list = []
    for eq in equipment_list:
        formatted_list.append({
            "id": eq["id"],
            "name": eq["name"],
            "type": eq["type"],
            "is_critical": bool(eq["is_critical"]),
            "status": eq["status"],
            "power_draw": eq["power_draw"],
            "standby_loss": eq["standby_loss"],
            "operating_hours": eq["operating_hours"],
            "maintenance_due": eq["maintenance_due"]
        })
        
    return jsonify(formatted_list)

# ==========================================
# 6. ANOMALY DETECTION & LEAKAGES
# ==========================================
@app.route("/api/anomalies", methods=["GET"])
def get_anomalies_list():
    conn = get_db_connection()
    is_mysql = not isinstance(conn, sqlite3.Connection)
    cursor = conn.cursor()
    
    # Return all grid leakages/alerts related to grid/HVAC anomalies
    cursor.execute("SELECT * FROM alerts WHERE type = 'Critical' OR source = 'Grid' ORDER BY timestamp DESC LIMIT 20")
    alerts_rows = cursor.fetchall()
    conn.close()
    
    alerts_list = []
    for row in alerts_rows:
        alerts_list.append({
            "id": row["id"],
            "timestamp": row["timestamp"],
            "type": row["type"],
            "source": row["source"],
            "message": row["message"],
            "resolved": bool(row["resolved"])
        })
        
    return jsonify({
        "contamination_rate": 0.03,
        "active_leaks_detected": len([a for a in alerts_list if not a["resolved"]]),
        "anomaly_logs": alerts_list
    })

# ==========================================
# 7. AUTOMATION SETTINGS TOGGLES
# ==========================================
@app.route("/api/automation/toggle", methods=["POST"])
def toggle_automation_settings():
    data = request.get_json() or {}
    key = data.get("key")
    
    if key not in ["hvac_eco_mode", "lighting_occupancy_control", "battery_peak_shaving", "idle_equipment_alerts"]:
        return jsonify({"error": "Invalid automation policy key."}), 400
        
    try:
        conn = get_db_connection()
        is_mysql = not isinstance(conn, sqlite3.Connection)
        cursor = conn.cursor()
        
        # Get current state
        placeholder = "%s" if is_mysql else "?"
        cursor.execute(f"SELECT `value` FROM settings WHERE `key` = {placeholder}", (key,))
        row = cursor.fetchone()
        
        if row:
            new_val = "0" if row["value"] == "1" else "1"
            cursor.execute(f"UPDATE settings SET `value` = {placeholder} WHERE `key` = {placeholder}", (new_val, key))
            conn.commit()
            
            # Sync instantly in IoT simulator
            iot_simulator.load_automation_settings()
            
            conn.close()
            return jsonify({
                "message": f"Automation policy '{key}' updated successfully.",
                "active": (new_val == "1")
            })
            
        conn.close()
        return jsonify({"error": "Configuration key not found."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 8. ALERTS MANAGEMENT PANEL
# ==========================================
@app.route("/api/alerts", methods=["GET", "POST"])
def get_set_alerts():
    conn = get_db_connection()
    is_mysql = not isinstance(conn, sqlite3.Connection)
    cursor = conn.cursor()
    
    if request.method == "POST":
        data = request.get_json() or {}
        alert_id = data.get("id")
        action = data.get("action", "resolve")
        
        if alert_id:
            placeholder = "%s" if is_mysql else "?"
            if action == "resolve":
                cursor.execute(f"UPDATE alerts SET resolved = 1 WHERE id = {placeholder}", (alert_id,))
            elif action == "delete":
                cursor.execute(f"DELETE FROM alerts WHERE id = {placeholder}", (alert_id,))
            conn.commit()
            
    cursor.execute("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 40")
    rows = cursor.fetchall()
    conn.close()
    
    alerts_list = []
    for row in rows:
        alerts_list.append({
            "id": row["id"],
            "timestamp": row["timestamp"],
            "type": row["type"],
            "source": row["source"],
            "message": row["message"],
            "resolved": bool(row["resolved"])
        })
        
    return jsonify(alerts_list)

# ==========================================
# 9. REPORT EXPORTS (CSV/MOCK REPORTS)
# ==========================================
@app.route("/api/reports/export", methods=["GET"])
def export_energy_reports():
    report_type = request.args.get("type", "energy") # energy, maintenance, carbon
    
    # Query database and build a CSV stream
    conn = get_db_connection()
    cursor = conn.cursor()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == "energy":
        writer.writerow(["Timestamp", "Total Grid Power (kW)", "ICU Wing Draw (kW)", "OT Surgical Draw (kW)", "Solar Generation (kW)", "Battery Status (%)", "Grid Import (kW)", "Carbon Emitted (kg CO2)"])
        cursor.execute("SELECT timestamp, total_power, icu_power, ot_power, solar_gen, battery_charge, grid_import, carbon_emitted FROM energy_readings ORDER BY timestamp DESC LIMIT 100")
        rows = cursor.fetchall()
        for r in rows:
            writer.writerow([r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]])
            
    elif report_type == "maintenance":
        writer.writerow(["Timestamp", "Asset Name", "Vibration (mm/s)", "Core Temperature (C)", "Lubricant Oil Pressure (PSI)", "Model Failure Prob (%)", "System Status"])
        cursor.execute("SELECT timestamp, asset_name, vibration, temperature, oil_pressure, failure_prob, status FROM maintenance_logs ORDER BY timestamp DESC LIMIT 100")
        rows = cursor.fetchall()
        for r in rows:
            writer.writerow([r[0], r[1], r[2], r[3], r[4], r[5], r[6]])
            
    else: # carbon
        writer.writerow(["Timestamp", "Grid Load Draw (kW)", "Clean Green Offset (kW)", "Carbon Emitted (kg CO2)", "Daily Carbon Mitigation (kg)"])
        cursor.execute("SELECT timestamp, grid_import, solar_gen, carbon_emitted FROM energy_readings ORDER BY timestamp DESC LIMIT 100")
        rows = cursor.fetchall()
        for r in rows:
            clean_offset_saving = r["solar_gen"] * 0.42 # offset factor
            writer.writerow([r["timestamp"], r["grid_import"], r["solar_gen"], r["carbon_emitted"], clean_offset_saving])
            
    conn.close()
    
    mem_file = io.BytesIO()
    mem_file.write(output.getvalue().encode("utf-8"))
    mem_file.seek(0)
    
    return send_file(
        mem_file,
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"smart_hospital_{report_type}_report_{datetime.now().strftime('%Y%m%d')}.csv"
    )

# ==========================================
# 10. SYSTEM CONTROLS & MODEL RETRAINING
# ==========================================
@app.route("/api/settings/system", methods=["POST"])
def trigger_system_settings():
    data = request.get_json() or {}
    action = data.get("action")
    
    if action == "retrain":
        # Run ML training in a background thread
        threading.Thread(target=ml_engine.train_models).start()
        return jsonify({
            "message": "Model retraining triggered. Recalculating forecasting weights in background.",
            "status": "processing"
        })
        
    elif action == "reset_db":
        # Reset tables
        try:
            init_db()
            threading.Thread(target=ml_engine.train_models).start()
            return jsonify({"message": "Database successfully wiped and re-seeded with initial historical records."})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"error": "Unsupported system configuration action."}), 400

if __name__ == "__main__":
    # Create required subdirectories first
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "models"), exist_ok=True)
    
    # Run Flask Application on Cfg Port
    flask_port = int(os.getenv("FLASK_PORT", 5000))
    flask_debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    
    app.run(host="0.0.0.0", port=flask_port, debug=flask_debug, use_reloader=False)
