from flask import Flask, request, jsonify
import joblib
import pandas as pd
import random
from flask_cors import CORS
import yaml

# Load configuration
with open('config.yaml', 'r') as config_file:
    config = yaml.safe_load(config_file)

app = Flask(__name__)
CORS(app)
application = app

# Load models from config paths
model = joblib.load(config['models']['paths']['rf_model'])
rf_model = joblib.load(config['models']['paths']['random_forest_regressor'])
model_crop = joblib.load(config['models']['paths']['crop_model'])
scaler = joblib.load(config['models']['paths']['scaler'])

# Get mappings from config
soil_type_mapping = config['mappings']['soil_type']
crop_type_mapping = config['mappings']['crop_type']
fertilizer_name_mapping = config['mappings']['fertilizer_name']
fertilizer_descriptions = config['fertilizer_descriptions']

# Create reverse mappings
soil_type_inverse_mapping = {v: k for k, v in soil_type_mapping.items()}
crop_type_inverse_mapping = {v: k for k, v in crop_type_mapping.items()}

# Get feature ranges
feature_ranges = config['feature_ranges']['fertilizer']
feature_ranges2 = config['feature_ranges']['crop']

# Get RF columns
rf_cols = config['rf_columns']

# Route for home page
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "success",
        "message": "Welcome to the Agricultural Recommendation API",
        "endpoints": [
            "/predict - General prediction endpoint",
            "/fertilizer-recommend - Fertilizer recommendation endpoint",
            "/crop-recommend - Crop recommendation endpoint"
        ]
    })

# Route for prediction endpoint, assuming rf_model expects detailed features
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        app.logger.info(f"Received data for /predict: {data}") 
        
        if not data:
            return jsonify({"status": "error", "message": "No input data provided"}), 400

        # Extract features - Use keys EXACTLY as seen in the backend log
        try:
            N = float(data['nitrogen'])
            P = float(data['phosphorous'])
            K = float(data['potassium'])
            temperature = float(data['temperature'])
            humidity = float(data['humidity'])
            ph = float(data['ph'])
            rainfall = float(data['rainfall'])
            # Use lowercase keys as received by the server
            soil_type_str = data['soil_type'] 
            crop_type_str = data['crop_type'] # Assuming frontend 'crop' becomes 'crop_type' 
            # Check if soil_moisture arrived - it seems it didn't based on logs
            if 'soil_moisture' not in data:
                # If it's truly optional for the model, use a default. Otherwise, raise error.
                app.logger.warning("'soil_moisture' key not found in received data, using default 0. Check frontend payload.")
                soil_moisture = 0.0 # Default if optional
                # Alternatively, if required by model, raise KeyError explicitly:
                # raise KeyError("'soil_moisture' is missing from the request data")
            else:
                soil_moisture = float(data['soil_moisture']) 
        except KeyError as e:
            app.logger.error(f"KeyError accessing key: {e}. Data received: {data}")
            return jsonify({"status": "error", "message": f"Missing required input field key: {e}"}), 400
        except ValueError as e:
             app.logger.error(f"ValueError converting data: {e}. Data received: {data}")
             return jsonify({"status": "error", "message": f"Invalid numeric value provided: {e}"}), 400

        # Convert categorical strings to numeric using mappings
        soil_type_num = soil_type_mapping.get(soil_type_str, -1)
        # crop_type_num = crop_type_mapping.get(crop_type_str, -1) # Keep getting this for fertilizer lookup later
        # We don't check crop_type_num for error here, assuming rf_model doesn't need it directly based on 8 feature error

        if soil_type_num == -1:
             expected_keys = list(soil_type_mapping.keys())
             return jsonify({"status": "error", "message": f"Invalid soil_type: '{soil_type_str}'. Expected one of: {expected_keys}"}), 400
        
        # Construct the feature list/array with 8 features based on error message analysis
        # Assuming order [N, P, K, temperature, humidity, ph, rainfall, soil_type_num]
        input_features = [[ N, P, K, temperature, humidity, ph, rainfall, 
                           soil_type_num 
                         ]]
        
        app.logger.info(f"Predicting with 8 features: {input_features}")

        # Make prediction using rf_model 
        prediction = rf_model.predict(input_features)
        
        # --- Result handling (Assuming it predicts fertilizer ID) --- 
        prediction_value = prediction[0]
        if hasattr(prediction_value, 'item'): 
            prediction_serializable = prediction_value.item()
        else:
            prediction_serializable = prediction_value
            
        fertilizer_name = fertilizer_name_mapping.get(prediction_serializable, "Unknown Fertilizer")
        fertilizer_info = fertilizer_descriptions.get(str(prediction_serializable), "No description available")

        return jsonify({
            "status": "success",
            "fertilizer_prediction": prediction_serializable, 
            "fertilizer_name": fertilizer_name,
            "description": fertilizer_info,
            "message": "Prediction successful (using 8 features)"
        })

    except Exception as e:
        app.logger.error(f"Prediction error: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"An error occurred during prediction: {e}"
        }), 500

# Route for fertilizer recommendation
@app.route('/fertilizer-recommend', methods=['POST'])
def fertilizer_recommend():
    try:
        data = request.get_json()
        
        # Extract features for fertilizer recommendation
        N = float(data.get('nitrogen', 0))
        P = float(data.get('phosphorous', 0))
        K = float(data.get('potassium', 0))
        soil_type = data.get('soil_type', '')
        crop_type = data.get('crop_type', '')
        
        # Convert text inputs to numeric using mapping
        soil_type_num = soil_type_mapping.get(soil_type.lower(), 0)
        crop_type_num = crop_type_mapping.get(crop_type.lower(), 0)
        
        # Create feature array
        input_features = [[N, P, K, soil_type_num, crop_type_num]]
        
        # Scale features if needed
        if scaler:
            input_features = scaler.transform(input_features)
        
        # Make prediction
        fertilizer_prediction = model.predict(input_features)[0]
        fertilizer_name = fertilizer_name_mapping.get(fertilizer_prediction, "Unknown Fertilizer")
        fertilizer_info = fertilizer_descriptions.get(str(fertilizer_prediction), 
                                                    "No description available")
        
        return jsonify({
            "status": "success",
            "fertilizer_id": int(fertilizer_prediction),
            "fertilizer_name": fertilizer_name,
            "description": fertilizer_info,
            "message": "Fertilizer recommendation successful"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

# Route for crop recommendation
@app.route('/crop-recommend', methods=['POST'])
def crop_recommend():
    try:
        data = request.get_json()
        
        # Extract features for crop recommendation
        N = float(data.get('nitrogen', 0))
        P = float(data.get('phosphorous', 0))
        K = float(data.get('potassium', 0))
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))
        ph = float(data.get('ph', 0))
        rainfall = float(data.get('rainfall', 0))
        
        # Create feature array
        input_features = [[N, P, K, temperature, humidity, ph, rainfall]]
        
        # Make prediction
        crop_prediction = model_crop.predict(input_features)[0]
        crop_name = crop_type_inverse_mapping.get(crop_prediction, "Unknown Crop")
        
        return jsonify({
            "status": "success",
            "crop_id": int(crop_prediction),
            "crop_name": crop_name,
            "message": "Crop recommendation successful"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

if __name__ == '__main__':
    app.run(port=5002, debug=True)