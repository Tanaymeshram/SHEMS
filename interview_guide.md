# 🎓 Smart Hospital Energy Management System (SHEMS) - Interview & Viva Guide

This guide is designed to help you ace your project presentation, external viva, or job interview. It provides a structured breakdown of the project, technical details, and answers to common examiner questions.

---

## 🚀 1. The 1-Minute Elevator Pitch (प्रोजेक्ट का परिचय)

> **English Version:**
> *"My project is a **Smart Hospital Energy Management System (SHEMS)**. It is a full-stack, AI-powered IoT platform designed to analyze, forecast, and optimize energy consumption in healthcare facilities. The system utilizes machine learning (scikit-learn) models to perform Peak Load Forecasting, Predictive Maintenance on critical utility assets, and Energy Leakage Detection. Crucially, the platform enforces hardcoded **Clinical Safety Shield** rules that prevent any remote power overrides or climate drifts on life-support zones (like the ICU and Operating Theater) for absolute patient safety."*

> **Hindi Version:**
> *"मेरा प्रोजेक्ट एक **Smart Hospital Energy Management System (SHEMS)** है। यह एक AI और IoT पर आधारित सिस्टम है जो अस्पतालों में बिजली की खपत को नियंत्रित और कम करता है। इसमें हमने 3 मशीन लर्निंग मॉडल्स का उपयोग किया है जो अगले 24 घंटे के लोड का अनुमान लगाते हैं, उपकरणों के खराब होने की भविष्यवाणी करते हैं (Predictive Maintenance), और बिजली की बर्बादी (Leakage) को रोकते हैं। अस्पताल में मरीजों की सुरक्षा सबसे महत्वपूर्ण होती है, इसलिए इसमें एक **Clinical Safety Shield** लगाया गया है जो ICU और OT जैसी जगहों पर एसी को बंद होने से या तापमान को खतरनाक स्तर पर जाने से रोकता है।"*

---

## 🔍 2. The Problem Statement (समस्या क्या थी?)

Hospitals are unique environments when it comes to energy management:
1. **High Energy Intensity**: Hospitals run 24/7/365 and consume 2.5 times more energy than average commercial buildings.
2. **Clinical Safety Constraints**: You cannot just turn off air conditioning or lights in an ICU to save power—patient safety is critical.
3. **Asset Maintenance**: Failure of critical generators or chillers can result in immediate loss of life.
4. **Phantom Power Losses**: Heavy machinery like MRI and CT scanners draw massive electricity even when idle (standby leakage).

---

## 🛠️ 3. Key Modules & Innovations (मुख्य विशेषताएं)

Prepare to talk about these five core modules:
1. **Live IoT Telemetry Harvester**: Visualizes live temperature sensors across hospital wings (ICU, OT, Wards) and Solar Lux Irradiance sensors mapping light intensity ($W/m^2$).
2. **Peak Load Forecasting (Random Forest Regressor)**: Projects hospital power loads and solar generation curves 24 hours in advance to optimize energy purchases.
3. **Predictive Maintenance (Logistic Regression)**: Evaluates core generator/chiller metrics (vibrations, oil pressure, temperature) to calculate live failure risks.
4. **Energy Leakage Detection (Isolation Forest)**: An unsupervised ML model that flags abnormal power spikes and administrative wing phantom loads.
5. **Medical Equipment Idle Monitor**: Identifies idle assets (e.g. MRI machine idle for 45 mins) and recommends automated eco-mode shift commands to save standby power.

---

## 💻 4. Technical Stack (तकनीकी वास्तुकला)

| Layer | Technology Used | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS v4, Recharts, Lucide Icons | Responsive dashboard with live streaming telemetry graphs and custom settings. |
| **Backend** | Python, Flask, Multi-threading | Unified server serving REST APIs and hosting compiled React assets on a single URL (`http://localhost:5000`). |
| **Database** | MySQL Server (Connector), SQLite | Stores 30 days of hourly historical telemetry, settings, and live alerts. |
| **ML Engine** | Scikit-learn, Pandas, NumPy | Handles time-series forecasting, anomaly isolation, and risk classification. |

---

## 🧠 5. Core Machine Learning Details (मशीन लर्निंग मॉडल की जानकारी)

Examiners love asking about models. Memorize this table:

| Model | Algorithm Used | Features (Inputs) | Target (Output) |
| :--- | :--- | :--- | :--- |
| **Load Forecaster** | **Random Forest Regressor** | Hour of day, day of week, outdoor temperature, occupancy count | **Total Power Demand (kW)** (Accuracy $R^2 \approx 88.0\%$) |
| **Anomaly Detector** | **Isolation Forest** (Unsupervised) | Grid Import load, Wing load draws | **Anomaly Flag (1 = Normal, -1 = Leakage/Spike)** |
| **Predictive Maintenance** | **Logistic Regression** | Vibration ($mm/s$), Core Temp ($^\circ C$), Oil Pressure ($PSI$) | **Failure Probability %** (Accuracy $\approx 94.0\%$) |

---

## 💬 6. Expected Viva Questions & Answers (अक्सर पूछे जाने वाले सवाल)

### Q1. Why did you use MySQL and SQLite both? (डेटाबेस आर्किटेक्चर)
> **Answer:** 
> *"We built a dual-core connection wrapper in `database.py`. In a real-world enterprise deployment, the system connects directly to a robust **MySQL database** (which we integrated and tested using MySQL Workbench). However, to make the prototype lightweight and plug-and-play for evaluation, the system can automatically switch to **SQLite** if no MySQL server is detected, ensuring zero-dependency execution."*

### Q2. How does the system ensure patient safety? (क्लीनिकल सेफ्टी)
> **Answer:** 
> *"Patient safety is enforced via **Clinical Safety Shields** at the code level. In `app.py`, any POST request attempting to remote power off life-support items (ICU Ventilators, OT Surgical lights) is blocked with an HTTP 403 status. Furthermore, target temperatures in the ICU are locked strictly between $20^\circ C - 23^\circ C$, and in the OT between $18^\circ C - 22^\circ C$. Any breach triggers immediate visual warnings and registers critical database alerts."*

### Q3. How does the Solar & Renewable Optimization work? (सोलर एनर्जी का उपयोग)
> **Answer:** 
> *"Our microgrid system performs **Peak Shaving**. During the day, surplus solar energy powers the hospital and charges a 100 kWh Tesla battery bank. During peak-rate hours (14:00 - 19:00), the system discharges battery power into the hospital grid, reducing grid import utility costs when rates are highest."*

### Q4. What is the "Live IoT Telemetry Harvester" widget on the Dashboard?
> **Answer:** 
> *"It simulates the physical hardware layer of the BEMS. It aggregates real-time signals from thermodynamic nodes (e.g. `IoT-T-ICU01`) and a solar lux pyranometer (measuring light flux in $W/m^2$). It proves that the ML engine and frontend charts are reacting dynamically to real-time telemetry inputs, rather than static mock files."*

---

> [!TIP]
> **Key Tip for the Demo:** 
> When presenting, always log in as `admin`. Show them the **Energy Predictions** page, change the **Weather Slider**, and point out how the ML Random Forest model instantly shifts the daily cost projections. This interactive element is a major highlight!
